"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const nodemailer = require("nodemailer");
async function main() {
    const to = process.argv[2];
    if (!to) {
        console.error('Uso: npm run smtp:send-test -- <email-destino>');
        process.exit(1);
    }
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_USER || process.env.SMTP_FROM || 'no-reply@little-tales.com';
    if (!host || !user || !pass) {
        console.error('SMTP não configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
        process.exit(1);
    }
    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
    try {
        await transporter.verify();
        const info = await transporter.sendMail({
            from,
            to,
            subject: 'Teste SMTP - Little Tales',
            text: 'E-mail de teste enviado com sucesso.',
            html: '<p>E-mail de teste enviado com sucesso.</p>',
            envelope: { from, to },
        });
        console.log('Enviado com sucesso:', { to, messageId: info?.messageId });
    }
    catch (e) {
        console.error('Falha ao enviar:', e?.message || e);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=send-test-email.js.map