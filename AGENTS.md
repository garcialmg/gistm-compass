# GISTM Compass (.NET) — contexto para agentes

Plataforma comercial de conformidade com o **GISTM** (*Global Industry Standard on Tailings Management*): catálogo oficial (6 tópicos, 15 princípios, **77 requisitos**), gestão documental, avaliação assistida por IA com **validação humana obrigatória**, planos de ação, ciclos e painéis.

Produto da **MGLS**. Stack alvo: **ASP.NET Core 8** (API + Worker + Blazor) + EF Core + Identity + Azure (Blob, Queue, SQL, Entra ID opcional).

## Origem e mandato de conversão

Este repositório é a conversão do protótipo em `reference/gistm-compass` (Next.js + Prisma + SQLite local + chamadas diretas à API Anthropic).

**Objetivo da conversão (já em curso):** multi-inquilino, responsabilidades em camadas, pronto para produto em nuvem Microsoft — **sem alterar regras de negócio/funcionais** salvo demanda explícita do usuário.

`reference/gistm-compass` é **somente referência de comportamento**. Não edite o reference para “implementar” features no .NET; use-o para conferir paridade.

## Solução

| Projeto | Responsabilidade |
|---------|------------------|
| `src/GistmCompass.Domain` | Entidades, enums, `ReadinessScore`, `Maturity`, `AiSimulator` |
| `src/GistmCompass.Application` | Casos de uso + abstrações (`IObjectStorage`, `IJobQueue`, `IAiAssessmentService`, `IInstallationGate`) |
| `src/GistmCompass.Infrastructure` | EF Core, Identity, Blob/Local storage, fila, extração, Anthropic/heurística, seed |
| `src/GistmCompass.Api` | REST + cookies Identity + `/health` |
| `src/GistmCompass.Worker` | Jobs: extração de texto e avaliação IA |
| `src/GistmCompass.Web` | UI Blazor Interactive Server (PT) — Application/Infrastructure in-process |
| `tests/GistmCompass.Tests` | Domínio + isolamento multi-tenant |

Dependências permitidas: **Api/Web/Worker → Application/Infrastructure**; **Application → Domain**; **Infrastructure → Application + Domain**. Domain não referencia Infrastructure/UI.

## Conceitos de domínio (vocabulario)

- **Organization** — tenant; usuários e instalações pertencem a ela.
- **Installation** — estrutura/barragem de rejeitos sob avaliação.
- **Cycle** — ciclo de avaliação; o mais recente é editável; ciclos encerrados = somente leitura.
- **Requirement** — requisito GISTM (código, texto PT/EN); catálogo global (seed).
- **Assessment** — avaliação por requisito × instalação × ciclo; campos `Ai*` vs `Final*`.
- **DocumentFile / Evidence** — documentos da instalação e trechos citados (IA ou humanos).
- **ActionItem** — plano de ação ligado à avaliação.
- **JustificationTemplate** — modelos de justificativa **por organização**.

## Regras de negócio imutáveis (sem pedido explícito)

1. Sugestão da IA **nunca** vira decisão final sem validação humana (`ReviewStatus.VALIDADO` + justificativa obrigatória).
2. Acesso cruzado entre organizações → **404** (não 403), via `IInstallationGate` / `AssertOwnershipAsync`.
3. Regeneração de evidências de IA apaga só evidências da **instalação corrente** (não global por `requirementId`).
4. `JustificationTemplate` sempre com `OrganizationId`.
5. Remoção de instalação (ADMIN) limpa avaliações, ações, docs, `ExternalAnalysis` e blobs.
6. Fórmulas de `ReadinessScore` e `Maturity` são port da referência — não “melhorar” sem demanda.
7. Conteúdo oficial GISTM: `Infrastructure/Seed/gistm-content.json` (origem: `prisma/gistm-content.ts`).

## Multi-tenancy e auth

- Tenant = `OrganizationId` no usuário (`ICurrentUserAccessor` / claims).
- Todo caso de uso ligado a instalação começa com `IInstallationGate`.
- Papéis: `ADMIN` | `MEMBER` (ex.: só ADMIN remove instalação).
- Identity: lockout após 5 tentativas; cookie `GistmCompass.Auth`.
- Entra ID (Azure AD) só se `AzureAd:ClientId` estiver preenchido.

## Infra pluggable (dev local ↔ Azure)

| Concern | Dev | Produção |
|---------|-----|----------|
| DB | SQLite | SQL Server / Azure SQL (`Database:Provider`) |
| Storage | `Local` → `App_Data/uploads` | Azure Blob |
| Queue | `InMemory` | Azure Queue |
| IA | Heurística se sem chave | Anthropic (`Anthropic:ApiKey`) |

Chaves de storage: `org/{orgId}/installation/{instId}/{docId}/{guid}{ext}`. Extensões allow-list no `DocumentService`.

## Como rodar / verificar

```bash
dotnet build
dotnet test
dotnet run --project src/GistmCompass.Web --urls http://127.0.0.1:5199
```

Demo seed: `demo@gistmcompass.com` / `demo12345`. Detalhes em `README.md`.

## Rules do Cursor

Padrões detalhados em `.cursor/rules/`. Em dúvida de comportamento funcional, confira o código equivalente em `reference/gistm-compass` e preserve a regra.
