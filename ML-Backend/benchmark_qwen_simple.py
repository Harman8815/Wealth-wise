import httpx
import time

OLLAMA_URL = "http://localhost:11434"

# Simple prompt to get basic speed measurement
payload = {
    "model": "qwen3:4b",
    "prompt": "Hi",
    "stream": False
}

print("Testing qwen3:4b with simple prompt...")
try:
    start = time.time()
    with httpx.Client(timeout=120.0) as client:
        resp = client.post(f"{OLLAMA_URL}/api/generate", json=payload)
    elapsed = time.time() - start
    data = resp.json()
    print(f"Status: {resp.status_code}")
    print(f"Time: {elapsed:.2f}s")
    print(f"eval_count: {data.get('eval_count')}")
    print(f"eval_duration: {data.get('eval_duration')}")
    print(f"prompt_eval_count: {data.get('prompt_eval_count')}")
    print(f"prompt_eval_duration: {data.get('prompt_eval_duration')}")
    if data.get('eval_count') and data.get('eval_duration'):
        speed = data['eval_count'] / (data['eval_duration'] / 1e9)
        print(f"Generation speed: {speed:.2f} tok/s")
    print(f"Response: {data.get('response', '')[:100]}")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
