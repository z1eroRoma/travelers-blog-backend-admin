import type { FastifySchema } from "fastify";
import { z } from "zod";
import { uuidSchema } from "../../../common/schemas/uuid.schema";

export const bodySchema = z.object({
    preview_filename: z.string().optional(),
    preview: z
        .custom<Buffer>((val) => Buffer.isBuffer(val))
        .refine((file) => file.length <= 5 * 1024 * 1024)
        .optional()
});

export const updateArticlesPreviewFastifySchema: FastifySchema = { params: uuidSchema, body: bodySchema };

export interface IUpdateArticlesPreviewFastifySchema {
    Body: z.infer<typeof bodySchema>;
    Params: z.infer<typeof uuidSchema>;
}
