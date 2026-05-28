# Sistema de Gestão Financeira

O Sistema de Gestão Financeira foi desenvolvido como projeto voluntário para auxiliar o setor da juventude na gestão financeira de grupos comunitários. A aplicação permite controle de entradas e saídas, gerenciamento hierárquico de usuários, emissão automática de extratos em PDF e organização financeira por grupos.

A solução foi construída utilizando arquitetura full stack, com frontend e backend desacoplados, autenticação JWT, API REST e deploy em nuvem.

## Tecnologias

### Frontend

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS** + **shadcn/ui**
- **@react-pdf/renderer** (geração de PDF)
- **Axios**

### Backend

- **NestJS**
- **Prisma ORM**
- **PostgreSQL**
- **JWT Authentication**

### Deploy

- **Vercel** - Frontend
- **Render** - Backend
- **Supabase** - Banco de Dados

---

## Funcionalidades

| Módulo             | Descrição                                           |
| ------------------ | --------------------------------------------------- |
| Autenticação       | Login com JWT e controle de acesso (RBAC)           |
| Gestão de Usuários | CRUD com permissões por grupo                       |
| Gestão de Grupos   | Organização financeira por grupo                    |
| Transações         | Registro de entradas/saídas com filtros             |
| Extrato PDF        | Geração de relatório com seleção de período         |
| Assinaturas        | PDF com campos para Tesoureiro, Coordenador e Padre |
| Admin              | Gerenciamento de organizações (SUPER_ADMIN)         |
| Responsivo         | Desktop e Mobile                                    |

## Aprendizados

Durante o desenvolvimento deste projeto, aprofundei conhecimentos em:

- Arquitetura full stack
- Autenticação JWT
- Controle de acesso por permissões
- Integração frontend/backend
- Geração dinâmica de PDFs
- Deploy de aplicações web
- Modelagem de banco de dados com Prisma ORM
- Liderança
- Organização Financeira
