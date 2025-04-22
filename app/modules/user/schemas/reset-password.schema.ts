import type { FastifySchema } from "fastify";
import { z } from "zod";
import { userRegex } from "../../../common/regex/user.regex";

const bodySchema = z.object({
    email: z.string().regex(userRegex.emailRegex),
    password: z.string().min(8).max(100).regex(userRegex.passwordRegex),
    code: z.string().regex(userRegex.CodeRegex).length(6)
});

export const resetPasswordFastifySchema: FastifySchema = { body: bodySchema };
export interface IResetPasswordFastifySchema {
    Body: z.infer<typeof bodySchema>;
}
