import fs from "node:fs";
import { PDFParse } from "pdf-parse";

const file = process.argv[2];
const outFile = process.argv[3];
const buffer = fs.readFileSync(file);
const parser = new PDFParse({ data: buffer });
const result = await parser.getText();
fs.writeFileSync(outFile, result.text, "utf-8");
console.log(`Extraído: ${result.total} páginas, ${result.text.length} caracteres -> ${outFile}`);
await parser.destroy();
