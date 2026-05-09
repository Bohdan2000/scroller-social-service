import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [ProfilesModule, EventsModule],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}
