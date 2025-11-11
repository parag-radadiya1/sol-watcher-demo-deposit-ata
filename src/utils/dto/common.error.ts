import { HttpStatus } from '@nestjs/common';
import { commonResponse } from '@utils/constant';
import { CommonException } from '@utils/exception';

export class RequestValidateResponse extends CommonException {
  constructor(message?: string) {
    super(message || commonResponse.forbiddenRequest, HttpStatus.FORBIDDEN);
  }
}

export class InvalidEmailException extends CommonException {
  constructor(message?: string) {
    super(
      message || commonResponse.invalidEmailAddress,
      HttpStatus.BAD_REQUEST,
    );
  }
}
