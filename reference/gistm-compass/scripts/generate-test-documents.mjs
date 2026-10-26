// Gera documentos fictícios (Word/Excel) representativos dos tipos de
// evidência normalmente associados a cada tema do GISTM, para popular a
// plataforma GISTM Compass com dados de teste realistas.
//
// TUDO AQUI É FICTÍCIO: empresa, estrutura, dados técnicos e nomes de
// pessoas são inventados para fins de teste de software — não representam
// nenhuma barragem, empresa ou situação real.

import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType } from "docx";
import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "..", "Documentos de Teste GISTM");
fs.mkdirSync(OUT_DIR, { recursive: true });

// --- Universo fictício ------------------------------------------------

const EMPRESA = "Mineradora Exemplo S.A.";
const CNPJ = "12.345.678/0001-90";
const ESTRUTURA = "Barragem Norte";
const LOCAL = "Distrito de Antônio Pereira, Ouro Preto/MG";
const METODO = "alteamento para jusante";
const ALTURA = "45 metros";
const VOLUME = "8,2 milhões de m³ de rejeitos de minério de ferro";
const ANO_OPERACAO = "2014";
const CLASSE_DANO = "Alto";
const CATEGORIA_RISCO = "Médio";
const EOR = "Eng. Fictício da Silva (CREA-MG 123456)";
const DATA_REF = "julho de 2026";

function sanitizeFileName(name) {
  return name.replace(/[/\\:*?"<>|]/g, "-");
}

// --- Geração de .docx ---------------------------------------------------

function coverParagraphs(subtitle) {
  return [
    new Paragraph({
      children: [new TextRun({ text: EMPRESA, bold: true, size: 22 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: `Estrutura: ${ESTRUTURA} — ${LOCAL}`, size: 20 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: subtitle, italics: true, size: 20 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: `Documento de referência — ${DATA_REF}. Conteúdo fictício para fins de teste.`, size: 18, color: "888888" })],
    }),
    new Paragraph({ text: "" }),
  ];
}

function section(heading, paragraphs) {
  const blocks = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, text: heading }),
  ];
  for (const p of paragraphs) {
    blocks.push(new Paragraph({ children: [new TextRun({ text: p })] }));
    blocks.push(new Paragraph({ text: "" }));
  }
  return blocks;
}

async function writeDocx(fileName, title, sections) {
  const children = [
    new Paragraph({ heading: HeadingLevel.TITLE, text: title }),
    ...coverParagraphs(title),
    ...sections.flatMap(([heading, paragraphs]) => section(heading, paragraphs)),
  ];
  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT_DIR, sanitizeFileName(fileName)), buffer);
  console.log("docx:", fileName);
}

// --- Geração de .xlsx ----------------------------------------------------

async function writeXlsx(fileName, sheetName, headers, rows, introLines = []) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  let rowCursor = 1;
  for (const line of [EMPRESA, `Estrutura: ${ESTRUTURA} — ${LOCAL}`, ...introLines, ""]) {
    sheet.getCell(rowCursor, 1).value = line;
    rowCursor++;
  }

  const headerRow = sheet.getRow(rowCursor);
  headers.forEach((h, i) => (headerRow.getCell(i + 1).value = h));
  headerRow.font = { bold: true };
  rowCursor++;

  for (const row of rows) {
    const r = sheet.getRow(rowCursor);
    row.forEach((v, i) => (r.getCell(i + 1).value = v));
    rowCursor++;
  }

  sheet.columns.forEach((col) => (col.width = 24));

  const buffer = await workbook.xlsx.writeBuffer();
  fs.writeFileSync(path.join(OUT_DIR, sanitizeFileName(fileName)), buffer);
  console.log("xlsx:", fileName);
}

