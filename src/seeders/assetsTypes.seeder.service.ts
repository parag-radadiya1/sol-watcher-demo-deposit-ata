import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { assetsTypes } from './constant';

@Injectable()
export class AssetsTypesSeederService {
  constructor() {} // private readonly assetsTypesModel: Model<AssetsTypes>, // @InjectModel(AssetsTypes.name)

  /**
   * @description Creates default assets in the database if no assets already exist.
   *              If assets are already present, this method does nothing.
   * @returns {Promise<void>} A promise that resolves when the default assets are created or if they already exist.
   */
  async createDefaultAssetsTypes(): Promise<void> {
    //   const check = await this.assetsTypesModel.findOne({});
    //   if (check) {
    //     return;
    //   }
    //   await this.assetsTypesModel.insertMany(assetsTypes);
  }
}
