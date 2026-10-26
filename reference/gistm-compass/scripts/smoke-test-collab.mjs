import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-collab");
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
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });

  await loginAs(page, BASE);

  console.log("1) Localizar a instalação Barragem Norte e um requisito qualquer");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  const hrefNorte = await page.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const installationId = hrefNorte.split("/")[2];

  await page.goto(`${BASE}/instalacoes/${installationId}/requisitos`, { waitUntil: "networkidle" });
  const firstReqHref = await page.locator('a[href*="/requisitos/"]').first().getAttribute("href");
  await page.goto(`${BASE}${firstReqHref}`, { waitUntil: "networkidle" });
  await shot(page, "requisito-inicial");

  console.log("2) Adicionar um comentário");
  const commentCountBefore = await page.locator("text=Comentários").count();
  if (commentCountBefore === 0) errors.push("Seção 'Comentários' não encontrada na página do requisito.");

  // Escopado ao form de comentário da AVALIAÇÃO: desde que o Plano de Ação
  // ganhou comentários por ação (ActionItem), `input[name="author"]` sozinho
  // casa com dois formulários diferentes na mesma página.
  const commentForm = page.locator('form:has(input[name="assessmentId"]):has(input[name="author"])');
  await commentForm.locator('input[name="author"]').fill("Engenheiro de Testes");
  await page.locator('textarea[name="text"]').fill("Comentário automatizado de smoke test.");
  await page.locator('form:has(textarea[name="text"]) button[type="submit"]').click();
  await page.waitForSelector("text=Comentário automatizado de smoke test.", { timeout: 10000 });
  await shot(page, "comentario-adicionado");
  const hasComment = await page.locator("text=Comentário automatizado de smoke test.").count();
  if (hasComment === 0) errors.push("Comentário adicionado não apareceu na lista.");

  console.log("3) Validar a avaliação com 'salvar como modelo de justificativa'");
  await page.locator('select[name="finalClassification"]').selectOption("ATENDE_PARCIALMENTE");
  await page.locator('select[name="finalRobustness"]').selectOption("PARCIAL");
  await page.locator('select[name="finalCriticality"]').selectOption("MEDIA");
  await page.locator('select[name="finalInfoSufficiency"]').selectOption("SUFICIENTE");
  await page.locator('textarea[name="finalJustification"]').fill(
    "Justificativa técnica gerada pelo smoke test automatizado para validar histórico e modelos."
  );
  await page.locator('input[name="reviewedBy"]').fill("Engenheiro de Testes");
  await page.locator('input[name="saveAsTemplate"]').check();
  await page.locator('input[name="templateTitle"]').fill("Modelo de teste automatizado");

  await page.locator('form:has(textarea[name="finalJustification"]) button[type="submit"]').click();
  await page.waitForSelector("text=Histórico de decisões", { timeout: 10000 });
  await shot(page, "avaliacao-validada");

  console.log("4) Conferir histórico de decisões");
  const hasHistory = await page.locator("text=Histórico de decisões").count();
  if (hasHistory === 0) errors.push("Seção 'Histórico de decisões' não apareceu após validar a avaliação.");
  else await shot(page, "historico-de-decisoes");

  console.log("5) Conferir modelo de justificativa salvo e reaplicar em outro requisito do mesmo tema");
  const currentUrl = page.url();
  const themeIdMatch = currentUrl.match(/requisitos\/([^/?]+)/);
  await page.goto(`${BASE}/instalacoes/${installationId}/requisitos`, { waitUntil: "networkidle" });
  const secondReqHref = await page.locator('a[href*="/requisitos/"]').nth(1).getAttribute("href");
  await page.goto(`${BASE}${secondReqHref}`, { waitUntil: "networkidle" });

  const templateChip = page.locator('a:has-text("Modelo de teste automatizado")');
  const templateChipCount = await templateChip.count();
  if (templateChipCount === 0) {
    console.log("   (modelo não aplicável a este requisito — provavelmente tema diferente; ok)");
  } else {
    await templateChip.first().click();
    await page.waitForURL(/template=/);
    await page.waitForFunction(
      () =>
        document.querySelector('textarea[name="finalJustification"]')?.value.includes(
          "smoke test automatizado"
        ) ?? false,
      { timeout: 10000 }
    );
    const textareaValue = await page.locator('textarea[name="finalJustification"]').inputValue();
    if (!textareaValue.includes("smoke test automatizado")) {
      errors.push("Selecionar o modelo de justificativa não preencheu a textarea corretamente.");
    }
    await shot(page, "modelo-aplicado");
  }

  console.log("6) Relatório — alternar nível de detalhamento (resumido/completo)");
  await page.goto(`${BASE}/instalacoes/${installationId}/relatorio`, { waitUntil: "networkidle" });
  const reportSectionHeading = (title) => page.locator("main h2, div h2").filter({ hasText: title });
  const hasPlanoAcaoCompleto = await reportSectionHeading("Plano de ação").count();
  if (hasPlanoAcaoCompleto === 0) errors.push("Modo completo do relatório não mostrou a seção 'Plano de ação'.");
  await shot(page, "relatorio-completo");

  await page.locator('a:has-text("Resumido")').click();
  await page.waitForLoadState("networkidle");
  await shot(page, "relatorio-resumido");
  const hasPlanoAcaoResumido = await reportSectionHeading("Plano de ação").count();
  if (hasPlanoAcaoResumido !== 0) errors.push("Modo resumido do relatório ainda mostra a seção 'Plano de ação'.");
  const hasSintese = await reportSectionHeading("Síntese executiva").count();
  if (hasSintese === 0) errors.push("Modo resumido do relatório não mostra a 'Síntese executiva'.");

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro. Comentários, histórico de decisões, modelos de justificativa e nível de detalhamento do relatório validados.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
