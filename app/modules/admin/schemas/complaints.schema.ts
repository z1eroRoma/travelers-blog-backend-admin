import { FastifySchema } from "fastify";
import { z } from "zod";

export const querySchema = z.object({
    type: z.string().optional()
});

export const complaintsSchema: FastifySchema = {
    querystring: querySchema
};

export interface IComplaintsFastifySchema {
    Querystring: z.infer<typeof querySchema>;
}
