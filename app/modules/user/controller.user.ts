import { MultipartFile } from "@fastify/multipart";
import bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from "fastify";
import { promises as fs } from "fs";
import { writeFile } from "fs/promises";
import jwt from "jsonwebtoken";
import path from "path";
import { sqlCon } from "../../common/config/drizzle-config";
import type { IHandlingResponseError } from "../../common/config/http-response.ts";
import { sendEmail } from "../../common/config/node-mailer";
import { HandlingErrorType } from "../../common/enum/error-types";
import { HttpStatusCode } from "../../common/enum/http-status-code";
import { VerifyCodeStatusEnum } from "../../common/enum/verify-code-types";
import * as themeRepository from "../theme/repository.theme";
import * as userRepository from "./repository.user";
import { ILoginFastifySchema } from "./schemas/login.schema";
import { IResetPasswordFastifySchema } from "./schemas/reset-password.schema";
import { ISignUpFastifySchema } from "./schemas/sign-up.schema";
import { IUpdateImageFastifySchema } from "./schemas/update-image.schema";
import { IUpdatePasswordPersonalAccountFastifySchema } from "./schemas/update-password-personal-account.schema";
import { IUpdatePersonalAccountFastifySchema } from "./schemas/update-personal-account.schema";
import { IValidateSignUpFastifySchema } from "./schemas/validate-sign-up.schema";
import { IVerifyCodeFastifySchema } from "./schemas/verifyCode.schema";

type Stored = {
    code: string;
    expires_at: Date;
};
const checkCode = (stored: Stored, userCode: string) => {
    if (!stored) {
        return { type: HandlingErrorType.Found };
    }

    if (stored.expires_at.getTime() < Date.now()) {
        return { type: HandlingErrorType.Exists };
    }

    if (stored.code !== userCode) {
        return { type: HandlingErrorType.Match };
    }
    return null;
};
const generateJwt = (id: string, email: string) => {
    return jwt.sign({ id, email }, process.env.JWT_SECRET!, { expiresIn: "7d" });
};

export async function validateSignUp(req: FastifyRequest<IValidateSignUpFastifySchema>, rep: FastifyReply) {
    const userExists = await userRepository.getByEmailOrUserName(sqlCon, req.body.email, req.body.user_name);
    if (userExists) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Unique, property: "user_name||email" };
        return rep.code(HttpStatusCode.CONFLICT).send(info);
    }

    return rep.code(HttpStatusCode.OK).send();
}

export async function sendVerifyCode(req: FastifyRequest<IVerifyCodeFastifySchema>, rep: FastifyReply) {
    const emailExists = await userRepository.getByEmail(sqlCon, req.body.email);

    if (emailExists) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Unique, property: "email" };
        return rep.code(HttpStatusCode.CONFLICT).send(info);
    }

    const recentCode = await userRepository.getRecentVerifyCode(sqlCon, req.body.email, new Date(Date.now() - 60 * 1000), VerifyCodeStatusEnum.EMAIL_VERIFICATION);

    if (recentCode) {
        return rep.code(HttpStatusCode.TOO_MANY_REQUESTS).send({ message: "Код был отправлен менее 60 секунд назад" });
    }
    await userRepository.deleteCode(sqlCon, req.body.email, VerifyCodeStatusEnum.EMAIL_VERIFICATION);

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await userRepository.insertVerifyCode(sqlCon, {
        email: req.body.email,
        code: code,
        type: VerifyCodeStatusEnum.EMAIL_VERIFICATION
    });

    await sendEmail({
        to: req.body.email,
        subject: "Код подтверждения",
        text: `Используйте этот код подтверждения: ${code}`
    });

    return rep.code(HttpStatusCode.OK).send({ message: "Проверьте свою почту" });
}

