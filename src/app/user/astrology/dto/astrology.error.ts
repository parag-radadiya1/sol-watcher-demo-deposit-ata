import { HttpStatus } from '@nestjs/common';
import { CommonException } from '@utils/exception';
import { astrologyResponse } from '@utils/constant';

export class IncompleteBirthDetailsException extends CommonException {
  constructor() {
    super(astrologyResponse.incompleteBirthDetails, HttpStatus.BAD_REQUEST);
  }
}

export class AstrologyServiceException extends CommonException {
  constructor(message: string = astrologyResponse.astrologyServiceFailed) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class JobNotFoundException extends CommonException {
  constructor() {
    super(astrologyResponse.jobNotFound, HttpStatus.NOT_FOUND);
  }
}
