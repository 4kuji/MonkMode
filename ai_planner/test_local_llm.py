import json
import requests

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "llama3.1:8b"

def main():
    schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "name": {"type": "string"},
            "title": {"type": "string"},
            "years_experience": {"type": "integer"},
            "skills": {"type": "array", "items": {"type": "string"}},
            "summary": {"type": "string"}
        },
        "required": ["name", "title", "years_experience", "skills", "summary"]
    }

    fake_text = """
    Kişi: Deniz A.
    Son 3 yıl: Backend geliştirici.
    2022-2024: Python/Django, REST, PostgreSQL, Redis, Docker.
    """

    prompt = (
        "Sadece JSON döndür. Açıklama yok. Markdown yok.\n"
        "Aşağıdaki metinden profil çıkar ve bu JSON Schema'ya uy:\n"
        f"JSON_SCHEMA={json.dumps(schema, ensure_ascii=False)}\n"
        f"METIN={fake_text}\n"
    )

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "Return ONLY valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "format": "json",     # JSON mod (çok işe yarar)
        "stream": False
    }

    r = requests.post(OLLAMA_URL, json=payload, timeout=120)
    r.raise_for_status()
    content = r.json()["message"]["content"]

    data = json.loads(content)  # JSON değilse burada patlar
    print(json.dumps(data, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()