import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmtpSettingsDto, TestSmtpDto } from './dto/smtp-settings.dto';

@Injectable()
export class SmtpService {
  constructor(private prisma: PrismaService) {}

  async upsert(tenantId: string, data: SmtpSettingsDto) {
    return this.prisma.smtpSettings.upsert({
      where: { tenantId },
      update: data,
      create: { ...data, tenantId },
    });
  }

  async get(tenantId: string) {
    const settings = await this.prisma.smtpSettings.findUnique({
      where: { tenantId },
    });
    if (!settings)
      throw new NotFoundException(
        'SMTP settings not configured for this tenant',
      );
    return settings;
  }

  testConnection(dto: TestSmtpDto) {
    // In production: use nodemailer to test SMTP connection and send test email
    // const settings = await this.get(tenantId);
    // const transporter = nodemailer.createTransport({ host: settings.host, port: settings.port, ... })
    // await transporter.sendMail({ from: settings.senderEmail, to: dto.testEmail, subject: 'Test', text: 'OK' });
    return {
      success: true,
      message: `Test email would be sent to ${dto.testEmail}. Configure nodemailer to enable this.`,
    };
  }
}
