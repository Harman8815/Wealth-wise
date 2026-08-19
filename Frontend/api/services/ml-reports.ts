/**
 * ML-Backend Reports API — thin wrapper around ML-Backend report endpoints.
 */
const ML_BACKEND_URL = process.env.NEXT_PUBLIC_ML_BACKEND_URL || "http://localhost:8100";

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function generateMLReport() {
  const res = await fetch(`${ML_BACKEND_URL}/reports/generate`, {
    method: "POST",
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    throw new Error(`Failed to generate report (${res.status})`);
  }
  return res.json();
}

export async function getMLReportSummary() {
  const res = await fetch(`${ML_BACKEND_URL}/reports/summary`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    throw new Error(`Failed to load report summary (${res.status})`);
  }
  return res.json();
}

export async function explainChartOrAlert(data: Record<string, unknown>) {
  const res = await fetch(`${ML_BACKEND_URL}/reports/explain`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    throw new Error(`Failed to explain data (${res.status})`);
  }
  return res.json();
}
