import { FastifySchema } from "fastify";
import { z } from "zod";

export const paramsSchema = z.object({
    id: z.string()
});

export const bodySchema = z.object({
    reason: z.string()
});

export const rejectArticleSchema: FastifySchema = { params: paramsSchema, body: bodySchema };
export interface IRejectArticleFastifySchema {
    Params: z.infer<typeof paramsSchema>;
    Body: z.infer<typeof bodySchema>;
}
