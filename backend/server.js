const express = require("express");
const cors = require("cors");
const { GoogleAuth } = require("google-auth-library");

const app = express();
const PORT = Number(process.env.PORT || 10000);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VERTEX_AI_PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID;
const VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || "us-central1";
const VERTEX_GEMINI_MODEL = process.env.VERTEX_GEMINI_MODEL || "gemini-2.5-pro";
const VERTEX_EMBEDDING_MODEL = process.env.VERTEX_EMBEDDING_MODEL || "text-embedding-005";
const GOOGLE_SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function requireSupabaseConfig(res) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.status(500).json({
      error:
        "Backend is missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.",
    });
    return false;
  }
  return true;
}

function parseServiceAccount() {
  if (!GOOGLE_SERVICE_ACCOUNT_JSON) {
    return null;
  }
  try {
    return JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON);
  } catch {
    return null;
  }
}

function extractJson(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i) || trimmed.match(/```\s*([\s\S]*?)```/i);
    if (fenced) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {
        return null;
      }
    }
    const objectStart = trimmed.indexOf("{");
    const arrayStart = trimmed.indexOf("[");
    const start = objectStart === -1 ? arrayStart : arrayStart === -1 ? objectStart : Math.min(objectStart, arrayStart);
    const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function getVertexAccessToken() {
  const credentials = parseServiceAccount();
  if (!credentials) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS_JSON for Vertex.");
  }
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const tokenResult = await client.getAccessToken();
  const token = typeof tokenResult === "string" ? tokenResult : tokenResult?.token;
  if (!token) {
    throw new Error("Unable to acquire Vertex access token.");
  }
  return token;
}

function requireVertexConfig(res) {
  if (!VERTEX_AI_PROJECT_ID) {
    res.status(500).json({ error: "Missing VERTEX_AI_PROJECT_ID environment variable." });
    return false;
  }
  if (!GOOGLE_SERVICE_ACCOUNT_JSON) {
    res.status(500).json({ error: "Missing GOOGLE_SERVICE_ACCOUNT_JSON / GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable." });
    return false;
  }
  return true;
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "mofitness-backend",
    timestamp: new Date().toISOString(),
  });
});

app.get("/config", (_req, res) => {
  res.json({
    ok: true,
    hasSupabaseConfig: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
    hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
    hasVertexConfig: Boolean(VERTEX_AI_PROJECT_ID && GOOGLE_SERVICE_ACCOUNT_JSON),
  });
});

app.post("/api/functions/:name", async (req, res) => {
  if (!requireSupabaseConfig(res)) {
    return;
  }

  const functionName = req.params.name;
  if (!functionName) {
    res.status(400).json({ error: "Function name is required." });
    return;
  }

  const authHeader = req.headers.authorization;
  const hasBearer = typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ");
  const authorization = hasBearer ? authHeader : (SUPABASE_SERVICE_ROLE_KEY ? `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` : null);
  if (!authorization) {
    res.status(401).json({
      error:
        "Missing Authorization bearer token and SUPABASE_SERVICE_ROLE_KEY is not configured on backend.",
    });
    return;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authorization,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: req.body === undefined ? undefined : JSON.stringify(req.body),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      res.status(response.status).json({
        error: typeof payload === "object" && payload && payload.error ? payload.error : `Function ${functionName} failed`,
        details: payload,
      });
      return;
    }

    if (isJson) {
      res.status(response.status).json(payload);
      return;
    }

    res.status(response.status).send(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown backend error";
    res.status(500).json({ error: message });
  }
});

app.post("/api/ai/generate", async (req, res) => {
  if (!requireVertexConfig(res)) {
    return;
  }

  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
  const systemInstruction = typeof req.body?.systemInstruction === "string" ? req.body.systemInstruction : "";
  const schema = req.body?.schema && typeof req.body.schema === "object" ? req.body.schema : undefined;
  const model = typeof req.body?.model === "string" ? req.body.model : VERTEX_GEMINI_MODEL;

  if (!prompt.trim()) {
    res.status(400).json({ error: "Missing prompt." });
    return;
  }

  try {
    const accessToken = await getVertexAccessToken();
    const response = await fetch(
      `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_PROJECT_ID}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        }),
      },
    );

    const payload = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: "Vertex generateContent failed.", details: payload });
      return;
    }

    const text = (payload.candidates?.[0]?.content?.parts ?? []).map((part) => part?.text ?? "").join("");
    const structuredData = extractJson(text);
    res.json({
      text,
      structuredData,
      usage: {
        inputTokens: payload.usageMetadata?.promptTokenCount ?? null,
        outputTokens: payload.usageMetadata?.candidatesTokenCount ?? null,
        model,
      },
      source: "vertex",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown backend error";
    res.status(500).json({ error: message });
  }
});

app.post("/api/ai/embedding", async (req, res) => {
  if (!requireVertexConfig(res)) {
    return;
  }

  const text = typeof req.body?.text === "string" ? req.body.text : "";
  const model = typeof req.body?.model === "string" ? req.body.model : VERTEX_EMBEDDING_MODEL;
  if (!text.trim()) {
    res.status(400).json({ error: "Missing text." });
    return;
  }

  try {
    const accessToken = await getVertexAccessToken();
    const response = await fetch(
      `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_PROJECT_ID}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/${model}:predict`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [{ content: text }],
        }),
      },
    );

    const payload = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: "Vertex embedding failed.", details: payload });
      return;
    }

    const values = payload?.predictions?.[0]?.embeddings?.values ?? [];
    res.json({ embedding: Array.isArray(values) ? values : [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown backend error";
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Mofitness backend listening on port ${PORT}`);
});
