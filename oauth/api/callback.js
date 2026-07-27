// Decap CMS GitHub OAuth callback for Vercel
// Deploy: put OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET in Vercel env vars

export default async function handler(req, res) {
  const { OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } = process.env;
  const origin = req.headers.origin || "https://harcic.is-a.dev";

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // /auth — redirect to GitHub
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

  // /callback — exchange code for token
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
    const data = await tokenRes.json();
    res.setHeader("Content-Type", "text/html");
    res.send(`
<!DOCTYPE html>
<html><body><script>
(function() {
  window.addEventListener("message", function(e) {
    if (e.data === "authorizing:github") {
      e.source.postMessage(
        "authorization:github:success:${JSON.stringify(data)}",
        e.origin
      );
    }
  });
  window.opener && window.opener.postMessage(
    "authorizing:github",
    "*"
  );
})();
</script></body></html>`);
  } catch (err) {
    res.status(500).json({ error: "OAuth failed" });
  }
}
