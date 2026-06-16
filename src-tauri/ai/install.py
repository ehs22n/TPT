import os
import sys
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

MODEL_NAME = "facebook/nllb-200-distilled-600M"


def load_model():
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
    return tokenizer, model


def translate(tokenizer, model, text):
    inputs = tokenizer(text, return_tensors="pt")
    outputs = model.generate(
        **inputs,
        forced_bos_token_id=tokenizer.convert_tokens_to_ids("fas_Arab"),
    )
    return tokenizer.decode(outputs[0], skip_special_tokens=True)


def main():
    if "--download-only" in sys.argv:
        load_model()
        print("MODEL_READY")
        return

    tokenizer, model = load_model()

    while True:
        text = input()
        print(translate(tokenizer, model, text), flush=True)


if __name__ == "__main__":
    main()
