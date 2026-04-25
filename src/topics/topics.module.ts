import { Module } from '@nestjs/common';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [ProfilesModule, EventsModule],
  controllers: [TopicsController],
  providers: [TopicsService],
})
export class TopicsModule {}
