import { HttpStatus } from '@nestjs/common';

export interface ITokenResponse {
  token: string;
  refreshToken: string;
}

export interface ICommonResponse<T> {
  statusCode: HttpStatus;
  message?: string;
  data?: T;
}

export interface ITokenCommonFields {
  iat: bigint;
  exp: bigint;
}

export interface UploadFile {
  buffer: Buffer;
  mimetype: string;
  filename: string;
  size: number;
}
