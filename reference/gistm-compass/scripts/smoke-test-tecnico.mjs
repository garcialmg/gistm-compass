import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-tecnico");
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

  console.log("1) Localizar Barragem Norte e abrir o Dashboard técnico pelo menu lateral");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  const hrefNorte = await page.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const installationId = hrefNorte.split("/")[2];

  await page.goto(`${BASE}/instalacoes/${installationId}/dashboard`, { waitUntil: "networkidle" });
  // "Dashboard técnico" deixou de ser item de menu e virou aba do Painel.
  await page.locator('nav[aria-label="Visões do painel"] a:has-text("Técnico")').click();
  await page.waitForURL(/dashboard-tecnico/);
  await page.waitForSelector("text=Divergência IA × humano");
  await shot(page, "dashboard-tecnico");

  const hasRobustness = await page.locator("text=Robustez das evidências validadas").count();
  if (hasRobustness === 0) errors.push("Seção de robustez das evidências não apareceu.");

  const hasActivity = await page.locator("text=Atividade recente").count();
  if (hasActivity === 0) errors.push("Seção de atividade recente não apareceu.");

  const hasNoEvidence = await page.locator("text=Requisitos sem nenhuma evidência vinculada").count();
  if (hasNoEvidence === 0) errors.push("Seção de requisitos sem evidência não apareceu.");

  console.log("2) Se houver divergências, clicar em um requisito da lista");
  const divergenceLink = page.locator('table a[href*="/requisitos/"]').first();
  if ((await divergenceLink.count()) > 0) {
    const href = await divergenceLink.getAttribute("href");
    await divergenceLink.click();
    await page.waitForURL(/requisitos\//);
    await shot(page, "requisito-a-partir-da-divergencia");
    if (!href.includes("/requisitos/")) errors.push("Link de divergência não apontou para um requisito.");
  } else {
    console.log("   (sem divergências registradas nesta instalação — ok, não é obrigatório)");
  }

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro. Dashboard técnico validado.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
