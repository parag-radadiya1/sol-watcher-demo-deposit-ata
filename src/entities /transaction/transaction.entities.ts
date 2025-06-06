import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MongoSchema } from '@utils/classes/schema.classes';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User extends MongoSchema  {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true })
  pdaAddress: string;

  @Prop({ required: true })
  ataAddress: string;

  @Prop({ required: true })
  ownerWallet: string;

  @Prop({ default: false })
  isMonitoring: boolean;

  @Prop({ default: 0 })
  currentBalance: number;

  @Prop({ default: 0 })
  lastKnownBalance: number;

  @Prop({ type: Date })
  lastBalanceUpdate: Date;
}

export const userSchema = SchemaFactory.createForClass(User);
export const userModel = MongooseModule.forFeature([
  { name: User.name, schema: userSchema },
]);