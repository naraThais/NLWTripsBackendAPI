import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
    log: ['query'],
})

//facilitar saber quais querys estão sendo feitas para o bd de dados.

