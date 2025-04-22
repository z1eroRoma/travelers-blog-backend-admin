import { FastifySchema } from "fastify";
import { z } from "zod";

export const bodySchema = z.object({
    id: z.string(),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
    name: z.string(),
    surname: z.string(),
    role: z.number()
});

export const adminSchemaType: FastifySchema = { body: bodySchema };
export interface IAdminFastifySchema {
    Body: z.infer<typeof bodySchema>;
}
