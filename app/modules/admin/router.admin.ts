import type { FastifyInstance } from "fastify";
import { resetPasswordFastifySchema } from "../user/schemas/reset-password.schema";
import { verifyCodeFastifySchema } from "../user/schemas/verifyCode.schema";
import * as adminController from "./controller.admin";
import { approveArticleSchema } from "./schemas/approveArticle.schema";
import { complaintsSchema } from "./schemas/complaints.schema";
import { adminLoginFastifySchema } from "./schemas/login.schema";
import { rejectArticleSchema } from "./schemas/rejectArticle.schema";
import { unpublishArticleSchema } from "./schemas/unpublishArticle.schema";
import { unpublishPostSchema } from "./schemas/unpublishPost.schema";

export const adminRouter = async (app: FastifyInstance) => {
    app.post("/login", { schema: adminLoginFastifySchema, config: { isPublic: true } }, adminController.loginAdmin);
    app.post("/send-reset-code", { schema: verifyCodeFastifySchema, config: { isPublic: true } }, adminController.sendResetCode);
    app.post("/reset-password", { schema: resetPasswordFastifySchema, config: { isPublic: true } }, adminController.resetPasswordAdmin);
    app.get("/articles/moderation", adminController.viewArticlesForModeration);
    app.get("/articles/moderation/:id", adminController.viewArticleForModeration);
    app.post("/articles/moderation/:id/approve", { schema: approveArticleSchema }, adminController.approveArticle);
    app.post("/articles/moderation/:id/reject", { schema: rejectArticleSchema }, adminController.rejectArticle);
    app.get("/complaints", { schema: complaintsSchema }, adminController.viewComplaints);
    app.get("/complaints/articles", adminController.viewArticleComplaints);
    app.get("/complaints/posts", adminController.viewPostComplaints);
    app.get("/complaints/commentArticle", adminController.viewCommentArticleComplaints);
    app.get("/complaints/commentPost", adminController.viewCommentPostComplaints);
    app.post("/articles/:id/unpublish", { schema: unpublishArticleSchema }, adminController.unpublishArticle);
    app.post("/posts/:id/unpublish", { schema: unpublishPostSchema }, adminController.unpublishPost);
};
