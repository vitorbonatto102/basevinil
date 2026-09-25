const COOKIE = "preco_disco_access";
const LOGIN = "/_site-login";
const LOGOUT = "/_site-logout";
const MAX_AGE = 60 * 60 * 24 * 30;

function safePath(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://site.local");
    if (url.origin !== "https://site.local" || [LOGIN, LOGOUT].includes(url.pathname)) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

function cookieValue(request: Request) {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === COOKIE) return value.join("=");
  }
  return "";
}

export async function sitePasswordToken(password: string) {
  const bytes = new TextEncoder().encode(`preco-de-disco-session-v1\0${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function equal(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function hasSitePasswordSession(request: Request, password: string) {
  return equal(cookieValue(request), await sitePasswordToken(password));
}

function sessionCookie(value: string, url: URL, maxAge = MAX_AGE) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${url.protocol === "https:" ? "; Secure" : ""}`;
}

function loginPage(returnTo: string, error: boolean) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Entrar — Preço de Disco</title><style>
:root{font-family:Arial,sans-serif;background:#e9e5da;color:#171815}*{box-sizing:border-box}
body{min-height:100vh;margin:0;display:grid;place-items:center;padding:24px}
main{width:min(430px,100%);border:1px solid;background:#f8f6ef;box-shadow:10px 10px #1718151f}
header{padding:25px;border-bottom:1px solid}.tag,label{font:700 10px monospace;letter-spacing:.11em;text-transform:uppercase}
.tag{color:#9b392f}h1{margin:10px 0 12px;font-size:42px;letter-spacing:-.045em}header p:last-child{color:#66665f;line-height:1.5}
form{display:grid;gap:12px;padding:25px}input{height:48px;border:1px solid #777;padding:0 13px;background:#fffef8;font-size:18px}
input:focus{outline:2px solid #225d44}button{height:46px;border:0;background:#171815;color:#fff;font:700 11px monospace;letter-spacing:.1em;text-transform:uppercase}
.error{margin:0;padding:10px;border-left:3px solid #9b392f;background:#f1dfd8;color:#7f2e27;font-size:13px}small{color:#777}
</style></head><body><main><header><p class="tag">Acesso reservado</p><h1>Preço de Disco</h1>
<p>Digite a senha para consultar e editar o catálogo e os próximos leilões.</p></header>
<form method="post" action="${LOGIN}"><input type="hidden" name="returnTo" value="${returnTo.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}">
<label for="password">Senha</label><input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
${error ? '<p class="error" role="alert">Senha incorreta. Tente novamente.</p>' : ""}
<button type="submit">Entrar</button><small>A sessão fica salva neste navegador por 30 dias.</small>
</form></main></body></html>`;
}

function loginResponse(returnTo: string, error: boolean) {
  return new Response(loginPage(returnTo, error), { headers: {
    "Cache-Control": "private, no-store",
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  } });
}

export async function passwordGate(request: Request, password: string) {
  const url = new URL(request.url);
  const expected = await sitePasswordToken(password);
  if (url.pathname === LOGOUT) {
    return new Response(null, { status: 303, headers: {
      Location: new URL(LOGIN, url).toString(),
      "Set-Cookie": sessionCookie("", url, 0),
    } });
  }
  if (url.pathname === LOGIN) {
    if (request.method === "GET" || request.method === "HEAD") {
      return loginResponse(safePath(url.searchParams.get("return_to")), url.searchParams.get("error") === "1");
    }
    if (request.method !== "POST") return new Response("Método não permitido.", { status: 405 });
    if (Number(request.headers.get("content-length") ?? 0) > 4096) return new Response("Requisição grande demais.", { status: 413 });
    const form = await request.formData();
    const supplied = typeof form.get("password") === "string" ? String(form.get("password")) : "";
    const returnTo = safePath(typeof form.get("returnTo") === "string" ? String(form.get("returnTo")) : "/");
    if (!equal(await sitePasswordToken(supplied), expected)) {
      const failed = new URL(LOGIN, url);
      failed.searchParams.set("error", "1");
      failed.searchParams.set("return_to", returnTo);
      return Response.redirect(failed, 303);
    }
    return new Response(null, { status: 303, headers: {
      Location: new URL(returnTo, url).toString(),
      "Set-Cookie": sessionCookie(expected, url),
    } });
  }
  if (equal(cookieValue(request), expected)) return null;
  if (request.method === "GET" || request.method === "HEAD") {
    const login = new URL(LOGIN, url);
    login.searchParams.set("return_to", safePath(`${url.pathname}${url.search}`));
    return Response.redirect(login, 302);
  }
  return Response.json({ error: "Senha necessária." }, { status: 401 });
}