// =========================================================================
// Tema 1 — Direitos humanos, engajamento significativo para o dano
// =========================================================================
await writeDocx(
  "Plano de Engajamento de Partes Interessadas e Comunidades Afetadas.docx",
  "Plano de Engajamento de Partes Interessadas e Comunidades Afetadas",
  [
    [
      "1. Objetivo",
      [
        `Este plano estabelece a estratégia de engajamento contínuo da ${EMPRESA} com as comunidades ` +
          `potencialmente afetadas pela ${ESTRUTURA}, em conformidade com os princípios de direitos humanos ` +
          "e engajamento significativo previstos no GISTM (Tópico I).",
        "O plano identifica os grupos afetados, incluindo comunidades a jusante dentro da Zona de " +
          "Autossalvamento (ZAS) e da Zona de Salvamento (ZAS estendida), povos e comunidades tradicionais, " +
          "e demais partes interessadas relevantes.",
      ],
    ],
    [
      "2. Mapeamento de partes afetadas",
      [
        "Foi realizado mapeamento socioterritorial identificando 3 comunidades rurais e 1 núcleo urbano " +
          `situados a jusante da ${ESTRUTURA}, totalizando aproximadamente 420 pessoas na Zona de Autossalvamento.`,
        "O mapeamento é revisado anualmente e sempre que houver alteração no estudo de ruptura hipotética " +
          "(dam break analysis) ou na mancha de inundação.",
      ],
    ],
    [
      "3. Canais de engajamento e queixas",
      [
        "Mantém-se canal de ouvidoria dedicado, com atendimento presencial mensal nas comunidades mapeadas " +
          "e canal telefônico/digital de recebimento de queixas, reclamações e sugestões, com prazo de " +
          "resposta de até 15 dias úteis.",
        "Reuniões públicas de prestação de contas são realizadas semestralmente, com registro de presença, " +
          "atas e plano de encaminhamento das demandas levantadas.",
      ],
    ],
    [
      "4. Simulados de emergência com a comunidade",
      [
        "Simulados de evacuação são conduzidos anualmente em conjunto com a Defesa Civil municipal e as " +
          "comunidades da ZAS, com avaliação de eficácia registrada em relatório específico.",
      ],
    ],
  ]
);

// =========================================================================
// Tema 2 — Base de conhecimento interdisciplinar
// =========================================================================
await writeDocx(
  "Relatório de Investigação Geotécnica e Hidrogeológica.docx",
  "Relatório de Investigação Geotécnica e Hidrogeológica",
  [
    [
      "1. Escopo da investigação",
      [
        `A campanha de investigação geotécnica da ${ESTRUTURA} contemplou 18 sondagens mistas (SPT e ` +
          "rotativa), 6 poços de monitoramento para caracterização hidrogeológica e ensaios de laboratório " +
          "(granulometria, limites de Atterberg, adensamento, cisalhamento direto e triaxial CIU).",
        "Os resultados subsidiam o modelo geológico-geotécnico integrado, correlacionando estratigrafia, " +
          "parâmetros de resistência e condições de nível d'água freático.",
      ],
    ],
    [
      "2. Caracterização dos materiais",
      [
        "Os rejeitos depositados são classificados predominantemente como siltes arenosos não plásticos, " +
          "com potencial de liquefação avaliado como moderado nas porções de praia próximas ao ponto de " +
          "lançamento, conforme critério de Been & Jefferies (parâmetro de estado).",
        "O maciço de contenção é constituído por enrocamento compactado, com fator de segurança geotécnico " +
          "mínimo calculado de 1,5 em condição drenada e 1,3 em condição pseudo-estática (coeficiente sísmico " +
          "de 0,05g).",
      ],
    ],
    [
      "3. Condições hidrogeológicas",
      [
        "A linha freática foi monitorada por meio de piezômetros de tubo aberto e piezômetros elétricos, " +
          "indicando posição compatível com o projeto de drenagem interna, sem indícios de percolação " +
          "anômala nas seções instrumentadas.",
      ],
    ],
    [
      "4. Base de conhecimento interdisciplinar",
      [
        "O modelo integra dados geotécnicos, hidrológicos (estudo de cheias de projeto — TR 10.000 anos " +
          "para vertedouro) e ambientais, subsidiando as decisões de projeto, operação e monitoramento da " +
          "estrutura de forma consistente entre as equipes técnicas envolvidas.",
      ],
    ],
  ]
);

