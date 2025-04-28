import { FastifySchema } from "fastify";
import { z } from "zod";

// Определяем схему для параметров запроса
export const paramsSchema = z.object({
    id: z.string().uuid({ message: "Invalid comment ID format" })
});

export const querySchema = z.object({
    type: z.string().optional()
});

// Создаем Fastify схему
export const deleteCommentSchema: FastifySchema = {
    params: paramsSchema,
    querystring: querySchema
};

// Интерфейс для типизации FastifyRequest
export interface IDeleteCommentFastifySchema {
    Params: z.infer<typeof paramsSchema>;
    Querystring: z.infer<typeof querySchema>;
}
