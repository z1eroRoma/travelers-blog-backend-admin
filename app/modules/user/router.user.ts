import type { FastifyInstance } from "fastify";
import { isNotDeleted } from "../guards/is-not-deleted.guard";
import * as userController from "./controller.user";
import { preValidationUpdateImage } from "./controller.user";
import { loginFastifySchema } from "./schemas/login.schema";
import { resetPasswordFastifySchema } from "./schemas/reset-password.schema";
import { signUpFastifySchema } from "./schemas/sign-up.schema";
import { updateImageFastifySchema } from "./schemas/update-image.schema";
import { updatePasswordPersonalAccountFastifySchema } from "./schemas/update-password-personal-account.schema";
import { updatePersonalAccountFastifySchema } from "./schemas/update-personal-account.schema";
import { validateSignUpFastifySchema } from "./schemas/validate-sign-up.schema";
import { verifyCodeFastifySchema } from "./schemas/verifyCode.schema";

export const userRouter = async (app: FastifyInstance) => {
    app.post("/validate-sign-up", { schema: validateSignUpFastifySchema, config: { isPublic: true } }, userController.validateSignUp);
    app.post("/send-verify-code", { schema: verifyCodeFastifySchema, config: { isPublic: true } }, userController.sendVerifyCode);
    app.post("/sign-up", { schema: signUpFastifySchema, config: { isPublic: true } }, userController.create);
    app.post("/login", { schema: loginFastifySchema, config: { isPublic: true } }, userController.login);
    app.post("/reset-password", { schema: resetPasswordFastifySchema, config: { isPublic: true } }, userController.resetPassword);
    app.post("/send-reset-code", { schema: verifyCodeFastifySchema, config: { isPublic: true } }, userController.sendResetCode);
    app.get("/", { preHandler: app.auth([isNotDeleted]) }, userController.getUserInfo);
    app.patch("/", { schema: updatePersonalAccountFastifySchema }, userController.update);
    app.patch("/password", { schema: updatePasswordPersonalAccountFastifySchema }, userController.changePassword);
    app.delete("/", userController.deleteAccount);
    app.patch("/image", { schema: updateImageFastifySchema, preValidation: preValidationUpdateImage }, userController.updateImage);
};
