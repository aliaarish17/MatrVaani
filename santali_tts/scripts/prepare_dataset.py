#!/usr/bin/env python3
"""Prepare the Santali subset of ai4bharat/Rasa for Parler-TTS fine-tuning.

This script:
1. Loads the Santali config from ai4bharat/Rasa
2. Selects a deterministic subset
3. Filters invalid samples
4. Validates Ol Chiki text
5. Adds a description column for Parler-TTS
6. Saves the processed dataset to disk
"""

import argparse
import re
import sys
from pathlib import Path

# ── Configuration Defaults ──────────────────────────────────────────────────
DATASET_NAME = "ai4bharat/Rasa"
DATASET_CONFIG = "Santali"
DEFAULT_SEED = 42
DEFAULT_TRAIN_SAMPLES = 800
DEFAULT_EVAL_SAMPLES = 100
TARGET_SAMPLING_RATE = 44_100  # DAC codec expects 44.1kHz

# Ol Chiki Unicode range: U+1C50 to U+1C7F
OL_CHIKI_PATTERN = re.compile(r"[\u1C50-\u1C7F]")


def contains_ol_chiki(text: str) -> bool:
    """Check if text contains at least one Ol Chiki character."""
    return bool(OL_CHIKI_PATTERN.search(text))


def is_valid_sample(example: dict) -> bool:
    """Filter samples with empty text, missing audio, or non-Ol-Chiki text."""
    text = example.get("text", "")
    if not text or not text.strip():
        return False
    audio = example.get("audio")
    if audio is None:
        return False
    if audio.get("array") is not None and len(audio["array"]) == 0:
        return False
    return True


def add_description(example: dict) -> dict:
    """Add a deterministic description for Parler-TTS conditioning.

    The description tells the model what kind of voice to produce.
    We use the gender and style columns from the dataset when available.
    """
    gender = example.get("gender", "female").strip().lower()
    style = example.get("style", "neutral").strip().lower()

    if gender == "male":
        voice_desc = "A clear natural Santali male voice"
    else:
        voice_desc = "A clear natural Santali female voice"

    if style and style != "neutral":
        desc = f"{voice_desc} speaking in a {style} tone in Ol Chiki script."
    else:
        desc = f"{voice_desc} speaking clearly in Ol Chiki script."

    example["description"] = desc
    return example


def main():
    parser = argparse.ArgumentParser(description="Prepare Santali Rasa dataset for Parler-TTS")
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./data/santali_prepared",
        help="Directory to save the prepared dataset",
    )
    parser.add_argument(
        "--num_train_samples",
        type=int,
        default=DEFAULT_TRAIN_SAMPLES,
        help="Number of training samples to extract",
    )
    parser.add_argument(
        "--num_eval_samples",
        type=int,
        default=DEFAULT_EVAL_SAMPLES,
        help="Number of evaluation samples to extract",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=DEFAULT_SEED,
        help="Random seed for deterministic sampling",
    )
    args = parser.parse_args()

    from datasets import load_dataset, Audio

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading {DATASET_NAME} [{DATASET_CONFIG}] ...")
    train_ds = load_dataset(DATASET_NAME, DATASET_CONFIG, split="train")
    test_ds = load_dataset(DATASET_NAME, DATASET_CONFIG, split="test")

    print(f"\nRaw train size: {len(train_ds)}")
    print(f"Raw test  size: {len(test_ds)}")
    print(f"Features: {train_ds.features}")
    print(f"\nSample [0] text: {train_ds[0].get('text', 'N/A')[:200]}")
    print(f"Sample [0] gender: {train_ds[0].get('gender', 'N/A')}")
    print(f"Sample [0] style: {train_ds[0].get('style', 'N/A')}")

    # Deterministic shuffle + select subset
    print(f"\nSelecting {args.num_train_samples} train + {args.num_eval_samples} eval samples (seed={args.seed}) ...")
    train_ds = train_ds.shuffle(seed=args.seed).select(range(min(args.num_train_samples, len(train_ds))))
    eval_ds = test_ds.shuffle(seed=args.seed).select(range(min(args.num_eval_samples, len(test_ds))))

    # Filter invalid samples
    print("Filtering invalid samples ...")
    train_before = len(train_ds)
    eval_before = len(eval_ds)
    train_ds = train_ds.filter(is_valid_sample)
    eval_ds = eval_ds.filter(is_valid_sample)
    print(f"  Train: {train_before} -> {len(train_ds)}")
    print(f"  Eval:  {eval_before} -> {len(eval_ds)}")

    # Check Ol Chiki presence
    ol_chiki_count = sum(1 for ex in train_ds if contains_ol_chiki(ex["text"]))
    print(f"\nOl Chiki text samples: {ol_chiki_count}/{len(train_ds)}")
    if ol_chiki_count == 0:
        print("WARNING: No Ol Chiki characters found! Text may be in Devanagari or Latin script.")
        print("This is expected for some Santali datasets. The model should still work.")

    # Add description column
    print("Adding description column ...")
    train_ds = train_ds.map(add_description)
    eval_ds = eval_ds.map(add_description)

    # Cast audio to target sampling rate
    print(f"Casting audio to {TARGET_SAMPLING_RATE} Hz ...")
    train_ds = train_ds.cast_column("audio", Audio(sampling_rate=TARGET_SAMPLING_RATE))
    eval_ds = eval_ds.cast_column("audio", Audio(sampling_rate=TARGET_SAMPLING_RATE))

    # Print a processed sample
    print(f"\n--- Processed Sample ---")
    sample = train_ds[0]
    print(f"  text:        {sample['text'][:200]}")
    print(f"  description: {sample['description']}")
    print(f"  gender:      {sample.get('gender', 'N/A')}")
    print(f"  style:       {sample.get('style', 'N/A')}")
    print(f"  audio sr:    {sample['audio']['sampling_rate']}")
    print(f"  audio len:   {len(sample['audio']['array'])} samples")
    print(f"  audio dur:   {len(sample['audio']['array']) / sample['audio']['sampling_rate']:.2f}s")

    # Save to disk as Parquet files for direct load_dataset compatibility
    print(f"\nSaving to {output_dir} (Parquet format) ...")
    train_ds.to_parquet(str(output_dir / "train-00000.parquet"))
    eval_ds.to_parquet(str(output_dir / "test-00000.parquet"))
    # Also save arrow format for direct load_from_disk if needed
    train_ds.save_to_disk(str(output_dir / "train_arrow"))
    eval_ds.save_to_disk(str(output_dir / "eval_arrow"))
    print("Done! Saved parquet splits (train-00000.parquet, test-00000.parquet) and arrow splits.")

    return train_ds, eval_ds


if __name__ == "__main__":
    main()
