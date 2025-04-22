import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

type MailType = {
    to: string;
    subject: string;
    text?: string | undefined;
    html?: string | undefined;
};

export async function sendEmail(obj: MailType) {
    try {
        await transporter.sendMail({
            from: `"Your Name" <${process.env.SMTP_USER}>`,
            ...obj
        });
    } catch (error) {
        throw error;
    }
}
