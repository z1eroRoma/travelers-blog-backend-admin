import { and, eq, inArray, InferInsertModel, sql } from "drizzle-orm";
import { DbConnection } from "../../common/config/drizzle-config";
import { aricleStatusEnum } from "../../common/enum/article-status-types";
import { article_blocks, article_likes, articles, users } from "../../common/types/drizzle/schema";

type InsertArticlesType = InferInsertModel<typeof articles>;
type InsertArticleBlockType = InferInsertModel<typeof article_blocks>;
export async function getByUser(con: DbConnection, userId: string) {
    const result = await con
        .select({
            user_image: users.image,
            user_name: users.user_name,
            created_at: articles.created_at,
            location: articles.location,
            preview: articles.preview,
            title: articles.title,
            description: articles.description,
            likes_count: sql`
                (SELECT COALESCE(COUNT(DISTINCT al.user_id), 0) 
                 FROM article_likes al 
                 WHERE al.article_id = articles.id)
            `.as("likes_count")
        })
        .from(articles)
        .leftJoin(users, eq(users.id, articles.creator_id))
        .where(eq(articles.creator_id, userId));

    return result;
}

export async function updateArticles(con: DbConnection, id: string, data: Partial<InsertArticlesType>) {
    await con.update(articles).set(data).where(eq(articles.id, id));
}

export async function findByUnpublishedArticles(con: DbConnection, userId: string) {
    const result = await con
        .select({
            user_image: users.image,
            user_name: users.user_name,
            location: articles.location,
            status: articles.status,
            preview: articles.preview,
            title: articles.title,
            description: articles.description
        })
        .from(articles)
        .leftJoin(users, eq(users.id, articles.creator_id))
        .leftJoin(article_likes, eq(article_likes.article_id, articles.id))
        .where(
            and(
                eq(users.id, userId),
                inArray(articles.status, [aricleStatusEnum["Отклонено"], aricleStatusEnum["Черновик"], aricleStatusEnum["На модерации"]]),
                eq(articles.is_deleted, false)
            )
        );

    return result;
}

export async function deleteUnpublishedArticles(con: DbConnection, id: string) {
    await con.delete(articles).where(eq(articles.id, id));
}

export async function getArticlePreviewById(con: DbConnection, articleId: string): Promise<string | null> {
    const result = await con
        .select({ preview: articles.preview })
        .from(articles)
        .where(eq(articles.id, articleId))
        .then((res) => res[0]?.preview);

    return result || null;
}

export async function updateArticleBlock(con: DbConnection, id: string, data: Partial<InsertArticleBlockType>) {
    await con.update(article_blocks).set(data).where(eq(article_blocks.id, id));
}

export async function getArticleBlockPictureById(con: DbConnection, articleBlockId: string): Promise<string | null> {
    const result = await con
        .select({ picture: article_blocks.big_picture })
        .from(article_blocks)
        .where(eq(article_blocks.id, articleBlockId))
        .then((res) => res[0]?.picture);

    return result || null;
}
