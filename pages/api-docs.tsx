import { useState } from 'react';

interface Endpoint {
  method: string;
  path: string;
  description: string;
  body: object;
  response: object;
  errors: { code: string; status: number; description: string }[];
}

const endpoint: Endpoint = {
  method: 'POST',
  path: '/api/v1/media',
  description: 'Fetch downloadable media links from a TikTok URL. Supports video, audio, and slideshow images.',
  body: {
    url: 'string (required) — TikTok URL',
    type: '"video" | "audio" | "image" | "all" (default: "all")',
  },
  response: {
    success: true,
    data: {
      title: 'TikTok video title',
      duration: 30,
      thumbnail: 'https://...',
      video: { url: 'https://...' },
      audio: { url: 'https://...' },
      images: { urls: ['https://...'], count: 3 },
    },
    meta: {
      api_version: '1.0',
      source: 'tiktok-downloader',
      timestamp: '2025-10-01T00:00:00.000Z',
    },
  },
  errors: [
    { code: 'MISSING_URL',        status: 400, description: '"url" field was not provided.' },
    { code: 'INVALID_URL',        status: 400, description: 'URL is not a valid TikTok link.' },
    { code: 'INVALID_TYPE',       status: 400, description: '"type" value is not recognised.' },
    { code: 'NOT_FOUND',          status: 404, description: 'Requested media type not found for this URL.' },
    { code: 'UPSTREAM_FAILED',    status: 502, description: 'All upstream APIs failed to respond.' },
    { code: 'METHOD_NOT_ALLOWED', status: 405, description: 'Only POST is accepted.' },
    { code: 'INTERNAL_ERROR',     status: 500, description: 'Unexpected server error.' },
  ],
};

const CURL_EXAMPLE = `curl -X POST https://your-domain.com/api/v1/media \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.tiktok.com/@user/video/1234567890",
    "type": "all"
  }'`;

const JS_EXAMPLE = `const response = await fetch('/api/v1/media', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.tiktok.com/@user/video/1234567890',
    type: 'all',   // 'video' | 'audio' | 'image' | 'all'
  }),
});

const { success, data } = await response.json();
if (success) {
  console.log('Video URL:', data.video?.url);
  console.log('Audio URL:', data.audio?.url);
  console.log('Images:',   data.images?.urls);
}`;

const PY_EXAMPLE = `import requests

res = requests.post(
    'https://your-domain.com/api/v1/media',
    json={
        'url': 'https://www.tiktok.com/@user/video/1234567890',
        'type': 'all',
    }
)
data = res.json()
if data['success']:
    print('Video:', data['data']['video']['url'])`;

