function escapeAttr(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export async function onRequestGet({ params, env, request }) {
  const id = params.id;
  const html = await env.VISUALS_KV.get(id);
  if (!html) {
    return new Response('Ez a vizualizáció nem található (lehet, hogy törölték).', { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const oembedUrl = `${origin}/oembed?url=${encodeURIComponent(`${origin}/v/${id}`)}&format=json`;

  const page = `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Adatvizualizáció</title>
<link rel="alternate" type="application/json+oembed" href="${escapeAttr(oembedUrl)}" title="Adatvizualizáció">
<style>
  html, body { margin: 0; padding: 0; background: #ffffff; }
  body { display: flex; align-items: flex-start; justify-content: center; }
</style>
</head>
<body>
${html}
</body>
</html>`;

  return new Response(page, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  });
}
