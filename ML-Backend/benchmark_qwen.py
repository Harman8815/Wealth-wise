import httpx
import time

OLLAMA_URL = "http://localhost:11434"

prompts = [
    ("qwen3:4b", "Extract transaction search filters from the user's query. Return ONLY a JSON object with keys: category, type_ (income|expense), start_date (YYYY-MM-DD), end_date (YYYY-MM-DD). Use null for missing values.\n\nUser query: Show me all Starbucks transactions over $50 in the last 30 days"),
    ("qwen3:4b", "You are a financial insights assistant. Using the insights data below, answer the user's question clearly and concisely. Reference specific figures and trends. If the data is empty or unavailable, say so honestly.\n\nInsights Data: {\"total_spending\": 1500, \"top_categories\": [\"Food & Dining\", \"Transportation\"], \"monthly_trend\": {\"August\": 1200, \"July\": 1100}}\n\nQuestion: What are my top spending categories this quarter?"),
]

for i, (model, prompt) in enumerate(prompts, 1):
    print(f"\n=== {model} #{i} ===")
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    try:
        start = time.time()
        with httpx.Client(timeout=180.0) as client:
            resp = client.post(f"{OLLAMA_URL}/api/generate", json=payload)
        elapsed = time.time() - start
        data = resp.json()
        print(f"Status: {resp.status_code}")
        print(f"Time: {elapsed:.2f}s")
        print(f"eval_count: {data.get('eval_count')}")
        print(f"eval_duration: {data.get('eval_duration')} ns")
        print(f"prompt_eval_count: {data.get('prompt_eval_count')}")
        print(f"prompt_eval_duration: {data.get('prompt_eval_duration')} ns")
        if data.get('eval_count') and data.get('eval_duration'):
            speed = data['eval_count'] / (data['eval_duration'] / 1e9)
            print(f"Generation speed: {speed:.2f} tok/s")
        if data.get('prompt_eval_count') and data.get('prompt_eval_duration'):
            prompt_speed = data['prompt_eval_count'] / (data['prompt_eval_duration'] / 1e9)
            print(f"Prompt speed: {prompt_speed:.2f} tok/s")
        print(f"Response preview: {str(data.get('response', ''))[:200]}")
    except Exception as e:
        print(f"ERROR: {e}")
