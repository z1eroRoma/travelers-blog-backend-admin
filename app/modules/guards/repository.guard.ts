import { eq } from "drizzle-orm";
import { sqlCon } from "../../common/config/drizzle-config";
import { users } from "../../common/types/drizzle/schema";

export async function findIsDeleted(userId: string) {
    return sqlCon.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { is_deleted: true }
    });
}
