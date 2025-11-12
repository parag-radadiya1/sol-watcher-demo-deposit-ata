import { GuardAuthService } from '@helper/guardAuth.helper.service';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { commonResponse } from '@utils/constant/common.constant';

@Injectable()
export class SocketAuthGuard implements CanActivate {
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
      const ws = context.switchToWs();
      const socket = ws.getClient();

      const authHeader = socket.handshake.auth.token;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException(commonResponse.invalidToken);
      }
      const ip =
        socket.handshake.headers['x-forwarded-for'] ||
        socket.handshake.address ||
        null;

      const token = authHeader.split('Bearer ')[1];
      return this.guardAuthService.guardAuth(token, socket.data, ip, context);
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}