// =========================================================================
// Tema 3 — Tomada de decisão informada
// =========================================================================
await writeDocx(
  "Ata do Comite de Governanca de Seguranca de Barragens.docx",
  "Ata do Comitê de Governança de Segurança de Barragens",
  [
    [
      "1. Identificação da reunião",
      [
        `Reunião ordinária do Comitê de Governança de Segurança de Barragens da ${EMPRESA}, realizada em ` +
          `${DATA_REF}, com a participação do Engenheiro de Registro, da diretoria de operações, da equipe ` +
          "de geotecnia e do responsável técnico pela auditoria interna.",
      ],
    ],
    [
      "2. Pauta e decisões",
      [
        `Apresentação da Declaração de Condição de Estabilidade (DCE) da ${ESTRUTURA}, com atestado de ` +
          "estabilidade sem ressalvas relevantes para o período de referência.",
        "Deliberado o aumento da frequência de leituras de piezômetros de mensal para quinzenal na seção " +
          "instrumentada SI-04, em caráter preventivo, em razão de leitura isolada acima do nível de atenção.",
        "Aprovado o orçamento para substituição de 3 marcos superficiais danificados e para contratação de " +
          "revisão técnica independente (ITRB) no próximo ciclo.",
      ],
    ],
    [
      "3. Registro de decisões informadas",
      [
        "Todas as decisões foram tomadas com base em dados técnicos consolidados (instrumentação, inspeções " +
          "visuais e pareceres do Engenheiro de Registro), com registro de justificativa técnica e " +
          "responsável por cada encaminhamento, assegurando rastreabilidade da tomada de decisão.",
      ],
    ],
  ]
);

// =========================================================================
// Tema 5 — Desenvolva um design robusto
// =========================================================================
await writeDocx(
  "Memorial Descritivo e de Calculo - Projeto Executivo.docx",
  "Memorial Descritivo e de Cálculo — Projeto Executivo",
  [
    [
      "1. Descrição geral do projeto",
      [
        `A ${ESTRUTURA} é uma estrutura de disposição de rejeitos com altura máxima de ${ALTURA}, construída ` +
          `pelo método de ${METODO}, com volume de reservação de ${VOLUME}, em operação desde ${ANO_OPERACAO}.`,
        `Classificação quanto à categoria de risco: ${CATEGORIA_RISCO}. Classificação quanto ao dano ` +
          `potencial associado: ${CLASSE_DANO}, conforme critérios da Resolução ANM nº 95/2022.`,
      ],
    ],
    [
      "2. Critérios de projeto e fatores de segurança",
      [
        "O dimensionamento atende aos fatores de segurança mínimos recomendados pela NBR 13028 e pelas " +
          "diretrizes internacionais (ICOLD/CDA): FS ≥ 1,5 em condição de operação normal (drenada), " +
          "FS ≥ 1,3 em condição pseudo-estática, e FS ≥ 1,0 em condição de rebaixamento rápido.",
        "O sistema extravasor foi dimensionado para a cheia de projeto com tempo de retorno de 10.000 anos, " +
          "incluindo borda livre mínima de operação de 1,0 metro sobre o nível d'água máximo maximorum.",
      ],
    ],
    [
      "3. Robustez e redundância",
      [
        "O projeto contempla sistema de drenagem interna redundante (tapete drenante e drenos de fundo), " +
          "cobertura vegetal do talude de jusante para controle de erosão, e sistema extravasor com " +
          "capacidade superior à vazão de projeto em 20%, como margem de segurança adicional.",
      ],
    ],
  ]
);

// =========================================================================
// Tema 6 — Minimizar e gerenciar riscos ao longo do ciclo de vida
// =========================================================================
await writeDocx(
  "Plano de Gestao de Mudancas e Nao Conformidades.docx",
  "Plano de Gestão de Mudanças e Não Conformidades",
  [
    [
      "1. Objetivo",
      [
        "Este plano define o processo de gestão de mudanças de projeto, operação e manutenção da " +
          `${ESTRUTURA}, assegurando que qualquer alteração seja avaliada quanto ao seu impacto na segurança ` +
          "estrutural antes da implementação.",
      ],
    ],
    [
      "2. Processo de gestão de mudanças",
      [
        "Toda mudança proposta (ex.: alteração de método construtivo, elevação de cota, mudança de taxa de " +
          "alteamento) é submetida a análise crítica multidisciplinar e aprovação formal do Engenheiro de " +
          "Registro antes da execução, com registro em formulário de gestão de mudança (MOC).",
      ],
    ],
    [
      "3. Registro de não conformidades",
      [
        "No período de referência foram registradas 2 não conformidades: (i) obstrução parcial de canaleta " +
          "de drenagem superficial no talude de jusante, corrigida em 5 dias; (ii) atraso na calibração " +
          "programada de 2 piezômetros elétricos, regularizado dentro do trimestre.",
        "Nenhuma não conformidade registrada foi classificada como crítica para a estabilidade da estrutura.",
      ],
    ],
  ]
);

