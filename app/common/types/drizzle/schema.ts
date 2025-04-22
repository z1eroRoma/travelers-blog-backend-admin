import { sql } from "drizzle-orm";
import { AnyPgColumn, boolean, date, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { aricleEnum } from "../../enum/article-status-types";
import { complaintsReasonEnum } from "../../enum/complaints-reason-types";
import { complaintEnum } from "../../enum/complaints-status-types";
import { roleEnum } from "../../enum/role-types";
import { verifyCodeEnum } from "../../enum/verify-code-types";

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password").notNull(),
    user_name: varchar("user_name", { length: 50 }).notNull().unique(),
    image: varchar("image", { length: 255 }),
    real_name: varchar("real_name", { length: 255 }),
    description: varchar("description", { length: 1024 }),
    birth_date: date("birth_date"),
    is_deleted: boolean().default(false).notNull(),
    deleted_at: timestamp("deleted_at", { withTimezone: true })
});

export const articles = pgTable("articles", {
    id: uuid("id").defaultRandom().primaryKey(),
    creator_id: uuid("creator_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 124 }).notNull(),
    preview: varchar("preview", { length: 255 }),
    description: varchar("description", { length: 1024 }).notNull(),

    location: jsonb("location"), // TODO: поменять формат
    status: aricleEnum("status").notNull(),

    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    is_deleted: boolean().default(false).notNull(),
    deleted_at: timestamp("deleted_at", { withTimezone: true })
});

export const posts = pgTable("posts", {
    id: uuid().defaultRandom().primaryKey(),
    creator_id: uuid("creator_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    text: text("text"),
    location: jsonb("location"), // TODO: поменять формат
    status: boolean("status").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    is_deleted: boolean().default(false).notNull(),
    deleted_at: timestamp("deleted_at", { withTimezone: true })
});

export const themes = pgTable("themes", {
    id: uuid().defaultRandom().primaryKey(),
    title: text("title").notNull()
});

export const favourite_articles = pgTable("favourite_articles", {
    id: uuid().defaultRandom().primaryKey(),
    user_id: uuid()
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    article_id: uuid()
        .references(() => articles.id, { onDelete: "cascade" })
        .notNull()
});

export const subscriptions = pgTable("subscriptions", {
    id: uuid().defaultRandom().primaryKey(),
    follower_id: uuid()
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    following_id: uuid()
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const favourite_posts = pgTable("favourite_posts", {
    id: uuid().defaultRandom().primaryKey(),
    user_id: uuid()
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    post_id: uuid()
        .references(() => posts.id, { onDelete: "cascade" })
        .notNull()
});

export const post_likes = pgTable("post_likes", {
    id: uuid().defaultRandom().primaryKey(),
    user_id: uuid()
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    post_id: uuid()
        .references(() => posts.id, { onDelete: "cascade" })
        .notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const article_blocks = pgTable("article_blocks", {
    id: uuid().defaultRandom().primaryKey(),
    article_id: uuid()
        .references(() => articles.id, { onDelete: "cascade" })
        .notNull(),
    big_picture: varchar("big_picture", { length: 255 }),
    big_text: text("big_text")
});

export const article_likes = pgTable("article_likes", {
    id: uuid().defaultRandom().primaryKey(),
    user_id: uuid()
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    article_id: uuid()
        .references(() => articles.id, { onDelete: "cascade" })
        .notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const post_comments = pgTable("post_comments", {
    id: uuid("id").defaultRandom().primaryKey(),
    text: text("text").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    parent_comment_id: uuid("parent_comment_id").references((): AnyPgColumn => post_comments.id, { onDelete: "cascade" }),
    user_id: uuid()
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    post_id: uuid()
        .references(() => posts.id, { onDelete: "cascade" })
        .notNull(),
    is_deleted: boolean().default(false).notNull(),
    deleted_at: timestamp("deleted_at", { withTimezone: true })
});

export const post_comment_likes = pgTable("post_comment_likes", {
    id: uuid().defaultRandom().primaryKey(),
    user_id: uuid()
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    post_comment_id: uuid()
        .references(() => post_comments.id, { onDelete: "cascade" })
        .notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const article_comments = pgTable("article_comments", {
    id: uuid().defaultRandom().primaryKey(),
    text: text("text").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    parent_comment_id: uuid().references((): AnyPgColumn => article_comments.id, { onDelete: "cascade" }),
    user_id: uuid()
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    article_id: uuid()
        .references(() => articles.id, { onDelete: "cascade" })
        .notNull(),
    is_deleted: boolean().default(false).notNull(),
    deleted_at: timestamp("deleted_at", { withTimezone: true })
});

export const article_comments_likes = pgTable("article_comments_likes", {
    id: uuid().defaultRandom().primaryKey(),
    user_id: uuid()
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    article_comment_id: uuid()
        .references(() => article_comments.id, { onDelete: "cascade" })
        .notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const admins = pgTable("admins", {
    id: uuid().defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    surname: varchar("surname", { length: 100 }).notNull(),
    role: roleEnum("role").notNull()
});

export const user_themes = pgTable("user_themes", {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid()
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    theme_id: uuid()
        .references(() => themes.id, { onDelete: "cascade" })
        .notNull()
});

export const article_themes = pgTable("article_themes", {
    id: uuid("id").defaultRandom().primaryKey(),
    article_id: uuid()
        .references(() => articles.id, { onDelete: "cascade" })
        .notNull(),
    theme_id: uuid()
        .references(() => themes.id, { onDelete: "cascade" })
        .notNull()
});

export const post_themes = pgTable("post_themes", {
    id: uuid("id").defaultRandom().primaryKey(),
    post_id: uuid()
        .references(() => posts.id, { onDelete: "cascade" })
        .notNull(),
    theme_id: uuid()
        .references(() => themes.id, { onDelete: "cascade" })
        .notNull()
});

export const media_posts = pgTable("media_posts", {
    id: uuid("id").defaultRandom().primaryKey(),
    post_id: uuid()
        .references(() => posts.id, { onDelete: "cascade" })
        .notNull(),
    media: varchar("media", { length: 255 }).notNull()
});

export const post_complaints = pgTable("post_complaints", {
    id: uuid().defaultRandom().primaryKey(),
    user_id: uuid()
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    post_id: uuid()
        .references(() => posts.id, { onDelete: "cascade" })
        .notNull(),
    reason: complaintsReasonEnum("reason").notNull(),
    status: complaintEnum("status").notNull(),
    description: varchar("description", { length: 255 })
});

export const article_complaints = pgTable("article_complaints", {
    id: uuid().defaultRandom().primaryKey(),
    user_id: uuid()
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    article_id: uuid()
        .references(() => articles.id, { onDelete: "cascade" })
        .notNull(),
    reason: complaintsReasonEnum("reason").notNull(),
    status: complaintEnum("status").notNull(),
    description: varchar("description", { length: 255 })
});
export const post_comments_complaints = pgTable("post_comments_complaints", {
    id: uuid().defaultRandom().primaryKey(),
    user_id: uuid()
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    post_comment_id: uuid()
        .references(() => post_comments.id, { onDelete: "cascade" })
        .notNull(),
    reason: complaintsReasonEnum("reason").notNull(),
    status: complaintEnum("status").notNull(),
    description: varchar("description", { length: 255 })
});

export const article_comments_complaints = pgTable("article_comments_complaints", {
    id: uuid().defaultRandom().primaryKey(),
    user_id: uuid()
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    article_comment_id: uuid()
        .references(() => article_comments.id, { onDelete: "cascade" })
        .notNull(),
    reason: complaintsReasonEnum("reason").notNull(),
    status: complaintEnum("status").notNull(),
    description: varchar("description", { length: 255 })
});

export const notifications = pgTable("notifications", {
    id: uuid().defaultRandom().primaryKey(),
    user_id: uuid()
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    text: text("text").notNull(),
    is_read: boolean().default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const verification_codes = pgTable("verification_codes", {
    id: uuid().defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }),
    code: varchar("code", { length: 6 }).notNull(),
    type: verifyCodeEnum("type").notNull(),
    expires_at: timestamp("expires_at", { withTimezone: true })
        .notNull()
        .default(sql`now() + interval '10 minutes'`),
    is_used: boolean("is_used").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
