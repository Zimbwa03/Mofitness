const express = require("express");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT || 10000);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function requireSupabaseConfig(res) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({
      error:
        "Backend is missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY environment variables.",
    });
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
    hasSupabaseConfig: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY),
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
  const authorization = hasBearer ? authHeader : `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;

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

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Mofitness backend listening on port ${PORT}`);
});
