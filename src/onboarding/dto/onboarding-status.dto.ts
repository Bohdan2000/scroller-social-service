import { ApiProperty } from '@nestjs/swagger';

export class OnboardingStatusDto {
  @ApiProperty({ description: 'Whether all onboarding steps have been completed', example: false })
  completed: boolean;

  @ApiProperty({ description: 'Step 1 complete — displayName has been set', example: false })
  step1Completed: boolean;

  @ApiProperty({ description: 'Step 2 complete — topics have been chosen', example: false })
  step2Completed: boolean;
}
