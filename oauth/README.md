# Decap CMS OAuth Setup

## 1. Create a GitHub OAuth App

Go to https://github.com/settings/developers → New OAuth App

- **Application name**: Harcic Blog CMS
- **Homepage URL**: `https://harcic.is-a.dev`
- **Callback URL**: `https://YOUR_APP.vercel.app/callback` (fill after step 2)

Click **Register application**, then **Generate a new client secret**.
Save the **Client ID** and **Client Secret**.

## 2. Deploy the OAuth proxy to Vercel

1. Install [Vercel CLI](https://vercel.com/cli): `npm i -g vercel`
2. In this `oauth/` folder, run: `vercel`
3. Follow prompts — note the URL (e.g. `harcic-cms.vercel.app`)
4. Set env vars:
   ```
   vercel env add OAUTH_CLIENT_ID
   vercel env add OAUTH_CLIENT_SECRET
   vercel --prod
   ```
5. Go back to GitHub OAuth App settings and update **Callback URL** to:
   `https://YOUR_APP.vercel.app/callback`

## 3. Update admin config

Edit `admin/config.yml` and set:
```yaml
backend:
  base_url: https://YOUR_APP.vercel.app
```

## 4. Login

Visit `https://harcic.is-a.dev/admin/` and click **Login with GitHub**.