// =========================================================================
// Tema 8 — Políticas, sistemas e capacidades contábeis
// =========================================================================
await writeDocx(
  "Politica Corporativa de Gestao de Rejeitos e Barragens.docx",
  "Política Corporativa de Gestão de Rejeitos e Barragens",
  [
    [
      "1. Compromisso institucional",
      [
        `A ${EMPRESA} adota como política corporativa a gestão responsável de estruturas de disposição de ` +
          "rejeitos, com aderência ao Global Industry Standard on Tailings Management (GISTM) em todas as " +
          "suas unidades operacionais.",
      ],
    ],
    [
      "2. Capacidades e recursos",
      [
        "A empresa mantém equipe técnica dedicada de geotecnia, com dotação orçamentária específica e " +
          "aprovada anualmente para monitoramento, manutenção, auditoria independente e planos de emergência " +
          "das estruturas de disposição de rejeitos, sem contingenciamento sobre itens de segurança.",
        "Sistemas contábeis internos segregam e reportam separadamente os investimentos em segurança de " +
          "barragens, permitindo rastreabilidade orçamentária perante auditorias internas e externas.",
      ],
    ],
    [
      "3. Responsabilidade executiva",
      [
        "A responsabilidade final pela segurança das estruturas de disposição de rejeitos é atribuída " +
          "formalmente a um executivo responsável (Executive Accountable Officer), com relato direto ao " +
          "conselho de administração sobre o desempenho de segurança das barragens.",
      ],
    ],
  ]
);

// =========================================================================
// Tema 9 — Engenheiro de Registro
// =========================================================================
await writeDocx(
  "Carta de Nomeacao e Relatorio Anual do Engenheiro de Registro.docx",
  "Carta de Nomeação e Relatório Anual do Engenheiro de Registro",
  [
    [
      "1. Nomeação",
      [
        `A ${EMPRESA} formaliza a nomeação do ${EOR} como Engenheiro de Registro (Engineer of Record — EoR) ` +
          `da ${ESTRUTURA}, com responsabilidade técnica pela supervisão do projeto, construção, operação e ` +
          "monitoramento da estrutura, conforme atribuições previstas no GISTM e na Resolução ANM nº 95/2022.",
      ],
    ],
    [
      "2. Relatório anual do EoR",
      [
        "No relatório anual de referência, o Engenheiro de Registro atesta que a estrutura opera em " +
          "conformidade com o Plano de Ação de Emergência, com o projeto executivo aprovado e com as " +
          "condições de estabilidade avaliadas, sem identificação de não conformidades críticas no período.",
        "São recomendadas 2 ações de melhoria: reforço do programa de treinamento das equipes de campo em " +
          "leitura de instrumentação e antecipação da próxima revisão técnica independente.",
      ],
    ],
    [
      "3. Continuidade e sucessão",
      [
        "A empresa mantém plano de continuidade que prevê Engenheiro de Registro substituto habilitado, " +
          "assegurando que a responsabilidade técnica pela estrutura nunca fique vaga.",
      ],
    ],
  ]
);

// =========================================================================
// Tema 10 — Níveis de revisão
// =========================================================================
await writeDocx(
  "Relatorio de Revisao Tecnica Independente (ITRB).docx",
  "Relatório de Revisão Técnica Independente (ITRB)",
  [
    [
      "1. Composição do painel",
      [
        "O Painel de Revisão Técnica Independente (Independent Tailings Review Board — ITRB) é composto " +
          "por 3 especialistas externos independentes, com expertise em geotecnia, hidrogeologia e " +
          "governança de segurança de barragens, sem vínculo com o projeto ou operação da estrutura.",
      ],
    ],
    [
      "2. Principais constatações",
      [
        `O painel avaliou a documentação de projeto, os relatórios de instrumentação e o Plano de Ação de ` +
          `Emergência da ${ESTRUTURA}, concluindo que a estrutura apresenta condição de estabilidade ` +
          "adequada frente aos critérios de projeto vigentes.",
        "Foram emitidas 4 recomendações de melhoria, nenhuma classificada como crítica, relacionadas à " +
          "atualização do estudo de ruptura hipotética e à ampliação da rede de instrumentação na crista " +
          "da estrutura.",
      ],
    ],
    [
      "3. Acompanhamento das recomendações",
      [
        "As recomendações do painel são incorporadas ao plano de ação corrente, com prazos e responsáveis " +
          "definidos, e seu status é reportado ao Comitê de Governança de Segurança de Barragens.",
      ],
    ],
  ]
);

