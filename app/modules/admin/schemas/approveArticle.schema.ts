import { FastifySchema } from "fastify";
import { z } from "zod";

export const paramsSchema = z.object({
    id: z.string()
});

export const approveArticleSchema: FastifySchema = { params: paramsSchema };
export interface IApproveArticleFastifySchema {
    Params: z.infer<typeof paramsSchema>;
}
