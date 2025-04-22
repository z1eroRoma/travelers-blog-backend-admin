import type { FastifySchema } from "fastify";
import { z } from "zod";
import { articleRegex } from "../../../common/regex/articles.regex";
import { uuidSchema } from "../../../common/schemas/uuid.schema";

export const bodySchema = z.object({
    title: z.string().regex(articleRegex.titleRegex).max(124).optional(),
    description: z.string().regex(articleRegex.descriptionRegex).max(1024).optional(),
    location: z.string().regex(articleRegex.locationRegex).min(2).max(255).optional(),
    theme_ids: z.string().uuid().array().max(5).optional()
});

export const updateArticlesFastifySchema: FastifySchema = { params: uuidSchema, body: bodySchema };

export interface IUpdateArticlesFastifySchema {
    Body: z.infer<typeof bodySchema>;
    Params: z.infer<typeof uuidSchema>;
}
