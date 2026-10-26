import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-auth");
fs.mkdirSync(SHOT_DIR, { recursive: true });

let shotN = 0;
async function shot(page, name) {
  shotN += 1;
  const file = path.join(SHOT_DIR, `${String(shotN).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log("screenshot:", file);
}

const errors = [];
const uniqueSuffix = Date.now();

(async () => {
  const browser = await chromium.launch();

  console.log("1) Acesso sem sessão deve redirecionar para /login");
  const anon = await browser.newContext().then((c) => c.newPage());
  await anon.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  if (!anon.url().includes("/login")) errors.push(`Sem sessão, esperava redirecionar para /login, ficou em ${anon.url()}`);
  await shot(anon, "sem-sessao-redireciona-login");

  console.log("2) Login incorreto mostra mensagem de erro");
  await anon.fill('input[name="email"]', "naoexiste@example.com");
  await anon.fill('input[name="password"]', "senhaerrada123");
  await anon.locator('button[type="submit"]').click();
  await anon.waitForURL(/login\?erro=1/);
  await anon.waitForSelector("text=Email ou senha incorretos");
  await shot(anon, "login-invalido");

  console.log("3) Login correto (usuário de demonstração) mostra as 3 instalações");
  await anon.fill('input[name="email"]', "demo@gistmcompass.com");
  await anon.fill('input[name="password"]', "demo12345");
  await anon.locator('button[type="submit"]').click();
  await anon.waitForURL(/\/instalacoes$/);
  await anon.waitForSelector("text=Barragem Norte");
  await shot(anon, "login-ok-lista-instalacoes");
  const demoRowCount = await anon.locator("tbody tr").count();
  if (demoRowCount !== 3) errors.push(`Esperava 3 instalações para a org demo, achei ${demoRowCount}`);

  const norteHref = await anon.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const norteInstallationId = norteHref.split("/")[2];

  console.log("4) Criar uma SEGUNDA organização (cadastro) — deve começar vazia");
  const other = await browser.newContext().then((c) => c.newPage());
  await other.goto(`${BASE}/cadastro`, { waitUntil: "networkidle" });
  await other.fill('input[name="orgName"]', `Empresa Teste ${uniqueSuffix}`);
  await other.fill('input[name="name"]', "Admin Teste");
  await other.fill('input[name="email"]', `admin${uniqueSuffix}@example.com`);
  await other.fill('input[name="password"]', "senhaSegura123");
  await other.locator('button[type="submit"]').click();
  await other.waitForURL(/\/instalacoes$/);
  await shot(other, "segunda-org-lista-vazia");
  const otherRowCount = await other.locator("tbody tr").count();
  if (otherRowCount !== 0) errors.push(`Organização nova deveria começar sem instalações, achei ${otherRowCount}`);
  const hasNorteLeaked = await other.locator("text=Barragem Norte").count();
  if (hasNorteLeaked > 0) errors.push("VAZAMENTO: a organização nova está vendo 'Barragem Norte' da outra organização!");

  console.log("5) Isolamento: acessar a instalação da OUTRA org pela URL direta deve dar 404");
  await other.goto(`${BASE}/instalacoes/${norteInstallationId}/dashboard`, { waitUntil: "networkidle" });
  await shot(other, "acesso-cruzado-bloqueado");
  const has404 = await other.locator("text=Não encontramos essa página").count();
  if (has404 === 0) errors.push("VAZAMENTO: acesso direto à instalação de outra organização não retornou 404.");

  console.log("6) Criar uma instalação na nova org e confirmar que ela NÃO aparece para a org demo");
  await other.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  await other.fill('input[name="name"]', `Estrutura Isolada ${uniqueSuffix}`);
  await other.locator('button:has-text("Criar instalação")').click();
  await other.waitForURL(/dashboard/);
  const newInstallationUrl = other.url();
  const newInstallationId = newInstallationUrl.split("/")[4];

  await anon.goto(`${BASE}/instalacoes/${newInstallationId}/dashboard`, { waitUntil: "networkidle" });
  const has404ForDemo = await anon.locator("text=Não encontramos essa página").count();
  if (has404ForDemo === 0) errors.push("VAZAMENTO: usuário da org demo conseguiu acessar instalação da outra organização.");
  await shot(anon, "org-demo-nao-ve-instalacao-nova");

  console.log("7) Logout volta para /login e bloqueia acesso de novo");
  await anon.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  await anon.locator('button:has-text("Sair")').click();
  await anon.waitForURL(/login/);
  await anon.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  if (!anon.url().includes("/login")) errors.push("Após logout, /instalacoes não redirecionou para /login.");
  await shot(anon, "pos-logout-bloqueado");

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro. Autenticação e isolamento entre organizações validados.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
