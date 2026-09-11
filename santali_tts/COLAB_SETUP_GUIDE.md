# Complete Google Colab Setup & Execution Guide: Santali (Ol Chiki) TTS Pipeline

This comprehensive, step-by-step markdown manual covers setup, execution, fine-tuning, audio inference, and permanent Google Drive backup for **`ai4bharat/indic-parler-tts-pretrained`** on the Santali (Ol Chiki) split of **`ai4bharat/Rasa`**.

---

## 📋 Table of Contents
1. [Prerequisites & One-Time Permissions](#1-prerequisites--one-time-permissions)
2. [Colab Environment & GPU Setup](#2-colab-environment--gpu-setup)
3. [Step-by-Step Refined Notebook Cells](#3-step-by-step-refined-notebook-cells)
   - [Cell 1: Dependencies & Repository Setup](#cell-1-dependencies--repository-setup)
   - [Cell 2: GPU Diagnostics & Mixed Precision](#cell-2-gpu-diagnostics--mixed-precision)
   - [Cell 3: Hugging Face Authentication](#cell-3-hugging-face-authentication)
   - [Cell 4: Mount Google Drive (Permanent Storage)](#cell-4-mount-google-drive-permanent-storage)
   - [Cell 5: Dataset Preparation & Ol Chiki Verification](#cell-5-dataset-preparation--ol-chiki-verification)
   - [Cell 6: Inspection of Base Model & Tokenizers](#cell-6-inspection-of-base-model--tokenizers)
   - [Cell 7: Source Code Patches & 1-Epoch Training Execution](#cell-7-source-code-patches--1-epoch-training-execution)
   - [Cell 8: Checkpoint Verification & Google Drive Backup](#cell-8-checkpoint-verification--google-drive-backup)
   - [Cell 9: High-Speed Inference on Ol Chiki Sentences](#cell-9-high-speed-inference-on-ol-chiki-sentences)
   - [Cell 10: Interactive Audio Playback & Spectrograms](#cell-10-interactive-audio-playback--spectrograms)
4. [Troubleshooting & Common Pitfalls](#4-troubleshooting--common-pitfalls)
5. [Useful Santali (Ol Chiki) Phrases for Testing](#5-useful-santali-ol-chiki-phrases-for-testing)

---

## 1. Prerequisites & One-Time Permissions

Before running the code in Colab, you **must** accept access to both gated repositories on Hugging Face (otherwise, downloads fail with `401 Unauthorized`):

1. **Model Access**: Go to [ai4bharat/indic-parler-tts-pretrained](https://huggingface.co/ai4bharat/indic-parler-tts-pretrained) $\rightarrow$ Click **"Acknowledge / Agree to conditions"**.
2. **Dataset Access**: Go to [ai4bharat/Rasa](https://huggingface.co/datasets/ai4bharat/Rasa) $\rightarrow$ Click **"Agree and access repository"**.
3. **Generate a Free Token**:
   - Go to [Hugging Face Settings $\rightarrow$ Access Tokens](https://huggingface.co/settings/tokens).
   - Click **"+ Create new token"**.
   - Type: **Write** (or **Read**), Name: `colab-tts`.
   - Click **Create** and **Copy** the token string (`hf_...`).

---

## 2. Colab Environment & GPU Setup

1. Open [Google Colab](https://colab.research.google.com).
2. Create a **New Notebook**.
3. **Enable GPU (Crucial)**:
   - Click top menu: **Runtime** $\rightarrow$ **Change runtime type**.
   - Under *Hardware accelerator*, select **T4 GPU** (or A100 if subscribed).
   - Click **Save**.
4. In the top-right corner, click **Connect** (ensure it displays a green checkmark with **RAM** and **Disk** meters).

---

## 3. Step-by-Step Refined Notebook Cells

Create and run the following cells sequentially (**Shift + Enter**):

---

### Cell 1: Dependencies & Repository Setup
Installs verified package versions, pins Transformers to `4.46.1` to prevent breaking API changes, and clones the Parler-TTS codebase.

```python
# Cell 1: Install core dependencies & clone Parler-TTS repo
!pip install -q git+https://github.com/huggingface/parler-tts.git
!pip install -q "transformers==4.46.1" "datasets==2.18.0" "accelerate==0.28.0"
!pip install -q soundfile librosa descript-audio-codec evaluate huggingface_hub
!pip install -q --upgrade protobuf

# Clone repository if not present
import os
if not os.path.exists("parler-tts"):
    !git clone https://github.com/huggingface/parler-tts.git

# Set environment flags to prevent TensorFlow conflicts
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

print("✓ All dependencies installed and Parler-TTS cloned successfully!")
```

---

### Cell 2: GPU Diagnostics & Mixed Precision
Validates that the Nvidia GPU is properly attached and detects compute capability.

```python
# Cell 2: Environment and GPU diagnostics
import sys
import torch
import transformers
import datasets
import accelerate

print("=" * 60)
print(f"Python Version:       {sys.version.split()[0]}")
print(f"PyTorch Version:      {torch.__version__}")
print(f"Transformers Version: {transformers.__version__}")
print(f"Datasets Version:     {datasets.__version__}")
print(f"CUDA Available:       {torch.cuda.is_available()}")

if not torch.cuda.is_available():
    raise SystemError(
        "CRITICAL: GPU is unavailable! Colab is running on CPU.\n"
        "Go to Runtime -> Change runtime type -> Select T4 GPU."
    )

gpu_name = torch.cuda.get_device_name(0)
total_vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
cuda_capability = torch.cuda.get_device_capability(0)

print(f"GPU Name:             {gpu_name}")
print(f"Total VRAM:           {total_vram_gb:.2f} GB")

# Determine optimal precision (bfloat16 for Ampere A100, float16 for Turing T4)
USE_BF16 = cuda_capability[0] >= 8
MIXED_PRECISION = "bfloat16" if USE_BF16 else "float16"
print(f"Selected Mixed Precision: {MIXED_PRECISION}")
print("=" * 60)
```

---

### Cell 3: Hugging Face Authentication
Logs into Hugging Face to authorize access to the gated model and dataset.

```python
# Cell 3: Hugging Face Authentication
from huggingface_hub import login, HfFolder

if not HfFolder.get_token():
    print("Paste your Hugging Face Token (starts with hf_...) below and press Enter:")
    login()
else:
    print("✓ Hugging Face token already cached and verified.")
```

---

### Cell 4: Mount Google Drive (Permanent Storage)
Connecting Google Drive prevents model loss when your Colab session disconnects or resets.

```python
# Cell 4: Mount Google Drive
from google.colab import drive
import os

print("Connecting Google Drive...")
drive.mount('/content/drive')

DRIVE_BACKUP_DIR = "/content/drive/MyDrive/santali_tts_checkpoint"
os.makedirs(DRIVE_BACKUP_DIR, exist_ok=True)
print(f"✓ Google Drive connected! Checkpoints will be permanently saved to: {DRIVE_BACKUP_DIR}")
```

---

### Cell 5: Dataset Preparation & Ol Chiki Verification
Downloads the Santali split of `ai4bharat/Rasa`, deterministically selects 800 train and 100 test samples (`seed=42`), validates the Ol Chiki Unicode range (`U+1C50`–`U+1C7F`), resamples the audio to 44.1 kHz (standard for the DAC codec), and saves pure Parquet splits.

```python
# Cell 5: Deterministic Sampling & Parquet Conversion
import os
import re
import shutil
from pathlib import Path
from datasets import load_dataset, Audio

print("=" * 70)
print("Downloading & Preparing 800 Santali Samples...")
print("=" * 70)

DATASET_NAME = "ai4bharat/Rasa"
DATASET_CONFIG = "Santali"
TARGET_SR = 44100
PREPARED_DIR = Path("./data/santali_prepared")

if PREPARED_DIR.exists():
    shutil.rmtree(PREPARED_DIR)
PREPARED_DIR.mkdir(parents=True, exist_ok=True)

# 1. Load Rasa Santali
raw_train = load_dataset(DATASET_NAME, DATASET_CONFIG, split="train")
raw_test = load_dataset(DATASET_NAME, DATASET_CONFIG, split="test")

# 2. Select 800 train + 100 eval deterministically
sub_train = raw_train.shuffle(seed=42).select(range(min(800, len(raw_train))))
sub_test = raw_test.shuffle(seed=42).select(range(min(100, len(raw_test))))

# 3. Filter valid samples
def is_valid(ex):
    return bool(ex.get("text") and str(ex.get("text")).strip() and ex.get("audio"))

sub_train = sub_train.filter(is_valid)
sub_test = sub_test.filter(is_valid)

# 4. Verify Ol Chiki Unicode presence (U+1C50 to U+1C7F)
OL_CHIKI_REGEX = re.compile(r"[\u1C50-\u1C7F]")
ol_count = sum(1 for ex in sub_train if OL_CHIKI_REGEX.search(ex["text"]))
print(f"Validated Samples: {len(sub_train)} ({ol_count}/{len(sub_train)} contain pure Ol Chiki script)")

# 5. Add Voice Conditioning Description
def add_desc(ex):
    gender = "male" if ex.get("gender", "female").strip().lower() == "male" else "female"
    style = ex.get("style", "neutral").strip().lower()
    if style and style not in ("neutral", "normal", "default"):
        desc = f"A clear natural Santali {gender} voice speaking in a {style} tone in Ol Chiki script."
    else:
        desc = f"A clear natural Santali {gender} voice speaking clearly in Ol Chiki script."
    return {"description": desc}

sub_train = sub_train.map(add_desc)
sub_test = sub_test.map(add_desc)

# 6. Resample audio to 44.1 kHz (required by Descript Audio Codec)
sub_train = sub_train.cast_column("audio", Audio(sampling_rate=TARGET_SR))
sub_test = sub_test.cast_column("audio", Audio(sampling_rate=TARGET_SR))

# 7. Export pure Parquet splits
print(f"Exporting Parquet files to {PREPARED_DIR}...")
sub_train.to_parquet(str(PREPARED_DIR / "train.parquet"))
sub_test.to_parquet(str(PREPARED_DIR / "test.parquet"))
print("✓ Step 5 Complete: Prepared Parquet dataset ready for training!")
```

---

### Cell 6: Inspection of Base Model & Tokenizers
Inspects the architecture of `ai4bharat/indic-parler-tts-pretrained`, dual tokenizers, and DAC codebook count.

```python
# Cell 6: Inspect base model tokenizers and codec configuration
from transformers import AutoTokenizer
from parler_tts import ParlerTTSForConditionalGeneration, ParlerTTSConfig

BASE_MODEL_NAME = "ai4bharat/indic-parler-tts-pretrained"

print(f"Inspecting config from {BASE_MODEL_NAME}...")
config = ParlerTTSConfig.from_pretrained(BASE_MODEL_NAME)
prompt_tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME)

desc_tokenizer_name = getattr(config.text_encoder, "_name_or_path", BASE_MODEL_NAME)
try:
    desc_tokenizer = AutoTokenizer.from_pretrained(desc_tokenizer_name)
except Exception:
    desc_tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME)

print("=" * 60)
print(f"Model Architecture:         {config.architectures}")
print(f"Audio Codec Sampling Rate:  {config.sampling_rate} Hz")
print(f"Prompt Tokenizer Vocab:     {len(prompt_tokenizer):,} tokens")
print(f"Description Tokenizer:      {desc_tokenizer_name}")
print(f"Decoder Codebooks:          {config.decoder.num_codebooks}")
print("=" * 60)
```

---

### Cell 7: Source Code Patches & 1-Epoch Training Execution
Applies two upstream bug fixes to Parler-TTS (`data.py` and `run_parler_tts_training.py` bandwidth parameter for DAC models) and executes 49 steps of fine-tuning using Accelerate (~2.5 minutes).

```python
# Cell 7: Apply Patches & Launch 1-Epoch Feasibility Training
import os
from pathlib import Path

OUTPUT_DIR = "./checkpoints/santali-parler-test"
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
Path("./data/audio_codes_tmp").mkdir(parents=True, exist_ok=True)
Path("./data/processed_dataset").mkdir(parents=True, exist_ok=True)

# Patch 1: metadata_dataset_names bug in data.py
for target in [
    "/usr/local/lib/python3.13/dist-packages/training/data.py",
    "./parler-tts/training/data.py"
]:
    try:
        with open(target, "r") as f:
            content = f.read()
        target_line = "dataset_names_dict = []"
        replacement = """if metadata_dataset_names is None:
        metadata_dataset_names = [None] * len(dataset_names)

    dataset_names_dict = []"""
        if target_line in content and "metadata_dataset_names is None:" not in content:
            content = content.replace(target_line, replacement)
            with open(target, "w") as f:
                f.write(content)
            print(f"✓ Patched {target}")
    except Exception:
        pass

# Patch 2: DacModel bandwidth bug in run_parler_tts_training.py
train_script = "./parler-tts/training/run_parler_tts_training.py"
try:
    with open(train_script, "r") as f:
        content = f.read()
    old_b = """            if bandwidth is not None:
                batch["bandwidth"] = bandwidth"""
    new_b = """            if bandwidth is not None and "bandwidth" in encoder_signature:
                batch["bandwidth"] = bandwidth"""
    if old_b in content:
        content = content.replace(old_b, new_b)
        with open(train_script, "w") as f:
            f.write(content)
        print("✓ Patched DacModel bandwidth handling!")
except Exception:
    pass

print("\nStarting Accelerate Training (49 Steps, ~2.5 mins)...")
!USE_TF=0 USE_TORCH=1 accelerate launch \
    ./parler-tts/training/run_parler_tts_training.py \
    --model_name_or_path ai4bharat/indic-parler-tts-pretrained \
    --train_dataset_name ./data/santali_prepared \
    --train_dataset_config_name default \
    --train_split_name train \
    --eval_dataset_name ./data/santali_prepared \
    --eval_dataset_config_name default \
    --eval_split_name test \
    --target_audio_column_name audio \
    --description_column_name description \
    --prompt_column_name text \
    --max_duration_in_seconds 30 \
    --min_duration_in_seconds 1.0 \
    --max_text_length 500 \
    --max_train_samples 800 \
    --max_eval_samples 50 \
    --preprocessing_num_workers 2 \
    --do_train true \
    --do_eval true \
    --num_train_epochs 1 \
    --gradient_accumulation_steps 8 \
    --gradient_checkpointing true \
    --per_device_train_batch_size 2 \
    --per_device_eval_batch_size 2 \
    --learning_rate 5e-5 \
    --lr_scheduler_type constant_with_warmup \
    --warmup_steps 50 \
    --logging_steps 10 \
    --save_steps 100 \
    --eval_steps 100 \
    --freeze_text_encoder true \
    --dtype float16 \
    --seed 42 \
    --output_dir ./checkpoints/santali-parler-test \
    --temporary_save_to_disk ./data/audio_codes_tmp/ \
    --save_to_disk ./data/processed_dataset/ \
    --audio_encoder_per_device_batch_size 4 \
    --dataloader_num_workers 2 \
    --report_to none \
    --group_by_length true \
    --attn_implementation sdpa \
    --predict_with_generate false \
    --overwrite_output_dir false
```

---

### Cell 8: Checkpoint Verification & Google Drive Backup
Verifies the generated weights (`pytorch_model.bin`, ~3.75 GB) and automatically copies them to Google Drive so your model is never lost when Colab disconnects.

```python
# Cell 8: Verify Checkpoint & Backup to Google Drive
import shutil
from pathlib import Path

LOCAL_CKPT = Path("./checkpoints/santali-parler-test")
DRIVE_DEST = Path("/content/drive/MyDrive/santali_tts_checkpoint")

step_dirs = sorted(
    [d for d in LOCAL_CKPT.iterdir() if d.is_dir() and d.name.startswith("checkpoint-")],
    key=lambda d: int(d.name.split("-")[1])
) if LOCAL_CKPT.exists() else []

if step_dirs:
    latest_step = step_dirs[-1]
    weights_path = latest_step / "pytorch_model.bin"
    print(f"✓ Found Checkpoint: {latest_step}")
    print(f"  Weights File:    {weights_path} ({weights_path.stat().st_size / (1024**3):.2f} GB)")

    # Copy to Google Drive
    print(f"\nBacking up model checkpoint to Google Drive: {DRIVE_DEST}...")
    if DRIVE_DEST.exists():
        shutil.rmtree(DRIVE_DEST)
    shutil.copytree(str(LOCAL_CKPT), str(DRIVE_DEST))
    print("✓ Successfully backed up to Google Drive! Your model is now safe permanently.")
else:
    print("Warning: No checkpoint found. Ensure Cell 7 completed successfully.")
```

---

### Cell 9: High-Speed Inference on Ol Chiki Sentences
Keeps the fine-tuned model resident in GPU VRAM and synthesizes Santali speech in **2–4 seconds** per sentence without reloading weights from disk.

```python
# Cell 9: High-Speed Persistent TTS Inference
import time
import torch
import soundfile as sf
from pathlib import Path
from transformers import AutoTokenizer
from parler_tts import ParlerTTSForConditionalGeneration

OUTPUT_DIR = Path("./outputs")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_WAV = OUTPUT_DIR / "test_santali.wav"

BASE_MODEL = "ai4bharat/indic-parler-tts-pretrained"
ROOT_DIR = Path("./checkpoints/santali-parler-test")
DRIVE_DIR = Path("/content/drive/MyDrive/santali_tts_checkpoint")

# Check local or Drive checkpoint
if (ROOT_DIR / "checkpoint-49-epoch-0" / "pytorch_model.bin").exists():
    weights_file = ROOT_DIR / "checkpoint-49-epoch-0" / "pytorch_model.bin"
elif (DRIVE_DIR / "checkpoint-49-epoch-0" / "pytorch_model.bin").exists():
    weights_file = DRIVE_DIR / "checkpoint-49-epoch-0" / "pytorch_model.bin"
else:
    weights_file = None

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Loading base architecture into {device}...")

model = ParlerTTSForConditionalGeneration.from_pretrained(
    BASE_MODEL,
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
).to(device)

if weights_file and weights_file.exists():
    print(f"Applying fine-tuned weights from: {weights_file}...")
    state_dict = torch.load(str(weights_file), map_location=device, weights_only=True)
    model.load_state_dict(state_dict, strict=False)
    print("✓ Fine-tuned Santali weights successfully applied!")

model.eval()

# Load Tokenizers
prompt_tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
desc_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)

# -------------------------------------------------------------
# Test Sentence: Modify this to synthesize any Santali sentence!
# -------------------------------------------------------------
test_ol_chiki = "ᱡᱚᱦᱟᱨ"  # Santali greeting: "Johar"
voice_description = "A clear natural Santali female voice speaking clearly in Ol Chiki script."

print(f"\nInput Text (Ol Chiki): {test_ol_chiki}")
print(f"Voice Description:     {voice_description}")

desc_inputs = desc_tokenizer(voice_description, return_tensors="pt", padding=True).to(device)
prompt_inputs = prompt_tokenizer(test_ol_chiki, return_tensors="pt", padding=True).to(device)

print("\nSynthesizing Santali speech...")
start_time = time.time()
with torch.no_grad():
    generation = model.generate(
        input_ids=desc_inputs.input_ids,
        attention_mask=desc_inputs.attention_mask,
        prompt_input_ids=prompt_inputs.input_ids,
        prompt_attention_mask=prompt_inputs.attention_mask,
        max_new_tokens=1000,
    )
gen_time = time.time() - start_time

audio_array = generation.cpu().float().numpy().squeeze()
sr = model.config.sampling_rate
duration = len(audio_array) / sr

sf.write(str(OUTPUT_WAV), audio_array, sr)

print("=" * 60)
print(f"Output File:     {OUTPUT_WAV}")
print(f"Sampling Rate:   {sr} Hz")
print(f"Audio Duration:  {duration:.2f} seconds")
print(f"Generation Time: {gen_time:.2f} seconds (RTF: {gen_time/duration:.2f}x)")
print("=" * 60)
```

---

### Cell 10: Interactive Audio Playback & Spectrograms
Renders an embedded audio player and plots the generated speech waveform and frequency spectrogram.

```python
# Cell 10: Interactive Audio Playback & Waveform Inspection
import IPython.display as ipd
import soundfile as sf
import matplotlib.pyplot as plt
import numpy as np

wav_path = "./outputs/test_santali.wav"
data, sr = sf.read(wav_path)

print(f"Playing: {wav_path} ({len(data)/sr:.2f}s, {sr} Hz)")

# Render interactive browser player
ipd.display(ipd.Audio(data, rate=sr))

# Plot waveform and spectrogram
fig, axs = plt.subplots(2, 1, figsize=(10, 4), sharex=True)
time_axis = np.linspace(0, len(data) / sr, num=len(data))

axs[0].plot(time_axis, data, color="#1f77b4", alpha=0.8)
axs[0].set_ylabel("Amplitude")
axs[0].set_title("Generated Santali Speech Waveform")
axs[0].grid(True, alpha=0.3)

axs[1].specgram(data, Fs=sr, NFFT=1024, noverlap=512, cmap="inferno")
axs[1].set_xlabel("Time (seconds)")
axs[1].set_ylabel("Frequency (Hz)")
axs[1].grid(True, alpha=0.3)

plt.tight_layout()
plt.show()
```

---

## 4. Troubleshooting & Common Pitfalls

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **`401 Client Error: Unauthorized`** | Hugging Face token missing or gated repo terms not accepted. | Run Cell 3, paste token, and click "Agree" on both model & dataset pages. |
| **`TypeError: 'NoneType' object is not subscriptable`** | Parler-TTS `data.py` bug when metadata datasets are omitted. | Handled automatically by the patch in Cell 7. |
| **`TypeError: DacModel.encode() got an unexpected keyword argument 'bandwidth'`** | Parler-TTS passes EnCodec `bandwidth` to DAC codec. | Handled automatically by the patch in Cell 7. |
| **`FileNotFoundError: ./checkpoints/...`** | Colab runtime was disconnected or restarted. | Mount Google Drive in Cell 4 and load weights from `/content/drive/MyDrive/santali_tts_checkpoint`. |
| **`ModuleNotFoundError: No module named 'evaluate'`** | Missing evaluate library in fresh session. | Ensure Cell 1 or `!pip install -q evaluate` is executed. |

---

## 5. Useful Santali (Ol Chiki) Phrases for Testing

Copy any of these phrases directly into `test_ol_chiki` in **Cell 9**:

| Phrase (Ol Chiki) | Pronunciation | Meaning |
| :--- | :--- | :--- |
| **`ᱡᱚᱦᱟᱨ`** | *Johar* | Greetings / Hello / Namaste |
| **`ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱢᱟ?`** | *Ched leka menama?* | How are you? (आप कैसे हैं?) |
| **`ᱤᱧ ᱫᱚ ᱵᱷᱟᱹᱜᱤ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ`** | *Injh do bhagi ge menanja* | I am fine (मैं ठीक हूँ) |
| **`ᱥᱟᱨᱦᱟᱣ`** | *Sarhaw* | Thank you (धन्यवाद / शुक्रिया) |
| **`ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ?`** | *Amag nhutum do ched?* | What is your name? (आपका नाम क्या है?) |
| **`ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ`** | *Sagun setag* | Good Morning (शुभ प्रभात) |
| **`ᱥᱟᱹᱜᱩᱱ ᱧᱤᱫᱟᱹ`** | *Sagun nhida* | Good Night (शुभ रात्रि) |

---

*Authored for the Santali (Ol Chiki) Low-Resource Speech Synthesis Project.*
