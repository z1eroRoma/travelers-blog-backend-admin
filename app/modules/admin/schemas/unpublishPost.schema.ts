import { FastifySchema } from "fastify";
import { z } from "zod";

export const paramsSchema = z.object({
    id: z.string().uuid({ message: "Invalid post ID format" })
});

export const unpublishPostSchema: FastifySchema = {
    params: paramsSchema
};

export interface IUnpublishPostFastifySchema {
    Params: z.infer<typeof paramsSchema>;
}
