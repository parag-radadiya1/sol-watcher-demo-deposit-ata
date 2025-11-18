import { CommonService } from '@helper/common.helper.service';
import { Module } from '@nestjs/common';
import { AssetsTypesSeederService } from './assetsTypes.seeder.service';
import { PlanSeederService } from './plan.seeder.service';
import { PlanModelModule } from '@entities-plan/plan.model.module';

@Module({
  imports: [PlanModelModule],
  providers: [CommonService, AssetsTypesSeederService, PlanSeederService],
})
export class SeedersModule {
  /**
   * @description Initializes the `SeedersModule` and triggers the data seeding process.
   */
  constructor(
    private readonly assetsTypesSeederService: AssetsTypesSeederService,
    private readonly planSeederService: PlanSeederService,
  ) {
    this.seedData(); // Trigger the seeding process on module initialization
  }

  /**
   * @description Seeds the database with default data for plans and assets concurrently.
   * @returns {Promise<void>} A promise that resolves when all seeding operations are completed.
   */
  private async seedData(): Promise<void> {
    await Promise.all([
      this.assetsTypesSeederService.createDefaultAssetsTypes(),
      this.planSeederService.createDefaultPlans(),
    ]);
  }
}
