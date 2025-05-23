import bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { sqlCon } from "../../common/config/drizzle-config";
import { IHandlingResponseError } from "../../common/config/http-response";
import { sendEmail } from "../../common/config/node-mailer";
import { aricleStatusEnum } from "../../common/enum/article-status-types";
import { ComplaintsStatusEnum } from "../../common/enum/complaints-status-types";
import { HandlingErrorType } from "../../common/enum/error-types";
import { HttpStatusCode } from "../../common/enum/http-status-code";
import { VerifyCodeStatusEnum } from "../../common/enum/verify-code-types";
import { IVerifyCodeFastifySchema } from "../user/schemas/verifyCode.schema";
import * as adminRepository from "./repository.admin";
import { IAddAdminFastifySchema } from "./schemas/AddAdmin.schema";
import { IApproveArticleFastifySchema } from "./schemas/approveArticle.schema";
import { IComplaintsFastifySchema } from "./schemas/complaints.schema";
import { IDeleteAdminFastifySchema } from "./schemas/deleteAdmin.schema";
import { IDeleteCommentFastifySchema } from "./schemas/deleteComment.schema";
import { IEditAdminFastifySchema } from "./schemas/editAdmin.schema";
import { IAdminLoginFastifySchema } from "./schemas/login.schema";
import { IRejectArticleFastifySchema } from "./schemas/rejectArticle.schema";
import { IRejectComplaintFastifySchema } from "./schemas/rejectComplaint.schema";
import { IAdminResetPasswordFastifySchema } from "./schemas/reset-password.schema";
import { ISearchAdminByEmailFastifySchema } from "./schemas/serchAdminByEmail.schema";
import { IUnpublishArticleFastifySchema } from "./schemas/unpublishArticle.schema";
import { IUnpublishPostFastifySchema } from "./schemas/unpublishPost.schema";

type Stored = {
    code: string;
    expires_at: Date;
};
const checkCode = (stored: Stored, adminCode: string) => {
    if (!stored) {
        return { type: HandlingErrorType.Found };
    }

    if (stored.expires_at.getTime() < Date.now()) {
        return { type: HandlingErrorType.Exists };
    }

    if (stored.code !== adminCode) {
        return { type: HandlingErrorType.Match };
    }
    return null;
};

export async function sendResetCode(req: FastifyRequest<IVerifyCodeFastifySchema>, rep: FastifyReply) {
    const admin = await adminRepository.getAdminByEmail(sqlCon, req.body.email);

    if (!admin) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Found, property: "email" };
        return rep.code(HttpStatusCode.NOT_FOUND).send(info);
    }

    const recentCode = await adminRepository.getRecentVerifyCode(sqlCon, req.body.email, new Date(Date.now() - 60 * 1000), VerifyCodeStatusEnum.PASSWORD_RECOVERY);

    if (recentCode) {
        return rep.code(HttpStatusCode.TOO_MANY_REQUESTS).send({ message: "Код был отправлен менее 60 секунд назад" });
    }
    await adminRepository.deleteCode(sqlCon, req.body.email, VerifyCodeStatusEnum.PASSWORD_RECOVERY);

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await adminRepository.insertVerifyCode(sqlCon, {
        email: req.body.email,
        code: code,
        type: VerifyCodeStatusEnum.PASSWORD_RECOVERY
    });
    await sendEmail({
        to: req.body.email,
        subject: "Код сброса пароля",
        text: `Используйте этот код для сброса пароля: ${code}`
    });

    return rep.code(HttpStatusCode.OK).send({ message: "Проверьте свою почту" });
}

const generateJwt = (id: string, email: string) => {
    return jwt.sign({ id, email }, process.env.JWT_SECRET!, { expiresIn: "1h" });
};

export async function loginAdmin(req: FastifyRequest<IAdminLoginFastifySchema>, rep: FastifyReply) {
    const admin = await adminRepository.getAdminByEmail(sqlCon, req.body.email);
    if (!admin) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Found, property: "admin" };
        return rep.code(HttpStatusCode.NOT_FOUND).send(info);
    }
    const isPasswordValid = await bcrypt.compare(req.body.password, admin.password!);
    if (!isPasswordValid) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Found, property: "admin" };
        return rep.code(HttpStatusCode.NOT_FOUND).send(info);
    }
    const token = generateJwt(admin.id, admin.email);

    const data = {
        id: admin.id,
        accessToken: token
    };

    return rep.code(HttpStatusCode.OK).send(data);
}

