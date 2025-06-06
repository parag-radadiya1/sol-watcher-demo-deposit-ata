import { Module } from '@nestjs/common';
import { SolanaModule } from './solana/solana.module';
import { UserModule as UserInsideModule } from './user/user.module';
import { WatcherModule } from './watcher/watcher.module';
import { WatcherService } from './watcher/watcher.service';

@Module({
  imports: [
    SolanaModule,
    UserInsideModule,
    WatcherModule,
  ],
  controllers: [],
  providers: [],
})
export class UserModule {}
