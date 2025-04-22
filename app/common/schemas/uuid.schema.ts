import type { FastifySchema } from "fastify";
import { z } from "zod";

export const uuidSchema = z.object({
    id: z.string().uuid()
});

export type uuidSchema = z.infer<typeof uuidSchema>;
export const uuidFSchema: FastifySchema = { params: uuidSchema };

export interface IUuidFastifySchema {
    Params: z.infer<typeof uuidSchema>;
}
