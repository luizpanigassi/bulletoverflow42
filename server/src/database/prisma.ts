import { PrismaClient } from "@prisma/client";

// Instância única do Prisma Client compartilhada pelo servidor inteiro.
// Evita esgotar conexões do Postgres em dev (hot reload) ou em múltiplos módulos.
export const prisma = new PrismaClient();
