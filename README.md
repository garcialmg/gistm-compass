# GISTM Compass (.NET)

Plataforma comercial de conformidade GISTM (*Global Industry Standard on Tailings Management*): catálogo oficial (77 requisitos), gestão documental, avaliação assistida por IA com validação humana, planos de ação, ciclos e painéis.

**Produto:** solução ASP.NET Core 8 (API + Worker + Blazor).  
**Referência de comportamento:** `reference/gistm-compass` (TypeScript/Next.js, somente leitura operacional).

## Solução

| Projeto | Função |
|---------|--------|
| `src/GistmCompass.Domain` | Entidades, enums, prontidão/maturidade, simulador IA |
| `src/GistmCompass.Application` | Casos de uso (instalações, docs, avaliações, ações, ciclos) |
| `src/GistmCompass.Infrastructure` | EF Core, Identity, Blob, fila, extração, Anthropic, seed |
| `src/GistmCompass.Api` | REST + cookies Identity + `/health` |
| `src/GistmCompass.Worker` | Jobs de extração de texto e avaliação IA |
| `src/GistmCompass.Web` | UI Blazor Interactive Server (PT) |
| `tests/GistmCompass.Tests` | Regras de domínio + isolamento multi-tenant |

## Pré-requisitos

- .NET 8 SDK
- (Opcional) SQL Server / Azure SQL — padrão local é **SQLite**
- (Opcional) Azure Storage (Blob + Queue)
- (Opcional) `Anthropic:ApiKey`

## Configuração

```bash
cp .env.example .env   # ou edite appsettings.Development.json
```

Pontos principais em `appsettings.json` / env:

- `Database:Provider` = `Sqlite` | `SqlServer`
- `ConnectionStrings:Default`
- `Storage:Provider` = `Local` | `Azure` (`Storage:LocalRoot` = `App_Data/uploads`)
- `Queue:Provider` = `InMemory` | `Azure`
- `Anthropic:ApiKey` (vazio → heurística determinística)
- `AzureAd:*` (SSO Entra — ativado só se `ClientId` estiver preenchido)

Sem segredos reais no repositório.

## Executar localmente (offline)

Três terminais (ou rode só Web para a UI completa in-process):

```bash
# API (porta livre)
dotnet run --project src/GistmCompass.Api --urls http://127.0.0.1:5188

# Worker (consome fila in-memory/arquivo compartilhada se apontar o mesmo App_Data)
dotnet run --project src/GistmCompass.Worker

# Blazor UI
dotnet run --project src/GistmCompass.Web --urls http://127.0.0.1:5199
```

Demo seed: `demo@gistmcompass.com` / `demo12345`  
Ou use **Criar organização** na tela de login.

A UI Blazor carrega Application/Infrastructure in-process (mesmo banco configurado). A API expõe os mesmos fluxos para testes/integrações.

## Testes

```bash
dotnet build
dotnet test
```

## Seed GISTM

Conteúdo oficial em `src/GistmCompass.Infrastructure/Seed/gistm-content.json` (exportado de `prisma/gistm-content.ts`). Cópia em docs do Agent Store.

## Isolamento (Fase 0 no reference)

Patches em `reference/gistm-compass`:

- `JustificationTemplate` com `organizationId`
- Regeneração de IA apaga evidências só da instalação corrente
- `deleteInstallation` remove `ExternalAnalysis` + arquivos em disco

## Arquitetura

Ver Agent Store: `docs/arquitetura-comercial.md` e checklist `docs/aceitacao-paridade.md`.