// =========================================================================
// Tema 12 — Proteção de denunciantes
// =========================================================================
await writeDocx(
  "Politica de Canal de Denuncias e Protecao ao Denunciante.docx",
  "Política de Canal de Denúncias e Proteção ao Denunciante",
  [
    [
      "1. Objetivo",
      [
        `A ${EMPRESA} mantém canal de denúncias independente e confidencial, disponível a empregados, ` +
          "prestadores de serviço e comunidades, para relato de preocupações relacionadas à segurança de " +
          "estruturas de disposição de rejeitos, incluindo a possibilidade de denúncia anônima.",
      ],
    ],
    [
      "2. Proteção contra retaliação",
      [
        "A política veda expressamente qualquer forma de retaliação contra denunciantes de boa-fé, com " +
          "mecanismos de acompanhamento do caso e sanções disciplinares previstas para casos de retaliação " +
          "comprovada.",
        "Denúncias relacionadas à segurança estrutural são encaminhadas com prioridade máxima diretamente " +
          "ao Engenheiro de Registro e ao Comitê de Governança, independentemente da hierarquia envolvida.",
      ],
    ],
  ]
);

// =========================================================================
// Tema 13 — Resposta de emergência
// =========================================================================
await writeDocx(
  "Plano de Acao de Emergencia (PAE).docx",
  "Plano de Ação de Emergência (PAE)",
  [
    [
      "1. Cenários de emergência",
      [
        `O PAE da ${ESTRUTURA} contempla cenários de ruptura, galgamento e erosão interna progressiva, com ` +
          "definição de níveis de resposta (atenção, alerta e emergência) associados a gatilhos objetivos " +
          "de instrumentação e inspeção visual.",
      ],
    ],
    [
      "2. Zoneamento e rota de fuga",
      [
        "O estudo de ruptura hipotética (dam break analysis) definiu a Zona de Autossalvamento (ZAS) com " +
          "raio aproximado de 10 km a jusante, com rotas de fuga sinalizadas, pontos de encontro definidos " +
          "e sistema de alerta sonoro (sirenes) testado mensalmente.",
      ],
    ],
    [
      "3. Simulados e treinamento",
      [
        "Simulados de emergência são realizados anualmente com a participação das comunidades da ZAS, " +
          "Defesa Civil e Corpo de Bombeiros, com avaliação formal de tempo de resposta e eficácia do " +
          "sistema de alerta.",
      ],
    ],
    [
      "4. Acionamento e comunicação",
      [
        "O plano define fluxo de acionamento com responsáveis, prazos de comunicação a autoridades e " +
          "comunidades, e protocolo de comunicação pública em caso de elevação do nível de emergência.",
      ],
    ],
  ]
);

// =========================================================================
// Tema 14 — Recuperação a longo prazo
// =========================================================================
await writeDocx(
  "Plano de Fechamento e Recuperacao a Longo Prazo.docx",
  "Plano de Fechamento e Recuperação a Longo Prazo",
  [
    [
      "1. Estratégia de fechamento",
      [
        `O plano de fechamento da ${ESTRUTURA} prevê descomissionamento progressivo com estabilização ` +
          "geotécnica, cobertura final multicamadas, revegetação com espécies nativas e monitoramento " +
          "geotécnico e ambiental de longo prazo após o encerramento das operações.",
      ],
    ],
    [
      "2. Provisão financeira",
      [
        "A empresa mantém provisão financeira e garantia atualizada anualmente, calculada com base no " +
          "custo estimado de fechamento e monitoramento pós-fechamento por período mínimo de 20 anos, " +
          "auditada por terceiro independente.",
      ],
    ],
    [
      "3. Uso futuro do território",
      [
        "O plano é desenvolvido em conjunto com as comunidades afetadas, considerando o uso futuro do " +
          "território após o encerramento e a recuperação da capacidade produtiva do solo na área de " +
          "influência da estrutura.",
      ],
    ],
  ]
);

