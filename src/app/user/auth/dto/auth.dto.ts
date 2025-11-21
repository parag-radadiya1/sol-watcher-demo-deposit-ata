import { User, Gender } from '@entities-user/user.entities';
import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Token } from '../../../../entities/token/token.entities';
import { ITokenCommonFields } from '@utils/dto';
import { Otp } from '@entities-otp/otp.entities';
import { commonResponse } from '@utils/constant';


export class UserCreateDto extends IntersectionType(
  PickType(User, ['firstName', 'middleName', 'lastName', 'birthDate', 'birthPlace', 'name', 'gender', 'mobileNumber', 'countryCode', 'email', 'password']),
) {}


export class LoginDto extends PickType(User, ['email']) {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class StoreAuthTokenWithUserIdDto extends PickType(Token, [
  'refreshToken',
  'accessToken',
  'userId',
]) {}


export class RefreshTokenDto extends PickType(Token, [
  'refreshToken',
  'accessToken'
]) {}

export class VerifyEmailDto  extends PickType(Otp, [
  'otp'
]) {}

export class SendMobileOtpDto extends PickType(User, ['mobileNumber', 'countryCode']) {}

export class VerifyMobileOtpDto extends PickType(Otp, ['otp']) {
  @IsString()
  @IsNotEmpty()
  mobileNumber: string;

  @IsString()
  @IsNotEmpty()
  countryCode: string;
}

export class ForgotPasswordDto extends PickType(User, ['email']) {}

export class ResetPasswordDto extends PickType(Otp, ['otp']) {
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

// Social login DTO and provider enum
export enum SocialProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
}

export class SocialLoginDto {
  @ApiProperty({ enum: SocialProvider })
  @IsEnum(SocialProvider)
  provider: SocialProvider;

  @ApiProperty({
    description: 'Provider token (Google id_token or Facebook access_token)',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail({}, { message: commonResponse.invalidEmailAddress })
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  // Required to create user due to schema requirements
  @ApiProperty({ example: '+91' })
  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @ApiProperty({ example: '9090909090' })
  @IsString()
  @IsNotEmpty()
  mobileNumber: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Smith', required: false })
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiProperty({ example: '1990-01-15T10:30:00.000Z' })
  @IsNotEmpty()
  birthDate: Date;

  @ApiProperty({ example: 'New York, USA' })
  @IsString()
  @IsNotEmpty()
  birthPlace: string;

  @ApiProperty({ enum: Gender, example: 'male' })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;
}

