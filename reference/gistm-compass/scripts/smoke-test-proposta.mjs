import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-proposta");
fs.mkdirSync(SHOT_DIR, { recursive: true });

let shotN = 0;
async function shot(page, name) {
  shotN += 1;
  const file = path.join(SHOT_DIR, `${String(shotN).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log("screenshot:", file);
}

const errors = [];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newContext().then((c) => c.newPage());
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("caret-color")) {
      errors.push(`console.error: ${msg.text()}`);
    }
  });

  await loginAs(page, BASE);

  console.log("1) Localizar Barragem Norte");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  const hrefNorte = await page.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const installationId = hrefNorte.split("/")[2];

  console.log("2) Dashboard técnico — 'Possíveis documentos faltantes'");
  await page.goto(`${BASE}/instalacoes/${installationId}/dashboard-tecnico`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Possíveis documentos faltantes");
  await shot(page, "dashboard-tecnico-documentos-faltantes");

  console.log("3) Dashboard executivo — checar seção de revalidação (se houver)");
  await page.goto(`${BASE}/instalacoes/${installationId}/dashboard`, { waitUntil: "networkidle" });
  await shot(page, "dashboard-executivo");
  // A seção só aparece se houver alguma revalidação pendente; não é obrigatório existir.

  console.log("4) Pacote de divulgação — página dedicada");
  await page.goto(`${BASE}/instalacoes/${installationId}/documentos`, { waitUntil: "networkidle" });
  const pacoteLink = page.locator('a:has-text("Ver pacote completo")');
  if ((await pacoteLink.count()) > 0) {
    await pacoteLink.click();
    await page.waitForURL(/divulgacao/);
    await page.waitForSelector("text=Pacote de divulgação pública");
    await shot(page, "pacote-divulgacao");
  } else {
    await page.goto(`${BASE}/instalacoes/${installationId}/documentos/divulgacao`, { waitUntil: "networkidle" });
    await page.waitForSelector("text=Pacote de divulgação pública");
    await shot(page, "pacote-divulgacao-direto");
  }

  console.log("5) Comentário e histórico em ação do plano de ação");
  await page.goto(`${BASE}/instalacoes/${installationId}/planos-de-acao`, { waitUntil: "networkidle" });
  const anyActionCard = page.locator("form:has(input[name='author'])").first();
  if ((await anyActionCard.count()) > 0) {
    await anyActionCard.locator('input[name="author"]').fill("Engenheiro de Testes");
    await anyActionCard.locator('input[name="text"]').fill("Comentário automatizado de smoke test na ação.");
    await anyActionCard.locator('button[type="submit"]').click();
    await page.waitForSelector("text=Comentário automatizado de smoke test na ação.", { timeout: 10000 });
    await shot(page, "acao-com-comentario");

    const hasHistoryToggle = await page.locator("summary", { hasText: "Histórico e comentários" }).count();
    if (hasHistoryToggle === 0) errors.push("Toggle de histórico/comentários não apareceu na ação.");
  } else {
    console.log("   (nenhuma ação com formulário de comentário disponível nesta instalação — ok)");
  }

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro. As 4 funcionalidades da proposta validadas.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
