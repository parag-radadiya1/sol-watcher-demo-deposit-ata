import { ConfigService } from '@nestjs/config';
import { MongoClient } from 'mongodb';

export const MongoProvider = {
  provide: MongoClient,
  useFactory: async (configService: ConfigService) => {
    const uri = configService.get<string>('DB_URI');
    return new MongoClient(uri);
  },
  inject: [ConfigService],
};
