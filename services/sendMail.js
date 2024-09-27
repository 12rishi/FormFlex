const nodemailer = require("nodemailer");
async function sendMail(options) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_CLIENT,
      pass: process.env.MAIL_CLIENT_PASS,
    },
  });
  const mailOption = {
    from: "Rishi Thapa<FormFlex123@gamil.com>",
    to: options.Email,
    subject: "join formflex",
    text: `${options.senderMail}} inviting you to join his/her organization.Click here to join ${options.invitationLink}  `,
  };
  await transporter.sendMail(mailOption);
}
module.exports = sendMail;
