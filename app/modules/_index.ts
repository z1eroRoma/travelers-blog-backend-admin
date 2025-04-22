import type { FastifyInstance } from "fastify";
import { adminRouter } from "./admin/router.admin";
import { articlesRouter } from "./artcles/router.articles";
import { themeRouter } from "./theme/router.theme";
import { userRouter } from "./user/router.user";

interface IProvider {
    instance: (app: FastifyInstance) => Promise<void>;
    prefix: string;
}

export const HttpProvider: IProvider[] = [
    { instance: userRouter, prefix: "user" },
    { instance: themeRouter, prefix: "theme" },
    { instance: adminRouter, prefix: "admin" },
    { instance: articlesRouter, prefix: "articles" }
];
