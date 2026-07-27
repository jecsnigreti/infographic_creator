/**
 * Uploads the generated embed HTML to our own Cloudflare KV-backed store and returns a stable
 * link (e.g. https://.../v/abc123). Pasting that bare link as its own line in WordPress lets the
 * platform's built-in oEmbed discovery auto-embed it as an iframe - no <script>, no plugin, no
 * unfiltered_html capability needed, since WordPress itself performs the fetch/render at that
 * point rather than the post content containing any risky markup.
 */
export async function createHostedLink(html, token) {
  const res = await fetch('/api/visuals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ html })
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Link generálása sikertelen (${res.status}).`);
  }
  return res.json();
}
