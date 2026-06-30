// server/aiProvider.js

/**
 * Unified LLM request helper.
 * Supports Hugging Face Inference API (full endpoint URL) and any OpenAI‑compatible server
 * (e.g., Ollama, vLLM). The caller passes the prompt and optional config.
 */
export async function askLLM(prompt, options = {}) {
  const {
    model = process.env.LLM_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2',
    endpoint = process.env.LLM_ENDPOINT,
    token = process.env.HF_TOKEN,
  } = options;

  const isHF = endpoint && endpoint.includes('huggingface.co');

  const url = isHF ? endpoint : `${endpoint ?? 'http://localhost:11434'}/api/chat`;

  const payload = isHF
    ? { inputs: prompt }
    : { model, messages: [{ role: 'user', content: prompt }], temperature: 0.2 };

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`LLM service error ${resp.status}: ${txt}`);
    }
    const data = await resp.json();
    const answer = isHF ? data?.generated_text?.trim?.() ?? '' : data?.message?.content?.trim?.() ?? '';
    return { answer };
  } catch (e) {
    console.error('askLLM error:', e);
    return { fallback: true, message: e?.message ?? 'Unknown LLM error' };
  }
}
