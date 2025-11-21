import { HttpStatus } from '@nestjs/common';
import { SwaggerResponse } from '@utils/classes';
import { BirthstoneSuccess, BirthstoneReadingSuccess, BirthstoneOverviewSuccess } from '../doc';
import { birthstoneResponse } from '@utils/constant';

export class BirthstoneSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  birthstoneResponse.birthstoneReadingInMarkdownFormatRetrievedSuccessfully,
  BirthstoneSuccess,
) {}

export class BirthstoneReadingSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  birthstoneResponse.birthstoneReadingRetrievedFromCache,
  BirthstoneReadingSuccess,
) {}

export class BirthstoneOverviewSuccessResponse extends SwaggerResponse(
  HttpStatus.OK,
  birthstoneResponse.birthstoneOverviewRetrievedSuccessfully,
  BirthstoneOverviewSuccess,
) {}
