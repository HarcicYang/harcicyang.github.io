export default async function handler(req, res) {
  const { OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } = process.env;

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
  var opener = window.opener;
  if (!opener) {
    document.body.textContent = '\\u6388\\u6743\\u5931\\u8d25\\uff1a\\u672a\\u627e\\u5230\\u4e3b\\u7a97\\u53e3';
    return;
  }

  function send(name, data) {
    opener.postMessage(data != null ? name + ':' + data : name, '*');
  }

  function receiveMessage(e) {
    if (e.data === 'authorizing:github') {
      send('authorization:github:success', ${JSON.stringify(payload)});
      window.removeEventListener('message', receiveMessage);
    }
  }

  window.addEventListener('message', receiveMessage);
  send('authorizing:github');
})();
</script><p>\\u6388\\u6743\\u6210\\u529f\\uff0c\\u8bf7\\u8fd4\\u56de\\u7ba1\\u7406\\u9875\\u9762\\u3002</p></body></html>`);
  } catch (err) {
    res.status(500).json({ error: "OAuth failed", detail: err.message });
  }
}
