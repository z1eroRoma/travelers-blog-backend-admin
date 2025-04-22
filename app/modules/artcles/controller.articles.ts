import { MultipartFile } from "@fastify/multipart";
import { FastifyReply, FastifyRequest } from "fastify";
import { promises as fs } from "fs";
import { writeFile } from "fs/promises";
import path from "path";
import { sqlCon } from "../../common/config/drizzle-config";
import type { IHandlingResponseError } from "../../common/config/http-response";
import { aricleStatusEnum } from "../../common/enum/article-status-types";
import { HandlingErrorType } from "../../common/enum/error-types";
import { HttpStatusCode } from "../../common/enum/http-status-code";
import { IUuidFastifySchema } from "../../common/schemas/uuid.schema";
import * as themeRepository from "../theme/repository.theme";
import * as articlesRepository from "./repository.articles";
import { IUpdateArticlesBlockFastifySchema } from "./schemas/update-article-block.schema";
import { IUpdateArticleBlocksPictureFastifySchema } from "./schemas/update-article-blocks-picture.schema";
import { IUpdateArticlesPreviewFastifySchema } from "./schemas/update-articles-preview.schema";
import { IUpdateArticlesFastifySchema } from "./schemas/update-articles.schema";

export async function getUserArticles(req: FastifyRequest, rep: FastifyReply) {
    const userId = req.user.id!;

    const userArticles = await articlesRepository.getByUser(sqlCon, userId);

    return rep.code(HttpStatusCode.OK).send(userArticles);
}

export async function deleteArticles(req: FastifyRequest<IUuidFastifySchema>, rep: FastifyReply) {
    await articlesRepository.updateArticles(sqlCon, req.params.id, { is_deleted: true, deleted_at: new Date() });

    return rep.code(HttpStatusCode.OK).send({ message: "Статья успешно удалёна" });
}

export async function listUnpublishedArticles(req: FastifyRequest, rep: FastifyReply) {
    const userId = req.user.id!;

    const unpublishedArticles = await articlesRepository.findByUnpublishedArticles(sqlCon, userId);

    return rep.code(HttpStatusCode.OK).send(unpublishedArticles);
}

export async function publishedArticles(req: FastifyRequest<IUuidFastifySchema>, rep: FastifyReply) {
    await articlesRepository.updateArticles(sqlCon, req.params.id, { status: aricleStatusEnum["На модерации"] });

    return rep.code(HttpStatusCode.OK).send({ message: "Статья отправлена на модерацию" });
}

export async function deleteUnpublishedArticles(req: FastifyRequest<IUuidFastifySchema>, rep: FastifyReply) {
    await articlesRepository.deleteUnpublishedArticles(sqlCon, req.params.id);

    return rep.code(HttpStatusCode.OK).send({ message: "Статья успешно удалёна" });
}

export async function preValidationUpdateArticlePreview(req: FastifyRequest<IUpdateArticlesPreviewFastifySchema>, rep: FastifyReply) {
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
    const file: MultipartFile | undefined = await req.file();

    if (!file || file.filename === "") {
        const info: IHandlingResponseError = {
            type: HandlingErrorType.Empty,
            property: "preview",
            message: "Файл не загружен"
        };
        return rep.code(HttpStatusCode.UNPROCESSABLE_ENTITY).send(info);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        const info: IHandlingResponseError = {
            type: HandlingErrorType.Allowed,
            property: "preview",
            message: "Допустимые форматы файлов .jpeg, .jpg, .png"
        };
        return rep.code(HttpStatusCode.UNPROCESSABLE_ENTITY).send(info);
    }

    const fileBuffer = await file.toBuffer();

    req.body = {
        preview_filename: file.filename,
        preview: fileBuffer
    };
}

