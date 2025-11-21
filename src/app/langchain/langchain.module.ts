import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LangChainService } from './langchain.service';
import { TokenManagementModule } from '@app/user/token-management/token-management.module';
import { PlanModelModule } from '@entities-plan/plan.model.module';
import { UserModelsModule } from '@entities/user/user.model.module';
import { SocketModule } from '@app/socket/socket.module';

@Module({
  imports: [
    UserModelsModule,
    ConfigModule,
    TokenManagementModule,
    PlanModelModule,
    forwardRef(() => SocketModule),
  ],
  providers: [LangChainService],
  exports: [LangChainService],
})
export class LangChainModule {}
