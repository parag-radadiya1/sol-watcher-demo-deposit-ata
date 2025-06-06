import { HttpStatus } from '@nestjs/common';
import { SwaggerResponse } from '@utils/classes';
import { commonResponse } from '@utils/constant';

export class InvalidAuthTokenResponse extends SwaggerResponse(
  HttpStatus.UNAUTHORIZED,
  commonResponse.unauthorizedRequest,
  [],
) {}

export class InternalServerErrorResponse extends SwaggerResponse(
  HttpStatus.INTERNAL_SERVER_ERROR,
  commonResponse.internalServerError,
  [],
) {}

export class BadRequestResponse extends SwaggerResponse(
  HttpStatus.BAD_REQUEST,
  commonResponse.badRequest,
  [],
) {}