export async function resetPasswordAdmin(req: FastifyRequest<IAdminResetPasswordFastifySchema>, rep: FastifyReply) {
    const { email, code, password } = req.body;
    const admin = await adminRepository.getAdminByEmail(sqlCon, email);
    if (!admin) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Found, property: "email" };
        return rep.code(HttpStatusCode.NOT_FOUND).send(info);
    }

    const stored = await adminRepository.getVerifyCode(sqlCon, email, VerifyCodeStatusEnum.PASSWORD_RECOVERY);
    const codeErrors = checkCode(stored, code);
    if (codeErrors) {
        const info: IHandlingResponseError = { type: codeErrors.type, property: "code" };
        return rep.code(HttpStatusCode.NOT_FOUND).send(info);
    }
    await adminRepository.deleteCode(sqlCon, req.body.email, VerifyCodeStatusEnum.PASSWORD_RECOVERY);

    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (isPasswordMatch) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Found, property: "password" };
        return rep.code(HttpStatusCode.NOT_FOUND).send(info);
    }
    const hashPassword = await bcrypt.hash(password, 5);
    const updatedAdmin = await adminRepository.updatePassword(sqlCon, email, hashPassword);
    const token = generateJwt(updatedAdmin.id, updatedAdmin.email);

    const data = {
        id: updatedAdmin.id,
        accessToken: token
    };
    return rep.code(HttpStatusCode.OK).send(data);
}

export async function viewArticlesForModeration(_req: FastifyRequest, rep: FastifyReply) {
    const articles = await adminRepository.getArticlesForModeration(sqlCon);
    if (articles.length === 0) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ message: "Статьи на модерацию не найдены" });
    }
    return rep.code(HttpStatusCode.OK).send(articles);
}

export async function viewArticleForModeration(req: FastifyRequest, rep: FastifyReply) {
    const articleId = (req.params as { id: string }).id;
    const article = await adminRepository.getArticleById(sqlCon, articleId);
    if (!article) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ message: "Статья на модерацию не найдена" });
    }
    return rep.code(HttpStatusCode.OK).send(article);
}

export async function approveArticle(req: FastifyRequest<IApproveArticleFastifySchema>, rep: FastifyReply) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded !== "object" || !("id" in decoded)) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "Invalid token" });
    }
    const adminId = decoded.id;
    const articleId = req.params.id;
    const article = await adminRepository.getArticleById(sqlCon, articleId);
    if (!article) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ message: "Статься не найдена" });
    }
    await adminRepository.updateArticleStatus(sqlCon, articleId, aricleStatusEnum["Опубликовано"], adminId);
    return rep.code(HttpStatusCode.OK).send({ message: "Статья одобрена" });
}

export async function rejectArticle(req: FastifyRequest<IRejectArticleFastifySchema>, rep: FastifyReply) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded !== "object" || !("id" in decoded)) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "Invalid token" });
    }
    const adminId = decoded.id;
    const articleId = req.params.id;
    const article = await adminRepository.getArticleById(sqlCon, articleId);
    if (!article) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ message: "Статья не найдена" });
    }
    await adminRepository.updateArticleStatus(sqlCon, articleId, aricleStatusEnum["Отклонено"], adminId);
    return rep.code(HttpStatusCode.OK).send({ message: "Статья отклонена" });
}

export async function viewComplaints(req: FastifyRequest<IComplaintsFastifySchema>, rep: FastifyReply) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded !== "object" || !("id" in decoded)) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "Invalid token" });
    }
    const type = req.query.type;
    if (type === "post") {
        return await viewPostComplaints(req, rep);
    } else if (type === "article") {
        return await viewArticleComplaints(req, rep);
    } else if (type === "commentArticle") {
        return await viewCommentArticleComplaints(req, rep);
    } else if (type === "commentPost") {
        return await viewCommentPostComplaints(req, rep);
    } else {
        return await viewAllComplaints(req, rep);
    }
}

