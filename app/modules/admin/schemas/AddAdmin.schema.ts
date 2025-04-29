import { FastifySchema } from "fastify";
import { z } from "zod";

export const bodySchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    name: z.string().min(1, { message: "Name is required" }),
    surname: z.string().min(1, { message: "Surname is required" }),
    role: z.number().int().min(1, { message: "Role must be a positive integer" })
});

export const addAdminSchema: FastifySchema = {
    body: bodySchema
};

export interface IAddAdminFastifySchema {
    Body: z.infer<typeof bodySchema>;
}
