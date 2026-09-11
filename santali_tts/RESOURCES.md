# Resources & Datasets Documentation: Santali (Ol Chiki) TTS Pipeline

This document provides a comprehensive, structured reference for all datasets, pretrained models, audio codecs, tokenizers, open-source repositories, and Unicode specifications utilized in the **Santali (Ol Chiki) Indic Parler-TTS** fine-tuning and inference pipeline.

---

## 1. Primary Dataset: AI4Bharat Rasa (Santali Split)

- **Dataset Identifier**: [`ai4bharat/Rasa`](https://huggingface.co/datasets/ai4bharat/Rasa)
- **Organization**: AI4Bharat (IIT Madras / EkStep Foundation)
- **Configuration Used**: `"Santali"`
- **Access Policy**: Gated (requires accepting repository terms on Hugging Face Hub)
- **Dataset License**: Creative Commons Attribution 4.0 International ([CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/))
- **Language**: Santali (`sat` / `sat_Olck`)
- **Script**: Ol Chiki (ᱚᱞ ᱪᱤᱠᱤ)
- **Audio Quality**: Studio-recorded, 48,000 Hz native sampling rate, 16-bit PCM WAV

### Data Split & Volume Statistics
| Split | Total Samples | Total Duration | Approx. Storage Size |
| :--- | :--- | :--- | :--- |
| **Train** | 25,184 rows | ~42 hours | ~7.8 GB (26 Parquet shards) |
| **Test / Eval** | 2,798 rows | ~4.7 hours | ~873 MB |
| **Feasibility Run (This Pipeline)** | 800 train / 100 eval | ~1.4 hours | ~280 MB |

### Schema & Feature Specification
```json
{
  "filename": "string (e.g., 'SAT_M_CONV_00693')",
  "text": "string (Santali text written in Ol Chiki Unicode script)",
  "language": "string ('Santali')",
  "gender": "string ('Male' or 'Female')",
  "style": "string ('CONV', 'NEWS', 'READ', etc.)",
  "duration": "string (audio duration in seconds)",
  "wav_path": "string (relative file path in original release)",
  "audio": {
    "bytes": "binary audio payload",
    "path": "string",
    "sampling_rate": 48000
  }
}
```

---

## 2. Pretrained Foundation Model: Indic Parler-TTS

- **Model Identifier**: [`ai4bharat/indic-parler-tts-pretrained`](https://huggingface.co/ai4bharat/indic-parler-tts-pretrained)
- **Architecture**: `ParlerTTSForConditionalGeneration` (based on MusicGen / AudioCraft autoregressive decoder architecture)
- **Access Policy**: Gated (requires Hugging Face authentication token)
- **Model Checkpoint Size**: ~3.75 GB (`pytorch_model.bin` / `model.safetensors`)
- **Supported Languages**: 22 Scheduled Indian Languages + English (including low-resource languages like Santali, Bodo, Maithili, Dogri)

### Architecture Decomposition
1. **Cross-Attention Text Conditioning Encoder**:
   - Model: `google/flan-t5-large` (24 layers, 1024 hidden dimension)
   - Function: Processes the natural language description (e.g. *"A clear natural Santali female voice speaking clearly in Ol Chiki script."*)
   - Frozen during fine-tuning (`--freeze_text_encoder true`) to conserve GPU VRAM.
2. **Autoregressive Audio Decoder**:
   - Model: `ParlerTTSForCausalLM` (24 layers, 16 attention heads, 1024 hidden dimension)
   - Cross-attention to text encoder embeddings + delay pattern masking.
   - Outputs multi-codebook discrete audio tokens.

---

## 3. Neural Audio Codec: Descript Audio Codec (DAC)

- **Codec Model**: [`ylacombe/dac_44khz`](https://huggingface.co/ylacombe/dac_44khz) / `DacModel`
- **Native Sampling Rate**: **44,100 Hz** (Mono)
- **Number of Codebooks**: **9** quantizer codebooks
- **Codebook Size**: 1,024 entries per codebook
- **Downsampling / Hop Length**: 512 samples (~86.13 Hz frame rate)
- **Bitrate**: ~7.75 kbps high-fidelity neural audio representation
- **Preprocessing Action**: The pipeline resamples all Rasa audio from 48,000 Hz down to 44,100 Hz to ensure exact alignment with DAC convolutional kernels.

---

## 4. Tokenizers

| Component | Identifier / Source | Vocab Size | Role |
| :--- | :--- | :--- | :--- |
| **Prompt Tokenizer** | `ai4bharat/indic-parler-tts-pretrained` | **90,714 tokens** | Tokenizes the Ol Chiki / Indic prompt text to be spoken. |
| **Description Tokenizer** | `google/flan-t5-large` | **32,128 tokens** | Tokenizes the voice style, gender, and pacing conditioning description. |

---

## 5. Unicode & Linguistic Resources: Ol Chiki (ᱚᱞ ᱪᱤᱠᱤ)

- **Script Name**: Ol Chiki (Santali alphabet invented by Pandit Raghunath Murmu in 1925)
- **Unicode Block**: `U+1C50` to `U+1C7F`
- **ISO 15924 Code**: `Olck`
- **ISO 639-3 Code**: `sat`
- **Unicode Standard Reference**: [Unicode Consortium Ol Chiki Chart (v15.0)](https://www.unicode.org/charts/PDF/U1C50.pdf)

### Core Character Set Used in Normalization & Validation
- **Vowels (ᱛᱟᱹᱥᱩᱨ ᱟᱲᱟᱝ)**: `ᱚ` (LA), `ᱟ` (LAA), `ᱤ` (LI), `ᱩ` (LU), `ᱮ` (LE), `ᱳ` (LO)
- **Consonants (ᱯᱟᱹᱨᱥᱩᱨ ᱟᱲᱟᱝ)**: `ᱛ` (AT), `ᱜ` (AG), `ᱝ` (ANG), `ᱞ` (AL), `ᱠ` (AAK), `ᱡ` (AAJ), `ᱢ` (AAM), `ᱣ` (AAW), `ᱥ` (IS), `ᱦ` (IH), `ᱧ` (INY), `ᱨ` (IR), `ᱪ` (UCH), `ᱫ` (UD), `ᱬ` (UNN), `ᱭ` (UY), `ᱯ` (EP), `ᱰ` (EDD), `ᱱ` (EN), `ᱲ` (ERR), `ᱴ` (OTT), `ᱵ` (OB), `ᱶ` (OV), `ᱷ` (OH)
- **Diacritics & Modifiers**:
  - `ᱸ` (`U+1C78`, Mu Tuḍag - nasalization / Chandrabindu)
  - `ᱹ` (`U+1C79`, Gāhlā Tuḍag - vowel baseline lowering)
  - `ᱺ` (`U+1C7A`, Mu-Gāhlā Tuḍag)
  - `ᱻ` (`U+1C7B`, Rēlā - vowel elongation)
  - `ᱼ` (`U+1C7C`, Ahvēn - deglottalization)
  - `ᱽ` (`U+1C7D`, Ohōd - degenerate consonant release)
- **Punctuation**:
  - `᱾` (`U+1C7E`, Mucād - Santali full stop / Purna Virama)
  - `᱿` (`U+1C7F`, Double Mucād)

---

## 6. Software Libraries & Repositories

| Software / Library | Version Pin | Source / Repository | Purpose |
| :--- | :--- | :--- | :--- |
| **Parler-TTS** | `main` branch | [GitHub: huggingface/parler-tts](https://github.com/huggingface/parler-tts) | Core model architecture, DAC wrapper, training collators |
| **Transformers** | `4.46.1` | [PyPI: transformers](https://pypi.org/project/transformers/) | Model loading, T5 text encoder, optimization loops |
| **Datasets** | `2.18.0` | [PyPI: datasets](https://pypi.org/project/datasets/) | Hugging Face streaming and disk caching of audio parquet data |
| **Accelerate** | `0.28.0` | [PyPI: accelerate](https://pypi.org/project/accelerate/) | Multi-GPU / mixed precision (FP16/BF16) orchestration |
| **Descript Audio Codec** | `>=1.0.0` | [GitHub: descriptinc/descript-audio-codec](https://github.com/descriptinc/descript-audio-codec) | Neural audio compression & decompression |
| **SoundFile** | `>=0.12.1` | [PyPI: soundfile](https://pypi.org/project/soundfile/) | 44.1 kHz WAV audio file writing and inspection |
| **Librosa** | `>=0.10.1` | [PyPI: librosa](https://pypi.org/project/librosa/) | Audio signal resampling and spectrum processing |
| **Evaluate** | `>=0.4.1` | [PyPI: evaluate](https://pypi.org/project/evaluate/) | Metrics tracking during training evaluation steps |

---

## 7. Web & Speech API Specifications (Web UI)

- **Speech Recognition API**: W3C Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`)
  - Recognition Locale: `hi-IN` (Hindi - India)
  - Intercepted normalization: Canonical Unicode NFC composition, Nukta folding (`ज़` $\rightarrow$ `ज`, `फ़` $\rightarrow$ `फ`, `ड़` $\rightarrow$ `ड`), and filler word cleaning.
- **Web UI Font Assets**:
  - `Noto Sans Ol Chiki` (Google Fonts / SIL Open Font License)
  - `Noto Sans Devanagari` (Google Fonts / SIL Open Font License)
  - `Outfit` (Modern UI typography)
