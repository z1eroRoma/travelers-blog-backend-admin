import { FastifyRequest } from "fastify";
import { AccessDeniedError } from "../../common/exceptions/accessDeniedError.guard";
import * as repositoryGuards from "./repository.guard";

export async function isNotDeleted(req: FastifyRequest) {
    const userId = req.user.id!;

    const user = await repositoryGuards.findIsDeleted(userId);

    if (user?.is_deleted) {
        throw new AccessDeniedError();
    }
}
