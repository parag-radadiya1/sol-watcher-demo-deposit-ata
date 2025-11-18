import { Module } from '@nestjs/common';
import { MarriageMatchService } from './marriage-match.service';
import { MarriageMatchModelModule } from '@entities-marriage-match/marriage-match.model.module';
import { UserModelsModule } from '@entities-user/user.model.module';
import { LangChainModule } from '@app/langchain/langchain.module';
import { MarriageMatchController } from '@app/user/marriage-match/marriage-match.controller';
import { CommonModule } from '@utils/common.module';
import { GuardAuthService } from '@helper/guardAuth.helper.service';
import { TokenModelsModule } from '@entities-token/token.model.module';

@Module({
  imports: [
    MarriageMatchModelModule,
    UserModelsModule,
    LangChainModule,
    CommonModule,
    TokenModelsModule,
  ],
  controllers: [MarriageMatchController],
  providers: [MarriageMatchService, GuardAuthService],
  exports: [MarriageMatchService],
})
export class MarriageMatchModule {}