// =========================================================================
// Tema 15 — Divulgação pública
// =========================================================================
await writeDocx(
  "Relatorio Publico de Conformidade GISTM.docx",
  "Relatório Público de Conformidade GISTM",
  [
    [
      "1. Compromisso com a transparência",
      [
        `A ${EMPRESA} publica anualmente, em seu site institucional, o relatório de conformidade da ` +
          `${ESTRUTURA} com o GISTM, incluindo classificação de risco, resumo do desempenho de segurança e ` +
          "principais indicadores de monitoramento, em linguagem acessível ao público não técnico.",
      ],
    ],
    [
      "2. Informações divulgadas",
      [
        "São disponibilizados publicamente: classificação de dano potencial e categoria de risco, resumo " +
          "do Plano de Ação de Emergência (versão pública), contatos do canal de comunicação com a " +
          "comunidade e histórico de auditorias e revisões técnicas independentes.",
      ],
    ],
    [
      "3. Acesso à informação",
      [
        "A empresa mantém canal permanente para solicitação de informações adicionais por parte de " +
          "comunidades, órgãos reguladores, investidores e sociedade civil, com prazo de resposta " +
          "publicamente divulgado.",
      ],
    ],
  ]
);

// =========================================================================
// Tema 4 — Plano e projeto para minimizar os riscos (XLSX: matriz de risco)
// =========================================================================
await writeXlsx(
  "Matriz de Risco da Estrutura de Disposicao de Rejeitos.xlsx",
  "Matriz de Risco",
  ["ID", "Modo de falha", "Causa", "Probabilidade", "Consequência", "Nível de risco", "Medida de mitigação", "Responsável"],
  [
    ["R-01", "Galgamento (overtopping)", "Cheia acima da vazão de projeto", "Baixa", "Alta", "Médio", "Manutenção do vertedouro e borda livre mínima de 1,0 m", "Engenharia"],
    ["R-02", "Erosão interna (piping)", "Percolação concentrada em zona de contato", "Baixa", "Alta", "Médio", "Filtros de transição e monitoramento de turbidez de drenos", "Geotecnia"],
    ["R-03", "Liquefação estática", "Saturação de rejeito não plástico em praia", "Baixa", "Alta", "Médio", "Controle de taxa de alteamento e piezometria", "Geotecnia"],
    ["R-04", "Instabilidade de talude", "Redução de resistência ao cisalhamento", "Baixa", "Alta", "Médio", "Inspeções visuais mensais e monitoramento de deslocamento", "Geotecnia"],
    ["R-05", "Falha de sistema de drenagem", "Colmatação de drenos internos", "Média", "Média", "Médio", "Limpeza e inspeção periódica dos sistemas de drenagem", "Manutenção"],
    ["R-06", "Evento sísmico induzido", "Atividade sísmica na região", "Baixa", "Alta", "Médio", "Análise pseudo-estática e monitoramento sismográfico", "Geotecnia"],
    ["R-07", "Falha de comunicação de emergência", "Falha no sistema de sirenes", "Baixa", "Alta", "Médio", "Testes mensais do sistema de alerta", "Segurança"],
  ],
  ["Matriz de Risco da Estrutura de Disposição de Rejeitos", `Referência: ${DATA_REF}`]
);

// =========================================================================
// Tema 7 — Monitoramento através do ciclo de vida (XLSX: leituras)
// =========================================================================
await writeXlsx(
  "Planilha de Leituras de Instrumentacao Geotecnica.xlsx",
  "Leituras",
  ["Instrumento", "Tipo", "Data da leitura", "Valor lido", "Unidade", "Nível de referência", "Status"],
  [
    ["PZ-01", "Piezômetro elétrico", "2026-06-02", "612,4", "m", "Normal", "Dentro do esperado"],
    ["PZ-02", "Piezômetro elétrico", "2026-06-02", "614,1", "m", "Atenção", "Acima do nível de atenção"],
    ["PZ-03", "Piezômetro de tubo aberto", "2026-06-02", "608,9", "m", "Normal", "Dentro do esperado"],
    ["INC-01", "Inclinômetro", "2026-06-05", "2,3", "mm (acumulado)", "Normal", "Dentro do esperado"],
    ["MS-04", "Marco superficial", "2026-06-05", "1,1", "mm (deslocamento)", "Normal", "Dentro do esperado"],
    ["MS-07", "Marco superficial", "2026-06-05", "0,8", "mm (deslocamento)", "Normal", "Dentro do esperado"],
    ["VZ-01", "Vazão de dreno", "2026-06-10", "3,4", "L/min", "Normal", "Dentro do esperado"],
  ],
  ["Planilha de Leituras de Instrumentação Geotécnica", `Ciclo de referência: ${DATA_REF}`]
);

