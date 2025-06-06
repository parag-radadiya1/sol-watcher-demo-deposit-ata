import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({})
export class DatabaseModule {
  static forRoot(uri: string) {
    return {
      module: DatabaseModule,
      imports: [MongooseModule.forRoot(uri)],
    };
  }
}
