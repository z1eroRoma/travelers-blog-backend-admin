import type { FastifySchema } from "fastify";
import { z } from "zod";
import { userRegex } from "../../../common/regex/user.regex";

const bodySchema = z.object({
    email: z.string().regex(userRegex.emailRegex).max(255)
});

export const verifyCodeFastifySchema: FastifySchema = { body: bodySchema };
export interface IVerifyCodeFastifySchema {
    Body: z.infer<typeof bodySchema>;
}
