import { Module } from '@nestjs/common';
import { SmtpService } from './smtp.service';
import { SmtpController } from './smtp.controller';

@Module({
  providers: [SmtpService],
  controllers: [SmtpController],
  exports: [SmtpService],
})
export class SmtpModule {}
