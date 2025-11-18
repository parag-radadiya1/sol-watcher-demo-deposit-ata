import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ClientSession,
  DeleteResult,
  Model,
  UpdateResult,
} from 'mongoose';
import { User } from './user.entities';

@Injectable()
export class UserModelService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  getUser(email: string): Promise<User | null> {
    return this.userModel.findOne({
      email,
      isActive: true,
    });
  }

  getUserByCredId(credId: string): Promise<User | null> {
    return this.userModel.findOne({ credId, isActive: true });
  }

  getUserByIdAndOrgId(_id: string, orgId: string): Promise<User | null> {
    return this.userModel.findOne({ _id, orgId, isAdminBinded: false });
  }

  // update user by id
  updateUserById(
    _id: string,
    value: Partial<User>,
    session?: ClientSession,
  ): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      _id,
      value,
      { new: true, session },
    );
  }

  updateUserActiveStatus(
    _id: string,
    isActive: boolean,
  ): Promise<UpdateResult> {
    return this.userModel.updateOne({ _id }, { isActive });
  }

  createUser(
    value: User,
    session: ClientSession,
  ): Promise<User[]> {
    return this.userModel.create([value], { session });
  }

  checkCred(email: string, _id?: string): Promise<User | null> {
    return this.userModel.findOne({
      ...(_id ? { _id: { $ne: _id } } : {}),
      email,
    });
  }


  getUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id).lean();
  }

  deleteUserById(_id: string, session: ClientSession): Promise<DeleteResult> {
    return this.userModel.deleteOne({ _id }, { session });
  }

  // Add method to get user by mobile number
  getUserByMobileNumber(mobileNumber: string, countryCode: string): Promise<User | null> {
    return this.userModel.findOne({
      mobileNumber,
      countryCode,
      isActive: true,
    });
  }

  // Update user's last astrology job ID
  updateLastAstrologyJobId(userId: string, jobId: string): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { lastAstrologyJobId: jobId },
      { new: true },
    );
  }

  // Update user's last birthstone job ID
  updateLastBirthstoneJobId(userId: string, jobId: string): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { lastBirthstoneJobId: jobId },
      { new: true },
    );
  }
}
