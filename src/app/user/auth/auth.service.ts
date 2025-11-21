import { Connection } from 'mongoose';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { UserModelService } from "@entities-user/user.service";
import { IAuthGuardResponse, ICommonResponse, IRefreshTokenDecode, ITokenResponse } from '@utils/dto';
import {
  DuplicateEmailException,
  ILoginResponse,
  InvalidCredentials, InvalidRefreshToken,
  IRegisterResponse, LoginDto, OtpIsAlreadyUsedOrExpired, RefreshTokenDto, SendMobileOtpDto, StoreAuthTokenWithUserIdDto,
  UserCreateDto, UserNotFoundException, VerifyEmailDto, VerifyMobileOtpDto, ForgotPasswordDto, ResetPasswordDto,
} from '@user-auth/dto';
import { userResponse } from '@utils/constant/user.constant';
import { CommonService } from '@helper/common.helper.service';
import { JwtWebAuthService } from '@helper/jwt.helper.service';
import { EMAIL_SUBJECT, TIME_EXPIRY } from '@utils/constants';
import { userVerifyEmailTemplate, passwordResetEmailTemplate } from '@mail/constant';
import { MailService } from '@mail/mail.service';
import { authResponse, commonResponse } from '@utils/constant';
import { TokenModelService } from '@entities-token/token.service';
import { OtpModelService } from '@entities-otp/otp.service';
import { OTP_TYPE } from '@utils/enums';
import { TwilioService } from '@app/twilio/twilio.service';
import { SocialLoginDto, SocialProvider } from './dto/auth.dto';
import { InvalidToken } from './dto/auth.error';
import * as https from 'https';
import { v4 as uuidv4 } from 'uuid';
import { QueueService } from '@app/queue/queue.service';
import { PlanService } from '@entities-plan/plan.service';
import { TokenTransactionService } from '@entities/token-transaction/token-transaction.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly userModelService: UserModelService,
    private readonly commonService: CommonService,
    private readonly jwtService: JwtWebAuthService,
    private readonly mailService: MailService,
    private readonly tokenModelService: TokenModelService,
    private readonly otpModelService: OtpModelService,
    private readonly twilioService: TwilioService,
    private readonly queueService: QueueService,
    private readonly planService: PlanService,
    private readonly tokenTransactionService: TokenTransactionService,
  ) {}

  /**
   * @description Registers a new user, sends a verification email, and returns authentication tokens. Runs in a transaction.
   * @param {any} req - The request object.
   * @param {UserCreateDto} value - The DTO containing user registration details.
   * @returns {Promise<ICommonResponse<IRegisterResponse>>} A promise that resolves to the registration response containing tokens.
   * @throws {DuplicateEmailException} If an account with the given email already exists.
   * @throws {Error} For any other errors during the transaction.
   */
  async registerUser(
    req: any,
    value: UserCreateDto,
  ): Promise<ICommonResponse<IRegisterResponse>> {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const checkCred = await this.userModelService.checkCred(value.email);
      if (checkCred) {
        throw new DuplicateEmailException();
      }
      
      // Get the free plan for new users
      const freePlan = await this.planService.getFreePlan();
      
      const { email, password } = value;
      value.password = await this.commonService.hashPassword(password);
      
      // Assign the free plan to the new user
      const userDataWithPlan = {
        ...value,
        planId: freePlan._id.toString(),
      };

      const [data] = await this.userModelService.createUser(userDataWithPlan, session);

      // Increment user count for the free plan
      await this.planService.incrementUserCount(freePlan._id.toString());
      
      // Create initial token credit transaction for the user
      await this.tokenTransactionService.creditTokens(
        data._id.toString(),
        freePlan.tokenBalance,
        0, // Initial balance is 0
        `Initial token credit from ${freePlan.name}`,
        freePlan._id.toString(),
      );
      
      console.log(`✅ Initial token credit of ${freePlan.tokenBalance} tokens for user ${data._id}`);
      
      await session.commitTransaction();
      await session.endSession();

      const emailVerificationToken = await this.jwtService.generateAccessToken(
        {
          userId: data._id,
          tokenType: 'emailVerification',
        },
        TIME_EXPIRY.oneDay,
      );


      const otp = this.commonService.generateOTP();

      console.log(`OTP for email verification: ${otp}`);
      // CREATE OTP RECORD
      await this.otpModelService.setOtp({
        userId: data._id,
        email,
        otpType: OTP_TYPE.EMAIL_VERIFICATION_OTP,
        otp,
        expiry: new Date(Date.now() + TIME_EXPIRY.oneDay),
      });

      const htmlTemplate = userVerifyEmailTemplate(otp);
      this.mailService.sendMail(
        {
          address: email,
          name: value.name,
        },
        EMAIL_SUBJECT.verifyEmail,
        htmlTemplate,
      );

      const sessionId = null;
      const { token, refreshToken } = await this.jwtService.generateToken({
        userId: data._id,
        sessionId, // need to add sticky session id down the line.
      });
      // Create background job for user addAstrologyJob processing
      try {
        const fullName = data.middleName
          ? `${data.firstName} ${data.lastName} ${data.middleName}`.trim()
          : `${data.firstName} ${data.lastName}`.trim();
        const job = await this.queueService.addAstrologyJob({
          userId: data._id,
          fullName,
          birthDate: data.birthDate,
          birthPlace: data.birthPlace,
          gender: data.gender,
        });

        // Store the job ID in the user model
        await this.userModelService.updateLastAstrologyJobId(data._id, job.id as string);

        console.log(`addAstrologyJob job queued for user: ${data._id}, jobId: ${job.id}`);
      } catch (queueError) {
        // Log but don't fail registration if queue fails
        console.error('Failed to queue user addAstrologyJob job:', queueError);
      }
      
      console.log(`✅ User registered with FREE plan - userId: ${data._id}, planId: ${freePlan._id}`);
      
      return {
        statusCode: HttpStatus.CREATED,
        message: userResponse.userCreatedSuccessfully,
        data: { token, refreshToken },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  }


  /**
   * @description Authenticates a user or organization and generates a login token and refresh token.
   * @param {LoginDto} value - The login credentials provided by the user or organization.
   * @returns {Promise<ICommonResponse<ILoginResponse>>} A promise that resolves to the login response containing tokens.
   * @throws {InvalidCredentials} If the provided credentials are incorrect or the user does not exist.
   */
  async login(
    req: any,
    value: LoginDto,
  ): Promise<ICommonResponse<ILoginResponse>> {
    const sessionId = null;

    const checkCred = await this.userModelService.checkCred(value.email);
    if (!checkCred) {
      throw new InvalidCredentials();
    }

    const comparePassword = await this.commonService.comparePasswords(
      value.password,
      checkCred.password,
    );

    if (!comparePassword) {
      throw new InvalidCredentials();
    }

    const { token, refreshToken } = await this.jwtService.generateToken({
      userId: checkCred._id,
      sessionId,
    });

    return {
      statusCode: HttpStatus.OK,
      message: authResponse.loginSuccessfully,
      data: { token, refreshToken },
    };
  }


  /**
   * @description Logs out a user, admin, or organization member by validating the provided access token, storing the token for reference, and creating a system log if applicable.
   * @param {StoreAuthTokenDto} value - The data transfer object containing the access token to be processed during logout.
   * @returns {Promise<ICommonResponse<[]>>} A promise that resolves to a response object indicating successful logout.
   * @throws {UnauthorizedException} If the access token is invalid or cannot be decrypted.
   */
  async logout(value: StoreAuthTokenWithUserIdDto): Promise<ICommonResponse<[]>> {
    const decryptedData = await this.jwtService.validateToken(
      value.accessToken.split(' ')[1],
    );
    await this.tokenModelService.storeToken(value);
    return {
      statusCode: HttpStatus.OK,
      message: commonResponse.logoutSuccessfully,
      data: [],
    };
  }

  /**
   * @description Refreshes an access token by validating the refresh token and generating a new token pair.
   * @param {RefreshTokenDto} value - The data containing the refresh and access tokens.
   * @returns {Promise<ICommonResponse<ITokenResponse>>} A promise that resolves to a response object containing the new token pair.
   * @throws {InvalidSharedSecret} If the shared secret between the client and server is invalid or not found.
   * @throws {InvalidRefreshToken} If the refresh token is invalid or does not match the provided access token.
   */
  async refreshToken(
    value: RefreshTokenDto,
  ): Promise<ICommonResponse<ITokenResponse>> {
    const tempToken = value.refreshToken.split(' ')[1];
    const refreshToken = (await this.jwtService.validateToken(
      tempToken,
      true,
    )) as unknown as IRefreshTokenDecode;

    const tempAccessToken = value.accessToken.split(' ')[1];
    if (refreshToken.token !== tempAccessToken) {
      throw new InvalidRefreshToken();
    }

    const [obj] = await Promise.all([
      this.jwtService.decodeToken(tempAccessToken),
    ]);

    delete obj.iat;
    delete obj.exp;
    const data = await this.jwtService.generateToken(obj);

    await this.tokenModelService.storeToken({
      refreshToken: data.refreshToken,
      accessToken: data.token,
      userId: obj.userId,
    });

    return {
      statusCode: HttpStatus.OK,
      message: commonResponse.refreshTokenSendSuccessfully,
      data,
    };
  }

  /**
   * Verifies a user's email address using the provided verification token.
   *
   * @returns {Promise<ICommonResponse<[]>>} Response indicating the result of the verification.
   * @throws {InvalidChangeEmailTokenException} If the token is invalid or already used.
   * @throws {UserNotFoundException} If the user is not found.
   * @throws {HttpException} For other HTTP-related errors.
   * @param req
   * @param value
   */
  async verifyEmail( req: IAuthGuardResponse ,value: VerifyEmailDto): Promise<ICommonResponse<[]>> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const checkOtp = await this.otpModelService.getOtpIfValid(
        value.otp,
        req.userId,
        OTP_TYPE.EMAIL_VERIFICATION_OTP,
      );

      if (!checkOtp) {
        throw new OtpIsAlreadyUsedOrExpired();
      }

      await this.userModelService.updateUserById(
        req.userId,
        {
          emailVerified: true,
        },
        session,
      );

      await this.otpModelService.setOtpAsUsed(
        value.otp,
        req.userId,
        session,
      );
      await session.commitTransaction();
      await session.endSession();

      return {
        statusCode: HttpStatus.OK,
        message: userResponse.emailVerifiedSuccessfully,
        data: [],
      };
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  /**
   * @description Sends OTP to mobile number for verification
   * @param req
   * @param {SendMobileOtpDto} value - The DTO containing mobile number and country code
   * @returns {Promise<ICommonResponse<[]>>} A promise that resolves to success response
   */
  async sendMobileOtp(req: IAuthGuardResponse, value: SendMobileOtpDto): Promise<ICommonResponse<[]>> {
    try {
      // Check if user exists with this mobile number
      const existingUser = await this.userModelService.getUserById(
        req.userId,
      );

      if (!existingUser) {
        throw new UserNotFoundException();
      }

      // check user give mobile number is same as registered mobile number
      if (existingUser.mobileNumber === value.mobileNumber &&
        existingUser.countryCode === value.countryCode) {
        throw new HttpException('Mobile number is already verified', HttpStatus.BAD_REQUEST);
      }

      // Generate OTP
      const otp = this.commonService.generateOTP();

      console.log(`OTP for mobile verification: ${otp}`);
      // Store OTP in database
      await this.otpModelService.setOtp({
        userId: existingUser._id,
        mobileNumber: value.mobileNumber,
        countryCode: value.countryCode,
        otpType: OTP_TYPE.MOBILE_VERIFICATION_OTP,
        otp,
        expiry: new Date(Date.now() + TIME_EXPIRY.tenMin * 1000), // Convert seconds to milliseconds
      });

      // Send OTP via WhatsApp/SMS using Twilio
      const fullMobileNumber = `${value.countryCode}${value.mobileNumber}`;
      this.twilioService.sendOtpToWhatsapp(fullMobileNumber, otp);

      return {
        statusCode: HttpStatus.OK,
        message: userResponse.otpSentSuccessfully,
        data: [],
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to send OTP', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * @description Verifies mobile OTP and updates user verification status
   * @param req
   * @param {VerifyMobileOtpDto} value - The DTO containing OTP, mobile number and country code
   * @returns {Promise<ICommonResponse<[]>>} A promise that resolves to success response
   */
  async verifyMobileOtp(req: IAuthGuardResponse, value: VerifyMobileOtpDto): Promise<ICommonResponse<[]>> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Find user by authenticated user ID
      const user = await this.userModelService.getUserById(
        req.userId
      );

      if (!user) {
        throw new UserNotFoundException();
      }

      // Verify OTP with mobile number and country code from the request
      const checkOtp = await this.otpModelService.getOtpIfValidWithMobile(
        value.otp,
        user._id,
        value.mobileNumber,
        value.countryCode,
        OTP_TYPE.MOBILE_VERIFICATION_OTP,
      );

      if (!checkOtp) {
        throw new OtpIsAlreadyUsedOrExpired();
      }

      // Update user with the verified mobile number and country code
      await this.userModelService.updateUserById(
        user._id,
        {
          mobileNumber: value.mobileNumber,
          countryCode: value.countryCode,
          numberVerified: true,
        },
        session,
      );

      // Mark OTP as used
      await this.otpModelService.setOtpAsUsed(
        value.otp,
        user._id,
        session,
      );

      await session.commitTransaction();
      await session.endSession();

      return {
        statusCode: HttpStatus.OK,
        message: userResponse.otpVerifiedSuccessfully,
        data: [],
      };
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();

      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to verify mobile OTP', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * @description Sends password reset OTP to user's email address
   * @param {ForgotPasswordDto} value - The DTO containing user's email
   * @returns {Promise<ICommonResponse<[]>>} A promise that resolves to success response
   * @throws {UserNotFoundException} If user with email doesn't exist
   */
  async forgotPassword(value: ForgotPasswordDto): Promise<ICommonResponse<[]>> {
    try {
      // Check if user exists with this email
      const user = await this.userModelService.checkCred(value.email);

      if (!user) {
        throw new UserNotFoundException();
      }

      // Generate OTP
      const otp = this.commonService.generateOTP();
      console.log(`OTP for password reset: ${otp}`);

      // Store OTP in database with 10 minutes expiry
      await this.otpModelService.setOtp({
        userId: user._id,
        email: value.email,
        otpType: OTP_TYPE.PASSWORD_RESET_OTP,
        otp,
        expiry: new Date(Date.now() + TIME_EXPIRY.tenMin * 1000),
      });

      // Send password reset email with OTP
      const htmlTemplate = passwordResetEmailTemplate(otp);
      this.mailService.sendMail(
        {
          address: value.email,
          name: user.name,
        },
        EMAIL_SUBJECT.forgotPassword,
        htmlTemplate,
      );

      return {
        statusCode: HttpStatus.OK,
        message: userResponse.passwordResetOtpSentSuccessfully,
        data: [],
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to send password reset OTP', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * @description Resets user password using OTP verification
   * @param {ResetPasswordDto} value - The DTO containing OTP and new password
   * @returns {Promise<ICommonResponse<[]>>} A promise that resolves to success response
   * @throws {OtpIsAlreadyUsedOrExpired} If OTP is invalid, expired, or already used
   */
  async resetPassword(value: ResetPasswordDto): Promise<ICommonResponse<[]>> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Verify OTP and get user details
      const otpRecord = await this.otpModelService.getOtpIfValid(
        value.otp,
        null, // We'll search by OTP since we don't have userId
        OTP_TYPE.PASSWORD_RESET_OTP,
      );

      if (!otpRecord) {
        throw new OtpIsAlreadyUsedOrExpired();
      }

      // Hash the new password
      const hashedPassword = await this.commonService.hashPassword(value.newPassword);

      // Update user password
      await this.userModelService.updateUserById(
        otpRecord.userId,
        {
          password: hashedPassword,
        },
        session,
      );

      // Mark OTP as used
      await this.otpModelService.setOtpAsUsed(
        value.otp,
        otpRecord.userId,
        session,
      );

      await session.commitTransaction();
      await session.endSession();

      return {
        statusCode: HttpStatus.OK,
        message: userResponse.passwordResetSuccessfully,
        data: [],
      };
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();

      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to reset password', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Helper: perform simple HTTPS GET and parse JSON (no external deps)
  private fetchJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve(json);
            } catch (err) {
              reject(err);
            }
          });
        })
        .on('error', (err) => reject(err));
    });
  }

  // Helper: verify provider token and return normalized profile
  private async verifyProviderToken(dto: SocialLoginDto) {
    try {
      if (dto.provider === SocialProvider.GOOGLE) {
        // Google id_token verification endpoint
        const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
          dto.token,
        )}`;
        const res = await this.fetchJson(url);
        // tokeninfo returns email and email_verified as string 'true'/'false'
        if (res.error_description) {
          throw new InvalidToken(res.error_description);
        }
        return {
          email: res.email,
          name: res.name || dto.name,
          emailVerified: res.email_verified === 'true' || res.email_verified === true,
        };
      }

      if (dto.provider === SocialProvider.FACEBOOK) {
        // Facebook graph API to get email and name
        const url = `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(
          dto.token,
        )}`;
        const res = await this.fetchJson(url);
        if (res.error) {
          throw new InvalidToken(res.error.message || 'Invalid facebook token');
        }
        return {
          email: res.email,
          name: res.name || dto.name,
          emailVerified: true, // Facebook access token implies email ownership when provided
        };
      }

      throw new InvalidToken('Unsupported provider');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InvalidToken('Failed to verify provider token');
    }
  }

  // Helper: generate a random password
  private generateRandomPassword() {
    // Use uuid and a small random suffix to satisfy password validators
    return `${uuidv4()}@${Math.floor(Math.random() * 10000)}`;
  }

  // Social login implementation
  async socialLogin(
    req: any,
    dto: SocialLoginDto,
  ): Promise<ICommonResponse<ILoginResponse>> {
    const sessionId = null;
    try {
      const profile = await this.verifyProviderToken(dto);

      const email = (profile.email || dto.email || '').trim().toLowerCase();
      if (!email) {
        throw new InvalidToken('Email not provided by provider.');
      }

      // 2) Find or create user
      let user = await this.userModelService.checkCred(email);

      if (!user) {
        const session = await this.connection.startSession();
        try {
          session.startTransaction();

          const randomPassword = this.generateRandomPassword();
          const hashed = await this.commonService.hashPassword(randomPassword);

          const [createdUser] = await this.userModelService.createUser(
            {
              firstName: dto.firstName,
              lastName: dto.lastName,
              surname: dto.surname,
              birthDate: dto.birthDate,
              birthPlace: dto.birthPlace,
              name: profile.name || dto.name || email.split("@")[0],
              email,
              password: hashed,
              mobileNumber: dto.mobileNumber,
              countryCode: dto.countryCode,
              emailVerified: Boolean(profile.emailVerified),
            } as any,
            session,
          );
          await session.commitTransaction();
          user = createdUser;
        } catch (e) {
          await session.abortTransaction();
          throw e;
        } finally {
          await session.endSession();
        }
      }
      // 3) Issue tokens
      const { token, refreshToken } = await this.jwtService.generateToken({
        userId: user._id,
        sessionId,
      });
      await this.tokenModelService.storeToken({
        refreshToken,
        accessToken: token,
        userId: user._id,
      } as any);
      return {
        statusCode: HttpStatus.OK,
        message: authResponse.loginSuccessfully,
        data: { token, refreshToken },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InvalidCredentials();
    }
  }

  async getProfile(req: IAuthGuardResponse): Promise<ICommonResponse<any>> {
    try {
      const user = await this.userModelService.getUserById(req.userId);
      if (!user) {
        throw new UserNotFoundException();
      }
      const { password, ...userProfile } = user;
      return {
        statusCode: HttpStatus.OK,
        message: 'User profile retrieved successfully',
        data: userProfile,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        commonResponse.internalServerError,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

// yes, i conform
