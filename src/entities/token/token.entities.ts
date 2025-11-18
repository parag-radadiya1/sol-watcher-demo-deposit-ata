import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { MongoSchema } from '@utils/classes/schema.classes';
import { IsNotEmpty, IsString } from 'class-validator';
import { SchemaTypes } from 'mongoose';

@Schema({ timestamps: true, versionKey: false, collection: 'token' })
export class Token extends MongoSchema {
  @ApiProperty({ example: 'Bearer ajuiahdsbazjsbajhb' })
  @Prop({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({ example: 'ajuiahdsbazjsbajhbajsia' })
  @Prop({ type: String, default: '' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'user' })
  @ApiProperty({ type: String, example: '686dfc3c588c3e199d834c6f' })
  @IsString()
  userId?: string;
}

export const tokenSchema = SchemaFactory.createForClass(Token);
export const tokenModel = MongooseModule.forFeature([
  { name: Token.name, schema: tokenSchema },
]);
