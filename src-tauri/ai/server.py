import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

MODEL_NAME = os.getenv("AI_MODEL", "facebook/nllb-200-distilled-600M")

app = FastAPI(title="TPT NLLB API")
tokenizer = None
model = None


class TranslateRequest(BaseModel):
    text: str


def get_model():
    global tokenizer, model

    if tokenizer is None or model is None:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)

    return tokenizer, model


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}


@app.post("/translate")
def translate(request: TranslateRequest):
    try:
        tokenizer, model = get_model()
        inputs = tokenizer(request.text, return_tensors="pt")
        outputs = model.generate(
            **inputs,
            forced_bos_token_id=tokenizer.convert_tokens_to_ids("fas_Arab"),
        )
        text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return {"text": text}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
