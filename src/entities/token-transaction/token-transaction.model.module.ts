import { Module } from '@nestjs/common';
import { tokenTransactionModel } from './token-transaction.entities';
import { TokenTransactionService } from '@entities/token-transaction/token-transaction.service';

@Module({
  imports: [tokenTransactionModel],
  providers: [TokenTransactionService],
  exports: [tokenTransactionModel, TokenTransactionService],
})
export class TokenTransactionModelModule {}

