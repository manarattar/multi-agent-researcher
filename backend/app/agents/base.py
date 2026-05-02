import json
import re
from openai import OpenAI
from app.config import get_settings


def get_client() -> OpenAI:
    s = get_settings()
    return OpenAI(api_key=s.openai_api_key, base_url=s.openai_base_url)


def call_llm(prompt: str, system: str, temperature: float = 0.3) -> str:
    s = get_settings()
    client = get_client()
    response = client.chat.completions.create(
        model=s.model_name,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
    )
    return response.choices[0].message.content


def extract_json(content: str):
    content = content.strip()
    content = re.sub(r"^```(?:json)?\s*", "", content, flags=re.MULTILINE)
    content = re.sub(r"\s*```\s*$", "", content, flags=re.MULTILINE)
    content = content.strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', content)
        if match:
            return json.loads(match.group(1))
        raise
