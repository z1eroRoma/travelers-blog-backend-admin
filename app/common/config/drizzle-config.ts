import { defineConfig } from "drizzle-kit";
import { sql } from "drizzle-orm";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { Pool } from "pg";
import * as schema from "../types/drizzle/schema";
import { logger } from "./pino-plugin";

export type DbConnection = NodePgDatabase<typeof schema>;
declare module "fastify" {
    interface FastifyInstance {
        db: DbConnection;
    }
}

export let sqlCon: DbConnection;

export const DrizzleConfig: FastifyPluginAsync = fp(async (fastify: FastifyInstance): Promise<void> => {
    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });

        const db = drizzle(pool, {
            schema,
            logger: {
                logQuery: (query, params) => {
                    logger.debug(`[SQL]: ${query} ${params ? JSON.stringify(params) : ""}`);
                }
            }
        });
        sqlCon = db;

        db.select({ value: sql`1` });
        logger.info("[Postgres]: Connection established");

        fastify.decorate("db", db);

        fastify.addHook("onClose", async () => {
            await pool.end();
            logger.info("[Postgres]: Connection closed");
        });
    } catch (e) {
        logger.error("[Postgres]: failed to establish database connection. See details:");
        logger.error(e);
        process.exit(1);
    }
});

export default defineConfig({
    out: "./drizzle",
    schema: "./app/common/types/drizzle/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!
    }
});
