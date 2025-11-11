import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Token } from './token.entities';
import { StoreAuthTokenWithUserIdDto } from '@user-auth/dto';

@Injectable()
export class TokenModelService {
  constructor(
    @InjectModel(Token.name)
    private readonly tokenModel: Model<Token>,
  ) {}

  /**
   * @description Checks if a token with the specified access and refresh tokens exists.
   * @param {string} accessToken - The access token to check.
   * @param {string} refreshToken - The refresh token to check.
   * @returns {Promise<Token | null>} A promise that resolves to the token if found, otherwise null.
   */
  checkToken(accessToken: string, refreshToken: string): Promise<Token | null> {
    return this.tokenModel.findOne({
      accessToken,
      refreshToken,
    });
  }

  /**
   * @description Checks the validity of an access token by querying the database.
   *
   * @param {string} accessToken - The access token to verify.
   * @returns {Promise<Token | null>} - A promise that resolves to the token details if found, or `null` if the token is invalid or does not exist.
   */
  checkAccessToken(accessToken: string): Promise<Token | null> {
    return this.tokenModel.findOne({
      accessToken,
    });
  }

  /**
   * @description Finds a token by its user ID.
   * @param {string} userId - The user ID to search for.
   * @returns {Promise<Token | null>} A promise that resolves to the token if found, otherwise null.
   */
  findRecentTokenByUserId(userId: string): Promise<Token | null> {
    return this.tokenModel
      .findOne({
        userId,
      })
      .sort({ createdAt: -1 });
  }

  /**
   * @description Stores a new token with the specified access and refresh tokens.
   * @param {StoreTokenDto | StoreAuthTokenDto} value - The token data to store.
   * @returns {Promise<Token>} A promise that resolves to the stored token.
   */
  storeToken(
    value: StoreAuthTokenWithUserIdDto,
  ): Promise<Token> {
    return this.tokenModel.create(value);
  }
}
