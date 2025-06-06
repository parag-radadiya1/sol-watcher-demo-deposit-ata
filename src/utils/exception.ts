import { HttpException, HttpStatus } from '@nestjs/common';
import { commonResponse } from './constant';

export class CommonException extends HttpException {
  constructor(message: string, statusCode: HttpStatus, data: Error[] = []) {
    super(
      {
        statusCode,
        message,
        data,
      },
      statusCode,
    );
  }
}

export class InvalidObjectId extends CommonException {
  constructor(message?: string) {
    super(message || commonResponse.invalidObjectId, HttpStatus.BAD_REQUEST);
  }
}

export class TokenExpiredException extends CommonException {
  constructor(message?: string) {
    super(message || commonResponse.tokenExpired, HttpStatus.UNAUTHORIZED);
  }
}
