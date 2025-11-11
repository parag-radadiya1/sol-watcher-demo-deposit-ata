import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ITokenResponse } from '@utils/dto';
import { TokenExpiredException } from '@utils/exception';
const configService = new ConfigService();

@Injectable()
export class JwtWebAuthService {
  constructor(private readonly jwtService: JwtService) {}
  private readonly accessSecretKey =
    configService.get<string>('ACCESS_SECRET_KEY');
  private readonly refreshSecretKey =
    configService.get<string>('REFRESH_SECRET_KEY');

  /**
   * @description Generates an access token and a refresh token for the specified user ID.
   * @param {object} obj - The object containing the user ID and other data.
   * @return {Promise<ITokenResponse>} - A promise that resolves to an object containing both access and refresh tokens.
   */
  async generateToken(obj): Promise<ITokenResponse> {
    const token = this.jwtService.sign(obj, {
      secret: this.accessSecretKey,
      expiresIn: configService.get<number>('JWT_EXPIRY') * 60,
    });
    const refreshToken = this.jwtService.sign(
      { token },
      {
        secret: this.refreshSecretKey,
        expiresIn: configService.get<number>('JWT_REFRESH_EXPIRY') * 60,
      },
    );
    return { token, refreshToken };
  }

  /**
   * @description Generates a JWT access token with the specified payload and expiration time.
   * @param {IGenerateToken} obj - The payload object to include in the access token.
   * @param {number} expiresIn - The expiration time of the token in seconds.
   * @returns {Promise<string>} - A promise that resolves to string the generated access token.
   */
  async generateAccessToken(obj, expiresIn: number): Promise<string> {
    const token = this.jwtService.sign(obj, {
      secret: this.accessSecretKey,
      expiresIn,
    });
    return token;
  }

  /**
   * @description Validates a JWT token based on the token type (access or refresh).
   * @param {string} token - The JWT token to validate.
   * @param {boolean} isRefreshToken - Indicates if the token is a refresh token.
   * @return {Promise<any>} - Returns the decoded token if valid.
   * @throws {UnauthorizedException} - Throws an exception if the token is invalid.
   */
  async validateToken(
    token: string,
    isRefreshToken: boolean = false,
  ): Promise<any> {
    try {
      const secretKey = isRefreshToken
        ? this.refreshSecretKey
        : this.accessSecretKey;

      const decoded = this.jwtService.verify(token, {
        secret: secretKey,
      }) as any;

      return decoded;
    } catch (error) {
      throw new TokenExpiredException();
    }
  }

  async decodeToken(token: string): Promise<any> {
    return this.jwtService.decode(token);
  }
}
