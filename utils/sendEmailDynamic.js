const nodemailer = require("nodemailer");

// ✅ JS templates — Vercel pe fs ki zaroorat nahi
const templates = {
    "user-update-admin": require("../template/user-update-admin.js"),
    "user-password-update-admin": require("../template/user-password-update-admin.js"),
    "user-role-update-admin": require("../template/user-role-update-admin.js"),
    "send-user-credentials": require("../template/send-user-credentials.js"),
};

const sendEmailDynamic = async (options) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    let htmlContent = "";

    if (options.templateName && templates[options.templateName]) {
        htmlContent = templates[options.templateName];

        // ✅ {{Key}} placeholders replace karo
        for (const key in options.replacements) {
            htmlContent = htmlContent.replace(
                new RegExp(`{{${key}}}`, "g"),
                options.replacements[key]
            );
        }
    }

    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || "Support"}" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: htmlContent || undefined,
        text: options.text || undefined,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmailDynamic;