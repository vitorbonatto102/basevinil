import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function startSite(port) {
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
    cwd: root,
    env: { ...process.env, SITE_PASSWORD: "senha-de-teste" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  const deadline = Date.now() + 15_000;
  while (!/Ready in/i.test(output)) {
    if (child.exitCode !== null) throw new Error(`Next encerrou antes de iniciar:\n${output}`);
    if (Date.now() > deadline) throw new Error(`Next não iniciou a tempo:\n${output}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  return child;
}

test("protects pages and APIs with the configured password", async (context) => {
  const port = 33117;
  const site = await startSite(port);
  context.after(async () => {
    site.kill();
    if (site.exitCode === null) await once(site, "exit");
  });
  const siteFetch = (path, init = {}) => fetch(new URL(path, `http://127.0.0.1:${port}`), { redirect: "manual", ...init });

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
  assert.equal(new URL(accepted.headers.get("location"), `http://127.0.0.1:${port}`).pathname, "/");
  const cookie = (accepted.headers.get("set-cookie") ?? "").split(";", 1)[0];
  assert.match(cookie, /^preco_disco_access=[a-f0-9]{64}$/);
  assert.doesNotMatch(cookie, /senha-de-teste/);

  const allowed = await siteFetch("/", { headers: { cookie } });
  assert.equal(allowed.status, 200);
  assert.match(await allowed.text(), /Tabela de preços/i);
});
