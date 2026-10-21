import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class RatingSheetEmailService {
  constructor(private readonly config: ConfigService) {}

  async send(
    to: string,
    name: string,
    pdf: Buffer,
    filename: string,
  ): Promise<void> {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    const from = this.config.get<string>('SMTP_FROM')?.trim();
    if (!host || !from) {
      throw new ServiceUnavailableException(
        'L’envoi par e-mail n’est pas configuré. Renseignez SMTP_HOST et SMTP_FROM dans l’environnement de l’API.',
      );
    }

    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new ServiceUnavailableException(
        'SMTP_PORT doit être un port valide.',
      );
    }
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASSWORD');
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      ...(user && pass ? { auth: { user, pass } } : {}),
    });

    try {
      await transport.sendMail({
        from,
        to,
        subject: `Votre fiche de notation — ${name}`,
        text: `Bonjour ${name},\n\nVeuillez trouver en pièce jointe votre fiche de notation. Elle est également disponible dans votre espace Évaluations.\n\nCordialement,\nSABC Eval360`,
        attachments: [
          { filename, content: pdf, contentType: 'application/pdf' },
        ],
      });
    } finally {
      transport.close();
    }
  }
}