// =========================================================================
// Tema 11 — Cultura organizacional (XLSX: treinamento)
// =========================================================================
await writeXlsx(
  "Plano de Treinamento e Capacitacao em Seguranca de Barragens.xlsx",
  "Treinamentos",
  ["Equipe", "Tema do treinamento", "Carga horária", "Data realizada", "Status", "Próxima reciclagem"],
  [
    ["Operação", "Leitura básica de instrumentação geotécnica", "8h", "2026-03-10", "Concluído", "2027-03-10"],
    ["Geotecnia", "Interpretação avançada de piezometria", "16h", "2026-02-15", "Concluído", "2028-02-15"],
    ["Brigada de emergência", "Plano de Ação de Emergência e evacuação", "12h", "2026-05-20", "Concluído", "2026-11-20"],
    ["Liderança", "Cultura de segurança e reporte de não conformidades", "4h", "2026-04-08", "Concluído", "2027-04-08"],
    ["Novos empregados", "Integração — segurança de barragens", "4h", "Contínuo (admissão)", "Em andamento", "—"],
  ],
  ["Plano de Treinamento e Capacitação em Segurança de Barragens", `Ciclo de referência: ${DATA_REF}`]
);

// =========================================================================
// Extras — auditoria interna e acompanhamento de ações
// =========================================================================
await writeXlsx(
  "Registro de Auditoria Interna - Ciclo 2026.xlsx",
  "Auditoria Interna",
  ["Item auditado", "Conformidade", "Observação", "Responsável", "Prazo de regularização"],
  [
    ["Atualização do PAE", "Conforme", "Última revisão dentro do prazo de 12 meses", "Segurança", "—"],
    ["Calibração de instrumentos", "Não conforme", "2 piezômetros com calibração vencida", "Geotecnia", "2026-08-15"],
    ["Treinamento da brigada", "Conforme", "100% da brigada treinada no ciclo", "RH", "—"],
    ["Provisão de fechamento", "Conforme", "Provisão atualizada e auditada externamente", "Financeiro", "—"],
    ["Registro de não conformidades", "Conforme", "Fluxo de MOC seguido em todos os casos do período", "Geotecnia", "—"],
  ],
  ["Registro de Auditoria Interna", `Ciclo de referência: ${DATA_REF}`]
);

await writeXlsx(
  "Plano de Acao Corretiva - Acompanhamento.xlsx",
  "Ações",
  ["Ação", "Origem", "Responsável", "Prazo", "Status"],
  [
    ["Recalibrar piezômetros PZ-02 e PZ-05", "Auditoria interna", "Geotecnia", "2026-08-15", "Em andamento"],
    ["Substituir marcos superficiais danificados", "Comitê de Governança", "Manutenção", "2026-09-01", "Aberta"],
    ["Atualizar estudo de ruptura hipotética", "ITRB", "Engenharia", "2027-01-31", "Aberta"],
    ["Ampliar rede de instrumentação na crista", "ITRB", "Geotecnia", "2027-03-31", "Aberta"],
  ],
  ["Plano de Ação Corretiva — Acompanhamento", `Ciclo de referência: ${DATA_REF}`]
);

// =========================================================================
// Extras adicionais — ampliam a base de teste com mais tipos documentais
// =========================================================================

await writeDocx(
  "Registro de Consulta Publica e Audiencia com Comunidades.docx",
  "Registro de Consulta Pública e Audiência com Comunidades",
  [
    [
      "1. Convocação e participação",
      [
        `A ${EMPRESA} realizou audiência pública em ${DATA_REF} para apresentação do desempenho de ` +
          `segurança da ${ESTRUTURA} às comunidades da Zona de Autossalvamento, com participação de 87 ` +
          "moradores, representantes da Defesa Civil e do órgão ambiental estadual.",
      ],
    ],
    [
      "2. Principais manifestações da comunidade",
      [
        "Foram registradas solicitações de maior frequência de comunicação sobre resultados de " +
          "monitoramento e de ampliação do número de sirenes de alerta na zona rural mais distante.",
      ],
    ],
    [
      "3. Encaminhamentos",
      [
        "Todas as manifestações foram protocoladas e vinculadas a ações de acompanhamento, com " +
          "retorno formal às comunidades previsto para a próxima reunião semestral.",
      ],
    ],
  ]
);

