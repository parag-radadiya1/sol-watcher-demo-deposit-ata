import { Module } from '@nestjs/common';
import { ChoghadiyaController } from './choghadiya.controller';
import { ChoghadiyaService } from './choghadiya.service';
import { GuardAuthService } from '@helper/guardAuth.helper.service';
import { CommonModule } from '@utils/common.module';
import { TokenModelsModule } from '@entities/token/token.model.module';
import { UserModelsModule } from '@entities-user/user.model.module';

@Module({
  imports: [CommonModule, TokenModelsModule, UserModelsModule],
  controllers: [ChoghadiyaController],
  providers: [ChoghadiyaService, GuardAuthService],
  exports: [ChoghadiyaService],
})
export class ChoghadiyaModule {}
