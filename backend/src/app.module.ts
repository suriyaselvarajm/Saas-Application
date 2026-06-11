import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './tenant/tenant.module';
import { SettingsModule } from './settings/settings.module';
import { AuditModule } from './audit/audit.module';
import { RbacModule } from './rbac/rbac.module';
import { SmtpModule } from './smtp/smtp.module';
import { EmailTemplateModule } from './email-template/email-template.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ComputersModule } from './computers/computers.module';
import { GroupsModule } from './groups/groups.module';

@Module({
  imports: [
    PrismaModule,
    TenantModule,
    SettingsModule,
    AuditModule,
    RbacModule,
    SmtpModule,
    EmailTemplateModule,
    AuthModule,
    UsersModule,
    ComputersModule,
    GroupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
