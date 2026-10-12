# GISTM Compass

Plataforma de gestão da conformidade com o GISTM (*Global Industry Standard on
Tailings Management*): base de requisitos, gestão documental, avaliação de
evidências assistida por IA com validação técnica humana, plano de ação, ciclos
de avaliação e painéis executivo e técnico.

Produto da **MGLS**.

## Visão geral

A plataforma organiza a conformidade de estruturas de disposição de rejeitos
em torno dos 77 requisitos do GISTM. Para cada estrutura, a equipe reúne a base
documental, avalia requisito a requisito com apoio de IA, registra o plano de
ação e acompanha a evolução por ciclos — com trilha de auditoria e relatórios
prontos para diretoria e auditores. A decisão final é sempre do revisor
técnico; a IA acelera a leitura, não substitui o julgamento.

## Principais recursos

- **Base de requisitos GISTM** — 6 tópicos, 15 princípios e 77 requisitos com o
  texto oficial do Padrão em português e inglês, com alternância PT/EN.
- **Avaliação por requisito** — classificação, robustez da evidência,
  criticidade do gap e suficiência de informação, com validação humana
  obrigatória, histórico estruturado de decisões, trilha de auditoria e
  biblioteca de justificativas reutilizáveis.
- **Leitura assistida por IA** — um agente consulta a base documental da
  estrutura por completo (localiza, lê os documentos na íntegra, cruza
  informações e cita as fontes) para sugerir a avaliação e responder perguntas
  no assistente. Uma heurística determinística serve de fallback.
- **Gestão documental** — upload com metadados (tipo, versão, validade,
  confidencialidade, público), versionamento, importação de pasta, busca por
  conteúdo e extração de texto de `.pdf`, `.docx`, `.xlsx`, `.txt` e `.md`.
- **Plano de ação** — quadro por status com prioridade, prazo, dependência
  entre ações, evidência de encerramento e histórico de progresso.
- **Ciclos de avaliação** — encerramento de ciclo, modo somente-leitura e
  comparação de evolução entre ciclos.
- **Painéis** — executivo e técnico, Bússola GISTM com Índice de Prontidão para
  Auditoria, comparação entre instalações e relatório imprimível (resumido ou
  completo), além do pacote de divulgação pública.
- **Multi-tenant** — cada organização só enxerga as próprias estruturas; papéis
  ADMIN/MEMBER e proteção contra força bruta no login.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS** — front-end e
  back-end no mesmo projeto, com Server Actions nas mutações.
- **Prisma** + **SQLite** em desenvolvimento (para produção, trocar o provider
  para PostgreSQL e apontar `DATABASE_URL`).
- **NextAuth (Auth.js v5)** — autenticação por credenciais e multi-tenant.
- **Anthropic API** — camada de IA agêntica (`src/lib/ai-agent.ts`).

## Executando localmente

Pré-requisitos: Node.js 20+.

```bash
npm install
cp .env.example .env      # preencha DATABASE_URL, AUTH_SECRET e ANTHROPIC_API_KEY
npx prisma generate
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). Para explorar com dados
fictícios, use o login de demonstração `demo@gistmcompass.com` / `demo12345`
(criado pelo seed). Para começar do zero como um novo cliente, use "Criar
organização" na tela de login.

O recurso de IA (assistente e leitura por requisito) exige uma
`ANTHROPIC_API_KEY` válida; o restante da plataforma funciona sem ela.

### Dados de demonstração

O banco de desenvolvimento já vem com o conteúdo oficial do GISTM e três
estruturas de exemplo. Para redefinir ao estado limpo:

```bash
npx prisma db seed
```

> Pare o servidor (`npm run dev`) antes de rodar o seed — duas escritas
> simultâneas no SQLite corrompem o banco no Windows.

Para um cenário mais rico (estruturas em diferentes estágios de maturidade):

```bash
npx tsx scripts/seed-test-documents.mjs
npx tsx scripts/seed-demo-story.mjs
```

## Conteúdo oficial do GISTM

`prisma/gistm-content.ts` é a fonte única do texto oficial (PT/EN), transcrito
dos PDFs do Padrão e consumido por `prisma/seed.ts`. Alguns requisitos (3.4,
5.6, 5.8, 10.7 e 15.1) reúnem mais de um parágrafo do original; a
correspondência foi conferida cruzando as citações internas do próprio Padrão.
Para atualizar (ex.: uma revisão do GISTM), edite esse arquivo e rode o seed
novamente.

## Arquitetura e segurança

- **Isolamento entre organizações** — toda página e Server Action escopada por
  estrutura passa por `getInstallationContext` / `assertInstallationOwnership`
  (`src/lib/context.ts`), que exige sessão válida e confirma a propriedade;
  acesso cruzado retorna 404.
- **Validação humana** — a sugestão da IA nunca vira avaliação definitiva sem
  confirmação de um revisor; cada decisão gera snapshot e trilha de auditoria.
- **IA ancorada nos documentos** — o agente responde apenas com base no
  conteúdo da base documental e cita as fontes; quando não encontra, diz
  explicitamente em vez de inventar.

## Qualidade

Scripts de verificação ponta-a-ponta (Playwright) em `scripts/smoke-test-*.mjs`
cobrem autenticação e isolamento entre organizações, avaliação, documentos,
plano de ação, ciclos, painéis, i18n e o assistente. Executam contra o
servidor local.

## Status e próximos passos

Para operação como produto em produção, estão previstos:

- Hospedagem em nuvem e migração de SQLite para **PostgreSQL** gerenciado.
- Armazenamento de arquivos em **object storage** (hoje em disco local).
- Autenticação corporativa (**SSO/AD**), verificação e convite por e-mail.
- Rotina de **backup** e monitoramento.
- Adequação à **LGPD** para o tratamento de dados dos clientes.
"# gistm-compass" 
