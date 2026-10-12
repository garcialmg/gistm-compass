import fs from "node:fs";

const lang = process.argv[2]; // "pt" or "en"
const file = lang === "pt" ? "../gistm-pt-extracted.txt" : "../gistm-en-extracted.txt";
const reqWord = lang === "pt" ? "Requisito" : "Requirement";
const prinWord = lang === "pt" ? "PRINCÍPIO" : "PRINCIPLE";

const raw = fs.readFileSync(new URL(file, import.meta.url), "utf-8");
const lines = raw.split("\n").map((l) => l.trim());

// Drop page-break noise and repeated header/footer lines.
const cleaned = [];
for (const line of lines) {
  if (!line) continue;
  if (/^-- \d+ of \d+ --$/.test(line)) continue;
  if (/PADRÃO GLOBAL DA INDÚSTRIA PARA A GESTÃO DE REJEITOS$/.test(line)) continue;
  if (/GLOBAL INDUSTRY STANDARD ON TAILINGS MANAGEMENT$/.test(line)) continue;
  cleaned.push(line);
}

// Stop before the Glossary annex — only the normative Topic/Principle sections matter here.
const glossaryIdx = cleaned.findIndex((l) => /^(GLOSSÁRIO|GLOSSARY)$/.test(l));
const body = glossaryIdx >= 0 ? cleaned.slice(0, glossaryIdx) : cleaned;

// Merge lines back into paragraphs: a new paragraph starts after a blank-ish break we don't have
// (we stripped blanks), so instead we rejoin lines until we hit a known "atom" (label or heading).
const reqLabelRe = new RegExp(`^${reqWord} (\\d+)\\.(\\d+)$`);
// Matches both the bare "PRINCÍPIO 8" label and the inline "PRINCÍPIO 4: DESENVOLVER..." heading form.
const prinLabelRe = new RegExp(`^${prinWord} (\\d+)\\b`);

let currentPrincipleNum = null;
const sections = {}; // principleNum -> { paragraphs: [], labels: [] }

let buffer = [];
function flushParagraph() {
  if (buffer.length) {
    const text = buffer.join(" ").replace(/\s+/g, " ").trim();
    if (text && currentPrincipleNum !== null) {
      sections[currentPrincipleNum] ??= { paragraphs: [], labels: [] };
      sections[currentPrincipleNum].paragraphs.push(text);
    }
    buffer = [];
  }
}

for (const line of body) {
  const reqMatch = line.match(reqLabelRe);
  const prinMatch = line.match(prinLabelRe);
  const isAllCapsHeading = line === line.toUpperCase() && /[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(line) && line.length > 15;

  if (reqMatch) {
    flushParagraph();
    const num = reqMatch[1];
    sections[num] ??= { paragraphs: [], labels: [] };
    sections[num].labels.push(`${reqMatch[1]}.${reqMatch[2]}`);
    continue;
  }
  if (prinMatch) {
    flushParagraph();
    currentPrincipleNum = prinMatch[1];
    continue;
  }
  if (isAllCapsHeading) {
    // Topic titles / principle statement headings — keep as markers, not paragraph body,
    // but don't flush mid-sentence paragraphs incorrectly; treat as its own boundary.
    flushParagraph();
    sections.headings ??= [];
    sections.headings.push(line);
    continue;
  }
  buffer.push(line);
}
flushParagraph();

const out = [];
for (let n = 1; n <= 15; n++) {
  const s = sections[String(n)];
  if (!s) {
    out.push(`=== Princípio/Principle ${n}: NO DATA ===`);
    continue;
  }
  out.push(`=== ${n}: ${s.paragraphs.length} paragraphs, labels=[${s.labels.join(", ")}] (${s.labels.length}) ===`);
  s.paragraphs.forEach((p, i) => {
    out.push(`  [P${i + 1}] ${p.slice(0, 140)}${p.length > 140 ? "…" : ""}`);
  });
}
fs.writeFileSync(new URL(`../gistm-structure-${lang}.txt`, import.meta.url), out.join("\n"), "utf-8");
console.log(`Wrote gistm-structure-${lang}.txt`);
