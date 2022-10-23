import nodemailer from 'nodemailer';

 const adminEmail = 'postmaster@sandbox115d0c90e473472791cc02a009fa334a.mailgun.org'
 const adminPassword = 'f18397b3e5465d8ec173152e519452ed-c27bf672-6bda2d43'
 const mailHost = 'smtp.mailgun.org'
 const mailPort = 587

 export const mailer = (to, subject, htmlContent) => {
   const transporter = nodemailer.createTransport({
     host: mailHost,
     port: mailPort,
     secure: false,
     auth: {
       user: adminEmail,
       pass: adminPassword
     }
   })
   const options = {
     from: adminEmail, 
     to: to, 
     subject: subject, 
     html: htmlContent 
   }
   return transporter.sendMail(options)
 }
