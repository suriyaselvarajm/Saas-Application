import { Controller, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserCreationService } from './userCreation.service';

@Controller('user-creation')
export class UserCreationController {
  constructor(private readonly userCreationService: UserCreationService) {}

  @Post('single')
  createSingleUser(@Body() userData: any) {
    return this.userCreationService.createSingleUser(userData);
  }

  @Post('bulk')
  @UseInterceptors(FileInterceptor('file'))
  createBulkUsers(@UploadedFile() file: any) {
    return this.userCreationService.createBulkUsers(file);
  }
}