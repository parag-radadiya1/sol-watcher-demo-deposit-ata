import { TokenModelService } from '@entities-token/token.service';
import { UserModelService } from '@entities-user/user.service';
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  commonResponse,
} from '@utils/constant';
import { JwtWebAuthService } from './jwt.helper.service';
import { userResponse } from '@utils/constant/user.constant';

@Injectable()
export class GuardAuthService {
  constructor(
    private readonly userModelService: UserModelService,
    private readonly jwtService: JwtWebAuthService,
    private readonly tokenModelService: TokenModelService,
  ) {}



  /**
   * Validates the authentication token and retrieves user information.
   * @param token - The authentication token to validate.
   * @param request - The request object containing user information.
   * @param reqIp - The IP address of the request.
   * @param context - The execution context (optional).
   * @returns A promise that resolves to true if authentication is successful.
   * @throws UnauthorizedException if the token is invalid or user is not found.
   */
  async guardAuth(
    token: any,
    request: any,
    reqIp: string,
    context?: ExecutionContext,
  ): Promise<boolean> {
    const checkToken = await this.tokenModelService.checkAccessToken(token);
    if (checkToken) {
      throw new UnauthorizedException(commonResponse.invalidToken);
    }

    const decodedToken = await this.jwtService.validateToken(token);
    request.userId = decodedToken.userId;
    request.sessionId = decodedToken.sessionId;

    const userData = await this.userModelService.getUserById(request.userId);
    if (!userData) {
      throw new UnauthorizedException(userResponse.userNotFound);
    }

    if (!userData.isActive) {
      throw new UnauthorizedException(userResponse.userIsNotActive);
    }

    return true;
  }
}
