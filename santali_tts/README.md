# Santali (Ol Chiki) TTS Fine-Tuning Pipeline

Fine-tune [ai4bharat/indic-parler-tts-pretrained](https://huggingface.co/ai4bharat/indic-parler-tts-pretrained)
on the Santali subset of [ai4bharat/Rasa](https://huggingface.co/datasets/ai4bharat/Rasa) for
Ol Chiki text → Santali speech synthesis.

## Prerequisites

1. **Google Colab** with GPU runtime (T4 minimum, A100 recommended).
2. **Hugging Face account** with accepted access to:
   - `ai4bharat/indic-parler-tts-pretrained` (gated model)
   - `ai4bharat/Rasa` (gated dataset)
3. A Hugging Face **write token** from <https://huggingface.co/settings/tokens>.

## Project Structure

```
santali_tts/
├── notebooks/
│   └── santali_tts_colab.ipynb   # Main Colab notebook
├── scripts/
│   ├── prepare_dataset.py         # Dataset preparation
│   ├── train.py                   # Training launcher
│   └── infer.py                   # Inference script
├── data/                          # Cached processed datasets
├── checkpoints/                   # Training checkpoints
├── outputs/                       # Generated audio
└── README.md
```

## Quick Start

### 1. Setup (Colab)

Open `notebooks/santali_tts_colab.ipynb` in Google Colab and run cells sequentially.

### 2. HF Access

Before running, ensure you have:
- Accepted the gated model at: https://huggingface.co/ai4bharat/indic-parler-tts-pretrained
- Accepted the gated dataset at: https://huggingface.co/datasets/ai4bharat/Rasa
- Logged in via `notebook_login()` or `huggingface-cli login`

### 3. Dataset Preparation

The notebook automatically:
- Loads the Santali config from `ai4bharat/Rasa`
- Selects 500-1000 samples deterministically (seed=42)
- Filters empty/invalid text and audio
- Validates Ol Chiki Unicode (U+1C50–U+1C7F)
- Adds a deterministic description column

### 4. Training

**Option A: Using the Training Launcher (`scripts/train.py`):**
```bash
# Start 1-epoch test run (800 samples)
python scripts/train.py --parler_tts_dir ./parler-tts

# Resume from latest checkpoint
python scripts/train.py --parler_tts_dir ./parler-tts --resume
```

**Option B: Direct Accelerate Launch Command:**
```bash
accelerate launch ./parler-tts/training/run_parler_tts_training.py \
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

**Resume Command (Direct Accelerate):**
```bash
# Auto-detects checkpoint in output_dir, or specify explicitly:
accelerate launch ./parler-tts/training/run_parler_tts_training.py \
    [...all arguments above...] \
    --resume_from_checkpoint ./checkpoints/santali-parler-test/checkpoint-100
```

### 5. Inference

```bash
python scripts/infer.py \
    --checkpoint_dir ./checkpoints/santali-parler-test \
    --text "ᱱᱚᱶᱟ ᱫᱤᱱ ᱨᱮ ᱵᱚᱫᱚᱞ" \
    --output_dir ./outputs
```

### 6. Full-Dataset Training

To train on the full Santali dataset (~25K samples):
1. Remove `--max_train_samples 800` from the training command
2. Increase `--num_train_epochs` to 3-5
3. Increase `--warmup_steps` to 500-1000
4. Consider using `--save_steps 1000` and `--eval_steps 1000`
5. Increase `--logging_steps` to 50-100
6. Use a larger GPU (A100 80GB) or enable DeepSpeed

## Technical Details

| Component | Value |
|---|---|
| Base Model | `ai4bharat/indic-parler-tts-pretrained` |
| Audio Codec | DAC (Descript Audio Codec) |
| Sampling Rate | 44,100 Hz |
| Architecture | Parler-TTS (MusicGen-based) |
| Text Encoder | Frozen (cross-attention) |
| Prompt Tokenizer | From base model |
| Description Tokenizer | From base model text encoder |
| Script | Ol Chiki (ᱚᱞ ᱪᱤᱠᱤ), Unicode U+1C50–U+1C7F |

## License

The Rasa dataset is released under CC-BY-4.0. Check model license at the HF model card.
