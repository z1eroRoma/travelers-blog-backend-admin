import { FastifySchema } from "fastify";
import { z } from "zod";

export const paramsSchema = z.object({
    id: z.string().uuid({ message: "Invalid complaint ID format" })
});

export const querySchema = z.object({
    type: z.string().optional()
});

export const rejectComplaintSchema: FastifySchema = {
    params: paramsSchema,
    querystring: querySchema
};

export interface IRejectComplaintFastifySchema {
    Params: z.infer<typeof paramsSchema>;
    Querystring: z.infer<typeof querySchema>;
}
