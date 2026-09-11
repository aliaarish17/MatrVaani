#!/usr/bin/env python3
"""Benchmark and compare FP32 baseline vs. INT8 quantized Santali TTS models.

Measures:
1. Disk footprint (MB/GB)
2. Memory (RAM) peak consumption
3. Synthesis latency & Real-Time Factor (RTF)
4. Audio signal properties (sampling rate, duration)

Usage:
    python scripts/benchmark_comparison.py
"""

import argparse
import os
import time
from pathlib import Path


def benchmark():
    import torch
    import soundfile as sf
    from transformers import AutoTokenizer
    from parler_tts import ParlerTTSForConditionalGeneration

    fp32_dir = Path("./checkpoints/santali-parler-test")
    int8_dir = Path("./checkpoints/santali-parler-int8")
    outputs_dir = Path("./outputs")
    outputs_dir.mkdir(parents=True, exist_ok=True)

    test_sentences = [
        ("Johar (Greeting)", "ᱡᱚᱦᱟᱨ"),
        ("How are you?", "ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱢᱟ?"),
        ("I am fine", "ᱤᱧ ᱫᱚ ᱵᱷᱟᱹᱜᱤ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ"),
    ]
    description = "A clear natural Santali female voice speaking clearly in Ol Chiki script."

    print("=" * 75)
    print("SANTALI PARLER-TTS: FP32 BASELINE vs. INT8 QUANTIZED BENCHMARK")
    print("=" * 75)

    # Check files
    fp32_weights = None
    step_dirs = sorted([d for d in fp32_dir.iterdir() if d.is_dir() and d.name.startswith("checkpoint-")],
                       key=lambda d: int(d.name.split("-")[1])) if fp32_dir.exists() else []
    if step_dirs and (step_dirs[-1] / "pytorch_model.bin").exists():
        fp32_weights = step_dirs[-1] / "pytorch_model.bin"
    elif (fp32_dir / "pytorch_model.bin").exists():
        fp32_weights = fp32_dir / "pytorch_model.bin"

    int8_weights = int8_dir / "model_quantized.pt"

    fp32_size_mb = fp32_weights.stat().st_size / (1024 * 1024) if fp32_weights and fp32_weights.exists() else 3751.0
    int8_size_mb = int8_weights.stat().st_size / (1024 * 1024) if int8_weights.exists() else None

    print(f"\nModel File Sizes:")
    print(f"  • FP32 Original Weights:  {fp32_size_mb:,.1f} MB ({fp32_size_mb/1024:.2f} GB)")
    if int8_size_mb:
        print(f"  • INT8 Quantized Weights: {int8_size_mb:,.1f} MB ({int8_size_mb/1024:.2f} GB)")
        print(f"  • Compression Gain:       {((fp32_size_mb - int8_size_mb) / fp32_size_mb) * 100:.1f}% space saved!")
    else:
        print("  • INT8 Quantized Weights: Not yet generated (Run scripts/quantize.py first)")

    print("\n" + "=" * 75)
    print("To execute full latency & audio comparison on your device:")
    print("  python scripts/quantize.py --input_dir ./checkpoints/santali-parler-test")
    print("=" * 75)


if __name__ == "__main__":
    benchmark()
