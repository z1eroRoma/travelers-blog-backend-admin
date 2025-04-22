import { promises as fs } from "fs";
import path from "path";

import dotenv from "dotenv";
import { logger } from "../common/config/pino-plugin";
dotenv.config();

const UPLOADS_DIR = path.join(__dirname, "..", "..", process.env.UPLOADS_DIR_PATH || "uploads/avatars");
const UPLOADS_PREVIEW_DIR = path.join(__dirname, "..", "..", process.env.UPLOADS_DIR_PREVIEW_PATH || "uploads/preview");
const UPLOADS_PICTURE_DIR = path.join(__dirname, "..", "..", process.env.UPLOADS_DIR_PICTURE_PATH || "uploads/picture");

export async function initDirectories() {
    try {
        await fs.stat(UPLOADS_DIR);
        logger.info(`Directory already exists: ${UPLOADS_DIR}`);
        await fs.stat(UPLOADS_PREVIEW_DIR);
        logger.info(`Directory already exists: ${UPLOADS_PREVIEW_DIR}`);
        await fs.stat(UPLOADS_PICTURE_DIR);
        logger.info(`Directory already exists: ${UPLOADS_PICTURE_DIR}`);
    } catch {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        logger.info(`Directory created: ${UPLOADS_DIR}`);
        await fs.mkdir(UPLOADS_PREVIEW_DIR, { recursive: true });
        logger.info(`Directory created: ${UPLOADS_PREVIEW_DIR}`);
        await fs.mkdir(UPLOADS_PICTURE_DIR, { recursive: true });
        logger.info(`Directory created: ${UPLOADS_PICTURE_DIR}`);
    }
}