export async function create(req: FastifyRequest<ISignUpFastifySchema>, rep: FastifyReply) {
    const { user_name, email, code, theme_ids, password } = req.body;
    const userExists = await userRepository.getByEmailOrUserName(sqlCon, email, user_name);
    if (userExists) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Unique, property: "user_name||email" };
        return rep.code(HttpStatusCode.CONFLICT).send(info);
    }

    const stored = await userRepository.getVerifyCode(sqlCon, email, VerifyCodeStatusEnum.EMAIL_VERIFICATION);

    const codeErrors = checkCode(stored, code);
    if (codeErrors) {
        const info: IHandlingResponseError = { type: codeErrors.type, property: "code" };
        return rep.code(HttpStatusCode.NOT_FOUND).send(info);
    }

    const hashPassword = await bcrypt.hash(password, 5);

    const user = {
        ...req.body,
        password: hashPassword
    };
    const themes = await themeRepository.getThemeByIds(sqlCon, theme_ids);

    if (themes.length != theme_ids.length) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Found, property: "theme_id" };
        return rep.code(HttpStatusCode.NOT_FOUND).send(info);
    }
    const insertedUser = await userRepository.insert(sqlCon, user);
    await userRepository.deleteCode(sqlCon, req.body.email, VerifyCodeStatusEnum.EMAIL_VERIFICATION);
    const token = generateJwt(insertedUser.id, insertedUser.email);

    const entities = theme_ids.map((theme_id) => {
        return {
            user_id: insertedUser.id,
            theme_id: theme_id
        };
    });

    await themeRepository.addUserThemes(sqlCon, entities);
    const data = {
        id: insertedUser.id,
        accessToken: token
    };
    return rep.code(HttpStatusCode.OK).send(data);
}

export async function login(req: FastifyRequest<ILoginFastifySchema>, rep: FastifyReply) {
    const user = await userRepository.getByEmail(sqlCon, req.body.email);
    if (!user) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Found, property: "user" };
        return rep.code(HttpStatusCode.NOT_FOUND).send(info);
    }
    const isPasswordValid = await bcrypt.compare(req.body.password, user.password!);
    if (!isPasswordValid) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Found, property: "user" };
        return rep.code(HttpStatusCode.NOT_FOUND).send(info);
    }
    const token = generateJwt(user.id, user.email);

    const data = {
        id: user.id,
        accessToken: token
    };

    return rep.code(HttpStatusCode.OK).send(data);
}

export async function sendResetCode(req: FastifyRequest<IVerifyCodeFastifySchema>, rep: FastifyReply) {
    const user = await userRepository.getByEmail(sqlCon, req.body.email);

    if (!user) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Found, property: "email" };
        return rep.code(HttpStatusCode.NOT_FOUND).send(info);
    }

    const recentCode = await userRepository.getRecentVerifyCode(sqlCon, req.body.email, new Date(Date.now() - 60 * 1000), VerifyCodeStatusEnum.PASSWORD_RECOVERY);

    if (recentCode) {
        return rep.code(HttpStatusCode.TOO_MANY_REQUESTS).send({ message: "Код был отправлен менее 60 секунд назад" });
    }
    await userRepository.deleteCode(sqlCon, req.body.email, VerifyCodeStatusEnum.PASSWORD_RECOVERY);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await userRepository.insertVerifyCode(sqlCon, {
        email: req.body.email,
        code: code,
        type: VerifyCodeStatusEnum.PASSWORD_RECOVERY,
        expires_at: expiresAt
    });
    await sendEmail({
        to: req.body.email,
        subject: "Код сброса пароля",
        text: `Используйте этот код для сброса пароля: ${code}`
    });

    return rep.code(HttpStatusCode.OK).send({ message: "Проверьте свою почту" });
}

export async function resetPassword(req: FastifyRequest<IResetPasswordFastifySchema>, rep: FastifyReply) {
    const { email, code, password } = req.body;
    const user = await userRepository.getByEmail(sqlCon, email);
    const hashPassword = await bcrypt.hash(password, 5);

    if (!user) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Found, property: "email" };
        return rep.code(HttpStatusCode.NOT_FOUND).send(info);
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (isPasswordMatch) {
        const info: IHandlingResponseError = { type: HandlingErrorType.Found, property: "password" };
        return rep.code(HttpStatusCode.CONFLICT).send(info);
    }
    const stored = await userRepository.getVerifyCode(sqlCon, email, VerifyCodeStatusEnum.PASSWORD_RECOVERY);

    const codeErrors = checkCode(stored, code);
    if (codeErrors) {
        const info: IHandlingResponseError = { type: codeErrors.type, property: "code" };
        return rep.code(HttpStatusCode.NOT_FOUND).send(info);
    }
    await userRepository.deleteCode(sqlCon, req.body.email, VerifyCodeStatusEnum.PASSWORD_RECOVERY);

    const updatedUser = await userRepository.updatePassword(sqlCon, email, hashPassword);
    const token = generateJwt(updatedUser.id, updatedUser.email);

    const data = {
        id: updatedUser.id,
        accessToken: token
    };
    return rep.code(HttpStatusCode.OK).send(data);
}

