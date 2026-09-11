#!/usr/bin/env python3
"""Inference script for the fine-tuned Santali Parler-TTS model.

Usage:
    python scripts/infer.py \
        --checkpoint_dir ./checkpoints/santali-parler-test \
        --text "ᱱᱚᱶᱟ ᱫᱤᱱ ᱨᱮ ᱵᱚᱫᱚᱞ" \
        --output_dir ./outputs
"""

import argparse
import time
from pathlib import Path

# Heavy ML libraries (torch, soundfile, transformers, parler_tts)
# are imported inside load_model / generate_speech for responsive CLI parsing.

# ── Default Configuration ──────────────────────────────────────────────────
BASE_MODEL = "ai4bharat/indic-parler-tts-pretrained"
DEFAULT_DESCRIPTION = "A clear natural Santali female voice speaking clearly in Ol Chiki script."

TEST_SENTENCES = [
    "ᱱᱚᱶᱟ ᱫᱤᱱ ᱨᱮ ᱵᱚᱫᱚᱞ",
    "ᱤᱱᱟᱹ ᱫᱚ ᱟᱹᱰᱤ ᱵᱟᱝ ᱜᱮ ᱵᱟᱹᱲᱤᱡ ᱠᱟᱱᱟ",
    "ᱚᱱᱟ ᱫᱤᱱ ᱨᱮ ᱟᱹᱰᱤ ᱥᱮᱨᱢᱟ ᱛᱟᱦᱮᱸ ᱠᱟᱱᱟ",
]


def load_model(checkpoint_dir: str, device: str = "auto"):
    """Load the fine-tuned model and tokenizers."""
    import torch
    from transformers import AutoTokenizer
    from parler_tts import ParlerTTSForConditionalGeneration

    checkpoint_path = Path(checkpoint_dir)

    # Determine device
    if device == "auto":
        device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    # Load model — try checkpoint first, fall back to base
    model_path = str(checkpoint_path) if checkpoint_path.exists() else BASE_MODEL
    print(f"Loading model from: {model_path}")

    model = ParlerTTSForConditionalGeneration.from_pretrained(
        model_path,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
    ).to(device)
    model.eval()

    # Load tokenizers from base model (they don't change during fine-tuning)
    print(f"Loading tokenizers from: {BASE_MODEL}")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)

    # The description tokenizer is the text encoder's tokenizer
    try:
        desc_tokenizer_name = getattr(model.config.text_encoder, "_name_or_path", None) or BASE_MODEL
        print(f"Loading description tokenizer from: {desc_tokenizer_name}")
        description_tokenizer = AutoTokenizer.from_pretrained(desc_tokenizer_name)
    except Exception:
        print(f"Falling back description tokenizer to: {BASE_MODEL}")
        description_tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)

    return model, tokenizer, description_tokenizer, device


def generate_speech(
    model,
    tokenizer,
    description_tokenizer,
    text: str,
    description: str = DEFAULT_DESCRIPTION,
    device: str = "cuda",
    max_new_tokens: int = 3000,
) -> tuple:
    """Generate speech from text. Returns (audio_array, sampling_rate)."""
    import torch

    # Tokenize the description (voice characteristics)
    desc_inputs = description_tokenizer(
        description, return_tensors="pt", padding=True
    ).to(device)

    # Tokenize the prompt (text to speak)
    prompt_inputs = tokenizer(
        text, return_tensors="pt", padding=True
    ).to(device)

    # Generate
    with torch.no_grad():
        generation = model.generate(
            input_ids=desc_inputs.input_ids,
            attention_mask=desc_inputs.attention_mask,
            prompt_input_ids=prompt_inputs.input_ids,
            prompt_attention_mask=prompt_inputs.attention_mask,
            max_new_tokens=max_new_tokens,
        )

    audio = generation.cpu().float().numpy().squeeze()
    sampling_rate = model.config.sampling_rate
    return audio, sampling_rate


def main():
    parser = argparse.ArgumentParser(description="Santali TTS Inference")
    parser.add_argument(
        "--checkpoint_dir",
        type=str,
        default="./checkpoints/santali-parler-test",
        help="Path to the fine-tuned model checkpoint",
    )
    parser.add_argument(
        "--text",
        type=str,
        default=None,
        help="Text to synthesize (Ol Chiki). If not provided, uses test sentences.",
    )
    parser.add_argument(
        "--description",
        type=str,
        default=DEFAULT_DESCRIPTION,
        help="Voice description for conditioning",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./outputs",
        help="Directory to save generated audio",
    )
    parser.add_argument(
        "--device",
        type=str,
        default="auto",
        help="Device: auto, cuda, or cpu",
    )
    args = parser.parse_args()

    import soundfile as sf

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Load model
    model, tokenizer, desc_tokenizer, device = load_model(
        args.checkpoint_dir, args.device
    )

    # Determine sentences to synthesize
    sentences = [args.text] if args.text else TEST_SENTENCES

    print(f"\n{'='*60}")
    print(f"Generating {len(sentences)} audio sample(s)")
    print(f"{'='*60}")

    for i, text in enumerate(sentences):
        print(f"\n[{i+1}/{len(sentences)}] Generating: {text[:80]}...")
        start_time = time.time()

        audio, sr = generate_speech(
            model, tokenizer, desc_tokenizer,
            text=text,
            description=args.description,
            device=device,
        )

        elapsed = time.time() - start_time
        duration = len(audio) / sr

        # Save
        filename = "test_santali.wav" if i == 0 else f"test_santali_{i:03d}.wav"
        output_path = output_dir / filename
        sf.write(str(output_path), audio, sr)

        print(f"  Sampling rate: {sr} Hz")
        print(f"  Duration:      {duration:.2f}s")
        print(f"  Gen time:      {elapsed:.2f}s")
        print(f"  RTF:           {elapsed/duration:.2f}x")
        print(f"  Saved to:      {output_path}")

    print(f"\n{'='*60}")
    print(f"All outputs saved to: {output_dir}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
