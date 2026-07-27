export default function handler(req, res) {
  const origin = req.headers.origin || "https://harcic.is-a.dev";
  res.setHeader("Access-Control-Allow-Origin", origin);

  const params = new URLSearchParams({
    client_id: process.env.OAUTH_CLIENT_ID,
    scope: "repo,user",
    redirect_uri: `https://${req.headers.host}/callback`,
  });
  res.writeHead(302, {
    Location: `https://github.com/login/oauth/authorize?${params}`,
  });
  res.end();
}
