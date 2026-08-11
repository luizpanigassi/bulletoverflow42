import { env } from "../env.js";

const AUTHORIZE_URL = "https://api.intra.42.fr/oauth/authorize";
const TOKEN_URL = "https://api.intra.42.fr/oauth/token";
const ME_URL = "https://api.intra.42.fr/v2/me";

export function buildAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: env.fortyTwo.clientId,
    redirect_uri: env.fortyTwo.callbackUrl,
    response_type: "code",
    scope: "public",
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

interface FortyTwoProfile {
  id: number;
  login: string;
  email: string;
  image: { link: string | null } | null;
}

export async function exchangeCodeForProfile(code: string): Promise<FortyTwoProfile> {
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: env.fortyTwo.clientId,
      client_secret: env.fortyTwo.clientSecret,
      code,
      redirect_uri: env.fortyTwo.callbackUrl,
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`Falha ao trocar code por token: ${tokenRes.status} ${await tokenRes.text()}`);
  }
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const meRes = await fetch(ME_URL, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!meRes.ok) {
    throw new Error(`Falha ao buscar perfil na API da 42: ${meRes.status} ${await meRes.text()}`);
  }
  return (await meRes.json()) as FortyTwoProfile;
}
