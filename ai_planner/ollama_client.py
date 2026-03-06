import requests
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.1:8b"


def get_focus_advice(kategori: str, sure: int, calisma_degerlendirmesi: str) -> dict:
    prompt = f"""
Sen bir verimlilik asistanısın.

Veri:
{{
  "kategori": "{kategori}",
  "sure": {sure},
  "calisma_degerlendirmesi": "{calisma_degerlendirmesi}"
}}

Görev:
- Kullanıcıya 1 kısa motivasyon tavsiyesi ver
- Kullanıcıya 1 kısa odaklanma tavsiyesi ver
- Türkçe yaz
- Cümleler doğal, açık ve destekleyici olsun
- Her tavsiye en fazla 1 cümle olsun
- Çok genel ifadeler kullanma
- Tavsiyeler verilen kategori, süre ve çalışma değerlendirmesine uygun olsun
- Aynı fikri iki farklı cümlede tekrar etme
- Yargılayıcı veya sert dil kullanma
- JSON anahtarlarını değiştirme
- Sadece geçerli JSON döndür
- JSON dışında hiçbir şey yazma

JSON formatı tam olarak şu olsun:
{{
  "motivasyon_tavsiyesi": "...",
  "odaklanma_tavsiyesi": "..."
}}
"""

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }

    response = requests.post(OLLAMA_URL, json=payload, timeout=120)
    response.raise_for_status()

    data = response.json()
    model_text = data.get("response", "").strip()

    parsed = json.loads(model_text)

    if "motivasyon_tavsiyesi" not in parsed or "odaklanma_tavsiyesi" not in parsed:
        raise ValueError("Model çıktısında beklenen anahtarlar yok")

    return parsed