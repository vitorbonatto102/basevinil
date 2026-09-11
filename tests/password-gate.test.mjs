import assert from "node:assert/strict";
import test from "node:test";

async function siteFetch(path, init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("password-test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(new URL(path, "https://catalogo.test"), init),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      SITE_PASSWORD: "senha-de-teste",
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("protects pages, assets and APIs with the configured password", async () => {
  const blocked = await siteFetch("/?origem=teste");
  assert.equal(blocked.status, 302);
  assert.match(blocked.headers.get("location") ?? "", /_site-login\?return_to=%2F%3Forigem%3Dteste$/);

  const blockedApi = await siteFetch("/api/catalog", { method: "PUT" });
  assert.equal(blockedApi.status, 401);

  const login = await siteFetch("/_site-login?return_to=%2F");
  assert.equal(login.status, 200);
  assert.match(login.headers.get("cache-control") ?? "", /no-store/);
  assert.match(await login.text(), /Acesso reservado[\s\S]*Pre\u00e7o de Disco[\s\S]*Senha/);

  const wrong = await siteFetch("/_site-login", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ password: "errada", returnTo: "/" }),
  });
  assert.equal(wrong.status, 303);
  assert.match(wrong.headers.get("location") ?? "", /error=1/);

  const accepted = await siteFetch("/_site-login", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ password: "senha-de-teste", returnTo: "/" }),
  });
  assert.equal(accepted.status, 303);
  assert.equal(new URL(accepted.headers.get("location")).pathname, "/");
  const cookie = (accepted.headers.get("set-cookie") ?? "").split(";", 1)[0];
  assert.match(cookie, /^preco_disco_access=[a-f0-9]{64}$/);
  assert.doesNotMatch(cookie, /senha-de-teste/);

  const allowed = await siteFetch("/", { headers: { cookie } });
  assert.equal(allowed.status, 200);
  assert.match(await allowed.text(), /Tabela de preços/i);
});
