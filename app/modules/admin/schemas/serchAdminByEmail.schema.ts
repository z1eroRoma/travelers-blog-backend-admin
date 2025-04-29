import { FastifySchema } from "fastify";
import { z } from "zod";

export const querySchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export const searchAdminByEmailSchema: FastifySchema = {
  querystring: querySchema,
};

export interface ISearchAdminByEmailFastifySchema {
  Querystring: z.infer<typeof querySchema>;
}
