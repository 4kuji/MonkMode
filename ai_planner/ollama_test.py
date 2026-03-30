# MonkMode AI Study Planner
# Local LLM: Ollama + llama3.1:8b

import re
import requests
import json


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


# 🔹 TEXT CLEANING
def clean_response(text):
    text = text.strip()

    sentences = re.split(r'(?<=[.!?])\s+', text)
    sentences = [s.strip() for s in sentences if s.strip()]

    final_sentences = sentences[:2]

    if len(final_sentences) == 1:
        final_sentences.append(
            "Çalışmanın sonunda birkaç soru çözerek öğrendiğin konuyu pekiştir."
        )

    return " ".join(final_sentences)


def safe_clean(text):
    if len(text.split()) < 5:
        return "Kısa bir tekrar yapıp ardından birkaç soru çözerek konuyu pekiştir."
    return text


# 🔹 AI RESPONSE
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


# 🔥 PLAN OPTIMIZATION (ASLI BURASI)
def optimize_plan(plan, user_stats):

    best_hours = user_stats.get("best_hours", []).copy()
    hard_lessons = user_stats.get("hard_lessons", [])

    for item in plan:
        if item["ders"] in hard_lessons:
            if best_hours:
                item["saat"] = best_hours.pop(0)

    return plan


# 🔥 JSON STUDY PLAN
def generate_study_plan(user_message, user_stats):

    prompt = f"""
Bir çalışma planı oluştur.

Sadece JSON ver.

Örnek:
[
  {{"gun":"Pazartesi","saat":"18:00","ders":"Matematik"}},
  {{"gun":"Çarşamba","saat":"20:00","ders":"Fizik"}}
]

Kullanıcı isteği:
{user_message}

JSON:
"""

    raw = ask_ollama(prompt)

    try:
        parsed = json.loads(raw)
    except:
        print("JSON parse hatası!")
        return raw

    optimized = optimize_plan(parsed, user_stats)

    return optimized


# 🔥 TEST
if __name__ == "__main__":

    print("\n--- STUDY PLAN TEST ---")

    user_stats = {
        "best_hours": ["20:00", "21:00"],
        "hard_lessons": ["Matematik"]
    }

    result = generate_study_plan(
        "Haftaya 3 gün matematik ve fizik çalışmak istiyorum",
        user_stats
    )

    print(result)