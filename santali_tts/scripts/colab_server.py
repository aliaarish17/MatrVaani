"""
Santali (Ol Chiki) Live Parler-TTS Server for Google Colab
Exposes the fine-tuned Indic Parler-TTS model running in Colab GPU
to your local Web UI via Cloudflare Tunnel / LocalTunnel / Ngrok.
"""

import os
import io
import re
import sys
import time
import subprocess
import threading
import torch
import soundfile as sf
from pathlib import Path

# 1. Install & import server dependencies if missing
try:
    from fastapi import FastAPI, HTTPException, Response
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    import uvicorn
except ImportError:
    print("Installing server dependencies (fastapi, uvicorn, pydantic)...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "fastapi", "uvicorn", "pydantic"])
    from fastapi import FastAPI, HTTPException, Response
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    import uvicorn

# 2. Setup FastAPI App
app = FastAPI(title="Santali Indic Parler-TTS API")

# Enable CORS for local browser connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TTSRequest(BaseModel):
    text: str
    gender: str = "female"
    description: str = "A clear natural Santali female voice speaking clearly in Ol Chiki script."

# Global references (expected to be already loaded in Colab memory)
# If not loaded, the script loads them automatically
device = "cuda" if torch.cuda.is_available() else "cpu"

def get_voice_desc(gender: str):
    if gender.lower() == "male":
        return "A clear natural Santali male voice speaking clearly in Ol Chiki script."
    return "A clear natural Santali female voice speaking clearly in Ol Chiki script."

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": "ai4bharat/indic-parler-tts-pretrained",
        "device": device,
        "cuda": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
    }

@app.post("/synthesize")
def synthesize(req: TTSRequest):
    global model, prompt_tokenizer, desc_tokenizer
    
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
        
    start_time = time.time()
    voice_desc = req.description if req.description else get_voice_desc(req.gender)
    
    # Tokenize
    desc_inputs = desc_tokenizer(voice_desc, return_tensors="pt", padding=True).to(device)
    prompt_inputs = prompt_tokenizer(req.text.strip(), return_tensors="pt", padding=True).to(device)
    
    # Generate on GPU
    with torch.no_grad():
        generation = model.generate(
            input_ids=desc_inputs.input_ids,
            attention_mask=desc_inputs.attention_mask,
            prompt_input_ids=prompt_inputs.input_ids,
            prompt_attention_mask=prompt_inputs.attention_mask,
            max_new_tokens=1000,
        )
        
    audio_arr = generation.cpu().float().numpy().squeeze()
    sr = model.config.sampling_rate
    elapsed = time.time() - start_time
    duration = len(audio_arr) / sr
    
    print(f"⚡ [TTS Synthesis] Text: '{req.text}' | Gen: {elapsed:.2f}s | Audio: {duration:.2f}s (SR: {sr} Hz)")
    
    # Write to in-memory WAV buffer
    buffer = io.BytesIO()
    sf.write(buffer, audio_arr, sr, format="WAV")
    buffer.seek(0)
    
    return Response(
        content=buffer.read(),
        media_type="audio/wav",
        headers={
            "X-Generation-Time": f"{elapsed:.2f}s",
            "X-Audio-Duration": f"{duration:.2f}s"
        }
    )

def start_server_and_tunnel(port=8000):
    # 1. Start Uvicorn in background thread
    config = uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning")
    server = uvicorn.Server(config)
    t = threading.Thread(target=server.run, daemon=True)
    t.start()
    time.sleep(1.5)
    print(f"✓ Local server running on http://127.0.0.1:{port}")
    
    # 2. Download and run Cloudflare Tunnel (Zero signup, 100% free)
    cf_path = Path("./cloudflared")
    if not cf_path.exists():
        print("Setting up Cloudflare Tunnel (no account required)...")
        subprocess.run(["wget", "-q", "-nc", "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64", "-O", "cloudflared"])
        subprocess.run(["chmod", "+x", "cloudflared"])
        
    cmd = ["./cloudflared", "tunnel", "--url", f"http://127.0.0.1:{port}"]
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    
    tunnel_url = None
    url_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")
    
    # Scan output for tunnel URL
    for line in process.stdout:
        match = url_pattern.search(line)
        if match:
            tunnel_url = match.group(0)
            break
            
    if tunnel_url:
        print("\n" + "=" * 70)
        print("🎉 SANTALI TTS LIVE GPU SERVER IS READY!")
        print("=" * 70)
        print(f"\n👉 Copy this Public URL:\n   \033[1;32m{tunnel_url}\033[0m\n")
        print("👉 Open your local Web UI (santali_tts/web_ui/index.html)")
        print(f"👉 Paste the URL into the top 'Colab GPU Bridge' box and click 'Connect Colab'")
        print("=" * 70 + "\n")
    else:
        print("Notice: Could not parse Cloudflare URL automatically. Check process output.")
        
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping server...")
