import { HttpException, HttpStatus } from '@nestjs/common';

export class IncompleteBirthDetailsException extends HttpException {
  constructor() {
    super(
      {
        success: false,
        message: 'Incomplete birth details. Please update your profile with birth date, birth place, and full name.',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class AstrologyServiceException extends HttpException {
  constructor(message: string = 'Failed to generate astrology reading') {
    super(
      {
        success: false,
        message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