export async function getUserInfo(req: FastifyRequest, rep: FastifyReply) {
    const userId = req.user.id!;

    const userInfo = await userRepository.findById(sqlCon, userId);

    return rep.code(HttpStatusCode.OK).send(userInfo);
}

export async function update(req: FastifyRequest<IUpdatePersonalAccountFastifySchema>, rep: FastifyReply) {
    const userId = req.user.id!;

    await userRepository.update(sqlCon, userId, req.body);

    return rep.code(HttpStatusCode.OK).send({ message: "Профиль успешно обновлён" });
}

export async function changePassword(req: FastifyRequest<IUpdatePasswordPersonalAccountFastifySchema>, rep: FastifyReply) {
    const userId = req.user.id!;
    const { new_password, old_password } = req.body;

    const hashedPassword = await bcrypt.hash(new_password, 5);

    const user = await userRepository.getById(sqlCon, userId);

    const isPasswordCorrect = await bcrypt.compare(old_password, user!.password);
    if (!isPasswordCorrect) {
        return rep.code(HttpStatusCode.BAD_REQUEST).send({ message: "Неверный старый пароль" });
    }

    if (old_password === new_password) {
        return rep.code(HttpStatusCode.BAD_REQUEST).send({ message: "Старый пароль совпадает с новым" });
    }

    await userRepository.update(sqlCon, userId, { password: hashedPassword });
    return rep.code(HttpStatusCode.OK).send({ message: "Пароль успешно изменен" });
}

export async function deleteAccount(req: FastifyRequest, rep: FastifyReply) {
    const userId = req.user.id!;

    await userRepository.update(sqlCon, userId, { is_deleted: true, deleted_at: new Date() });

    return rep.code(HttpStatusCode.OK).send({ message: "Профиль успешно удалён" });
}
export async function preValidationUpdateImage(req: FastifyRequest<IUpdateImageFastifySchema>, rep: FastifyReply) {
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
    const file: MultipartFile | undefined = await req.file();

    if (!file || file.filename === "") {
        const info: IHandlingResponseError = {
            type: HandlingErrorType.Empty,
            property: "file",
            message: "Файл не загружен"
        };
        return rep.code(HttpStatusCode.UNPROCESSABLE_ENTITY).send(info);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        const info: IHandlingResponseError = {
            type: HandlingErrorType.Allowed,
            property: "file",
            message: "Недопустимый формат файла. Разрешены только JPEG и PNG"
        };
        return rep.code(HttpStatusCode.UNPROCESSABLE_ENTITY).send(info);
    }

    const fileBuffer = await file.toBuffer();

    req.body = {
        filename: file.filename,
        buffer: fileBuffer
    };
}

export async function updateImage(req: FastifyRequest<IUpdateImageFastifySchema>, rep: FastifyReply) {
    const UPLOADS_DIR = process.env.UPLOADS_DIR_PATH;
    const userId = req.user.id!;
    const { buffer, filename } = req.body;
    const fileName = `${userId}_${Date.now()}${path.extname(filename)}`;
    const filePath = path.join(UPLOADS_DIR!, fileName);

    await sqlCon.transaction(async (tx) => {
        try {
            await writeFile(filePath, buffer);

            const oldImage = await userRepository.getUserImage(sqlCon, userId);

            await userRepository.update(sqlCon, userId, { image: fileName });

            if (oldImage && oldImage !== "default.png") {
                const oldImagePath = path.join(UPLOADS_DIR!, oldImage);
                const fileExists = await fs
                    .stat(oldImagePath)
                    .then(() => true)
                    .catch(() => false);

                if (fileExists) {
                    await fs.unlink(oldImagePath);
                }
            }

            return rep.code(HttpStatusCode.OK).send({
                message: "Аватар успешно обновлен",
                image: fileName
            });
        } catch (error) {
            await tx.rollback();
            await fs.unlink(filePath).catch(() => {});
            throw error;
        }
    });
}
