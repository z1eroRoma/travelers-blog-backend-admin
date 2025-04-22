import type { FastifyInstance } from "fastify";
import { uuidFSchema } from "../../common/schemas/uuid.schema";
import * as articlesController from "./controller.articles";
import { preValidationUpdateArticleBlockPicture, preValidationUpdateArticlePreview } from "./controller.articles";
import { updateArticlesBlockFastifySchema } from "./schemas/update-article-block.schema";
import { updateArticleBlocksPictureFastifySchema } from "./schemas/update-article-blocks-picture.schema";
import { updateArticlesPreviewFastifySchema } from "./schemas/update-articles-preview.schema";
import { updateArticlesFastifySchema } from "./schemas/update-articles.schema";

export const articlesRouter = async (app: FastifyInstance) => {
    app.get("/", articlesController.getUserArticles);
    app.delete("/:id", { schema: uuidFSchema }, articlesController.deleteArticles);
    app.get("/unpublished", articlesController.listUnpublishedArticles);
    app.post("/published/:id", { schema: uuidFSchema }, articlesController.publishedArticles);
    app.delete("/unpublished/:id", { schema: uuidFSchema }, articlesController.deleteUnpublishedArticles);
    app.patch("/preview/:id", { schema: updateArticlesPreviewFastifySchema, preValidation: preValidationUpdateArticlePreview }, articlesController.updateArticlePreview);
    app.patch(
        "/block/picture/:id",
        { schema: updateArticleBlocksPictureFastifySchema, preValidation: preValidationUpdateArticleBlockPicture },
        articlesController.updateArticleBlockPicture
    );
    app.patch("/:id", { schema: updateArticlesFastifySchema }, articlesController.updateArticlesText);
    app.patch("/block/:id", { schema: updateArticlesBlockFastifySchema }, articlesController.updateArticlesBlockText);
};
