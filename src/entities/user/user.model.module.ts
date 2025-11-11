import { Module } from '@nestjs/common';
import { userModel } from './user.entities';
import { UserModelService } from './user.service';

@Module({
  imports: [userModel],
  controllers: [],
  providers: [UserModelService],
  exports: [userModel, UserModelService],
})
export class UserModelsModule {}