export async function viewAllComplaints(_req: FastifyRequest, rep: FastifyReply) {
    const allComplaints = await adminRepository.getAllComplaints(sqlCon);
    if (allComplaints.length === 0) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ message: "Жалобы не найдены" });
    }
    return rep.code(HttpStatusCode.OK).send(allComplaints);
}

export async function viewPostComplaints(_req: FastifyRequest, rep: FastifyReply) {
    const complaints = await adminRepository.getPostComplaints(sqlCon);
    if (complaints.length === 0) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ message: "Жалобы на посты не найдены" });
    }
    return rep.code(HttpStatusCode.OK).send(complaints);
}

export async function viewArticleComplaints(_req: FastifyRequest, rep: FastifyReply) {
    const complaints = await adminRepository.getArticleComplaints(sqlCon);
    if (complaints.length === 0) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ message: "Жалобы на статьи не найдены" });
    }
    return rep.code(HttpStatusCode.OK).send(complaints);
}

export async function viewCommentArticleComplaints(_req: FastifyRequest, rep: FastifyReply) {
    const complaints = await adminRepository.getCommentArticleComplaints(sqlCon);
    if (complaints.length === 0) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ message: "Жалобы на комментарии к статьям не найдены" });
    }
    return rep.code(HttpStatusCode.OK).send(complaints);
}

export async function viewCommentPostComplaints(_req: FastifyRequest, rep: FastifyReply) {
    const complaints = await adminRepository.getCommentPostComplaints(sqlCon);
    if (complaints.length === 0) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ message: "Жалобы на комментарии к постам не найдены" });
    }
    return rep.code(HttpStatusCode.OK).send(complaints);
}

export async function unpublishArticle(req: FastifyRequest<IUnpublishArticleFastifySchema>, rep: FastifyReply) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded !== "object" || !("id" in decoded)) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "Invalid token" });
    }
    const articleId = req.params.id;
    const article = await adminRepository.getArticleById(sqlCon, articleId);
    if (!article) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ message: "Статья не найдена" });
    }
    if (article.status !== 3) {
        return rep.code(HttpStatusCode.BAD_REQUEST).send({ message: "Статья не опубликована" });
    }
    await adminRepository.updateArticleStatus(sqlCon, articleId, 4, decoded.id);
    return rep.code(HttpStatusCode.OK).send({ message: "Статья снята с публикации" });
}

export async function unpublishPost(req: FastifyRequest<IUnpublishPostFastifySchema>, rep: FastifyReply) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded !== "object" || !("id" in decoded)) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "Invalid token" });
    }
    const postId = req.params.id;
    const post = await adminRepository.getPostById(sqlCon, postId);
    if (!post) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ message: "Пост не найден" });
    }
    if (!post.status) {
        return rep.code(HttpStatusCode.BAD_REQUEST).send({ message: "Пост не опубликован" });
    }
    await adminRepository.updatePostStatus(sqlCon, postId, false, decoded.id);
    return rep.code(HttpStatusCode.OK).send({ message: "Пост снят с публикации" });
}

export async function deleteComplaints(req: FastifyRequest<IRejectComplaintFastifySchema>, rep: FastifyReply) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded !== "object" || !("id" in decoded)) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "Invalid token" });
    }
    const complaintId = req.params.id;
    const type = req.query.type;
    if (type === "post") {
        await adminRepository.updatePostComplaintStatus(sqlCon, complaintId, ComplaintsStatusEnum["Отклонена"], decoded.id);
    } else if (type === "article") {
        await adminRepository.updateArticleComplaintStatus(sqlCon, complaintId, ComplaintsStatusEnum["Отклонена"], decoded.id);
    } else if (type === "commentArticle") {
        await adminRepository.updateCommentArticleComplaintStatus(sqlCon, complaintId, ComplaintsStatusEnum["Отклонена"], decoded.id);
    } else if (type === "commentPost") {
        await adminRepository.updateCommentPostComplaintStatus(sqlCon, complaintId, ComplaintsStatusEnum["Отклонена"], decoded.id);
    } else {
        return rep.code(HttpStatusCode.BAD_REQUEST).send({ message: "Invalid complaint type" });
    }
    return rep.code(HttpStatusCode.OK).send({ message: "Жалоба отклонена" });
}

