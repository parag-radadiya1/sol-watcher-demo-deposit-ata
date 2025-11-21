import { CustomValidationService } from '@helper/customValidation.helper.service';
import { GuardAuthService } from '@helper/guardAuth.helper.service';
import { JwtWebAuthService } from '@helper/jwt.helper.service';
import { Module, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { SocketGateway } from './socket.gateway';
import { SocketGatewayService } from './socket.gateway.service';
import { ChatValidationService } from './services/chat-validation.service';
import { LangChainModule } from '../langchain/langchain.module';
import { MessageModelsModule } from '../../entities/message/message.model.module';
import { ConversationModelModule } from '../../entities/conversation/conversation.model.module';
import { MessageChunkModelsModule } from '../../entities/message-chunk/message-chunk.model.module';
import { UserModelsModule } from '../../entities/user/user.model.module';
import { TokenModelsModule } from '../../entities/token/token.model.module';
import { TokenManagementModule } from '@app/user/token-management/token-management.module';
import { PlanModelModule } from '@entities/plan/plan.model.module';

@Module({
  imports: [
    forwardRef(() => LangChainModule),
    MessageModelsModule,
    ConversationModelModule,
    MessageChunkModelsModule,
    UserModelsModule,
    TokenModelsModule,
    TokenManagementModule,
    PlanModelModule
  ],
  providers: [
    SocketGateway,
    CustomValidationService,
    SocketGatewayService,
    ChatValidationService,
    GuardAuthService,
    JwtService,
    JwtWebAuthService,
  ],
  exports: [SocketGateway, SocketGatewayService],
})
export class SocketModule {}
