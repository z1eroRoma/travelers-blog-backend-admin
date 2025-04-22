import type { FastifySchema } from "fastify";
import { z } from "zod";
import { userRegex } from "../../../common/regex/user.regex";

export const bodySchema = z.object({
    real_name: z.string().regex(userRegex.realNameRegex).max(255).optional(),
    description: z.string().max(1024).regex(userRegex.descriptionRegex).optional(),
    birth_date: z.string().regex(userRegex.birthDateRegex).optional()
});

export const updatePersonalAccountFastifySchema: FastifySchema = { body: bodySchema };

export interface IUpdatePersonalAccountFastifySchema {
    Body: z.infer<typeof bodySchema>;
}
