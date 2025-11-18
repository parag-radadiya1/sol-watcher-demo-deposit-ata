import { CustomValidationService } from '@helper/customValidation.helper.service';
import { GuardAuthService } from '@helper/guardAuth.helper.service';
import { JwtWebAuthService } from '@helper/jwt.helper.service';
import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    LangChainModule,
    MessageModelsModule,
    ConversationModelModule,
    MessageChunkModelsModule,
    UserModelsModule,
    TokenModelsModule,
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
