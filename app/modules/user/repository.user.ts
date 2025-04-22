import { and, eq, gte, InferInsertModel, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { DbConnection } from "../../common/config/drizzle-config";
import { VerifyCodeStatusEnum } from "../../common/enum/verify-code-types";
import { subscriptions, users, verification_codes } from "../../common/types/drizzle/schema";

type InsertUserType = InferInsertModel<typeof users>;
type InsertCodeType = InferInsertModel<typeof verification_codes>;

export async function insert(con: DbConnection, user: InsertUserType) {
    return await con
        .insert(users)
        .values(user)
        .returning()
        .then((result) => result[0]);
}

export async function getByEmail(con: DbConnection, email: string) {
    return await con.query.users.findFirst({
        where: eq(users.email, email)
    });
}
export async function getByEmailOrUserName(con: DbConnection, email: string, user_name: string) {
    return await con
        .select()
        .from(users)
        .where(or(eq(users.email, email), eq(users.user_name, user_name)))
        .then((result) => result[0]);
}
export async function getById(con: DbConnection, id: string) {
    return await con
        .select()
        .from(users)
        .where(eq(users.id, id))
        .then((result) => result[0]);
}

export async function insertVerifyCode(con: DbConnection, code: InsertCodeType) {
    return await con.insert(verification_codes).values(code);
}
export async function getVerifyCode(con: DbConnection, email: string, type: VerifyCodeStatusEnum) {
    return await con
        .select()
        .from(verification_codes)
        .where(and(eq(verification_codes.email, email), eq(verification_codes.type, type)))
        .then((result) => result[0]);
}

export async function getRecentVerifyCode(con: DbConnection, email: string, interval: Date, type: VerifyCodeStatusEnum) {
    return await con
        .select()
        .from(verification_codes)
        .where(and(eq(verification_codes.email, email), gte(verification_codes.created_at, interval), eq(verification_codes.type, type)))
        .then((result) => result[0]);
}
export async function deleteCode(con: DbConnection, email: string, type: VerifyCodeStatusEnum) {
    return await con
        .delete(verification_codes)
        .where(and(eq(verification_codes.email, email), eq(verification_codes.type, type)))
        .execute();
}

export async function updatePassword(con: DbConnection, email: string, hashPassword: string) {
    return await con
        .update(users)
        .set({
            password: hashPassword
        })
        .where(eq(users.email, email))
        .returning()
        .then((result) => result[0]);
}

export async function findById(con: DbConnection, id: string) {
    const subs1 = alias(subscriptions, "subs1");
    const subs2 = alias(subscriptions, "subs2");

    const result = await con
        .select({
            user_image: users.image,
            user_name: users.user_name,
            user_real_name: users.real_name,
            user_description: users.description,
            followers_count: sql`COALESCE(COUNT(DISTINCT ${subs1.follower_id}), 0)`.as("followers_count"),
            following_count: sql`COALESCE(COUNT(DISTINCT ${subs2.following_id}), 0)`.as("following_count")
        })
        .from(users)
        .leftJoin(subs1, eq(subs1.following_id, users.id))
        .leftJoin(subs2, eq(subs2.follower_id, users.id))
        .where(eq(users.id, id))
        .groupBy(users.id, users.image, users.user_name, users.real_name, users.description);

    return result[0];
}

export async function update(con: DbConnection, id: string, data: Partial<InsertUserType>) {
    await con.update(users).set(data).where(eq(users.id, id));
}

export async function getUserImage(con: DbConnection, userId: string): Promise<string | null> {
    const result = await con
        .select({ image: users.image })
        .from(users)
        .where(eq(users.id, userId))
        .then((res) => res[0]?.image);

    return result || null;
}
