export default async function handler(req, res) {
  const { OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } = process.env;

  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");

  if (req.url.startsWith("/auth")) {
    const params = new URLSearchParams({
      client_id: OAUTH_CLIENT_ID,
      scope: "repo,user",
      redirect_uri: `https://${req.headers.host}/callback`,
    });
    res.writeHead(302, {
      Location: `https://github.com/login/oauth/authorize?${params}`,
    });
    return res.end();
  }

  const code = req.query?.code;
  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  try {
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: OAUTH_CLIENT_ID,
          client_secret: OAUTH_CLIENT_SECRET,
          code,
        }),
      }
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(400).json({
        error: "No access token",
        detail: tokenData,
      });
    }

    const payload = JSON.stringify({
      token: tokenData.access_token,
      provider: "github",
    });

    res.setHeader("Content-Type", "text/html");
    res.send(`<!doctype html><html><body><script>
(function() {
  var done = false;
  var msg = "authorization:github:success:" + ${JSON.stringify(payload)};

  function trySend() {
    if (done) return;
    var op = window.opener;
    if (!op) { setTimeout(trySend, 200); return; }
    op.postMessage("authorizing:github", "*");
    done = true;
  }

  window.addEventListener("message", function onMsg(e) {
    if (e.data === "authorizing:github" && window.opener) {
      window.opener.postMessage(msg, "*");
    }
  });

  // retry handshake a few times in case opener listener isn't ready
  trySend();
  setTimeout(function() { if (!done) done = true; }, 500);
  setTimeout(function() { if (!done) done = true; }, 1000);

  // fallback: also try sending success directly after delay
  setTimeout(function() {
    if (window.opener) window.opener.postMessage(msg, "*");
  }, 1500);
})();
</script></body></html>`);
  } catch (err) {
    res.status(500).json({ error: "OAuth failed", detail: err.message });
  }
}