export async function deleteComment(req: FastifyRequest<IDeleteCommentFastifySchema>, rep: FastifyReply) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded !== "object" || !("id" in decoded)) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "Invalid token" });
    }
    const commentId = req.params.id;
    const type = req.query.type;
    if (type === "article") {
        await adminRepository.deleteArticleComment(sqlCon, commentId, decoded.id);
    } else if (type === "post") {
        await adminRepository.deletePostComment(sqlCon, commentId, decoded.id);
    } else {
        return rep.code(HttpStatusCode.BAD_REQUEST).send({ message: "Invalid comment type" });
    }
    return rep.code(HttpStatusCode.OK).send({ message: "Комментарий удален" });
}

export async function addAdmin(req: FastifyRequest<IAddAdminFastifySchema>, rep: FastifyReply) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded !== "object" || !("id" in decoded)) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "Invalid token" });
    }
    const isSuperAdmin = await adminRepository.isSuperAdmin(sqlCon, decoded.id);
    if (!isSuperAdmin) {
        return rep.code(HttpStatusCode.FORBIDDEN).send({ message: "Only super admin can add new admins" });
    }
    const { email, name, surname, role } = req.body;
    const existingAdmin = await adminRepository.getAdminByEmail(sqlCon, email);
    if (existingAdmin) {
        return rep.code(HttpStatusCode.BAD_REQUEST).send({ message: "Admin with this email already exists" });
    }
    await adminRepository.addNewAdmin(sqlCon, email, name, surname, role);
    return rep.code(HttpStatusCode.CREATED).send({ message: "Admin successfully added" });
}

export async function viewAdmins(req: FastifyRequest, rep: FastifyReply) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded !== "object" || !("id" in decoded)) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "Invalid token" });
    }
    const admins = await adminRepository.getAllAdmins(sqlCon);
    if (admins.length === 0) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ message: "Admins not found" });
    }

    return rep.code(HttpStatusCode.OK).send(admins);
}

export async function editAdmin(req: FastifyRequest<IEditAdminFastifySchema>, rep: FastifyReply) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded !== "object" || !("id" in decoded)) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "Invalid token" });
    }
    const isSuperAdmin = await adminRepository.isSuperAdmin(sqlCon, decoded.id);
    if (!isSuperAdmin) {
        return rep.code(HttpStatusCode.FORBIDDEN).send({ message: "Only super admin can edit admins" });
    }
    const { id, name, surname, role } = req.body;
    const existingAdmin = await adminRepository.getAdminById(sqlCon, id);
    if (!existingAdmin) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ message: "Admin not found" });
    }
    await adminRepository.updateAdmin(sqlCon, id, name, surname, role);
    return rep.code(HttpStatusCode.OK).send({ message: "Admin successfully updated" });
}

export async function deleteAdmin(req: FastifyRequest<IDeleteAdminFastifySchema>, rep: FastifyReply) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded !== "object" || !("id" in decoded)) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "Invalid token" });
    }
    const isSuperAdmin = await adminRepository.isSuperAdmin(sqlCon, decoded.id);
    if (!isSuperAdmin) {
        return rep.code(HttpStatusCode.FORBIDDEN).send({ message: "Only super admin can delete admins" });
    }
    const adminId = req.params.id;
    const existingAdmin = await adminRepository.getAdminById(sqlCon, adminId);
    if (!existingAdmin) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ message: "Admin not found" });
    }
    await adminRepository.deleteAdmin(sqlCon, adminId);
    return rep.code(HttpStatusCode.OK).send({ message: "Admin successfully deleted" });
}

export async function searchAdminByEmail(req: FastifyRequest<ISearchAdminByEmailFastifySchema>, rep: FastifyReply) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded !== "object" || !("id" in decoded)) {
        return rep.code(HttpStatusCode.UNAUTHORIZED).send({ message: "Invalid token" });
    }
    const isSuperAdmin = await adminRepository.isSuperAdmin(sqlCon, decoded.id);
    if (!isSuperAdmin) {
        return rep.code(HttpStatusCode.FORBIDDEN).send({ message: "Only super admin can search admins by email" });
    }
    const email = req.query.email;
    const admin = await adminRepository.getAdminByEmail(sqlCon, email);
    if (!admin) {
        return rep.code(HttpStatusCode.NOT_FOUND).send({ message: "Admin not found" });
    }
    return rep.code(HttpStatusCode.OK).send(admin);
}
