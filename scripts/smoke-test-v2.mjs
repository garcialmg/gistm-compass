import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-v2");
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

  console.log("1) Instalações -> abrir Barragem Norte");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  const hrefNorte = await page.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const installationId = hrefNorte.split("/")[2];

  console.log("2) Documentos: upload com validade, disclosure e público-alvo");
  await page.goto(`${BASE}/instalacoes/${installationId}/documentos`, { waitUntil: "networkidle" });
  await page.fill('input[name="title"]', "Relatório de Auditoria Externa 2026");
  await page.selectOption('select[name="type"]', "Registro de auditoria");
  await page.fill('input[name="validUntil"]', "2020-01-01"); // já vencido, propositalmente
  await page.selectOption('select[name="confidentiality"]', "PUBLICO");
  await page.fill('input[name="targetAudience"]', "Investidores");
  const txtPath = path.join(SHOT_DIR, "doc-teste.txt");
  fs.writeFileSync(txtPath, "Relatorio de auditoria externa sobre resposta de emergencia e recuperacao a longo prazo.");
  await page.setInputFiles('input[name="file"]', txtPath);
  await page.click('button:has-text("Enviar documento")');
  await page.locator("li").filter({ hasText: "Relatório de Auditoria Externa 2026" }).first().waitFor();
  await shot(page, "documento-vencido-e-publico");

  const bodyAfterUpload = await page.locator("body").innerText();
  if (!bodyAfterUpload.includes("vencido")) errors.push("Documento vencido não mostrou badge 'vencido'.");

  console.log("3) Aprovar documento para divulgação pública");
  await page.fill('input[name="approvedBy"]', "Compliance");
  await page.click('button:has-text("Aprovar para divulgação")');
  await page.waitForSelector("text=aprovado p/ divulgação");
  await shot(page, "documento-aprovado-disclosure");

  const pacoteText = await page.locator("body").innerText();
  if (!pacoteText.includes("Relatório de Auditoria Externa 2026")) {
    errors.push("Documento aprovado não apareceu no Pacote de divulgação.");
  }

  console.log("4) Requisito: verificar evidência esperada + condição interna de análise");
  await page.goto(`${BASE}/instalacoes/${installationId}/requisitos?q=13.1`, { waitUntil: "networkidle" });
  await page.locator('a[href*="/requisitos/"]').first().click();
  await page.waitForSelector("text=Evidência esperada");
  await page.click('button:has-text("Simular leitura por IA")');
  await page.waitForSelector("text=Última sugestão da IA");
  const hasInfoSufficiency = await page.locator("text=Informação").count();
  if (hasInfoSufficiency === 0) errors.push("Badge de condição interna de análise não apareceu na sugestão da IA.");
  await shot(page, "requisito-evidencia-esperada-e-info-suficiencia");

  console.log("5) Validar avaliação com condição interna de análise");
  // Obrigatório desde a migração `add_..._infosufficiency`: sem preencher,
  // o form não passa na validação nativa do navegador e o submit nem sai.
  await page.selectOption('select[name="finalInfoSufficiency"]', "SUFICIENTE");
  await page.fill('input[name="reviewedBy"]', "Teste V2");
  await page.click('button:has-text("Validar avaliação")');
  await page.waitForSelector("text=Validado por Teste V2");

  console.log("6) Criar ação corretiva e depois uma segunda ação dependente dela");
  const descBox = page.locator('textarea[name="description"]');
  if (await descBox.count()) {
    await descBox.fill("Primeira ação corretiva.");
    await page.fill('input[name="responsible"]', "Equipe A");
    await page.click('button:has-text("Criar ação")');
    await page.locator("li").filter({ hasText: "Primeira ação corretiva." }).first().waitFor();

    await page.locator('textarea[name="description"]').fill("Segunda ação, depende da primeira.");
    await page.fill('input[name="responsible"]', "Equipe B");
    const dependsSelect = page.locator('select[name="dependsOnId"]');
    if (await dependsSelect.count()) {
      await dependsSelect.selectOption({ label: "Depende de: Primeira ação corretiva." });
    }
    await page.click('button:has-text("Criar ação")');
    await page.waitForSelector("text=Segunda ação, depende da primeira.");
    await shot(page, "acoes-com-dependencia");

    const blockedText = await page.locator("body").innerText();
    if (!blockedText.includes("Bloqueada até a ação da qual depende")) {
      errors.push("Ação dependente não mostrou aviso de bloqueio.");
    }
  }

  console.log("7) Dashboard: notificações, síntese executiva, ranking de gaps");
  await page.goto(`${BASE}/instalacoes/${installationId}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Síntese executiva");
  await page.waitForSelector("text=Notificações e acompanhamento");
  await shot(page, "dashboard-enriquecido");

  console.log("8) Novo ciclo de avaliação");
  await page.fill('input[name="name"]', "Ciclo 2026.2 (teste)");
  await page.click('button:has-text("Encerrar ciclo atual e iniciar novo")');
  await page.waitForURL(/cycle=/);
  await shot(page, "novo-ciclo-criado");

  console.log("9) Voltar ao ciclo antigo via seletor -> deve virar somente leitura");
  await page.selectOption('select[name="cycle"]', { label: "Ciclo 2026.1 (encerrado)" });
  await page.click('button:has-text("Ver ciclo")');
  await page.waitForSelector("text=somente leitura");
  await shot(page, "ciclo-encerrado-somente-leitura");

  console.log("10) Relatório exportável");
  await page.goto(`${BASE}/instalacoes/${installationId}/relatorio`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Relatório consolidado de conformidade");
  await page.waitForSelector("text=Lista consolidada de lacunas");
  await shot(page, "relatorio-exportavel");

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro. Todas as funcionalidades novas validadas.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
