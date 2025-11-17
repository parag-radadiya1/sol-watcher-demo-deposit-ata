import { Module } from '@nestjs/common';
import { UserModelsModule } from '../../entities/user/user.model.module';
import { AuthModule } from '@user-auth/auth.module';
import { AstrologyModule } from './astrology/astrology.module';
import { BirthstoneModule } from './birthstone/birthstone.module';
import { JobModule } from './job/job.module';
import { CommonModule } from '@utils/common.module';
import { MailModule } from '@mail/mail.module';

@Module({
  imports: [
    UserModelsModule,
    AuthModule,
    AstrologyModule,
    BirthstoneModule,
    JobModule,
  ],
  controllers: [],
  providers: [],
})
export class UserModule {}
