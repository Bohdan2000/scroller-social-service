import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ProfilesModule } from './profiles/profiles.module';
import { TopicsModule } from './topics/topics.module';
import { FriendsModule } from './friends/friends.module';
import { GroupsModule } from './groups/groups.module';
import { JwtAccessStrategy } from './common/strategies/jwt-access.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      expandVariables: true,
    }),
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    PrismaModule,
    HealthModule,
    ProfilesModule,
    TopicsModule,
    FriendsModule,
    GroupsModule,
  ],
  providers: [JwtAccessStrategy],
})
export class AppModule {}
