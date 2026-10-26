import { chromium } from "playwright";
import { loginAs, DEMO_LOGIN } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-password-lockout");
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

// Usuário só para testar "trocar minha senha" (não mexe no login demo, que
// os outros smoke tests dependem).
const SELF = { email: `senha-self-${stamp}@example.com`, password: "senhaInicial123" };
const SELF_NAME = "Usuário Troca Senha";
const SELF_NEW_PASSWORD = "senhaNovaAutoatendimento456";

// Usuário só para testar bloqueio por força bruta + redefinição pelo ADMIN.
const BRUTE = { email: `senha-brute-${stamp}@example.com`, password: "senhaInicial123" };
const BRUTE_NAME = "Usuário Força Bruta";
const BRUTE_NEW_PASSWORD = "senhaRedefinidaPeloAdmin789";

async function createUser(page, { email, password, name }) {
  await page.goto(`${BASE}/organizacao/usuarios`, { waitUntil: "networkidle" });
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.locator('select[name="role"]').selectOption("MEMBER");
  await page.locator('button:has-text("Criar usuário")').click();
  await page.locator("li", { hasText: email }).first().waitFor({ timeout: 10000 });
}

async function removeUser(page, email) {
  await page.goto(`${BASE}/organizacao/usuarios`, { waitUntil: "networkidle" });
  const row = page.locator("li", { hasText: email });
  if ((await row.count()) === 0) return;
  await row.locator('button[title="Remover usuário"]').click();
  await page.locator("li", { hasText: email }).first().waitFor({ state: "detached", timeout: 10000 }).catch(() => {});
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newContext().then((c) => c.newPage());
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

  console.log("1) Login como ADMIN e criar os dois usuários de teste");
  await loginAs(page, BASE);
  await createUser(page, { ...SELF, name: SELF_NAME });
  await createUser(page, { ...BRUTE, name: BRUTE_NAME });

  console.log("2) Logout e login como usuário de teste 'self' para trocar a própria senha");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  await page.locator('button:has-text("Sair")').click();
  await page.waitForURL(/\/login/);
  await loginAs(page, BASE, SELF);

  await page.goto(`${BASE}/conta`, { waitUntil: "networkidle" });
  await page.fill('input[name="currentPassword"]', SELF.password);
  await page.fill('input[name="newPassword"]', SELF_NEW_PASSWORD);
  await page.fill('input[name="confirmPassword"]', SELF_NEW_PASSWORD);
  await page.locator('button[type="submit"]:has-text("Salvar nova senha")').click();
  await page.waitForURL(/\/conta\?sucesso=1/, { timeout: 10000 });
  const successMsg = await page.locator("text=Senha alterada com sucesso.").count();
  if (successMsg === 0) errors.push("Mensagem de sucesso não apareceu após trocar a própria senha.");
  await shot(page, "senha-trocada-sucesso");

  console.log("3) Logout e confirmar que a senha antiga não funciona mais, mas a nova sim");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  await page.locator('button:has-text("Sair")').click();
  await page.waitForURL(/\/login/);

  await page.fill('input[name="email"]', SELF.email);
  await page.fill('input[name="password"]', SELF.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/login\?erro=1/, { timeout: 10000 });

  await page.fill('input[name="email"]', SELF.email);
  await page.fill('input[name="password"]', SELF_NEW_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/instalacoes/, { timeout: 10000 }).catch(() => {
    errors.push("Login com a NOVA senha (após autoatendimento) falhou.");
  });

  console.log("4) Testar bloqueio por força bruta: 5 tentativas erradas seguidas para o usuário 'brute'");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  await page.locator('button:has-text("Sair")').click();
  await page.waitForURL(/\/login/);

  for (let i = 1; i <= 5; i++) {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.fill('input[name="email"]', BRUTE.email);
    await page.fill('input[name="password"]', "senhaErradaDePropositoParaTestar");
    await page.locator('button[type="submit"]').click();
    if (i < 5) {
      await page.waitForURL(/\/login\?erro=1/, { timeout: 10000 }).catch(() => {
        errors.push(`Tentativa ${i}: esperava erro=1, não bloqueio ainda.`);
      });
    } else {
      await page.waitForURL(/\/login\?erro=bloqueado/, { timeout: 10000 }).catch(() => {
        errors.push("5ª tentativa errada não resultou em bloqueio (erro=bloqueado).");
      });
    }
  }
  const lockedMsg = await page.locator("text=bloqueada temporariamente").count();
  if (lockedMsg === 0) errors.push("Mensagem de conta bloqueada não apareceu na tela de login.");
  await shot(page, "conta-bloqueada");

  console.log("5) Confirmar que a senha CORRETA também é rejeitada enquanto bloqueado");
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', BRUTE.email);
  await page.fill('input[name="password"]', BRUTE.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/login\?erro=bloqueado/, { timeout: 10000 }).catch(() => {
    errors.push("Login com senha CORRETA foi aceito mesmo com a conta bloqueada.");
  });

  console.log("6) Login como ADMIN, ver badge 'Bloqueado' e redefinir a senha do usuário travado");
  await loginAs(page, BASE, DEMO_LOGIN);
  await page.goto(`${BASE}/organizacao/usuarios`, { waitUntil: "networkidle" });
  const bruteRow = page.locator("li", { hasText: BRUTE.email });
  const lockedBadge = await bruteRow.locator("text=Bloqueado").count();
  if (lockedBadge === 0) errors.push("Badge 'Bloqueado' não apareceu na lista de usuários para o usuário travado.");
  await shot(page, "admin-ve-usuario-bloqueado");

  await bruteRow.locator("summary", { hasText: "Redefinir senha" }).click();
  await bruteRow.locator('input[name="newPassword"]').fill(BRUTE_NEW_PASSWORD);
  await bruteRow.locator('button:has-text("Redefinir")').click();
  await page.waitForLoadState("networkidle");
  await shot(page, "admin-redefiniu-senha");

  console.log("7) Confirmar que o usuário consegue logar com a nova senha (e não está mais bloqueado)");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  await page.locator('button:has-text("Sair")').click();
  await page.waitForURL(/\/login/);
  await page.fill('input[name="email"]', BRUTE.email);
  await page.fill('input[name="password"]', BRUTE_NEW_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/instalacoes/, { timeout: 10000 }).catch(() => {
    errors.push("Login com a senha redefinida pelo ADMIN falhou (usuário deveria ter sido desbloqueado).");
  });

  console.log("8) Login como ADMIN e limpar os usuários de teste");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  await page.locator('button:has-text("Sair")').click();
  await page.waitForURL(/\/login/);
  await loginAs(page, BASE, DEMO_LOGIN);
  await removeUser(page, SELF.email);
  await removeUser(page, BRUTE.email);

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro. Troca de senha, redefinição pelo ADMIN e bloqueio por força bruta validados.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
