import { and, eq, gte, InferInsertModel } from "drizzle-orm";
import { DbConnection } from "../../common/config/drizzle-config";
import { aricleStatusEnum } from "../../common/enum/article-status-types";
import { ComplaintsStatusEnum } from "../../common/enum/complaints-status-types";
import { VerifyCodeStatusEnum } from "../../common/enum/verify-code-types";
import {
    admins,
    article_comments,
    article_comments_complaints,
    article_complaints,
    articles,
    post_comments,
    post_comments_complaints,
    post_complaints,
    posts,
    verification_codes
} from "../../common/types/drizzle/schema";

type InsertCodeType = InferInsertModel<typeof verification_codes>;

export async function getAdminByEmail(con: DbConnection, email: string) {
    return con.query.admins.findFirst({ where: eq(admins.email, email) });
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
        .update(admins)
        .set({
            password: hashPassword
        })
        .where(eq(admins.email, email))
        .returning()
        .then((result) => result[0]);
}

export async function getArticlesForModeration(con: DbConnection) {
    return con
        .select()
        .from(articles)
        .where(eq(articles.status, 1))
        .then((result) => result);
}

export async function getArticleById(con: DbConnection, articleId: string) {
    return con
        .select()
        .from(articles)
        .where(eq(articles.id, articleId))
        .then((result) => result[0]);
}

export async function updateArticleStatus(con: DbConnection, articleId: string, status: aricleStatusEnum, adminId: string, reason?: string) {
    const updateData = {
        status: status,
        adminId: adminId,
        reason: reason || null
    };
    return con.update(articles).set(updateData).where(eq(articles.id, articleId)).execute();
}

export async function getArticleComplaints(con: DbConnection) {
    return con.select().from(article_complaints).execute();
}

export async function getPostComplaints(con: DbConnection) {
    return con.select().from(post_complaints).execute();
}
export async function getCommentArticleComplaints(con: DbConnection) {
    return con.select().from(article_comments_complaints).execute();
}

export async function getCommentPostComplaints(con: DbConnection) {
    return con.select().from(post_comments_complaints).execute();
}

export async function getAllComplaints(con: DbConnection) {
    const articleComplaints = await con.select().from(article_complaints).execute();
    const postComplaints = await con.select().from(post_complaints).execute();
    const commentArticleComplaints = await con.select().from(article_comments_complaints).execute();
    const commentPostComplaints = await con.select().from(post_comments_complaints).execute();
    return [...articleComplaints, ...postComplaints, ...commentArticleComplaints, ...commentPostComplaints];
}

export async function getPostById(con: DbConnection, postId: string) {
    return con
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .then((result) => result[0]);
}

export async function updatePostStatus(con: DbConnection, postId: string, status: boolean, adminId: string) {
    const updateData = {
        status: status,
        adminId: adminId
    };
    return con.update(posts).set(updateData).where(eq(posts.id, postId)).execute();
}

export async function updatePostComplaintStatus(con: DbConnection, complaintId: string, status: ComplaintsStatusEnum, adminId: string) {
    const updateData = {
        status: status,
        adminId: adminId
    };
    return con.update(post_complaints).set(updateData).where(eq(post_complaints.id, complaintId)).execute();
}

export async function updateArticleComplaintStatus(con: DbConnection, complaintId: string, status: ComplaintsStatusEnum, adminId: string) {
    const updateData = {
        status: status,
        adminId: adminId
    };
    return con.update(article_complaints).set(updateData).where(eq(article_complaints.id, complaintId)).execute();
}

export async function updateCommentArticleComplaintStatus(con: DbConnection, complaintId: string, status: ComplaintsStatusEnum, adminId: string) {
    const updateData = {
        status: status,
        adminId: adminId
    };
    return con.update(article_comments_complaints).set(updateData).where(eq(article_comments_complaints.id, complaintId)).execute();
}

export async function updateCommentPostComplaintStatus(con: DbConnection, complaintId: string, status: ComplaintsStatusEnum, adminId: string) {
    const updateData = {
        status: status,
        adminId: adminId
    };
    return con.update(post_comments_complaints).set(updateData).where(eq(post_comments_complaints.id, complaintId)).execute();
}

export async function deleteArticleComment(con: DbConnection, commentId: string, adminId: string) {
    await con.delete(article_comments).where(eq(article_comments.id, commentId)).execute();
    const updateData = {
        status: ComplaintsStatusEnum["Отклонена"],
        adminId: adminId
    };
    return con.update(article_comments_complaints).set(updateData).where(eq(article_comments_complaints.article_comment_id, commentId)).execute();
}

export async function deletePostComment(con: DbConnection, commentId: string, adminId: string) {
    await con.delete(post_comments).where(eq(post_comments.id, commentId)).execute();
    const updateData = {
        status: ComplaintsStatusEnum["Отклонена"],
        adminId: adminId
    };
    return con.update(post_comments_complaints).set(updateData).where(eq(post_comments_complaints.post_comment_id, commentId)).execute();
}

export async function isSuperAdmin(con: DbConnection, adminId: string) {
    const result = await con
        .select()
        .from(admins)
        .where(and(eq(admins.id, adminId), eq(admins.role, 1)));
    return result.length > 0;
}

export async function addNewAdmin(con: DbConnection, email: string, name: string, surname: string, role: number, password: string) {
    const insertData = {
        email,
        name,
        surname,
        role,
        password
    };
    return con.insert(admins).values(insertData).execute();
}

export async function getAllAdmins(con: DbConnection) {
    return con.select().from(admins).execute();
}

export async function getAdminById(con: DbConnection, adminId: string) {
    return con
        .select()
        .from(admins)
        .where(eq(admins.id, adminId))
        .then((result) => result[0]);
}

export async function updateAdmin(con: DbConnection, adminId: string, name: string, surname: string, role: number) {
    const updateData = {
        name,
        surname,
        role
    };
    return con.update(admins).set(updateData).where(eq(admins.id, adminId)).execute();
}

export async function deleteAdmin(con: DbConnection, adminId: string) {
    return con.delete(admins).where(eq(admins.id, adminId)).execute();
}
