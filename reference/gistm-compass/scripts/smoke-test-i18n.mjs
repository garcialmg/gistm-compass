import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-i18n");
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

  console.log("1) Localizar Barragem Norte");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  const hrefNorte = await page.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const installationId = hrefNorte.split("/")[2];

  console.log("2) Requisitos — alternar para EN e checar conteúdo oficial em inglês");
  await page.goto(`${BASE}/instalacoes/${installationId}/requisitos`, { waitUntil: "networkidle" });
  await shot(page, "requisitos-pt");
  const hasPtTopic = await page.locator("text=Tópico 1").count();
  if (hasPtTopic === 0) errors.push("Requisitos (PT) não mostrou 'Tópico 1'.");

  await page.locator('a:text-is("EN")').first().click();
  await page.waitForURL(/lang=en/);
  await page.waitForSelector("text=Affected Communities");
  await shot(page, "requisitos-en");
  const hasEnRequirement = await page
    .locator("text=For existing facilities, the Operator can initially opt")
    .count();
  if (hasEnRequirement === 0) errors.push("Requisitos (EN) não mostrou o texto oficial do Requisito 1.1 em inglês.");

  console.log("3) Detalhe do requisito — clicar no primeiro item mantendo lang=en");
  const firstReqHref = await page.locator('a[href*="/requisitos/"]').first().getAttribute("href");
  if (!firstReqHref.includes("lang=en")) errors.push("Link do requisito não preservou lang=en a partir da listagem.");
  await page.goto(`${BASE}${firstReqHref}`, { waitUntil: "networkidle" });
  await shot(page, "requisito-detalhe-en");
  const hasEnBreadcrumb = await page.locator("text=Affected Communities").count();
  if (hasEnBreadcrumb === 0) errors.push("Detalhe do requisito (EN) não mostrou o tópico traduzido no breadcrumb.");

  console.log("4) Voltar para PT no detalhe do requisito");
  await page.locator('a:text-is("PT")').first().click();
  await page.waitForURL((url) => !url.search.includes("lang=en"));
  await page.locator("p").filter({ hasText: "Comunidades Afetadas" }).first().waitFor();
  await shot(page, "requisito-detalhe-pt");

  console.log("5) Dashboard — bússola em inglês");
  await page.goto(`${BASE}/instalacoes/${installationId}/dashboard?lang=en`, { waitUntil: "networkidle" });
  await page.waitForSelector("svg[aria-label='Bússola de conformidade GISTM por princípio']");
  const wedgeTitles = await page
    .locator("svg path[role='button'] title")
    .evaluateAll((els) => els.map((el) => el.textContent ?? ""));
  const hasEnglishWedge = wedgeTitles.some((t) => /Affected Communities|Respect the rights/.test(t));
  if (!hasEnglishWedge) errors.push("Bússola do dashboard em lang=en não mostrou rótulos em inglês.");
  await shot(page, "dashboard-en");

  console.log("6) Relatório — nível de detalhamento + idioma combinados");
  await page.goto(`${BASE}/instalacoes/${installationId}/relatorio?lang=en&nivel=resumido`, {
    waitUntil: "networkidle",
  });
  await shot(page, "relatorio-en-resumido");
  const hasEnSection = await page.locator("h2", { hasText: "Panorama visual" }).count();
  if (hasEnSection === 0) errors.push("Relatório resumido+EN não renderizou (título de seção ainda em PT, ok manter).");

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro. Alternância PT/EN do conteúdo oficial validada.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
