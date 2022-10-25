import nodemailer from "nodemailer";

const adminEmail =
  "postmaster@sandbox9a1b4dcfee9e40a6897e8ac46b6e3c4c.mailgun.org";
const adminPassword = "09fe9a305d04c7bc6a6dd34baeaad95a-d117dd33-7961ad1b";
const mailHost = "smtp.mailgun.org";
const mailPort = 587;

export const mailer = (to, subject, htmlContent) => {
  const transporter = nodemailer.createTransport({
    host: mailHost,
    port: mailPort,
    secure: false,
    auth: {
      user: adminEmail,
      pass: adminPassword,
    },
  });
  const options = {
    from: adminEmail,
    to: to,
    subject: subject,
    html: htmlContent,
  };
  return transporter.sendMail(options);
};
