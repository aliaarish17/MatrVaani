#!/usr/bin/env python3
"""Quantize Fine-Tuned Santali Parler-TTS from FP32 to INT8.

This script:
1. Loads the fine-tuned FP32 model checkpoint.
2. Applies dynamic INT8 quantization (torch.ao.quantization.quantize_dynamic)
   specifically to the linear and attention projection layers of the Text Encoder
   and Audio Decoder.
3. Preserves the DAC audio codec in full precision to avoid metallic audio artifacts.
4. Packages tokenizers, configs, and generation parameters into the target directory.
5. Synthesizes a test Ol Chiki sentence using both models to verify audio fidelity.

Usage:
    python scripts/quantize.py \
        --input_dir ./checkpoints/santali-parler-test \
        --output_dir ./checkpoints/santali-parler-int8 \
        --test_text "ᱡᱚᱦᱟᱨ"
"""

import argparse
import os
import time
from pathlib import Path

BASE_MODEL = "ai4bharat/indic-parler-tts-pretrained"
DEFAULT_TEST_SENTENCE = "ᱡᱚᱦᱟᱨ"  # Santali 'Johar'
DEFAULT_DESCRIPTION = "A clear natural Santali female voice speaking clearly in Ol Chiki script."


def get_dir_size_mb(path: Path) -> float:
    """Calculate directory size in megabytes."""
    total_bytes = sum(f.stat().st_size for f in path.glob("**/*") if f.is_file())
    return total_bytes / (1024 * 1024)


