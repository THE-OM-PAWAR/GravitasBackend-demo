const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: "87fcdb001@smtp-brevo.com", // Replace with your API Key
    pass: "za5P7ZHwD3hBxjQc", // Same as Username
  },
});

const mailOptions = {
  from: "solankisourabh796@gmail.com", // Must be your verified email
  to: "gouravrajak985@gmail.com",
  subject: "Test Email from Brevo SMTP",
  text: "Hello! This is a test email using Brevo SMTP.",
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Email sent:", info.response);
  }
});
