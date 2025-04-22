import type { FastifyReply, FastifyRequest } from "fastify";
import { sqlCon } from "../../common/config/drizzle-config";
import { HttpStatusCode } from "../../common/enum/http-status-code";
import * as themeRepository from "./repository.theme";

export async function get(_req: FastifyRequest, rep: FastifyReply) {
    const data = await themeRepository.getThemes(sqlCon);

    return rep.code(HttpStatusCode.OK).send(data);
}
