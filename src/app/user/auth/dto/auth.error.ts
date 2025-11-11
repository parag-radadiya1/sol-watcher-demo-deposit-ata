import { HttpStatus } from '@nestjs/common';
import {
  authResponse,
  commonResponse,
} from '@utils/constant';
import { CommonException } from '@utils/exception';

export class InvalidCredentials extends CommonException {
  constructor(message?: string) {
    super(message || authResponse.invalidCredential, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidToken extends CommonException {
  constructor(message?: string) {
    super(message || commonResponse.invalidToken, HttpStatus.BAD_REQUEST);
  }
}

export class DuplicateEmailException extends CommonException {
  constructor(message?: string) {
    super(message || authResponse.duplicateEmailFound, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidRefreshToken extends CommonException {
  constructor(message?: string) {
    super(
      message || commonResponse.invalidRefreshToken,
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class OtpIsAlreadyUsedOrExpired extends CommonException {
  constructor(message?: string) {
    super(
      message || authResponse.otpIsAlreadyUserOrExpired,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UserNotFoundException extends CommonException {
  constructor(message?: string) {
    super(
      message || authResponse.userNotFound,
      HttpStatus.NOT_FOUND,
    );
  }
}
