# Colab GPU Bridge & Tunnel Deployment Guide

This guide details how to host the **MatrVaani Santali (Ol Chiki) Indic Parler-TTS** model on a free Google Colab GPU (T4 / A100) and expose it as a high-speed real-time synthesis API to the **MatrVaani Web UI** using public tunnels (**Ngrok** or **Cloudflare Tunnel**).

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────┐           ┌──────────────────────────────┐
│       Client Browser / Web UI   │           │      Public Tunnel Gateway   │
│  • Web Speech API (Hindi ASR)   │  HTTP     │  • Cloudflare (trycloudflare)│
│  • FLN Master Rule Engine       │ ───────>  │  • Ngrok (ngrok-free.dev)    │
│  • Ol Chiki Script Formatter    │           │  • LocalTunnel               │
└─────────────────────────────────┘           └──────────────┬───────────────┘
                                                             │ Forward Payload
                                                             ▼
                                              ┌──────────────────────────────┐
                                              │   Google Colab GPU Backend   │
                                              │  • FastAPI Server (:8000)    │
                                              │  • Indic Parler-TTS (FP16)   │
                                              │  • 44.1 kHz 16-bit PCM Audio │
                                              └──────────────────────────────┘
```

---

## 🚀 Setup Instructions

### 1. Enable GPU in Google Colab
1. Navigate to [Google Colab](https://colab.research.google.com).
2. Open `santali_tts/notebooks/santali_tts_colab.ipynb` (or create a new notebook).
3. Select **Runtime** $\rightarrow$ **Change runtime type** $\rightarrow$ **T4 GPU** $\rightarrow$ **Save**.

### 2. Install Server & Tunnel Dependencies
Run the following inside a Colab code cell:
```bash
!pip install -q fastapi uvicorn pydantic soundfile pyngrok
```

### 3. Start the Server with Ngrok Tunnel
```python
import os
import uvicorn
from pyngrok import ngrok
from santali_tts.scripts.colab_server import app

# Set your free Ngrok auth token (from https://dashboard.ngrok.com)
NGROK_AUTH_TOKEN = "your_ngrok_authtoken_here"
ngrok.set_auth_token(NGROK_AUTH_TOKEN)

# Open tunnel on port 8000
tunnel = ngrok.connect(8000)
public_url = tunnel.public_url
print(f"🔥 Live Public Tunnel URL: {public_url}")
print(f"👉 Paste this into the MatrVaani Web UI Colab URL input box!")

# Start FastAPI server
import nest_asyncio
import asyncio
nest_asyncio.apply()

config = uvicorn.Config(app, host="0.0.0.0", port=8000, log_level="info")
server = uvicorn.Server(config)
asyncio.run(server.serve())
```

### 4. Alternative: Cloudflare Tunnel (Zero-Account Setup)
If you do not want an ngrok account:
```bash
# Download cloudflared binary
!wget -q -nc https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
!dpkg -i cloudflared-linux-amd64.deb > /dev/null

# Start server in background
!nohup python -m uvicorn santali_tts.scripts.colab_server:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &

# Launch tunnel
!cloudflared tunnel --url http://127.0.0.1:8000
```
Look for the output line:
```
Your quick Tunnel has been created! Visit: https://[random-subdomain].trycloudflare.com
```

---

## 📡 API Endpoint Reference

### 1. Health Probe
- **Endpoint**: `GET /health`
- **Headers**:
  ```http
  Accept: application/json
  ngrok-skip-browser-warning: true
  ```
- **Response**:
  ```json
  {
    "status": "ok",
    "model_loaded": true,
    "device": "cuda",
    "model_name": "ai4bharat/indic-parler-tts-pretrained",
    "language": "Santali (sat)",
    "script": "Ol Chiki (U+1C50-U+1C7F)"
  }
  ```

### 2. Speech Synthesis
- **Endpoint**: `POST /synthesize`
- **Headers**:
  ```http
  Content-Type: application/json
  ngrok-skip-browser-warning: true
  ```
- **Payload**:
  ```json
  {
    "text": "ᱡᱚᱦᱟᱨ",
    "gender": "female",
    "description": "A clear natural Santali female voice speaking clearly in Ol Chiki script."
  }
  ```
- **Response**:
  Binary `audio/wav` stream (44,100 Hz, 16-bit PCM WAV).

---

## 🧪 Testing with cURL
```bash
# Test health check
curl -H "ngrok-skip-browser-warning: true" https://your-tunnel.ngrok-free.dev/health

# Synthesize audio to disk
curl -X POST https://your-tunnel.ngrok-free.dev/synthesize \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{"text": "ᱡᱚᱦᱟᱨ", "gender": "female"}' \
  --output test_santali.wav
```

---

## 🛡️ Critical Technical Details & Fixes

1. **Ngrok Interstitial Bypass**:
   Free ngrok domains show an HTML interstitial warning screen on standard browser `GET`/`POST` requests. MatrVaani handles this automatically by attaching the header `"ngrok-skip-browser-warning": "true"` to all browser fetch calls.

2. **CORS Headers**:
   The FastAPI server in `santali_tts/scripts/colab_server.py` enables wild-card CORS (`allow_origins=["*"]`) so any client instance (including `localhost` or GitHub Pages) can invoke the API without origin errors.

3. **Autoregressive Duration Cap**:
   Autoregressive generation on long sequences can exhaust GPU VRAM. The server restricts prompt tokens and caps maximum duration at 30 seconds to guarantee < 2.5s synthesis times.
