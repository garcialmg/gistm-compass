import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-pending-suggestions");
fs.mkdirSync(SHOT_DIR, { recursive: true });

const errors = [];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newContext().then((c) => c.newPage());
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

  await loginAs(page, BASE);

  console.log("1) Validar um SEGUNDO requisito (sem criar ação) para gerar um gap pendente");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  const hrefNorte = await page.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const installationId = hrefNorte.split("/")[2];
  await page.goto(`${BASE}/instalacoes/${installationId}/requisitos`, { waitUntil: "networkidle" });
  // pega o segundo link de requisito (o primeiro já foi usado no teste anterior)
  await page.locator('a[href*="/requisitos/"]').nth(1).click();
  await page.waitForLoadState("networkidle");

  await page.locator('select[name="finalClassification"]').selectOption("ATENDE_PARCIALMENTE");
  await page.locator('select[name="finalRobustness"]').selectOption("FRACA");
  await page.locator('select[name="finalCriticality"]').selectOption("MEDIA");
  await page.locator('select[name="finalInfoSufficiency"]').selectOption("SUFICIENTE");
  await page.locator('textarea[name="finalJustification"]').fill("Teste de gap pendente sem ação.");
  await page.locator('input[name="reviewedBy"]').fill("Engenheiro de Testes");
  await page.locator('form:has(textarea[name="finalJustification"]) button[type="submit"]').click();
  await page.waitForLoadState("networkidle");

  console.log("2) Ir para Plano de Ação e conferir a seção 'Ações sugeridas pendentes'");
  await page.goto(`${BASE}/instalacoes/${installationId}/planos-de-acao`, { waitUntil: "networkidle" });
  const sectionVisible = await page.locator("text=Ações sugeridas pendentes").count();
  console.log("Seção visível:", sectionVisible > 0);
  if (sectionVisible === 0) errors.push("Seção 'Ações sugeridas pendentes' não apareceu com um gap sem ação.");
  await page.screenshot({ path: `${SHOT_DIR}/01-plano-de-acao.png`, fullPage: true });

  if (sectionVisible > 0) {
    console.log("3) Clicar em 'Ver sugestão' e conferir que abre o requisito com o form pré-preenchido");
    await page.locator('a:has-text("Ver sugestão")').first().click();
    await page.waitForURL(/\/requisitos\//, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    const hasForm = await page.locator('textarea[name="description"]').count();
    if (hasForm === 0) errors.push("Não encontrou o formulário de ação sugerida ao clicar em 'Ver sugestão'.");
    await page.screenshot({ path: `${SHOT_DIR}/02-requisito-com-sugestao.png` });
  }

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) console.log("Nenhum erro. Seção de ações pendentes validada.");
  else errors.forEach((e) => console.log(e));
})().catch((err) => {
  console.error("FALHA:", err);
  process.exitCode = 1;
});
