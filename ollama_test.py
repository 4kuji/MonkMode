import re
import requests
import json
from datetime import date, datetime


# 🔥 STREAK ENGINE (GERÇEK HESAP)
def update_streak(history, today_minutes):
    today = str(date.today())

    history[today] = today_minutes

    if today_minutes == 0:
        return 0, history

    streak = 0

    for d in sorted(history.keys(), reverse=True):
        if history[d] > 0:
            streak += 1
        else:
            break

    return streak, history


# 🔥 MONK MODE OVERRIDE
def monk_mode_override(user_stats):
    focus = user_stats.get("today_focus_time", 0)
    streak = user_stats.get("streak", 0)
    hour = datetime.now().hour

    if focus == 0 and streak >= 3:
        return f"Patron {streak} günlük seriyi çöpe attın. Bu mu ciddiyetin?"

    if focus == 0 and hour >= 22:
        return "Patron saat gece oldu, hala 0’sın. Bu başarı değil, erteleme."

    if focus == 0:
        return "Patron, rakiplerin çalışıyor sen 0’sın. Ekrana bakmayı bırak, başla."

    elif focus < 60:
        return "Liderim, bu tempo tatil modu. Kendine gel ve süreyi artır."

    elif focus >= 180 and streak >= 3:
        return f"{streak} gündür üst üste çalışıyorsun. İşte disiplin bu."

    elif focus >= 180:
        return "Motorları yaktın şampiyon. Efsane odak, böyle devam."

    return None


# 🔥 OLLAMA
def ask_ollama(prompt, model="llama3.1:8b"):
    url = "http://127.0.0.1:11434/api/generate"

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.2}
    }

    try:
        response = requests.post(url, json=payload, timeout=120)
        response.raise_for_status()
        return response.json().get("response", "").strip()
    except:
        return "Hata oluştu"


# 🔥 CLEANING
def clean_response(text):
    text = text.strip()
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return " ".join(sentences[:2])


def safe_clean(text):
    if len(text.split()) < 5:
        return "Kısa bir tekrar yapıp ardından birkaç soru çöz."
    return text


# 🔥 AI RESPONSE
def generate_ai_response(user_message, user_stats):

    # 🔥 STREAK UPDATE (EN KRİTİK KISIM)
    history = user_stats.get("history", {})
    streak, history = update_streak(history, user_stats.get("today_focus_time", 0))

    user_stats["streak"] = streak
    user_stats["history"] = history

    # 🔥 MONK MODE FIRST
    override = monk_mode_override(user_stats)
    if override:
        return override

    stats_text = f"""
Bugün: {user_stats.get('today_focus_time', 0)} dk
Streak: {user_stats.get('streak', 0)}
"""

    prompt = f"""
Sen MonkMode verimlilik koçusun.

Kullanıcı:
{user_message}

Veri:
{stats_text}

Maks 2 cümle, kısa ve net.
"""

    raw = ask_ollama(prompt)
    return safe_clean(clean_response(raw))


# 🔥 TEST
if __name__ == "__main__":

    print("\n--- OVERRIDE TEST ---")

# 🔥 TEST 1: 0 dk (en kritik)
user_stats = {
    "today_focus_time": 0,
    "weekly_avg": 500,
    "completed_tasks": 999,
    "history": {"2026-04-16": 0}
}

print("\n0 dk test:")
print(generate_ai_response("Bana motivasyon ver", user_stats))


# 🔥 TEST 2: 30 dk
user_stats = {
    "today_focus_time": 30,
    "weekly_avg": 200,
    "completed_tasks": 10,
    "history": {"2026-04-16": 30}
}

print("\n30 dk test:")
print(generate_ai_response("Çalışıyorum", user_stats))


# 🔥 TEST 3: 200 dk
user_stats = {
    "today_focus_time": 200,
    "weekly_avg": 180,
    "completed_tasks": 50,
    "history": {"2026-04-16": 200}
}

print("\n200 dk test:")
print(generate_ai_response("Bitti", user_stats))