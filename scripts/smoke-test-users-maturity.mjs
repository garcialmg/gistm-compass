import { chromium } from "playwright";
import { loginAs, DEMO_LOGIN } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-users-maturity");
fs.mkdirSync(SHOT_DIR, { recursive: true });

let shotN = 0;
async function shot(page, name) {
  shotN += 1;
  const file = path.join(SHOT_DIR, `${String(shotN).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log("screenshot:", file);
}

const errors = [];
const stamp = Date.now();
const MEMBER = { email: `membro-teste-${stamp}@example.com`, password: "senhaTeste123" };
const MEMBER_NAME = "Membro de Teste";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newContext().then((c) => c.newPage());
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

  console.log("1) Login como ADMIN demo e checar link 'Usuários' + botão de excluir instalação");
  await loginAs(page, BASE);
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  const usersLinkAdmin = await page.locator('a[href="/organizacao/usuarios"]').count();
  if (usersLinkAdmin === 0) errors.push("ADMIN: link 'Usuários' não apareceu em /instalacoes.");
  const deleteButtonsAdmin = await page.locator('button[title="Remover instalação"]').count();
  if (deleteButtonsAdmin === 0) errors.push("ADMIN: botão de remover instalação não apareceu.");
  await shot(page, "admin-instalacoes");

  console.log("2) Ir para /organizacao/usuarios e criar um usuário MEMBER");
  await page.goto(`${BASE}/organizacao/usuarios`, { waitUntil: "networkidle" });
  await page.fill('input[name="name"]', MEMBER_NAME);
  await page.fill('input[name="email"]', MEMBER.email);
  await page.fill('input[name="password"]', MEMBER.password);
  await page.locator('select[name="role"]').selectOption("MEMBER");
  await page.locator('button:has-text("Criar usuário")').click();
  await page.waitForSelector(`text=${MEMBER.email}`, { timeout: 10000 });
  await shot(page, "usuario-membro-criado");

  const memberListed = await page.locator(`text=${MEMBER.email}`).count();
  if (memberListed === 0) errors.push("Usuário MEMBER recém-criado não apareceu na lista.");

  console.log("3) Logout e login como o novo usuário MEMBER");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  await page.locator('button:has-text("Sair")').click();
  await page.waitForURL(/\/login/);
  await loginAs(page, BASE, MEMBER);

  console.log("4) Como MEMBER: verificar que 'Usuários' e botão de excluir instalação NÃO aparecem");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  const usersLinkMember = await page.locator('a[href="/organizacao/usuarios"]').count();
  if (usersLinkMember !== 0) errors.push("MEMBER: link 'Usuários' apareceu (deveria estar oculto).");
  const deleteButtonsMember = await page.locator('button[title="Remover instalação"]').count();
  if (deleteButtonsMember !== 0) errors.push("MEMBER: botão de remover instalação apareceu (deveria estar oculto).");
  await shot(page, "member-instalacoes");

  console.log("5) Como MEMBER: tentar acessar /organizacao/usuarios diretamente deve redirecionar");
  await page.goto(`${BASE}/organizacao/usuarios`, { waitUntil: "networkidle" });
  await page.waitForURL((url) => url.pathname === "/instalacoes", { timeout: 10000 }).catch(() => {});
  if (!page.url().endsWith("/instalacoes")) {
    errors.push(`MEMBER: acesso direto a /organizacao/usuarios não redirecionou (url atual: ${page.url()}).`);
  }

  console.log("6) Checar selos de maturidade no dashboard de uma instalação");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  const hrefNorte = await page.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const installationId = hrefNorte.split("/")[2];
  await page.goto(`${BASE}/instalacoes/${installationId}/dashboard`, { waitUntil: "networkidle" });
  const maturityBadges = await page
    .locator("text=/Otimizado|Gerenciado|Em desenvolvimento|Inicial|Sem avaliação/")
    .count();
  if (maturityBadges === 0) errors.push("Nenhum selo de maturidade encontrado no dashboard ('Atendimento por tema').");
  await shot(page, "dashboard-maturidade");

  console.log("7) Logout e login de volta como ADMIN para remover o usuário de teste");
  await page.locator('button:has-text("Sair")').click();
  await page.waitForURL(/\/login/);
  await loginAs(page, BASE, DEMO_LOGIN);
  await page.goto(`${BASE}/organizacao/usuarios`, { waitUntil: "networkidle" });
  const memberRow = page.locator("li", { hasText: MEMBER.email });
  await memberRow.locator('button[title="Remover usuário"]').click();
  await page.waitForSelector(`text=${MEMBER.email}`, { state: "detached", timeout: 10000 }).catch(() => {});
  const stillListed = await page.locator(`text=${MEMBER.email}`).count();
  if (stillListed !== 0) errors.push("Usuário MEMBER de teste não foi removido com sucesso.");
  await shot(page, "usuario-membro-removido");

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro. Gestão de usuários, permissões por papel e módulo de maturidade validados.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
