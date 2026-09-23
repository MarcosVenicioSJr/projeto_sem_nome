import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_LOCALE, t, type Locale } from '@org/i18n';
import { createTransport, type Transporter } from 'nodemailer';
import type { Env } from '../config';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Transactional email over SMTP (nodemailer). The transport is configured
 * from env (`MAIL_*`): local points at the Mailpit container from
 * docker-compose; production, at a real SMTP (e.g. Mailjet).
 */
@Injectable()
export class MailerService implements OnModuleInit {
  private readonly logger = new Logger(MailerService.name);
  private readonly from: string;
  private readonly transporter: Transporter;

  constructor(config: ConfigService<Env, true>) {
    this.from = config.get('MAIL_FROM', { infer: true });
    const user = config.get('MAIL_USER', { infer: true });
    this.transporter = createTransport({
      host: config.get('MAIL_HOST', { infer: true }),
      port: config.get('MAIL_PORT', { infer: true }),
      secure: config.get('MAIL_SECURE', { infer: true }),
      auth: user
        ? { user, pass: config.get('MAIL_PASSWORD', { infer: true }) }
        : undefined,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP ready');
    } catch (err) {
      this.logger.warn(`SMTP unavailable: ${(err as Error).message}`);
    }
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({ from: this.from, ...message });
  }

  /** Email confirmation code (Security spec §2 and §3). */
  async sendVerificationCode(
    to: string,
    code: string,
    locale: Locale = DEFAULT_LOCALE,
  ): Promise<void> {
    const line1 = t('email.verification.line1', locale);
    const line2 = t('email.verification.line2', locale);
    await this.send({
      to,
      subject: t('email.verification.subject', locale),
      text: `${line1} ${code}. ${line2}`,
      html:
        `<p>${line1}</p>` +
        `<p style="font-size:24px;letter-spacing:4px"><strong>${code}</strong></p>` +
        `<p>${line2}</p>`,
    });
  }
}
