// const nodemailer = require("nodemailer");

// const sendEmail = async (options) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: options.to,
//     subject: options.subject,
//     text: options.text,
//   };

//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;

const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let htmlContent = "";

  // ✅ Agar template diya hai to use karo
  // if (options.templateName) {
  //   const templatePath = path.join(
  //     __dirname,
  //     `../template/${options.templateName}.html`
  //   );

  //   htmlContent = fs.readFileSync(templatePath, "utf-8");

  //   // Replace variables {{UserName}} etc
  //   for (const key in options.replacements) {
  //     htmlContent = htmlContent.replace(
  //       new RegExp(`{{${key}}}`, "g"),
  //       options.replacements[key]
  //     );
  //   }
  // }
  if (options.templateName) {
    const templatePath = path.join(
      __dirname,
      `../template/${options.templateName}.html`
    );

    if (fs.existsSync(templatePath)) {
      htmlContent = fs.readFileSync(templatePath, "utf-8");

      for (const key in options.replacements) {
        htmlContent = htmlContent.replace(
          new RegExp(`{{${key}}}`, "g"),
          options.replacements[key]
        );
      }
    }
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: options.to,
    subject: options.subject,

    // ❗ agar html hai to html bhejo warna text
    html: htmlContent || undefined,
    text: options.text || undefined,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;