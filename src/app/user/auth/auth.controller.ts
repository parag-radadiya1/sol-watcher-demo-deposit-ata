import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards, Get } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  BadRequestResponse,
  IAuthGuardResponse,
  ICommonResponse,
  InternalServerErrorResponse,
  ITokenResponse,
} from '@utils/dto';
import { commonResponse } from '@utils/constant';
import { AuthService } from '@user-auth/auth.service';
import {
  ILoginResponse,
  IRegisterResponse,
  LoginDto,
  LoginSuccessResponse, RefreshTokenDto,
  RegisterSuccessResponse, SendMobileOtpDto, SendMobileOtpSuccessResponse, StoreAuthTokenWithUserIdDto,
  UserCreateDto, VerifyChangeEmailSuccessResponse, VerifyEmailDto, VerifyMobileOtpDto, VerifyMobileOtpSuccessResponse,
  ForgotPasswordDto, ResetPasswordDto, ForgotPasswordSuccessResponse, ResetPasswordSuccessResponse,
  SocialLoginDto,
} from '@user-auth/dto';
import { userResponse } from '@utils/constant/user.constant';
import { AuthGuard } from '@guard/auth.guard';


@Controller('user/auth')
@ApiTags('User-Auth')
@ApiBadRequestResponse({
  type: BadRequestResponse,
  description: commonResponse.badRequest,
})
@ApiInternalServerErrorResponse({
  type: InternalServerErrorResponse,
  description: commonResponse.internalServerError,
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({
    description: 'User Register successfully',
    type: RegisterSuccessResponse,
  })
  register(
    @Req() req,
    @Body() value: UserCreateDto,
  ): Promise<ICommonResponse<IRegisterResponse>> {
    return this.authService.registerUser(req, value);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'User login successfully',
    type: LoginSuccessResponse,
  })
  login(
    @Req() req,
    @Body() value: LoginDto,
  ): Promise<ICommonResponse<ILoginResponse>> {
    return this.authService.login(req, value);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Logout successfully' })
  logout(@Body() value: StoreAuthTokenWithUserIdDto): Promise<ICommonResponse<[]>> {
    return this.authService.logout(value);
  }

  @Post('refreshToken')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'New tokens send successfully' })
  refreshToken(
    @Body() value: RefreshTokenDto,
  ): Promise<ICommonResponse<ITokenResponse>> {
    return this.authService.refreshToken(value);
  }

  @Post('verifyEmail')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: userResponse.emailVerifiedSuccessfully,
    type: VerifyChangeEmailSuccessResponse,
  })
  verifyEmail(
    @Req() req: IAuthGuardResponse,
    @Body() value: VerifyEmailDto
  ): Promise<ICommonResponse<[]>> {
    return this.authService.verifyEmail(req, value);
  }

  @Post('send-mobile-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Mobile OTP sent successfully',
    type: SendMobileOtpSuccessResponse,
  })
  sendMobileOtp(
    @Body() value: SendMobileOtpDto,
    @Req() req: IAuthGuardResponse,
  ): Promise<ICommonResponse<[]>> {
    return this.authService.sendMobileOtp(req, value);
  }

  @Post('verify-mobile-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Mobile OTP verified successfully',
    type: VerifyMobileOtpSuccessResponse,
  })
  verifyMobileOtp(
    @Body() value: VerifyMobileOtpDto,
    @Req() req: IAuthGuardResponse,
  ): Promise<ICommonResponse<[]>> {
    return this.authService.verifyMobileOtp(req, value);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Password reset link sent successfully',
    type: ForgotPasswordSuccessResponse,
  })
  forgotPassword(
    @Body() value: ForgotPasswordDto,
  ): Promise<ICommonResponse<[]>> {
    return this.authService.forgotPassword(value);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Password reset successfully',
    type: ResetPasswordSuccessResponse,
  })
  resetPassword(
    @Body() value: ResetPasswordDto,
  ): Promise<ICommonResponse<[]>> {
    return this.authService.resetPassword(value);
  }

  @Post('socialLogin')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'User social login successfully',
    type: LoginSuccessResponse,
  })
  socialLogin(
    @Req() req,
    @Body() value: SocialLoginDto,
  ): Promise<ICommonResponse<ILoginResponse>> {
    return this.authService.socialLogin(req, value);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
  })
  getProfile(
    @Req() req: IAuthGuardResponse,
  ): Promise<ICommonResponse<any>> {
    return this.authService.getProfile(req);
  }
}
