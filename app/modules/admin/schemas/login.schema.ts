import type { FastifySchema } from "fastify";
import { z } from "zod";
import { userRegex } from "../../../common/regex/user.regex";

const bodySchema = z.object({
    email: z.string().regex(userRegex.emailRegex),
    password: z.string().nonempty().regex(userRegex.passwordRegex)
});

export const adminLoginFastifySchema: FastifySchema = { body: bodySchema };
export interface IAdminLoginFastifySchema {
    Body: z.infer<typeof bodySchema>;
}
