"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
async function main() {
    const config = new config_1.ConfigService();
    const host = config.get('SMTP_HOST');
    const port = parseInt(config.get('SMTP_PORT') || '587');
    const user = config.get('SMTP_USER');
    const pass = config.get('SMTP_PASS');
    if (!host || !user || !pass) {
        console.log('SMTP não configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
        process.exit(1);
    }
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
    try {
        const ok = await transporter.verify();
        console.log('Conexão SMTP válida:', ok === true);
    }
    catch (e) {
        console.error('Falha ao verificar SMTP:', e?.message || e);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=smtp-check.js.map