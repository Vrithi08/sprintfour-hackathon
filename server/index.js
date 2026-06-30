import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { askLLM } from './aiProvider.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Help get the samples directory
const samplesDir = path.join(__dirname, 'samples');

// Serve samples metadata (without full originalText and full spans to keep payload lightweight)
app.get('/api/samples', (req, res) => {
  try {
    const files = fs.readdirSync(samplesDir).filter(file => file.endsWith('.json'));
    const samples = files.map(file => {
      const filePath = path.join(samplesDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return {
        id: data.id,
        title: data.title,
        spanCount: data.spans.length,
        safetyScore: data.safetyScore,
        snippet: data.originalText.substring(0, 100) + '...'
      };
    });
    res.json(samples);
  } catch (error) {
    console.error('Error fetching samples metadata:', error);
    res.status(500).json({ error: 'Failed to load samples metadata' });
  }
});

// Serve full sample by id
app.get('/api/samples/:id', (req, res) => {
  try {
    const sampleId = req.params.id;
    const filePath = path.join(samplesDir, `${sampleId}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Sample document not found' });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (error) {
    console.error('Error fetching sample:', error);
    res.status(500).json({ error: 'Failed to load sample document' });
  }
});

// LLM "Ask Why" route — tries Hugging Face first, then Gemini, then returns fallback
app.post('/api/ask', async (req, res) => {
  const { span, question, worriedMode } = req.body;
  if (!span || !question) {
    return res.status(400).json({ error: 'Missing span or question in request' });
  }

  const toneInstruction = worriedMode 
    ? "EXTREMELY empathetic, reassuring, and highly convincing. The user is anxious about their privacy. Speak to them like a deeply caring privacy expert who takes their security incredibly seriously. Validate their concerns, patiently explain the rigorous security measures, and absolutely convince them that their data is safe."
    : "plain, professional, factual, and direct";

  const safetyRule = span.status === 'redacted' 
    ? "\nCRITICAL SECURITY RULE: The span text was REDACTED. You MUST NOT reveal the actual span text in your answer under any circumstances. Refer to it abstractly (e.g., 'the phone number', 'the name', 'this information')."
    : "";

  const prompt = `You are explaining a document redaction decision inside a trust/audit tool.
Span text: "${span.text}"
Detected type: ${span.type}
Confidence: ${span.confidence * 100}%
Status: ${span.status}
Existing base reasoning: ${worriedMode ? span.reasoningWorried : span.reasoning}
Tone: ${toneInstruction}${safetyRule}
User's question: "${question}"

Provide a detailed explanation that references the words immediately surrounding the span in the original document (you may assume you have access to the surrounding text). Additionally, identify any other potentially sensitive information in the surrounding context that should have been redacted but was missed, and explain why the redaction was overlooked.

Answer the user's specific question in 2-4 sentences. Adopt the requested Tone completely. Stay grounded only in the data above — do not invent additional facts about the document or surrounding context. If the question cannot be answered from this data, say so honestly and explain what information would be needed.`;

  // ---- Strategy 1: Hugging Face via askLLM helper ----
  const hfToken = process.env.HF_TOKEN;
  const hfEndpoint = process.env.LLM_ENDPOINT;
  if (hfToken && hfEndpoint) {
    try {
      const result = await askLLM(prompt, { endpoint: hfEndpoint, token: hfToken });
      if (!result.fallback && result.answer) {
        return res.json({ answer: result.answer, generatedAt: new Date().toISOString() });
      }
      console.warn('HF LLM returned fallback:', result.message);
    } catch (err) {
      console.error('Error invoking askLLM for HF:', err.message || err);
    }
    // fall through to Gemini
  }

  // ---- Strategy 2: Gemini fallback ----
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('No LLM provider available (HF failed or missing, GEMINI_API_KEY not set).');
    return res.json({
      fallback: true,
      message: 'Live Q/A is currently unavailable. Please configure a Hugging Face token or Gemini API key.',
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Gemini API returned status ${response.status}`);
    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.();
    if (!answer) throw new Error('Empty response from Gemini API structure');
    return res.json({ answer, generatedAt: new Date().toISOString() });
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error calling Gemini API:', error.message || error);
    return res.json({
      fallback: true,
      error: error.name === 'AbortError' ? 'Request timed out' : (error.message || 'Unknown API error'),
    });
  }
});

// Serve frontend build in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../dist');
  if (fs.existsSync(frontendBuildPath)) {
    app.use((req, res, next) => {
      const indexPath = path.join(frontendBuildPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        next();
      }
    });
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
