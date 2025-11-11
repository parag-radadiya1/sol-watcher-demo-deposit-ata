import { GuardAuthService } from '@helper/guardAuth.helper.service';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { commonResponse } from '@utils/constant';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly guardAuthService: GuardAuthService) {}

  /**
   * @method canActivate
   * @description Authorization guard that verifies the JWT token and determines access based on the decoded module (USER or ORGANIZATION).
   *              Attaches the user or organization ID to the request object for further processing.
   * @param {ExecutionContext} context - The execution context from which to retrieve the HTTP request.
   * @returns {Promise<boolean>} A promise that resolves to true if authorization succeeds, otherwise throws an UnauthorizedException.
   * @throws {UnauthorizedException} Throws if the token is missing, invalid, or the associated user/organization is not found.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers?.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException(commonResponse.invalidToken);
      }

      const ip =
        request.headers['x-forwarded-for'] ||
        request.socket.remoteAddress ||
        null;

      const token = authHeader.split(' ')[1];
      return this.guardAuthService.guardAuth(token, request, ip, context);
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}
