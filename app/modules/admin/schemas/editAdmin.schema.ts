import { FastifySchema } from "fastify";
import { z } from "zod";

export const bodySchema = z.object({
    id: z.string().uuid({ message: "Invalid admin ID format" }),
    name: z.string().min(1, { message: "Name is required" }),
    surname: z.string().min(1, { message: "Surname is required" }),
    role: z.number().int().min(1, { message: "Role must be a positive integer" }),
});

export const editAdminSchema: FastifySchema = {
    body: bodySchema
};

export interface IEditAdminFastifySchema {
    Body: z.infer<typeof bodySchema>;
}
