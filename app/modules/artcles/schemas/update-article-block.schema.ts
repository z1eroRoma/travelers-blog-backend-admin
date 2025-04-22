import type { FastifySchema } from "fastify";
import { z } from "zod";
import { articleRegex } from "../../../common/regex/articles.regex";
import { uuidSchema } from "../../../common/schemas/uuid.schema";

export const bodySchema = z.object({
    big_text: z.string().regex(articleRegex.bigTextRegex).optional()
});

export const updateArticlesBlockFastifySchema: FastifySchema = { params: uuidSchema, body: bodySchema };

export interface IUpdateArticlesBlockFastifySchema {
    Body: z.infer<typeof bodySchema>;
    Params: z.infer<typeof uuidSchema>;
}
