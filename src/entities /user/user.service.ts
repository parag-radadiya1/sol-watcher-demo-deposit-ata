import { IAdminDateWiseTrendDataFromQuery } from '@admin-config/dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserCreateDto, UserUpdateDto } from '@organization-user/dto';
import {
  IUserDetail,
  IUserListGet,
  IUserWithPermissionAndPlanData,
  IUserWithPermissionData,
} from '@organization-user/dto/user.interface';
import { PAGINATION_CONFIG } from '@utils/constants';
import { PlanTypeEnum } from '@utils/enums';
import { ObjectId } from 'mongodb';
import {
  ClientSession,
  DeleteResult,
  FilterQuery,
  Model,
  PipelineStage,
  UpdateResult,
} from 'mongoose';
import { User } from './user.entities';
const ignorePlanType = [
  PlanTypeEnum.MODEL,
  PlanTypeEnum.IMAGE,
  PlanTypeEnum.VIDEO,
  PlanTypeEnum.PORTFOLIO,
  PlanTypeEnum.ADMIN_ORG_CORE,
];

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

  getUserTrentData(
    aggregation: PipelineStage[],
  ): Promise<IAdminDateWiseTrendDataFromQuery[]> {
    return this.userModel.aggregate(aggregation);
  }

  updateUserActiveStatus(
    _id: string,
    isActive: boolean,
  ): Promise<UpdateResult> {
    return this.userModel.updateOne({ _id }, { isActive });
  }

  createUser(
    value: UserCreateDto | User,
    session: ClientSession,
  ): Promise<User[]> {
    return this.userModel.create([value], { session });
  }

  getUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  getUserList(
    query: FilterQuery<User>,
    page: number = PAGINATION_CONFIG.page,
    limit: number = PAGINATION_CONFIG.limit,
  ): Promise<IUserListGet[]> {
    const skip = (page - 1) * limit;
    return this.userModel.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: 'cred',
          localField: 'credId',
          foreignField: '_id',
          as: 'email',
        },
      },
      {
        $addFields: {
          email: {
            $first: '$email.email',
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, ...(limit > 0 ? [{ $limit: limit }] : [])],
          totalCount: [{ $count: 'total' }],
        },
      },
      {
        $addFields: {
          totalCount: {
            $ifNull: [{ $first: '$totalCount.total' }, 0],
          },
        },
      },
    ]);
  }

  getUserDetail(_id: string): Promise<IUserDetail[]> {
    return this.userModel.aggregate([
      {
        $match: {
          _id: new ObjectId(_id),
        },
      },
      {
        $lookup: {
          from: 'cred',
          localField: 'credId',
          foreignField: '_id',
          as: 'email',
        },
      },
      {
        $lookup: {
          from: 'userPermission',
          localField: '_id',
          foreignField: 'userId',
          as: 'permission',
        },
      },
      {
        $project: {
          name: 1,
          isAdminBinded: 1,
          languagePref: 1,
          allowedIps: 1,
          isActive: 1,
          permission: {
            $first: '$permission.permission',
          },
          email: {
            $first: '$email.email',
          },
        },
      },
    ]);
  }

  deleteUserById(_id: string, session: ClientSession): Promise<DeleteResult> {
    return this.userModel.deleteOne({ _id }, { session });
  }

  updateUserById(
    _id: string,
    value: UserUpdateDto,
    session: ClientSession,
  ): Promise<User> {
    return this.userModel.findByIdAndUpdate(_id, value, { session, new: true });
  }

  getUserWithPermissionData(_id: string): Promise<IUserWithPermissionData[]> {
    return this.userModel.aggregate([
      {
        $match: {
          _id: new ObjectId(_id),
          isActive: true,
        },
      },
      {
        $lookup: {
          from: 'userPermission',
          localField: '_id',
          foreignField: 'userId',
          as: 'permission',
        },
      },
      {
        $lookup: {
          from: 'organization',
          localField: 'orgId',
          foreignField: '_id',
          as: 'organization',
        },
      },
      {
        $project: {
          orgId: 1,
          allowedIps: 1,
          permission: {
            $first: '$permission.permission',
          },
          planDetail: {
            $filter: {
              input: {
                $first: '$organization.planDetail',
              },
              as: 'item',
              cond: {
                $and: [
                  {
                    $gte: [
                      {
                        $dateToString: {
                          format: '%Y-%m-%d',
                          date: '$$item.endDate',
                        },
                      },
                      {
                        $dateToString: { format: '%Y-%m-%d', date: new Date() },
                      },
                    ],
                  },
                  {
                    $not: {
                      $in: ['$$item.type', ignorePlanType],
                    },
                  },
                ],
              },
            },
          },
          orgActive: { $first: '$organization.isActive' },
        },
      },
    ]);
  }

  getUserWithPermissionAndPlanData(
    _id: string,
  ): Promise<IUserWithPermissionAndPlanData[]> {
    return this.userModel.aggregate([
      {
        $match: {
          _id: new ObjectId(_id),
        },
      },
      {
        $lookup: {
          from: 'organization',
          localField: 'orgId',
          foreignField: '_id',
          as: 'organization',
        },
      },
      {
        $lookup: {
          from: 'userPermission',
          localField: '_id',
          foreignField: 'userId',
          as: 'permission',
        },
      },
      {
        $addFields: {
          orgPlanDetail: {
            $filter: {
              input: {
                $first: '$organization.planDetail',
              },
              as: 'item',
              cond: {
                $and: [
                  {
                    $gte: [
                      {
                        $dateToString: {
                          format: '%Y-%m-%d',
                          date: '$$item.endDate',
                        },
                      },
                      {
                        $dateToString: { format: '%Y-%m-%d', date: new Date() },
                      },
                    ],
                  },
                  {
                    $not: {
                      $in: ['$$item.type', ignorePlanType],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'plans',
          localField: 'orgPlanDetail.planRefId',
          foreignField: '_id',
          as: 'plans',
        },
      },
      {
        $lookup: {
          from: 'modelUploadCounter',
          let: { orgId: '$orgId', currentDate: new Date() },
          as: 'modelLimit',
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$orgId', '$$orgId'] },
                    {
                      $gte: [
                        {
                          $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$endDate',
                          },
                        },
                        {
                          $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$$currentDate',
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: '$orgId',
                totalModelUploadCount: {
                  $sum: '$modelUploadCount',
                },
                totalCurrentLimit: {
                  $sum: '$currentLimit',
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          name: 1,
          orgName: {
            $first: '$organization.name',
          },
          orgPlanDetail: {
            $map: {
              input: '$orgPlanDetail',
              as: 'prod',
              in: {
                $mergeObjects: [
                  '$$prod',
                  {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: '$plans',
                              as: 'product',
                              cond: {
                                $eq: ['$$product._id', '$$prod.planRefId'],
                              },
                            },
                          },
                          as: 'filteredPlan',
                          in: {
                            planName: '$$filteredPlan.name',
                            planCategory: '$$filteredPlan.category',
                          },
                        },
                      },
                      0,
                    ],
                  },
                ],
              },
            },
          },
          userPermission: {
            $first: '$permission.permission',
          },
          modelLimit: {
            $subtract: [
              {
                $first: '$modelLimit.totalCurrentLimit',
              },
              {
                $first: '$modelLimit.totalModelUploadCount',
              },
            ],
          },
        },
      },
    ]);
  }
}
