import { PrismaClient } from "./generated/prisma";

function getPrismaClient(): PrismaClient {
  const prismaClient = new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "info" },
      { emit: "event", level: "warn" },
      { emit: "event", level: "error" },
    ],
  });

  // @ts-expect-error ts(2339)
  prismaClient.$on("query", (event: Prisma.QueryEvent) => {
    console.log(
      `[prisma]: [query]=${event.query} [params]=${event.params} [duration]=${event.duration}`,
    );
  });
  return prismaClient;
}

export const state = {
  prisma: getPrismaClient(),
};
