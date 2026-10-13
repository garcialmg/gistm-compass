import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-action-suggestion");
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

  await loginAs(page, BASE);

  console.log("1) Abrir um requisito de Barragem Norte e validar como 'Não atende' com criticidade alta");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  const hrefNorte = await page.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const installationId = hrefNorte.split("/")[2];
  await page.goto(`${BASE}/instalacoes/${installationId}/requisitos`, { waitUntil: "networkidle" });
  await page.locator('a[href*="/requisitos/"]').first().click();
  await page.waitForLoadState("networkidle");

  await page.locator('select[name="finalClassification"]').selectOption("NAO_ATENDE");
  await page.locator('select[name="finalRobustness"]').selectOption("AUSENTE");
  await page.locator('select[name="finalCriticality"]').selectOption("ALTA");
  await page.locator('select[name="finalInfoSufficiency"]').selectOption("INSUFICIENTE");
  await page.locator('textarea[name="finalJustification"]').fill("Teste de sugestão automática de plano de ação.");
  await page.locator('input[name="reviewedBy"]').fill("Engenheiro de Testes");
  await page.locator('form:has(textarea[name="finalJustification"]) button[type="submit"]').click();
  await page.waitForSelector('form:has(textarea[name="description"])', { timeout: 10000 });

  console.log("2) Conferir se a descrição, prioridade e prazo já vêm sugeridos");
  await shot(page, "form-sugerido");

  const description = await page.locator('textarea[name="description"]').inputValue();
  console.log("Descrição sugerida:", description);
  if (!description.includes("criticidade alta")) {
    errors.push(`Descrição sugerida não menciona a criticidade correta: "${description}"`);
  }

  const priority = await page.locator('select[name="priority"]').inputValue();
  console.log("Prioridade sugerida:", priority);
  if (priority !== "ALTA") errors.push(`Prioridade esperada ALTA, veio ${priority}`);

  const dueDate = await page.locator('input[name="dueDate"]').inputValue();
  console.log("Prazo sugerido:", dueDate);
  const expectedDate = new Date();
  expectedDate.setDate(expectedDate.getDate() + 30);
  const expectedStr = expectedDate.toISOString().slice(0, 10);
  if (dueDate !== expectedStr) {
    errors.push(`Prazo esperado ~${expectedStr} (30 dias), veio ${dueDate}`);
  }

  console.log("3) Criar a ação com os valores sugeridos e conferir que salvou");
  await page.locator('input[name="responsible"]').fill("Equipe de Testes");
  await page.locator('form:has(textarea[name="description"]) button[type="submit"]').click();
  await page.waitForSelector("text=Adequar o atendimento ao requisito", { timeout: 10000 });
  await shot(page, "acao-criada");

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro. Sugestão de plano de ação a partir do gap validada.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