export default function ApiDocs() {
  const [tab, setTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  const examples = { curl: CURL_EXAMPLE, js: JS_EXAMPLE, python: PY_EXAMPLE };
  const tabLabels = { curl: 'cURL', js: 'JavaScript', python: 'Python' };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e0e0e0', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <a href="/" style={{ color: '#00f2ea', textDecoration: 'none', fontSize: 14 }}>← Back to App</a>
          <h1 style={{ fontSize: 36, fontWeight: 700, margin: '16px 0 8px', background: 'linear-gradient(135deg,#00f2ea,#ff0050)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            TikTok Downloader API
          </h1>
          <p style={{ color: '#888', fontSize: 16, margin: 0 }}>REST API v1 — Programmatically fetch TikTok media links</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <span style={{ background: '#1a1a2e', border: '1px solid #00f2ea33', color: '#00f2ea', borderRadius: 20, padding: '4px 14px', fontSize: 12 }}>v1.0</span>
            <span style={{ background: '#1a1a2e', border: '1px solid #ff005033', color: '#ff0050', borderRadius: 20, padding: '4px 14px', fontSize: 12 }}>Public</span>
          </div>
        </div>

        {/* Base URL */}
        <Section title="Base URL">
          <Code>{`https://your-domain.com/api/v1`}</Code>
        </Section>

        {/* Endpoint */}
        <Section title="Endpoint">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#111', border: '1px solid #222', borderRadius: 10, padding: '14px 18px', marginBottom: 12 }}>
            <span style={{ background: '#00f2ea22', color: '#00f2ea', borderRadius: 6, padding: '3px 10px', fontWeight: 700, fontSize: 13 }}>POST</span>
            <code style={{ color: '#e0e0e0', fontSize: 15 }}>/api/v1/media</code>
          </div>
          <p style={{ color: '#888', margin: 0 }}>{endpoint.description}</p>
        </Section>

        {/* Request Body */}
        <Section title="Request Body">
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#111', borderRadius: 10, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#1a1a1a' }}>
                {['Field', 'Type', 'Required', 'Description'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#00f2ea', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #222' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <TableRow cells={['url', 'string', '✅ Yes', 'Full TikTok URL (tiktok.com / vm.tiktok.com / vt.tiktok.com)']} />
              <TableRow cells={['type', 'string', '⬜ No', '"video" | "audio" | "image" | "all"  — defaults to "all"']} />
            </tbody>
          </table>
        </Section>

        {/* Code Examples */}
        <Section title="Code Examples">
          <div style={{ display: 'flex', gap: 4, marginBottom: 0 }}>
            {(Object.keys(tabLabels) as (keyof typeof tabLabels)[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '8px 18px', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: tab === t ? '#1a1a2e' : '#111',
                color:      tab === t ? '#00f2ea' : '#666',
                borderBottom: tab === t ? '2px solid #00f2ea' : '2px solid transparent',
              }}>
                {tabLabels[t]}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', background: '#111', border: '1px solid #222', borderRadius: '0 8px 8px 8px', padding: 20 }}>
            <button onClick={() => copy(examples[tab])} style={{
              position: 'absolute', top: 12, right: 12,
              background: copied ? '#00b894' : '#1a1a2e',
              color: copied ? '#fff' : '#888',
              border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12
            }}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            <pre style={{ margin: 0, overflowX: 'auto', fontSize: 13, lineHeight: 1.7, color: '#cdd6f4' }}>
              <code>{examples[tab]}</code>
            </pre>
          </div>
        </Section>

        {/* Response */}
        <Section title="Response (200 OK)">
          <Code>{JSON.stringify(endpoint.response, null, 2)}</Code>
        </Section>

        {/* Error Codes */}
        <Section title="Error Codes">
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#111', borderRadius: 10, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#1a1a1a' }}>
                {['Code', 'HTTP Status', 'Description'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#ff0050', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #222' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {endpoint.errors.map(e => (
                <TableRow key={e.code} cells={[e.code, String(e.status), e.description]} codeFirst />
              ))}
            </tbody>
          </table>
        </Section>

        {/* Notes */}
        <Section title="Notes">
          <ul style={{ color: '#888', lineHeight: 2, paddingLeft: 20 }}>
            <li>No authentication required — the API is public.</li>
            <li>Media URLs are sourced from third-party upstream APIs (tikwm, tikodl) and may expire.</li>
            <li>Slideshow posts return <code style={{ color: '#00f2ea' }}>images.urls[]</code>; regular posts return <code style={{ color: '#00f2ea' }}>video.url</code>.</li>
            <li>Response time: typically 1–5 seconds depending on upstream latency.</li>
          </ul>
        </Section>

        <div style={{ textAlign: 'center', marginTop: 60, color: '#333', fontSize: 13 }}>
          TikTok Downloader API v1.0 • Made with Next.js
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16, borderBottom: '1px solid #222', paddingBottom: 8 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre style={{ background: '#111', border: '1px solid #222', borderRadius: 10, padding: 20, overflowX: 'auto', fontSize: 13, lineHeight: 1.7, color: '#cdd6f4', margin: 0 }}>
      <code>{children}</code>
    </pre>
  );
}

function TableRow({ cells, codeFirst = false }: { cells: string[]; codeFirst?: boolean }) {
  return (
    <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
      {cells.map((c, i) => (
        <td key={i} style={{ padding: '10px 16px', fontSize: 13, color: '#ccc' }}>
          {i === 0 && codeFirst
            ? <code style={{ color: '#ff6b6b', background: '#1a1a1a', padding: '2px 8px', borderRadius: 4 }}>{c}</code>
            : c}
        </td>
      ))}
    </tr>
  );
}
