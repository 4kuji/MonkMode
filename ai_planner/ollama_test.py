# MonkMode AI Study Planner
# Local LLM: Ollama + llama3.1:8b
# Generates short study advice based on study data

import re
import requests


def ask_ollama(prompt, model="llama3.1:8b"):
    url = "http://127.0.0.1:11434/api/generate"

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()

        data = response.json()
        return data.get("response", "").strip()

    except requests.exceptions.RequestException as e:
        return f"Hata oluştu: {e}"

def build_prompt(ders_adi, sure, verimli_saat):
    prompt = (
        f"Sen samimi ama düzgün Türkçe kullanan bir çalışma koçususun. "
        f"Kullanıcı bugün {ders_adi} dersine {sure} dakika çalıştı. "
        f"Kullanıcının en verimli olduğu zaman {verimli_saat}. "
        f"Kullanıcıya doğrudan hitap ederek {ders_adi} dersi için tam 2 cümlelik çalışma tavsiyesi ver. "
        f"Sadece tavsiye ver, yapılan çalışmayı değerlendirme veya yorumlama. "
        f"'çok iyi', 'önemli bir adım', 'tebrikler' gibi ifadeler kullanma. "
        f"Tavsiyeler konu tekrarı, soru çözme, pratik yapma veya zaman yönetimi ile ilgili olsun. "
        f"Cevap kısa, net ve düzgün Türkçe olsun. "
        f"Aynı cümleyi tekrar etme. "
        f"Başlık yazma. "
        f"Maddeleme yapma. "
        f"Numaralandırma yapma. "
        f"Sadece düz metin yaz."
    )
    return prompt


def clean_response(text):
    import re

    text = text.strip()
    lines = text.splitlines()
    cleaned_lines = []

    for line in lines:
        line = line.strip()

        if not line:
            continue

        line = line.replace("**", "")
        line = re.sub(r"^\d+\.\s*", "", line)
        line = re.sub(r"^[-•]\s*", "", line)

        if len(line.split()) <= 6 and not line.endswith((".", "!", "?")):
            continue

        cleaned_lines.append(line)

    cleaned_text = " ".join(cleaned_lines)
    cleaned_text = re.sub(r"\s+", " ", cleaned_text).strip()

    sentences = re.split(r'(?<=[.!?])\s+', cleaned_text)
    sentences = [s.strip() for s in sentences if s.strip()]

    unique_sentences = []
    for s in sentences:
        if s not in unique_sentences:
            unique_sentences.append(s)

    final_sentences = unique_sentences[:2]

    # Eğer model tek cümle verdiyse otomatik ikinci tavsiye ekle
    if len(final_sentences) == 1:
        final_sentences.append(
            "Çalışmanın sonunda 10-15 soru çözerek öğrendiğin konuyu pekiştirmeyi unutma."
        )

    return " ".join(final_sentences)


if __name__ == "__main__":
    ders_adi = "Matematik"
    sure = 90
    verimli_saat = "gece"

    prompt = build_prompt(ders_adi, sure, verimli_saat)
    print("PROMPT:")
    print(prompt)

    raw_result = ask_ollama(prompt)
    cleaned_result = clean_response(raw_result)

    print("\nHAM MODEL CEVABI:")
    print(raw_result)

    print("\nTEMİZLENMİŞ CEVAP:")
    print(cleaned_result)