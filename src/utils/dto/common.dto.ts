import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PickType } from '@nestjs/swagger';
import { Otp } from '@entities-otp/otp.entities';

export class CommonSearchDto {
  @IsOptional()
  @IsString()
  search?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  page?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class OtpDto extends PickType(Otp, [
  'countryCode',
  'mobileNumber',
  'otp',
  'email',
  'expiry',
  'otpType',
  'userId'
]) {}