import { JwtWebAuthService } from '@helper/jwt.helper.service';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { commonResponse } from '@utils/constant/common.constant';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    // private readonly adminModelService: AdminModelService,
    private readonly jwtService: JwtWebAuthService,
  ) {}

  /**
   * @method canActivate
   * @description Validates the incoming request to check if the user is authorized to access the requested resource by verifying the JWT token.
   * @param {ExecutionContext} context - The execution context containing the incoming HTTP request.
   * @returns {Promise<boolean>} - A promise that resolves to `true` if the user is authorized; otherwise, throws an `UnauthorizedException`.
   * @throws {UnauthorizedException} - Throws an exception if the token is invalid or missing, or if the user credentials are invalid.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers?.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException(commonResponse.invalidToken);
      }

      const token = authHeader.split(' ')[1];
      const decodedToken = await this.jwtService.validateToken(token);
      // const data = await this.adminModelService.getAdminById(
      //   decodedToken.adminId,
      // );
      // if (!data) {
      // throw new InvalidCredentials();
      // }
      // request.adminId = data._id;
      // request.sessionId = decodedToken.sessionId;
      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}
