import type { FastifySchema } from "fastify";
import { z } from "zod";

const bodySchema = z.object({
    filename: z.string(),
    buffer: z.custom<Buffer>((val) => Buffer.isBuffer(val)).refine((file) => file.length <= 5 * 1024 * 1024)
});

export const updateImageFastifySchema: FastifySchema = { body: bodySchema };

export interface IUpdateImageFastifySchema {
    Body: z.infer<typeof bodySchema>;
}
