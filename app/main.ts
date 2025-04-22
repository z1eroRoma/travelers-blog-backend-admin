import fastifyAuth from "@fastify/auth";
import { fastifyCors } from "@fastify/cors";
import { fastifyJwt } from "@fastify/jwt";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { fastifySwagger } from "@fastify/swagger";
import { fastifySwaggerUi } from "@fastify/swagger-ui";
import dotenv from "dotenv";
import { fastify, type FastifyInstance } from "fastify";
import path from "node:path";
import { DrizzleConfig } from "./common/config/drizzle-config";
import { globalAuthHook } from "./common/config/global-auth";
import { jwtOption } from "./common/config/jwt";
import { logger } from "./common/config/pino-plugin";
import { AppErrorPipe, ZodValidatorCompiler } from "./common/config/pipe";
import { swaggerOption, swaggerUiOption } from "./common/config/swagger";
import { initDirectories } from "./helpers/init-directories";
import { HttpProvider } from "./modules/_index";

async function app() {
    const app: FastifyInstance = fastify();
    const port: number = Number(process.env.APP_PORT!);
    const host: string = process.env.APP_HOST!;

    app.setValidatorCompiler(ZodValidatorCompiler);
    app.setErrorHandler(AppErrorPipe);
    await app.register(fastifyCors, {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["Content-Disposition"]
    });

    app.register(fastifyAuth);

    app.register(fastifyStatic, {
        root: path.join(process.cwd(), "/uploads"),
        prefix: "/uploads"
    });

    app.register(fastifyMultipart);
    app.register(fastifySwagger, swaggerOption);
    app.register(fastifySwaggerUi, swaggerUiOption);
    await app.register(DrizzleConfig);
    await app.register(fastifyJwt, jwtOption);
    await globalAuthHook(app);
    HttpProvider.forEach((router) => app.register(router.instance, { prefix: router.prefix }));

    app.listen({ host, port }, (e, address) => {
        if (e) {
            logger.info(`[APP] App crashed while starting. Details:`);
            logger.error(e);
            process.exit(1);
        }
        logger.info(`[APP] Server listening on ${address}`);
    });
    await initDirectories();
    dotenv.config();
}

void app();
