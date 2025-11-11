import { HttpStatus } from '@nestjs/common';
import { SwaggerResponse } from '@utils/classes';
import { authResponse } from '@utils/constant';
import { LoginSuccess } from '../doc';
import { userResponse } from '@utils/constant/user.constant';

export class LoginSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  authResponse.loginSuccessfully,
  LoginSuccess,
) {}

export class RegisterSuccessResponse extends SwaggerResponse(
  HttpStatus.CREATED,
  userResponse.userCreatedSuccessfully,
  LoginSuccess,
) {}

export class VerifyChangeEmailSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  userResponse.emailChangedSuccessfully,
  [],
) {}

// New response DTOs for mobile OTP verification
export class SendMobileOtpSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  userResponse.otpSentSuccessfully,
  [],
) {}

export class VerifyMobileOtpSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  userResponse.otpVerifiedSuccessfully,
  [],
) {}

export class ForgotPasswordSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  userResponse.passwordResetOtpSentSuccessfully,
  [],
) {}

export class ResetPasswordSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  userResponse.passwordResetSuccessfully,
  [],
) {}
