/*
  Migration reescrita para ser só-adição e idempotente.

  A versão original desta migration foi gerada automaticamente pelo
  `prisma migrate dev` a partir do histórico de migrations — que nunca
  registrou renomeações que já tinham sido aplicadas diretamente no banco
  de produção (provavelmente via `prisma db push` em algum momento
  anterior). Por isso ela tentava RENAME COLUMN em colunas que já tinham
  esse nome novo no banco real, e falhava.

  Esta versão não renomeia, não dropa e não altera nada que já existe —
  só adiciona o que ainda falta (updated_by em Transaction + a tabela
  PrestacaoContas). Pode ser reaplicada com segurança em qualquer estado
  do banco.
*/

-- Garante que o valor MEMBRO existe no enum Role (idempotente)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MEMBRO';

-- ─── Transaction.updated_by ──────────────────────────────────────────────────
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "updated_by" TEXT;

CREATE INDEX IF NOT EXISTS "Transaction_updated_by_idx" ON "Transaction"("updated_by");

DO $$ BEGIN
    ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_updated_by_fkey"
      FOREIGN KEY ("updated_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─── PrestacaoContas ──────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE "PrestacaoStatus" AS ENUM ('PENDENTE', 'FEITO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "PrestacaoContas" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "status" "PrestacaoStatus" NOT NULL DEFAULT 'PENDENTE',
    "updated_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrestacaoContas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PrestacaoContas_group_id_idx" ON "PrestacaoContas"("group_id");
CREATE INDEX IF NOT EXISTS "PrestacaoContas_mes_ano_idx" ON "PrestacaoContas"("mes", "ano");
CREATE UNIQUE INDEX IF NOT EXISTS "PrestacaoContas_group_id_mes_ano_key" ON "PrestacaoContas"("group_id", "mes", "ano");

DO $$ BEGIN
    ALTER TABLE "PrestacaoContas" ADD CONSTRAINT "PrestacaoContas_group_id_fkey"
      FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PrestacaoContas" ADD CONSTRAINT "PrestacaoContas_updated_by_fkey"
      FOREIGN KEY ("updated_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;