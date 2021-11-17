const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class EmailTrabajador {
    constructor(codigo) {
        this.to = process.env.EMAIL_FROM;
        this.codigo = codigo;
        this.from = process.env.EMAIL_FROM
    }
    newTransport() {
        if(process.env.NODE_ENV === "production"){
            return nodemailer.createTransport({
                service: "SendGrid",
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }
            })
        }
        else {
            return nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
        }
    }
    async send(template, subject, confirm) {

        const html = pug.renderFile(`${__dirname}/../emails/${template}.pug`, {
            codigo: this.codigo,
            subject,
            confirm
        })

        const mailOptions = {
            from: this.from,
            to: this.to,
            subject: subject,
            html,
            text: htmlToText.fromString(html)
        }

        await this.newTransport().sendMail(mailOptions);
    }

    async sendWarning() {
        this.send("pedidoAdmin", "Alguien ha realizado un pedido");
    }
}