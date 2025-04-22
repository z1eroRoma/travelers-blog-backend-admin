import type { FastifyInstance } from "fastify";
import * as themeController from "./controller.theme";

export const themeRouter = async (app: FastifyInstance) => {
    app.get("/", { config: { isPublic: true } }, themeController.get);
};
