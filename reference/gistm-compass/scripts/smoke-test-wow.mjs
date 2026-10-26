import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-wow");
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

  console.log("1) Lista de instalações com coluna de Prontidão + link Comparar");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  await shot(page, "instalacoes-com-prontidao");
  const hasCompareLink = await page.locator('a:has-text("Comparar instalações")').count();
  if (hasCompareLink === 0) errors.push("Link 'Comparar instalações' não encontrado.");

  const hrefNorte = await page.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const installationId = hrefNorte.split("/")[2];

  console.log("2) Dashboard com a Bússola GISTM + Gauge de Prontidão");
  await page.goto(`${BASE}/instalacoes/${installationId}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Bússola GISTM");
  await page.waitForSelector("svg[aria-label='Bússola de conformidade GISTM por princípio']");
  await shot(page, "dashboard-bussola");

  const wedgeCount = await page.locator("svg path[role='button']").count();
  console.log(`Fatias da bússola renderizadas: ${wedgeCount}`);
  if (wedgeCount !== 15) errors.push(`Esperava 15 fatias na bússola, achei ${wedgeCount}.`);

  console.log("3) Clicar numa fatia da bússola e conferir navegação para Requisitos filtrados");
  const firstWedge = page.locator("svg path[role='button']").first();
  const wedgeLabel = await firstWedge.getAttribute("aria-label");
  console.log(`   clicando na fatia: ${wedgeLabel}`);
  await firstWedge.click();
  await page.waitForURL(/requisitos\?theme=/);
  await page.waitForSelector("text=Filtrando pelo princípio da bússola");
  await shot(page, "requisitos-filtrado-por-tema-da-bussola");

  console.log("4) Página de comparação entre instalações (mapa de calor)");
  await page.goto(`${BASE}/instalacoes/comparar`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Mapa de conformidade");
  await shot(page, "comparar-instalacoes");

  const rowCount = await page.locator("tbody tr").count();
  console.log(`Linhas na comparação: ${rowCount}`);
  if (rowCount < 3) errors.push(`Esperava pelo menos 3 instalações na comparação, achei ${rowCount}.`);

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro. Bússola, Gauge e Comparação validados.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
