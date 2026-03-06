from django.shortcuts import render
import json
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .ollama_client import get_focus_advice

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "llama3.1:8b"


@csrf_exempt
def extract_profile(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=405)

    try:
        body = json.loads(request.body)
        user_text = body.get("text", "")
    except json.JSONDecodeError:
        return JsonResponse({"error":"Invalid JSON"}, status=400)
        

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

    prompt = (
        "Return ONLY valid JSON.\n"
        f"JSON_SCHEMA: {json.dumps(schema)}\n"
        f"TEXT: {user_text}"
    )

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": "Return ONLY valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "format": "json",
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)
        response.raise_for_status()
        content = response.json()["message"]["content"]
        data = json.loads(content)
        return JsonResponse(data)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def generate_advice(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        body = json.loads(request.body)

        kategori = body.get("kategori")
        sure = body.get("sure")
        verimlilik_notu = body.get("verimlilik_notu")

        if kategori is None or sure is None or verimlilik_notu is None:
            return JsonResponse(
                {"error": "kategori, sure ve verimlilik_notu gerekli"},
                status=400
            )

        result = get_focus_advice(kategori, sure, verimlilik_notu)
        return JsonResponse(result, status=200)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Geçersiz JSON"}, status=400)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)