const nodemailer = require("nodemailer");
const db = require("./database");
const dev = true;
let testAccount;
let transporter;
async function SendEmail(to, subject, body) {
    if(dev) {
        testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        })
    }

    let info = await transporter.sendMail({
        from: "Tester Email",
        to,
        subject,
        html: body
    });

    return info;
}

module.exports.sendEmail = SendEmail;