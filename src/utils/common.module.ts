import { CommonService } from '@helper/common.helper.service';
import { JwtWebAuthService } from '@helper/jwt.helper.service';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  providers: [CommonService, JwtWebAuthService, JwtService],
  exports: [CommonService, JwtWebAuthService, JwtService],
})
export class CommonModule {}