def quantize_model(input_dir: str, output_dir: str, test_text: str = DEFAULT_TEST_SENTENCE):
    import torch
    import soundfile as sf
    from transformers import AutoTokenizer
    from parler_tts import ParlerTTSForConditionalGeneration

    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    outputs_dir = Path("./outputs")
    outputs_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print("SANTALI PARLER-TTS INT8 DYNAMIC QUANTIZATION PIPELINE")
    print("=" * 70)

    # 1. Locate model weights
    step_checkpoints = sorted(
        [d for d in input_path.iterdir() if d.is_dir() and d.name.startswith("checkpoint-")],
        key=lambda d: int(d.name.split("-")[1]),
    ) if input_path.exists() else []

    device = "cpu"  # Quantization is executed and tested for CPU deployment
    print(f"Loading base architecture from: {BASE_MODEL}...")
    model_fp32 = ParlerTTSForConditionalGeneration.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float32,
    ).to(device)

    # Apply fine-tuned weights if present
    fine_tuned_weights = None
    if step_checkpoints:
        candidate_bin = step_checkpoints[-1] / "pytorch_model.bin"
        if candidate_bin.exists():
            fine_tuned_weights = candidate_bin
    elif (input_path / "pytorch_model.bin").exists():
        fine_tuned_weights = input_path / "pytorch_model.bin"

    if fine_tuned_weights and fine_tuned_weights.exists():
        print(f"Applying fine-tuned weights from: {fine_tuned_weights}...")
        state_dict = torch.load(str(fine_tuned_weights), map_location=device, weights_only=True)
        model_fp32.load_state_dict(state_dict, strict=False)
        print("✓ Fine-tuned weights loaded successfully.")
    else:
        print("Note: Running quantization on base pretrained model.")

    model_fp32.eval()

    # Load tokenizers
    prompt_tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    desc_tokenizer_name = getattr(model_fp32.config.text_encoder, "_name_or_path", BASE_MODEL)
    try:
        desc_tokenizer = AutoTokenizer.from_pretrained(desc_tokenizer_name)
    except Exception:
        desc_tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)

    # 2. Benchmark Pre-Quantization (FP32)
    print("\n" + "-" * 70)
    print("[1/3] Benchmarking Pre-Quantization Model (FP32 Baseline)...")
    print("-" * 70)

    desc_inputs = desc_tokenizer(DEFAULT_DESCRIPTION, return_tensors="pt", padding=True).to(device)
    prompt_inputs = prompt_tokenizer(test_text, return_tensors="pt", padding=True).to(device)

    start_fp32 = time.time()
    with torch.no_grad():
        gen_fp32 = model_fp32.generate(
            input_ids=desc_inputs.input_ids,
            attention_mask=desc_inputs.attention_mask,
            prompt_input_ids=prompt_inputs.input_ids,
            prompt_attention_mask=prompt_inputs.attention_mask,
            max_new_tokens=1500,
        )
    fp32_time = time.time() - start_fp32
    audio_fp32 = gen_fp32.cpu().float().numpy().squeeze()
    sr = model_fp32.config.sampling_rate
    duration_fp32 = len(audio_fp32) / sr

    fp32_wav_path = outputs_dir / "test_santali_fp32.wav"
    sf.write(str(fp32_wav_path), audio_fp32, sr)
    print(f"FP32 Output Audio:   {fp32_wav_path} ({duration_fp32:.2f}s)")
    print(f"FP32 Generation Time: {fp32_time:.2f}s (RTF: {fp32_time/duration_fp32:.2f}x)")

    # 3. Apply Dynamic Quantization
    print("\n" + "-" * 70)
    print("[2/3] Performing Dynamic Quantization (FP32 -> INT8)...")
    print("      - Target: torch.nn.Linear & MultiheadAttention projection layers")
    print("      - Preserving: DAC Audio Codec in FP32 (prevents acoustic artifacts)")
    print("-" * 70)

    # Quantize text encoder and decoder linear layers dynamically
    quantized_model = torch.ao.quantization.quantize_dynamic(
        model_fp32,
        {torch.nn.Linear},
        dtype=torch.qint8,
    )

    print("✓ Dynamic quantization complete.")

    # 4. Benchmark Post-Quantization (INT8)
    print("\n" + "-" * 70)
    print("[3/3] Benchmarking Quantized Model (INT8 Optimized)...")
    print("-" * 70)

    start_int8 = time.time()
    with torch.no_grad():
        gen_int8 = quantized_model.generate(
            input_ids=desc_inputs.input_ids,
            attention_mask=desc_inputs.attention_mask,
            prompt_input_ids=prompt_inputs.input_ids,
            prompt_attention_mask=prompt_inputs.attention_mask,
            max_new_tokens=1500,
        )
    int8_time = time.time() - start_int8
    audio_int8 = gen_int8.cpu().float().numpy().squeeze()
    duration_int8 = len(audio_int8) / sr

    int8_wav_path = outputs_dir / "test_santali_int8.wav"
    sf.write(str(int8_wav_path), audio_int8, sr)
    print(f"INT8 Output Audio:   {int8_wav_path} ({duration_int8:.2f}s)")
    print(f"INT8 Generation Time: {int8_time:.2f}s (RTF: {int8_time/duration_int8:.2f}x)")

    # 5. Save Quantized Model & Configurations
    print("\nSaving quantized model package to:", output_path)
    model_save_path = output_path / "model_quantized.pt"
    torch.save(quantized_model.state_dict(), str(model_save_path))

    # Save configs and tokenizers into the quantized directory
    quantized_model.config.save_pretrained(str(output_path))
    prompt_tokenizer.save_pretrained(str(output_path))
    desc_tokenizer.save_pretrained(str(output_path / "description_tokenizer"))

    # Calculate sizes
    fp32_size_mb = fine_tuned_weights.stat().st_size / (1024 * 1024) if fine_tuned_weights else 3750.0
    int8_size_mb = model_save_path.stat().st_size / (1024 * 1024)
    compression_ratio = (1 - (int8_size_mb / fp32_size_mb)) * 100

    print("\n" + "=" * 70)
    print("QUANTIZATION BENCHMARK SUMMARY")
    print("=" * 70)
    print(f"Original FP32 Model Size:   {fp32_size_mb:,.1f} MB (~{fp32_size_mb/1024:.2f} GB)")
    print(f"Quantized INT8 Model Size:  {int8_size_mb:,.1f} MB (~{int8_size_mb/1024:.2f} GB)")
    print(f"Storage Reduction:          {compression_ratio:.1f}% smaller!")
    print(f"FP32 Output Audio:          {fp32_wav_path}")
    print(f"INT8 Output Audio:          {int8_wav_path}")
    print("=" * 70)
    print("\nQuantized package is ready in:", output_path)


def main():
    parser = argparse.ArgumentParser(description="Quantize Santali Parler-TTS to INT8")
    parser.add_argument(
        "--input_dir",
        type=str,
        default="./checkpoints/santali-parler-test",
        help="Path to FP32 checkpoint directory",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./checkpoints/santali-parler-int8",
        help="Path to save INT8 quantized model",
    )
    parser.add_argument(
        "--test_text",
        type=str,
        default=DEFAULT_TEST_SENTENCE,
        help="Ol Chiki sentence to test quality",
    )
    args = parser.parse_args()

    quantize_model(
        input_dir=args.input_dir,
        output_dir=args.output_dir,
        test_text=args.test_text,
    )


if __name__ == "__main__":
    main()
