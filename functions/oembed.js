export async function onRequestGet({ request, env }) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  if (!targetUrl) {
    return new Response(JSON.stringify({ message: 'Hiányzó url paraméter.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let id;
  try {
    const parsed = new URL(targetUrl);
    const match = parsed.pathname.match(/\/v\/([a-zA-Z0-9_-]+)/);
    id = match && match[1];
  } catch (err) {
    id = null;
  }
  if (!id) {
    return new Response(JSON.stringify({ message: 'Érvénytelen url.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const exists = await env.VISUALS_KV.get(id);
  if (!exists) {
    return new Response(JSON.stringify({ message: 'Nem található.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const origin = new URL(request.url).origin;
  const embedUrl = `${origin}/v/${id}`;
  const width = 900;
  const height = 750;

  const body = {
    version: '1.0',
    type: 'rich',
    provider_name: 'Infografika-készítő',
    provider_url: origin,
    width,
    height,
    html: `<iframe src="${embedUrl}" width="${width}" height="${height}" style="border:0;max-width:100%;width:100%;" scrolling="yes" loading="lazy"></iframe>`
  };

  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
