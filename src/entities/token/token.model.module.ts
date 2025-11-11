import { Module } from '@nestjs/common';
import { tokenModel } from './token.entities';
import { TokenModelService } from './token.service';

@Module({
  imports: [tokenModel],
  controllers: [],
  providers: [TokenModelService],
  exports: [tokenModel, TokenModelService],
})
export class TokenModelsModule {}
