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
    res.send(`<!doctype html>
<html>
<body>
<p id="status">\\u6b63\\u5728\\u5b8c\\u6210\\u767b\\u5f55...</p>
<pre id="log"></pre>
<script>
(function() {
  var log = document.getElementById('log');
  var status = document.getElementById('status');
  var opener = window.opener;

  function addLog(msg) {
    log.textContent += msg + '\\n';
  }

  addLog('origin: ' + window.location.origin);
  addLog('opener: ' + (opener ? 'found' : 'null'));

  if (!opener) {
    status.textContent = '\\u6388\\u6743\\u5931\\u8d25\\uff1a\\u672a\\u627e\\u5230\\u4e3b\\u7a97\\u53e3';
    return;
  }

  addLog('step 1: sending authorizing:github');
  opener.postMessage('authorizing:github', '*');
  addLog('step 1: sent');

  window.addEventListener('message', function onMsg(e) {
    addLog('received: ' + e.data + ' (origin: ' + e.origin + ')');

    if (e.data === 'authorizing:github') {
      addLog('step 2: got ack, sending success');
      opener.postMessage(
        'authorization:github:success:' + ${JSON.stringify(payload)},
        '*'
      );
      addLog('step 2: sent, login should complete now');
      window.removeEventListener('message', onMsg);
      status.textContent = '\\u767b\\u5f55\\u6210\\u529f\\uff0c\\u60a8\\u53ef\\u4ee5\\u5173\\u95ed\\u6b64\\u7a97\\u53e3\\u4e86';
    }
  });
})();
</script>
</body>
</html>`);
  } catch (err) {
    res.status(500).json({ error: "OAuth failed", detail: err.message });
  }
}
