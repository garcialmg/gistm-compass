# GISTM Compass — como rodar esta cópia (MGLS)

Esta cópia inclui a base de dados real (`prisma/dev.db`) e os documentos
(`uploads/`). É material confidencial — mantenha em local seguro.

## Pré-requisitos
- Node.js 20 ou superior (https://nodejs.org)

## Passos
1. Descompacte o pacote.
2. Abra um terminal na pasta `gistm-compass` e rode:
       npm install
3. Copie `.env.example` para `.env` e preencha (principalmente sua ANTHROPIC_API_KEY).
4. Gere o cliente do banco:
       npx prisma generate
5. Suba a plataforma:
       npm run dev
6. Abra http://localhost:3000

## Acesso de administrador
- Login inicial (ADMIN):  mgs@projetox.com  /  MGLS@2026Admin
- Recomendado: ao entrar, vá em **Organização > Usuários** e crie o seu próprio
  login de administrador com um e-mail da MGLS, e troque/defina a sua senha em
  **sua conta** (rodapé do menu). Assim cada pessoa tem acesso nomeado.

Para explorar com dados fictícios, há também o login de demonstração:
  demo@gistmcompass.com  /  demo12345

Observação: o Assistente de IA e a "Simular leitura por IA" só funcionam com
uma ANTHROPIC_API_KEY válida no .env; o resto da plataforma funciona sem ela.
