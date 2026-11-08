#!/usr/bin/env python3
"""
MatrVaani: Unified CLI Pipeline Runner for Santali (Ol Chiki) Voice Synthesis.

This CLI provides a centralized entry point to execute every stage of the
MatrVaani model lifecycle:
  1. prepare   - Extract and validate Santali subset from ai4bharat/Rasa
  2. train     - Launch Accelerate training for Indic Parler-TTS fine-tuning
  3. infer     - Synthesize speech for any Ol Chiki Unicode text prompt
  4. quantize  - Quantize fine-tuned model from FP32 to dynamic INT8
  5. benchmark - Compare latency, RAM footprint, and RTF between FP32 & INT8
  6. serve     - Start the FastAPI GPU backend for live Web UI synthesis
"""

import argparse
import sys
import subprocess
from pathlib import Path

# Ensure UTF-8 output on all operating systems (prevents cp1252 errors on Windows)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

SCRIPTS_DIR = Path(__file__).resolve().parent / "scripts"


def run_script(script_name: str, extra_args: list[str]):
    script_path = SCRIPTS_DIR / script_name
    if not script_path.exists():
        print(f"Error: Script not found at {script_path}", file=sys.stderr)
        sys.exit(1)
    
    cmd = [sys.executable, str(script_path)] + extra_args
    print(f"\n[MatrVaani Pipeline] Running: {' '.join(cmd)}\n" + "-" * 60)
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"\n[MatrVaani Pipeline] Command exited with error code {e.returncode}", file=sys.stderr)
        sys.exit(e.returncode)


def main():
    parser = argparse.ArgumentParser(
        description="MatrVaani Santali (Ol Chiki) Voice AI & Pedagogy Pipeline CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python santali_tts/pipeline.py prepare --train_samples 800 --eval_samples 100
  python santali_tts/pipeline.py train --epochs 1 --batch_size 2
  python santali_tts/pipeline.py infer --text "ᱡᱚᱦᱟᱨ"
  python santali_tts/pipeline.py quantize --input_dir ./santali_tts/checkpoints/santali-parler-test
  python santali_tts/pipeline.py benchmark
  python santali_tts/pipeline.py serve --port 8000
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Available pipeline stages")

    # Subcommand: prepare
    sub_prepare = subparsers.add_parser("prepare", help="Prepare & validate Santali Rasa dataset")
    sub_prepare.add_argument("--train_samples", type=int, default=800, help="Number of training samples")
    sub_prepare.add_argument("--eval_samples", type=int, default=100, help="Number of eval samples")
    sub_prepare.add_argument("--output_dir", type=str, default="./santali_tts/data/santali_prepared")

    # Subcommand: train
    sub_train = subparsers.add_parser("train", help="Launch Parler-TTS training")
    sub_train.add_argument("--parler_tts_dir", type=str, default="./parler-tts", help="Path to cloned parler-tts repo")
    sub_train.add_argument("--resume", action="store_true", help="Resume from latest checkpoint")
    sub_train.add_argument("--epochs", type=int, default=1, help="Number of training epochs")
    sub_train.add_argument("--batch_size", type=int, default=2, help="Per-device batch size")

    # Subcommand: infer
    sub_infer = subparsers.add_parser("infer", help="Generate speech from Ol Chiki text")
    sub_infer.add_argument("--text", type=str, default="ᱡᱚᱦᱟᱨ", help="Input Santali text in Ol Chiki script")
    sub_infer.add_argument("--checkpoint_dir", type=str, default="./santali_tts/checkpoints/santali-parler-test")
    sub_infer.add_argument("--output_dir", type=str, default="./santali_tts/outputs")
    sub_infer.add_argument("--device", type=str, default="auto", choices=["auto", "cuda", "cpu"])

    # Subcommand: quantize
    sub_quantize = subparsers.add_parser("quantize", help="Quantize model weights to INT8")
    sub_quantize.add_argument("--input_dir", type=str, default="./santali_tts/checkpoints/santali-parler-test")
    sub_quantize.add_argument("--output_dir", type=str, default="./santali_tts/checkpoints/santali-parler-int8")
    sub_quantize.add_argument("--test_text", type=str, default="ᱡᱚᱦᱟᱨ")

    # Subcommand: benchmark
    sub_benchmark = subparsers.add_parser("benchmark", help="Run FP32 vs INT8 latency & memory benchmark")

    # Subcommand: serve
    sub_serve = subparsers.add_parser("serve", help="Start live FastAPI Colab synthesis server")
    sub_serve.add_argument("--port", type=int, default=8000, help="Server port")
    sub_serve.add_argument("--host", type=str, default="0.0.0.0", help="Server bind host")

    args, unknown = parser.parse_known_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    if args.command == "prepare":
        extra = [
            "--num_train_samples", str(args.train_samples),
            "--num_eval_samples", str(args.eval_samples),
            "--output_dir", args.output_dir
        ] + unknown
        run_script("prepare_dataset.py", extra)

    elif args.command == "train":
        extra = [
            "--parler_tts_dir", args.parler_tts_dir,
            "--num_epochs", str(args.epochs),
            "--batch_size", str(args.batch_size),
        ]
        if args.resume:
            extra.append("--resume")
        extra.extend(unknown)
        run_script("train.py", extra)

    elif args.command == "infer":
        extra = [
            "--text", args.text,
            "--checkpoint_dir", args.checkpoint_dir,
            "--output_dir", args.output_dir,
            "--device", args.device,
        ] + unknown
        run_script("infer.py", extra)

    elif args.command == "quantize":
        extra = [
            "--input_dir", args.input_dir,
            "--output_dir", args.output_dir,
            "--test_text", args.test_text,
        ] + unknown
        run_script("quantize.py", extra)

    elif args.command == "benchmark":
        run_script("benchmark_comparison.py", unknown)

    elif args.command == "serve":
        extra = unknown
        run_script("colab_server.py", extra)


if __name__ == "__main__":
    main()
