import { Module } from '@nestjs/common';
import { UserCreationController } from './userCreation.controller';
import { UserCreationService } from './userCreation.service';

@Module({
  controllers: [UserCreationController],
  providers: [UserCreationService],
})
export class UserCreationModule {}