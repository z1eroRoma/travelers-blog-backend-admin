import { FastifySchema } from "fastify";
import { z } from "zod";

export const paramsSchema = z.object({
    id: z.string().uuid({ message: "Invalid admin ID format" }),
});

export const deleteAdminSchema: FastifySchema = {
    params: paramsSchema
};

export interface IDeleteAdminFastifySchema {
    Params: z.infer<typeof paramsSchema>;
}
