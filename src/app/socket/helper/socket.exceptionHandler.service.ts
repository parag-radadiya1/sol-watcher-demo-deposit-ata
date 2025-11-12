import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { commonResponse, commonSocketEvent } from '@utils/constant';

export class SocketExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    const socket = host.switchToWs().getClient();
    const args = host.getArgs();
    const event = args[3] || commonSocketEvent.error;

    const { response, error, message } = exception;

    const statusCode =
      response?.statusCode ??
      error?.statusCode ??
      HttpStatus.INTERNAL_SERVER_ERROR;

    const errorMessage =
      response?.message ??
      error?.message ??
      message ??
      commonResponse.internalServerError;

    socket.emit(event, {
      statusCode,
      message: errorMessage,
    });
  }
}
