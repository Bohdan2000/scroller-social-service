import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { PublicProfilesController } from './public-profiles.controller';
import { ProfilesService } from './profiles.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [ProfilesController, PublicProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
