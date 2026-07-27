export default async function handler(req, res) {
  const { OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } = process.env;
  const origin = req.headers.origin || "https://harcic.is-a.dev";

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

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

  const code = req.query?.code || req.body?.code;
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
    const token = tokenData.access_token;

    if (!token) {
      return res.status(400).json({
        error: "Failed to get access token",
        detail: tokenData,
      });
    }

    const payload = JSON.stringify({ token, provider: "github" });

    res.setHeader("Content-Type", "text/html");
    res.send(`<!doctype html><html><body><script>
(function() {
  window.opener.postMessage(
    "authorization:github:success:" + ${JSON.stringify(payload)},
    "*"
  );
})();
</script><p>授权成功，正在跳回管理页面…</p></body></html>`);
  } catch (err) {
    res.status(500).json({ error: "OAuth failed", detail: err.message });
  }
}
