import { CommonService } from '@helper/common.helper.service';
import { Module } from '@nestjs/common';
import { AssetsTypesSeederService } from './assetsTypes.seeder.service';

@Module({
  imports: [],
  providers: [CommonService, AssetsTypesSeederService],
})
export class SeedersModule {
  /**
   * @description Initializes the `SeedersModule` and triggers the data seeding process.
   * @param {AdminSeederService} adminSeederService - Service to seed default admin data.
   * @param {OrganizationSeederService} organizationSeederService - Service to seed default organization data.
   * @param {AssetsSeederService} assetsSeederService - Service to seed default assets data.
   * @param {PlansSeederService} plansSeederService - Service to seed default plans data.
   * @param {JewelCategorySeederService} jewelCategorySeederService - Service to seed default jewel category data.
   * @param {AssetsTypesSeederService} assetsTypesSeederService - Service to seed default assets types data.
   */
  constructor(
    private readonly assetsTypesSeederService: AssetsTypesSeederService,
  ) {
    this.seedData(); // Trigger the seeding process on module initialization
  }

  /**
   * @description Seeds the database with default data for admin, organization, and assets concurrently.
   * @returns {Promise<void>} A promise that resolves when all seeding operations are completed.
   */
  private async seedData(): Promise<void> {
    await Promise.all([
      this.assetsTypesSeederService.createDefaultAssetsTypes(),
    ]);

    // await this.organizationSeederService.createDefaultOrganization();
  }
}
