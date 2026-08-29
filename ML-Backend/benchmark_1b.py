import httpx
import time

OLLAMA_URL = "http://localhost:11434"
MODEL = "llama3.2:1b"

prompts = [
    ("Filter extraction", "Extract transaction search filters from the user's query. Return ONLY a JSON object with keys: category, type_ (income|expense), start_date (YYYY-MM-DD), end_date (YYYY-MM-DD). Use null for missing values.\n\nUser query: Show me all Starbucks transactions over $50 in the last 30 days"),
    ("Response generation", "You are a financial insights assistant. Using the insights data below, answer the user's question clearly and concisely. Reference specific figures and trends. If the data is empty or unavailable, say so honestly.\n\nInsights Data: {\"total_spending\": 1500, \"top_categories\": [\"Food & Dining\", \"Transportation\"], \"monthly_trend\": {\"August\": 1200, \"July\": 1100}}\n\nQuestion: What are my top spending categories this quarter?"),
]

results = []

for name, prompt in prompts:
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False
    }
    print(f"Benchmarking {MODEL} - {name}...")
    try:
        start = time.time()
        with httpx.Client(timeout=180.0) as client:
            resp = client.post(f"{OLLAMA_URL}/api/generate", json=payload)
        elapsed = time.time() - start
        data = resp.json()
        
        eval_count = data.get('eval_count', 0)
        eval_duration = data.get('eval_duration', 1)
        prompt_eval_count = data.get('prompt_eval_count', 0)
        prompt_eval_duration = data.get('prompt_eval_duration', 1)
        
        gen_speed = eval_count / (eval_duration / 1e9) if eval_duration > 0 else 0
        prompt_speed = prompt_eval_count / (prompt_eval_duration / 1e9) if prompt_eval_duration > 0 else 0
        
        result = {
            "name": name,
            "model": MODEL,
            "elapsed": elapsed,
            "eval_count": eval_count,
            "eval_duration_ns": eval_duration,
            "prompt_eval_count": prompt_eval_count,
            "prompt_eval_duration_ns": prompt_eval_duration,
            "gen_speed": gen_speed,
            "prompt_speed": prompt_speed,
        }
        results.append(result)
        
        print(f"  Time: {elapsed:.2f}s")
        print(f"  Prompt tokens: {prompt_eval_count}")
        print(f"  Output tokens: {eval_count}")
        print(f"  Prompt speed: {prompt_speed:.2f} tok/s")
        print(f"  Generation speed: {gen_speed:.2f} tok/s")
        print()
    except Exception as e:
        print(f"  ERROR: {type(e).__name__}: {e}")
        results.append({"name": name, "model": MODEL, "error": str(e)})
        print()

print("=== Summary ===")
for r in results:
    if "error" in r:
        print(f"{r['name']}: ERROR - {r['error']}")
    else:
        print(f"{r['name']}: {r['elapsed']:.2f}s, {r['gen_speed']:.2f} tok/s")
