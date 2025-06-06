import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export const SwaggerResponse = <T>(
  statusCode: HttpStatus,
  message: string,
  data: T,
) => {
  class Response {
    @ApiProperty({
      example: statusCode,
    })
    statusCode: number;

    @ApiProperty({
      example: message,
    })
    message: string;

    @ApiProperty({
      example: data,
    })
    data: T;
  }
  return Response;
};
