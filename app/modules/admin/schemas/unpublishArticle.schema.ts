import { FastifySchema } from "fastify";
import { z } from "zod";

export const paramsSchema = z.object({
    id: z.string().uuid({ message: "Invalid article ID format" })
});

export const unpublishArticleSchema: FastifySchema = {
    params: paramsSchema
};

export interface IUnpublishArticleFastifySchema {
    Params: z.infer<typeof paramsSchema>;
}
