import { HttpStatus } from '@nestjs/common';
import { CommonException } from '@utils/exception';
import { birthstoneResponse } from '@utils/constant';

export class IncompleteBirthDetailsException extends CommonException {
  constructor() {
    super(birthstoneResponse.incompleteBirthDetails, HttpStatus.BAD_REQUEST);
  }
}

export class BirthstoneServiceException extends CommonException {
  constructor(message: string = birthstoneResponse.birthstoneServiceFailed) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
