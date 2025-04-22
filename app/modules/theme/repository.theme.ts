import { InferInsertModel, eq, inArray } from "drizzle-orm";
import { DbConnection } from "../../common/config/drizzle-config";
import { article_themes, themes, user_themes } from "../../common/types/drizzle/schema";

type InsertUserThemeType = InferInsertModel<typeof user_themes>;
type InsertArticleThemesType = InferInsertModel<typeof article_themes>;

export async function getThemes(con: DbConnection) {
    return await con.select().from(themes);
}

export async function getThemeByIds(con: DbConnection, ids: string[]) {
    return await con.select().from(themes).where(inArray(themes.id, ids));
}

export async function addUserThemes(con: DbConnection, entity: InsertUserThemeType[]) {
    return await con
        .insert(user_themes)
        .values(entity)
        .returning()
        .then((result) => result[0]);
}

export async function addArticlesThemes(con: DbConnection, entity: InsertArticleThemesType[]) {
    await con.insert(article_themes).values(entity).onConflictDoNothing().returning();
}

export async function removeArticlesThemes(con: DbConnection, articleId: string) {
    await con.delete(article_themes).where(eq(article_themes.article_id, articleId));
}
