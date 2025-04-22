import type { FastifySchema } from "fastify";
import { z } from "zod";
import { userRegex } from "../../../common/regex/user.regex";

export const bodySchema = z.object({
    old_password: z.string().min(8).max(100),
    new_password: z.string().min(8).max(100).regex(userRegex.passwordRegex)
});

export const updatePasswordPersonalAccountFastifySchema: FastifySchema = { body: bodySchema };

export interface IUpdatePasswordPersonalAccountFastifySchema {
    Body: z.infer<typeof bodySchema>;
}