export async function updateArticlePreview(req: FastifyRequest<IUpdateArticlesPreviewFastifySchema>, rep: FastifyReply) {
    const UPLOADS_DIR = process.env.UPLOADS_DIR_PREVIEW_PATH!;
    const articleId = req.params.id;
    const { preview, preview_filename } = req.body;
    const fileName = `${articleId}_${Date.now()}${path.extname(preview_filename || "")}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    await sqlCon.transaction(async (tx) => {
        try {
            await writeFile(filePath, preview!);

            const oldPreview = await articlesRepository.getArticlePreviewById(tx, articleId);

            await articlesRepository.updateArticles(tx, articleId, { preview: fileName });

            if (oldPreview && oldPreview !== "default.png") {
                const oldImagePath = path.join(UPLOADS_DIR, oldPreview);
                const fileExists = await fs
                    .stat(oldImagePath)
                    .then(() => true)
                    .catch(() => false);

                if (fileExists) {
                    await fs.unlink(oldImagePath);
                }
            }

            return rep.code(HttpStatusCode.OK).send({
                message: "Превью успешно обновлено",
                preview: fileName
            });
        } catch (error) {
            await tx.rollback();
            await fs.unlink(filePath).catch(() => {});
            throw error;
        }
    });
}

export async function preValidationUpdateArticleBlockPicture(req: FastifyRequest<IUpdateArticleBlocksPictureFastifySchema>, rep: FastifyReply) {
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
    const file: MultipartFile | undefined = await req.file();

    if (!file || file.filename === "") {
        const info: IHandlingResponseError = {
            type: HandlingErrorType.Empty,
            property: "picture",
            message: "Файл не загружен"
        };
        return rep.code(HttpStatusCode.UNPROCESSABLE_ENTITY).send(info);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        const info: IHandlingResponseError = {
            type: HandlingErrorType.Allowed,
            property: "picture",
            message: "Допустимые форматы файлов .jpeg, .jpg, .png"
        };
        return rep.code(HttpStatusCode.UNPROCESSABLE_ENTITY).send(info);
    }

    const fileBuffer = await file.toBuffer();

    req.body = {
        big_picture_filename: file.filename,
        big_picture: fileBuffer
    };
}

export async function updateArticleBlockPicture(req: FastifyRequest<IUpdateArticleBlocksPictureFastifySchema>, rep: FastifyReply) {
    const UPLOADS_DIR = process.env.UPLOADS_DIR_PICTURE_PATH!;
    const articleBlockId = req.params.id;
    const { big_picture, big_picture_filename } = req.body;
    const fileName = `${articleBlockId}_${Date.now()}${path.extname(big_picture_filename || "")}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    await sqlCon.transaction(async (tx) => {
        try {
            await writeFile(filePath, big_picture!);

            const oldBigPicture = await articlesRepository.getArticleBlockPictureById(sqlCon, articleBlockId);

            await articlesRepository.updateArticleBlock(sqlCon, articleBlockId, { big_picture: fileName });

            if (oldBigPicture && oldBigPicture !== "default.png") {
                const oldImagePath = path.join(UPLOADS_DIR, oldBigPicture);
                const fileExists = await fs
                    .stat(oldImagePath)
                    .then(() => true)
                    .catch(() => false);

                if (fileExists) {
                    await fs.unlink(oldImagePath);
                }
            }

            return rep.code(HttpStatusCode.OK).send({
                message: "Превью успешно обновлено",
                big_picture: fileName
            });
        } catch (error) {
            await tx.rollback();
            await fs.unlink(filePath).catch(() => {});
            throw error;
        }
    });
}

export async function updateArticlesText(req: FastifyRequest<IUpdateArticlesFastifySchema>, rep: FastifyReply) {
    const { id } = req.params;

    const { title, description, location, theme_ids } = req.body;

    type UpdatedArticleType = {
        title?: string;
        description?: string;
        location?: string;
        themes?: string[];
    };

    let updatedArticle: UpdatedArticleType = {};

    if (title || description || location) {
        await articlesRepository.updateArticles(sqlCon, id, { title, description, location });
        updatedArticle = { ...updatedArticle, title, description, location };
    }

    if (theme_ids) {
        await themeRepository.removeArticlesThemes(sqlCon, id);

        const entities = theme_ids.map((theme_id) => ({
            article_id: id,
            theme_id: theme_id
        }));

        await themeRepository.addArticlesThemes(sqlCon, entities);

        updatedArticle = { ...updatedArticle, themes: theme_ids };
    }

    return rep.code(HttpStatusCode.OK).send({
        message: "Статья успешно обновлена",
        updatedArticle: updatedArticle
    });
}

export async function updateArticlesBlockText(req: FastifyRequest<IUpdateArticlesBlockFastifySchema>, rep: FastifyReply) {
    const { id } = req.params;
    const { big_text } = req.body;

    await articlesRepository.updateArticleBlock(sqlCon, id, { big_text });

    return rep.code(HttpStatusCode.OK).send({
        message: "Блок статьи успешно обновлен"
    });
}