await writeDocx(
  "Estudo de Provisao Financeira para Fechamento.docx",
  "Estudo de Provisão Financeira para Fechamento",
  [
    [
      "1. Metodologia",
      [
        `O estudo estima o custo total de descomissionamento e monitoramento pós-fechamento da ${ESTRUTURA} ` +
          "considerando estabilização geotécnica, cobertura final, revegetação e monitoramento por 20 anos " +
          "após o encerramento das operações.",
      ],
    ],
    [
      "2. Resultado da provisão",
      [
        "A provisão financeira constituída é revisada e atualizada anualmente por auditoria externa " +
          "independente, permanecendo compatível com o custo estimado de fechamento vigente.",
      ],
    ],
  ]
);

await writeDocx(
  "Relatorio de Simulado de Emergencia.docx",
  "Relatório de Simulado de Emergência",
  [
    [
      "1. Execução do simulado",
      [
        `Simulado de evacuação da Zona de Autossalvamento da ${ESTRUTURA}, realizado em conjunto com a ` +
          "Defesa Civil municipal e o Corpo de Bombeiros, incluindo acionamento do sistema de sirenes e " +
          "deslocamento das comunidades até os pontos de encontro definidos no PAE.",
      ],
    ],
    [
      "2. Resultados e tempo de resposta",
      [
        "O tempo médio de deslocamento das comunidades até os pontos seguros foi de 42 minutos, dentro " +
          "da margem de segurança estimada pelo estudo de ruptura hipotética. O sistema de sirenes operou " +
          "sem falhas em todos os pontos testados.",
      ],
    ],
    [
      "3. Lições aprendidas",
      [
        "Recomenda-se reforçar a sinalização de uma das rotas de fuga secundárias e antecipar o próximo " +
          "simulado geral para o primeiro semestre do próximo ciclo.",
      ],
    ],
  ]
);

// Segunda versão do PAE, para demonstrar o versionamento de documentos —
// note que o nome do arquivo é diferente do original de propósito (o
// vínculo de "nova versão de" é feito na tela de Documentos, não pelo nome).
await writeDocx(
  "Plano de Acao de Emergencia (PAE) - Rev 1.docx",
  "Plano de Ação de Emergência (PAE) — Revisão 1",
  [
    [
      "1. Motivo da revisão",
      [
        "Esta revisão incorpora as recomendações do simulado de emergência mais recente: reforço da " +
          "sinalização da rota de fuga secundária e atualização dos pontos de encontro após o crescimento " +
          "do núcleo urbano a jusante.",
      ],
    ],
    [
      "2. Cenários de emergência (mantidos da versão anterior)",
      [
        `O PAE da ${ESTRUTURA} contempla cenários de ruptura, galgamento e erosão interna progressiva, com ` +
          "níveis de resposta (atenção, alerta e emergência) associados a gatilhos objetivos de " +
          "instrumentação e inspeção visual.",
      ],
    ],
    [
      "3. Validade",
      [
        "Esta revisão substitui integralmente a versão anterior do Plano de Ação de Emergência e passa a " +
          "ser a referência vigente para treinamentos e simulados futuros.",
      ],
    ],
  ]
);

await writeXlsx(
  "Matriz de Competencias e Treinamentos da Equipe Tecnica.xlsx",
  "Competências",
  ["Nome", "Função", "Competência crítica", "Status da certificação", "Validade"],
  [
    ["Camila Rocha", "Engenheira geotécnica", "Interpretação de instrumentação", "Válida", "2027-03-01"],
    ["Rafael Andrade", "Técnico de campo", "Leitura de piezômetros e inclinômetros", "Válida", "2026-11-15"],
    ["Juliana Prado", "Coordenadora de segurança", "Coordenação de resposta a emergências", "Válida", "2026-09-30"],
    ["Marcos Teixeira", "Engenheiro de registro (suplente)", "Análise de estabilidade geotécnica", "Válida", "2027-06-01"],
    ["Beatriz Nunes", "Analista de compliance", "Auditoria de conformidade GISTM", "Renovação pendente", "2026-08-01"],
  ],
  ["Matriz de Competências e Treinamentos da Equipe Técnica", `Ciclo de referência: ${DATA_REF}`]
);

console.log(`\nDocumentos gerados em: ${OUT_DIR}`);
