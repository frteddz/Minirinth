const DEFAULT_SCOPES = 'USER_READ'

interface Env {
  MODRINTH_CLIENT_ID: string
  MODRINTH_CLIENT_SECRET: string
  APP_REDIRECT: string
  OAUTH_SCOPES?: string
  WEB_REDIRECT?: string
}

function redirectTo(url: string, status = 302) {
  return new Response(null, {
    status,
    headers: { Location: url },
  })
}

function error(message: string, status = 400) {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const redirectUri = `${url.origin}/callback`

    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response('Minirynth auth worker is running.')
    }

    if (url.pathname === '/start') {
      const isWeb = url.searchParams.get('web') === '1'
      const authorize = new URL('https://modrinth.com/auth/authorize')
      authorize.searchParams.set('response_type', 'code')
      authorize.searchParams.set('client_id', env.MODRINTH_CLIENT_ID)
      authorize.searchParams.set('scope', env.OAUTH_SCOPES ?? DEFAULT_SCOPES)
      authorize.searchParams.set('state', `${isWeb ? 'web' : 'native'}:${crypto.randomUUID()}`)
      authorize.searchParams.set('redirect_uri', redirectUri)
      return redirectTo(authorize.toString())
    }

    if (url.pathname === '/callback') {
      const isWeb = url.searchParams.get('state')?.startsWith('web:') ?? false
      const providerError = url.searchParams.get('error')
      if (providerError) return error(`Modrinth auth failed: ${providerError}`)

      const code = url.searchParams.get('code')
      if (!code) return error('Missing authorization code.')

      const body = new URLSearchParams({
        code,
        client_id: env.MODRINTH_CLIENT_ID,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      })

      const tokenResponse = await fetch('https://api.modrinth.com/_internal/oauth/token', {
        method: 'POST',
        headers: {
          Authorization: env.MODRINTH_CLIENT_SECRET,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Minirynth/0.3.0 (Unofficial mobile port for Modrinth)',
        },
        body,
      })

      if (!tokenResponse.ok) {
        return error(`Token exchange failed: ${tokenResponse.status}`, 502)
      }

      const token = (await tokenResponse.json()) as {
        access_token: string
        expires_in: number
      }

      const webRedirect = isWeb && env.WEB_REDIRECT ? env.WEB_REDIRECT : env.APP_REDIRECT
      const appCallback = new URL(webRedirect)
      appCallback.searchParams.set('token', token.access_token)
      appCallback.searchParams.set('expires_in', String(token.expires_in))
      return redirectTo(appCallback.toString())
    }

    return error('Not found', 404)
  },
}
