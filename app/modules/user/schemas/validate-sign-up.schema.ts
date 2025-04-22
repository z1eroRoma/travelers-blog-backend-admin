import type { FastifySchema } from "fastify";
import { z } from "zod";
import { userRegex } from "../../../common/regex/user.regex";

const bodySchema = z.object({
    email: z.string().regex(userRegex.emailRegex).max(255),
    user_name: z.string().min(4).max(50).regex(userRegex.userNameRegex),
    password: z.string().min(8).max(100).regex(userRegex.passwordRegex),
    real_name: z.string().regex(userRegex.realNameRegex).max(50).optional(),
    description: z.string().max(255).regex(userRegex.descriptionRegex).optional(),
    birth_date: z.string().regex(userRegex.birthDateRegex).optional()
});

export const validateSignUpFastifySchema: FastifySchema = { body: bodySchema };

export interface IValidateSignUpFastifySchema {
    Body: z.infer<typeof bodySchema>;
}
