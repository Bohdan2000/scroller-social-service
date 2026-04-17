import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { OnboardingStatusDto } from './dto/onboarding-status.dto';
import { OnboardingStep1Dto } from './dto/onboarding-step1.dto';
import { OnboardingStep2Dto } from './dto/onboarding-step2.dto';
import { ProfileResponseDto } from '../profiles/dto/profile-response.dto';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async getStatus(userId: string): Promise<OnboardingStatusDto> {
    const profile = await this.profilesService.findProfileByUserId(userId);
    if (!profile) {
      return { completed: false, step1Completed: false, step2Completed: false };
    }

    const step2Completed = profile.onboardingCompleted;
    const step1Completed = profile.displayName !== null || step2Completed;

    return {
      completed: profile.onboardingCompleted,
      step1Completed,
      step2Completed,
    };
  }

  async completeStep1(userId: string, dto: OnboardingStep1Dto): Promise<ProfileResponseDto> {
    const profile = await this.profilesService.ensureProfile(userId);

    const updated = await this.prisma.profile.update({
      where: { id: profile.id },
      data: {
        displayName: dto.displayName,
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      username: updated.username,
      displayName: updated.displayName,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl,
      onboardingCompleted: updated.onboardingCompleted,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async completeStep2(userId: string, dto: OnboardingStep2Dto): Promise<OnboardingStatusDto> {
    const profile = await this.profilesService.getProfileByUserId(userId);

    // Require step 1 to be done first
    if (!profile.displayName) {
      throw new BadRequestException('Complete step 1 (fill in your display name) before choosing topics');
    }

    // Validate that all supplied topicIds exist
    const topicIds = dto.topics.map((t) => t.topicId);
    const foundTopics = await this.prisma.topic.findMany({
      where: { id: { in: topicIds } },
      select: { id: true },
    });
    const foundIds = new Set(foundTopics.map((t) => t.id));
    const missing = topicIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(`Unknown topic IDs: ${missing.join(', ')}`);
    }

    // Replace topic preferences and mark onboarding complete in a single transaction
    await this.prisma.$transaction([
      this.prisma.userTopicPreference.deleteMany({ where: { profileId: profile.id } }),
      this.prisma.userTopicPreference.createMany({
        data: dto.topics.map((t) => ({
          profileId: profile.id,
          topicId: t.topicId,
          weight: t.weight ?? 1.0,
        })),
      }),
      this.prisma.profile.update({
        where: { id: profile.id },
        data: { onboardingCompleted: true },
      }),
    ]);

    return { completed: true, step1Completed: true, step2Completed: true };
  }
}
