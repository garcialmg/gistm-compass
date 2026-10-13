import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-visual");
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

  // Todas as páginas exigem sessão desde a migração `add_organization_and_users`;
  // o import de loginAs existia mas nunca era chamado.
  await loginAs(page, BASE);
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  await shot(page, "instalacoes");
  const hrefNorte = await page.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const installationId = hrefNorte.split("/")[2];

  await page.goto(`${BASE}/instalacoes/${installationId}/dashboard`, { waitUntil: "networkidle" });
  await shot(page, "dashboard");

  await page.goto(`${BASE}/instalacoes/${installationId}/documentos`, { waitUntil: "networkidle" });
  await shot(page, "documentos");

  await page.goto(`${BASE}/instalacoes/${installationId}/relatorio`, { waitUntil: "networkidle" });
  await shot(page, "relatorio");

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
