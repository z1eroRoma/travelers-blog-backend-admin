import type { FastifySchema } from "fastify";
import { z } from "zod";
import { userRegex } from "../../../common/regex/user.regex";

const bodySchema = z.object({
    email: z.string().regex(userRegex.emailRegex),
    password: z.string().nonempty().regex(userRegex.passwordRegex)
});

export const loginFastifySchema: FastifySchema = { body: bodySchema };
export interface ILoginFastifySchema {
    Body: z.infer<typeof bodySchema>;
}
