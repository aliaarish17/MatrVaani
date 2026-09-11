#!/usr/bin/env python3
"""Training launcher for Santali Parler-TTS fine-tuning.

This is a convenience wrapper that constructs the correct accelerate launch
command for the Parler-TTS training script. It can also be used to resume
from the latest checkpoint.

Usage:
    # First run
    python scripts/train.py --parler_tts_dir ./parler-tts

    # Resume from checkpoint
    python scripts/train.py --parler_tts_dir ./parler-tts --resume
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path


# ── Configuration ──────────────────────────────────────────────────────────
BASE_MODEL = "ai4bharat/indic-parler-tts-pretrained"
DEFAULT_DATASET_NAME = "./data/santali_prepared"
DEFAULT_DATASET_CONFIG = "default"


def get_latest_checkpoint(output_dir: str) -> str | None:
    """Find the latest checkpoint in the output directory."""
    output_path = Path(output_dir)
    if not output_path.exists():
        return None
    checkpoints = sorted(
        [d for d in output_path.iterdir() if d.is_dir() and d.name.startswith("checkpoint-")],
        key=lambda d: int(d.name.split("-")[-1]),
    )
    return str(checkpoints[-1]) if checkpoints else None


def build_training_command(
    parler_tts_dir: str,
    dataset_name: str = DEFAULT_DATASET_NAME,
    dataset_config: str = DEFAULT_DATASET_CONFIG,
    output_dir: str = "./checkpoints/santali-parler-test",
    resume_from: str | None = None,
    max_train_samples: int = 800,
    num_epochs: int = 1,
    batch_size: int = 2,
    gradient_accumulation: int = 8,
    learning_rate: float = 5e-5,
    dtype: str = "float16",
    max_eval_samples: int = 50,
) -> list[str]:
    """Build the accelerate launch command."""
    training_script = str(Path(parler_tts_dir) / "training" / "run_parler_tts_training.py")

    cmd = [
        "accelerate", "launch", training_script,
        "--model_name_or_path", BASE_MODEL,
        "--train_dataset_name", dataset_name,
        "--train_dataset_config_name", dataset_config,
        "--eval_dataset_name", dataset_name,
        "--eval_dataset_config_name", dataset_config,
        "--eval_split_name", "test",
        "--target_audio_column_name", "audio",
        "--description_column_name", "description",
        "--prompt_column_name", "text",
        "--max_duration_in_seconds", "30",
        "--min_duration_in_seconds", "1.0",
        "--max_text_length", "500",
        "--max_train_samples", str(max_train_samples),
        "--max_eval_samples", str(max_eval_samples),
        "--preprocessing_num_workers", "2",
        "--do_train", "true",
        "--do_eval", "true",
        "--num_train_epochs", str(num_epochs),
        "--gradient_accumulation_steps", str(gradient_accumulation),
        "--gradient_checkpointing", "true",
        "--per_device_train_batch_size", str(batch_size),
        "--per_device_eval_batch_size", "2",
        "--learning_rate", str(learning_rate),
        "--lr_scheduler_type", "constant_with_warmup",
        "--warmup_steps", "50",
        "--logging_steps", "10",
        "--save_steps", "100",
        "--eval_steps", "100",
        "--freeze_text_encoder", "true",
        "--dtype", dtype,
        "--seed", "42",
        "--output_dir", output_dir,
        "--temporary_save_to_disk", "./data/audio_codes_tmp/",
        "--save_to_disk", "./data/processed_dataset/",
        "--audio_encoder_per_device_batch_size", "4",
        "--dataloader_num_workers", "2",
        "--report_to", "none",
        "--group_by_length", "true",
        "--attn_implementation", "sdpa",
        "--predict_with_generate", "false",
        "--overwrite_output_dir", "false",
    ]

    if resume_from:
        cmd.extend(["--resume_from_checkpoint", resume_from])

    return cmd


def main():
    parser = argparse.ArgumentParser(description="Santali TTS Training Launcher")
    parser.add_argument(
        "--parler_tts_dir",
        type=str,
        default="./parler-tts",
        help="Path to the cloned parler-tts repository",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./checkpoints/santali-parler-test",
        help="Checkpoint output directory",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume from the latest checkpoint in output_dir",
    )
    parser.add_argument(
        "--max_train_samples",
        type=int,
        default=800,
        help="Number of training samples",
    )
    parser.add_argument(
        "--num_epochs",
        type=int,
        default=1,
        help="Number of training epochs",
    )
    parser.add_argument(
        "--batch_size",
        type=int,
        default=2,
        help="Per-device training batch size",
    )
    parser.add_argument(
        "--dtype",
        type=str,
        default="float16",
        choices=["float16", "bfloat16", "float32"],
        help="Training dtype",
    )
    parser.add_argument(
        "--train_dataset_name",
        type=str,
        default=DEFAULT_DATASET_NAME,
        help="Dataset name or path to prepared dataset directory",
    )
    parser.add_argument(
        "--train_dataset_config_name",
        type=str,
        default=DEFAULT_DATASET_CONFIG,
        help="Dataset configuration name",
    )
    args = parser.parse_args()

    # Validate parler-tts dir
    training_script = Path(args.parler_tts_dir) / "training" / "run_parler_tts_training.py"
    if not training_script.exists():
        print(f"ERROR: Training script not found at {training_script}")
        print(f"Make sure parler-tts is cloned at {args.parler_tts_dir}")
        sys.exit(1)

    # Check for resume
    resume_from = None
    if args.resume:
        resume_from = get_latest_checkpoint(args.output_dir)
        if resume_from:
            print(f"Resuming from: {resume_from}")
        else:
            print("No checkpoint found, starting from scratch.")

    # Build and run
    cmd = build_training_command(
        parler_tts_dir=args.parler_tts_dir,
        dataset_name=args.train_dataset_name,
        dataset_config=args.train_dataset_config_name,
        output_dir=args.output_dir,
        resume_from=resume_from,
        max_train_samples=args.max_train_samples,
        num_epochs=args.num_epochs,
        batch_size=args.batch_size,
        dtype=args.dtype,
    )

    print(f"\nLaunching training ...")
    print(f"Command: {' '.join(cmd)}\n")

    # Create output directories
    Path(args.output_dir).mkdir(parents=True, exist_ok=True)
    Path("./data/audio_codes_tmp").mkdir(parents=True, exist_ok=True)
    Path("./data/processed_dataset").mkdir(parents=True, exist_ok=True)

    result = subprocess.run(cmd)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
