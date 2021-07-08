const ORIGINS = {
  'www.appartementsuperdevoluy.fr': 'main--superdevoluy--kptdobe.hlx.live',
}

async function handleRequest(request) {
  const url = new URL(request.url);

  if (url.hostname in ORIGINS) {
    const xfh = url.hostname;
    const target = ORIGINS[xfh];
    url.hostname = target;
    request = new Request(request);
    request.headers.set('X-Forwarded-Host', xfh);
    const response = await fetch(url.toString(), request);

    const { ok, body, status, statusText } = response;
    const headers = new Headers(response.headers);
    headers.delete('X-Robots-Tag');
    return new Response(body, { status, statusText, headers });
   }

   return fetch(request);
}

addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event.request).catch(
      (err) => new Response(err.stack, { status: 500 })
    )
  );
});

