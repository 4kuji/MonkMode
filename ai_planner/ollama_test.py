# MonkMode AI Study Planner
# Local LLM: Ollama + llama3.1:8b

import re
import requests


def ask_ollama(prompt, model="llama3.1:8b"):
    url = "http://127.0.0.1:11434/api/generate"

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2
        }
    }

    try:
        response = requests.post(url, json=payload, timeout=120)
        response.raise_for_status()

        data = response.json()
        return data.get("response", "").strip()

    except requests.exceptions.RequestException as e:
        return f"Hata oluştu: {e}"


def clean_response(text):
    text = text.strip()

    sentences = re.split(r'(?<=[.!?])\s+', text)
    sentences = [s.strip() for s in sentences if s.strip()]

    # sadece ilk 2 cümle
    final_sentences = sentences[:2]

    # tek cümle gelirse ikinciyi ekle
    if len(final_sentences) == 1:
        final_sentences.append(
            "Çalışmanın sonunda birkaç soru çözerek öğrendiğin konuyu pekiştir."
        )

    return " ".join(final_sentences)


def safe_clean(text):
    if len(text.split()) < 5:
        return "Kısa bir tekrar yapıp ardından birkaç soru çözerek konuyu pekiştir."
    return text


def generate_ai_response(user_message, user_stats):

    stats_text = f"""
Bugün çalışma süresi: {user_stats.get('today_focus_time', 0)} dakika
Haftalık ortalama: {user_stats.get('weekly_avg', 0)} dakika
Son çalışma: {user_stats.get('last_session', 'bilinmiyor')}
Tamamlanan görev: {user_stats.get('completed_tasks', 0)}
"""

    prompt = f"""
Sen MonkMode uygulamasının disiplinli ama saygılı bir verimlilik koçusun.

Kullanıcı verileri:
{stats_text}

Kullanıcı mesajı:
{user_message}

Kurallar:
- Maksimum 2 cümle yaz
- Net ve kısa ol
- Doğal konuş
- Argo kullanma
- Hakaret etme
- Aşırı övgü yapma
- Eğer kullanıcı az çalıştıysa nazikçe uyar
- Eğer iyi çalıştıysa motive et ama abartma
- Sadece düz metin yaz (maddeleme yok)

Örnek cevap:
Gece odaklandığın saatlerde kısa bir tekrar yap, ardından zor sorular çözerek konuyu pekiştir. Takıldığın noktaları not alıp tekrar dönersen öğrenmen daha kalıcı olur.

Cevap:
"""

    raw = ask_ollama(prompt)
    cleaned = clean_response(raw)
    return safe_clean(cleaned)


# TEST (isteğe bağlı)
if __name__ == "__main__":
    print(generate_ai_response(
        "Bugün hiç çalışmadım",
        {
            "today_focus_time": 0,
            "weekly_avg": 100,
            "last_session": "dün",
            "completed_tasks": 1
        }
    ))