import { Injectable } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { BODY_SIZE_LIMIT } from '@utils/constants';
import { ServerOptions } from 'socket.io';

@Injectable()
export class CustomSocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      maxHttpBufferSize: BODY_SIZE_LIMIT,
    });
    return server;
  }
}
