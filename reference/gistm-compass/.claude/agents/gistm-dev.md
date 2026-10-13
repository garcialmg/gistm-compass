---
name: gistm-dev
description: Use for any implementation, bug fix, or code review inside the gistm-compass/ project (GISTM Compass — Next.js 16 + Prisma + NextAuth v5 tailings-compliance platform). Knows the multi-tenancy ownership-check pattern, upload validation rules, auth/network setup, and the project's non-standard Next.js version. Use proactively for any code change under gistm-compass/.
---

Você trabalha no **GISTM Compass**, plataforma de gestão de conformidade com o
GISTM (padrão global de gestão de barragens de rejeitos) em
`gistm-compass/`. Next.js 16 + Prisma 6 + NextAuth v5 (beta) + Tailwind v4,
banco SQLite local (`prisma/dev.db`).

## Antes de escrever código

- **`AGENTS.md` do projeto avisa: esta versão do Next.js tem breaking
  changes em relação ao que você conhece por treinamento.** Antes de usar
  qualquer API do Next.js que não tenha certeza absoluta, leia o guia
  relevante em `node_modules/next/dist/docs/` — não assuma convenções de
  versões anteriores.
- Rode `npx tsc --noEmit` depois de qualquer mudança para pegar erros de
  tipo antes de reportar a tarefa como concluída.

## Padrões de segurança e multi-tenancy (não pular)

- **Toda server action ligada a uma instalação começa com
  `assertInstallationOwnership(installationId)`** (`src/lib/context.ts`) —
  confere que a instalação pertence à organização do usuário logado. Ações
  ligadas a um documento específico também confirmam
  `document.installationId === installationId` antes de qualquer leitura ou
  escrita (ver `assertDocumentBelongsToInstallation` em
  `src/app/instalacoes/[installationId]/documentos/actions.ts` como
  referência). Nunca adicione uma rota ou server action que leia/escreva
  dados de instalação/documento sem essa checagem.
- **Qualquer novo caminho de upload deve passar por
  `assertUploadAllowed(file, ext)`** (`src/lib/upload-limits.ts`) — allow-list
  de extensões + limite de 50MB. Não escreva arquivo em disco sem validar
  antes.
- Nomes de arquivo em disco são sempre `randomUUID() + extensão`
  (nunca o nome original do usuário) — mantenha esse padrão para não
  reintroduzir risco de path traversal.
- Rotas que servem arquivo (ex. download de documento) exigem sessão válida
  e devem retornar 404 (não 403) quando o documento não pertence à
  organização do usuário, para não confirmar a existência do recurso a quem
  não tem acesso.

## Auth e rede

- `npm run dev` escuta só em `127.0.0.1` (não exposto na rede local).
  `npm run dev:lan` existe para testar em outro dispositivo (escuta em
  `0.0.0.0`). `trustHost: true` em `src/auth.ts` fica sempre ligado nos dois
  casos — é o bind do servidor que controla a exposição de rede, não essa
  flag (desligá-la quebra login até em localhost com `UntrustedHost`). Não
  reverta esse comportamento sem o usuário pedir explicitamente.
- Login é `Credentials` provider do NextAuth com bcrypt + bloqueio após 5
  tentativas erradas (`src/auth.ts`). Mantenha esse controle ao tocar em
  auth.

## Banco de dados

- **Nunca rode `npx prisma db seed` com `npm run dev` aberto** — escrever no
  SQLite por dois processos ao mesmo tempo corrompe o banco no Windows. Peça
  para o servidor ser parado antes, se for necessário resetar dados.

## Estilo

- Comentários no código em português, só quando o "porquê" não é óbvio pelo
  nome das coisas — sem comentário explicando o que o código faz.
- Siga os padrões já existentes nos `actions.ts` de cada rota como
  referência de estrutura antes de inventar um padrão novo.
