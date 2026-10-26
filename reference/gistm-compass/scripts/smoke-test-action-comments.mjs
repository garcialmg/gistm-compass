import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-action-comments");
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

  console.log("1) Abrir o primeiro requisito de Barragem Norte e validar como 'Não atende'");
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
  await page.locator('textarea[name="finalJustification"]').fill("Validado pelo smoke test para viabilizar a criação de ação.");
  await page.locator('input[name="reviewedBy"]').fill("Engenheiro de Testes");
  await page.locator('form:has(textarea[name="finalJustification"]) button[type="submit"]').click();
  await page.waitForSelector('form:has(textarea[name="description"])', { timeout: 10000 });

  console.log("2) Criar uma ação corretiva (se o formulário estiver disponível)");
  const createForm = page.locator('form:has(textarea[name="description"])');
  if ((await createForm.count()) === 0) {
    console.log("   (classificação atual não permite criar ação — ok, teste encerra aqui)");
    await browser.close();
    console.log("\n=== Erros/falhas capturados ===");
    console.log("Nenhum erro (cenário sem ação disponível para testar).");
    return;
  }
  await createForm.locator('textarea[name="description"]').fill("Ação de teste automatizado para comentários.");
  await createForm.locator('input[name="responsible"]').fill("Equipe de Testes");
  await createForm.locator('button[type="submit"]').click();
  await page.waitForSelector("text=Ação de teste automatizado para comentários.", { timeout: 10000 });
  await shot(page, "acao-criada");

  console.log("3) Adicionar um comentário na ação recém-criada");
  // O formulário de comentário da AÇÃO usa <input name="text">; o da AVALIAÇÃO
  // usa <textarea name="text"> — esse seletor é exclusivo do formulário da ação.
  const commentForm = page.locator('form:has(input[name="text"])').first();
  await commentForm.locator('input[name="author"]').fill("Engenheiro de Testes");
  await commentForm.locator('input[name="text"]').fill("Comentário automatizado na ação.");
  await commentForm.locator('button[type="submit"]').click();
  await page.waitForSelector("text=Histórico e comentários", { timeout: 10000 });
  await shot(page, "acao-com-comentario-e-historico");

  const hasComment = await page.locator("summary", { hasText: "Histórico e comentários" }).count();
  if (hasComment === 0) errors.push("Seção de histórico/comentários não apareceu após comentar.");

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro. Comentários e histórico de ações validados.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
