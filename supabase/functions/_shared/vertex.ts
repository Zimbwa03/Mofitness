const encoder = new TextEncoder();

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
  project_id?: string;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function getServiceAccount(): ServiceAccount | null {
  const raw = Deno.env.get('VERTEX_SERVICE_ACCOUNT_JSON') ?? Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as ServiceAccount;
}

function base64UrlEncode(input: Uint8Array | string) {
  const bytes = typeof input === 'string' ? encoder.encode(input) : input;
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToArrayBuffer(pem: string) {
  const sanitized = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s+/g, '');
  const binary = atob(sanitized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

async function createSignedJwt(serviceAccount: ServiceAccount) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;
  const tokenUri = serviceAccount.token_uri ?? 'https://oauth2.googleapis.com/token';

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: tokenUri,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    iat: issuedAt,
    exp: expiresAt,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(unsigned));
  return `${unsigned}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function getAccessToken() {
  const envToken = Deno.env.get('VERTEX_ACCESS_TOKEN');
  if (envToken) {
    return envToken;
  }

  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 30_000) {
    return cachedAccessToken.token;
  }

  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    return null;
  }

  const assertion = await createSignedJwt(serviceAccount);
  const tokenUri = serviceAccount.token_uri ?? 'https://oauth2.googleapis.com/token';
  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Unable to fetch Vertex access token: ${text}`);
  }

  const data = await response.json();
  cachedAccessToken = {
    token: data.access_token as string,
    expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000,
  };

  return cachedAccessToken.token;
}

function getProjectId() {
  return Deno.env.get('VERTEX_AI_PROJECT_ID') ?? getServiceAccount()?.project_id ?? null;
}

function getLocation() {
  return Deno.env.get('VERTEX_AI_LOCATION') ?? 'us-central1';
}

export function isVertexConfigured() {
  return Boolean(Deno.env.get('VERTEX_ACCESS_TOKEN') || getServiceAccount()) && Boolean(getProjectId());
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Vertex returned an empty response');
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const fenceMatch = trimmed.match(/```json\s*([\s\S]*?)```/i) ?? trimmed.match(/```\s*([\s\S]*?)```/i);
    if (fenceMatch) {
      return JSON.parse(fenceMatch[1].trim());
    }

    const objectStart = trimmed.indexOf('{');
    const arrayStart = trimmed.indexOf('[');
    const start = objectStart === -1 ? arrayStart : arrayStart === -1 ? objectStart : Math.min(objectStart, arrayStart);
    const end = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }

    throw new Error('Unable to parse JSON from Vertex response');
  }
}

async function callVertex(path: string, body: unknown) {
  const accessToken = await getAccessToken();
  const projectId = getProjectId();
  const location = getLocation();

  if (!accessToken || !projectId) {
    throw new Error('Vertex is not configured');
  }

  const response = await fetch(`https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vertex request failed: ${text}`);
  }

  return response.json();
}

export async function generateStructuredContent<T>(model: string, prompt: string, systemInstruction?: string) {
  const response = await callVertex(`${model}:generateContent`, {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  });

  const text = (response.candidates?.[0]?.content?.parts ?? []).map((part: { text?: string }) => part.text ?? '').join('');
  return extractJson(text) as T;
}

export async function analyzeImageWithPrompt<T>(
  model: string,
  prompt: string,
  imageBase64: string,
  mimeType: string,
  systemInstruction?: string,
) {
  const response = await callVertex(`${model}:generateContent`, {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
          { text: prompt },
        ],
      },
    ],
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  const text = (response.candidates?.[0]?.content?.parts ?? []).map((part: { text?: string }) => part.text ?? '').join('');
  return extractJson(text) as T;
}

export async function generateImagenBase64(prompt: string) {
  const model = Deno.env.get('VERTEX_IMAGEN_MODEL') ?? 'imagen-4.0-generate-001';
  const response = await callVertex(`${model}:predict`, {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: '1:1',
      safetyFilterLevel: 'block_few',
      personGeneration: 'dont_allow',
    },
  });

  return response.predictions?.[0]?.bytesBase64Encoded as string | undefined;
}
