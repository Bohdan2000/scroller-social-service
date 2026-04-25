import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [ProfilesModule, EventsModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
