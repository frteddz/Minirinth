# Minirynth auth worker

Small Cloudflare Worker for the Modrinth OAuth code exchange. The client secret stays here, not in the app.

## Deploy

```sh
npx wrangler login
npm install
npx wrangler secret put MODRINTH_CLIENT_ID
npx wrangler secret put MODRINTH_CLIENT_SECRET
npx wrangler secret put APP_REDIRECT
npx wrangler deploy
```

Set `APP_REDIRECT` to `minirynth://oauth/callback`.

After deploying, send Flash the Worker URL and the Modrinth client ID. Do not send the client secret.

Register this URL as the redirect URI in Modrinth application settings:

```txt
https://minirynth-auth.<you>.workers.dev/callback
```
