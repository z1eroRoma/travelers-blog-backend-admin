import type { FastifySchema } from "fastify";
import { z } from "zod";
import { uuidSchema } from "../../../common/schemas/uuid.schema";

export const bodySchema = z.object({
    big_picture_filename: z.string().optional(),
    big_picture: z
        .custom<Buffer>((val) => Buffer.isBuffer(val))
        .refine((file) => file.length <= 8 * 1024 * 1024)
        .optional()
});

export const updateArticleBlocksPictureFastifySchema: FastifySchema = { params: uuidSchema, body: bodySchema };

export interface IUpdateArticleBlocksPictureFastifySchema {
    Body: z.infer<typeof bodySchema>;
    Params: z.infer<typeof uuidSchema>;
}
