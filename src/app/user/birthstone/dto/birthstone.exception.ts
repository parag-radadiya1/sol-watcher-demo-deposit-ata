import { HttpException, HttpStatus } from '@nestjs/common';

export class IncompleteBirthDetailsException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Incomplete birth details. Please update your profile with birth date, birth place, and name.',
        error: 'INCOMPLETE_BIRTH_DETAILS',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class BirthstoneServiceException extends HttpException {
  constructor(message: string = 'Failed to generate birthstone reading') {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message,
        error: 'BIRTHSTONE_SERVICE_ERROR',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

