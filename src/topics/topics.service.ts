import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { SetTopicsDto } from './dto/set-topics.dto';
import {
  PaginatedTopicsResponseDto,
  TopicPreferenceResponseDto,
  TopicResponseDto,
} from './dto/topic-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Topic } from '@prisma/client';

@Injectable()
export class TopicsService {
  private readonly logger = new Logger(TopicsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async listTopics(pagination: PaginationDto): Promise<PaginatedTopicsResponseDto> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [topics, total] = await Promise.all([
      this.prisma.topic.findMany({
        skip,
        take: limit,
        orderBy: { title: 'asc' },
      }),
      this.prisma.topic.count(),
    ]);

    return {
      data: topics.map((t) => this.toTopicResponse(t)),
      total,
      page,
      limit,
    };
  }

  async getMyTopics(userId: string): Promise<TopicPreferenceResponseDto[]> {
    const profile = await this.profilesService.getProfileByUserId(userId);

    const preferences = await this.prisma.userTopicPreference.findMany({
      where: { profileId: profile.id },
      include: { topic: true },
      orderBy: { weight: 'desc' },
    });

    return preferences.map((pref) => ({
      id: pref.id,
      topic: this.toTopicResponse(pref.topic),
      weight: pref.weight,
      createdAt: pref.createdAt,
    }));
  }

  async setTopics(
    userId: string,
    dto: SetTopicsDto,
  ): Promise<TopicPreferenceResponseDto[]> {
    const profile = await this.profilesService.getProfileByUserId(userId);

    // Validate that all supplied topicIds exist
    if (dto.topics.length > 0) {
      const topicIds = dto.topics.map((t) => t.topicId);
      const foundTopics = await this.prisma.topic.findMany({
        where: { id: { in: topicIds } },
        select: { id: true },
      });
      const foundIds = new Set(foundTopics.map((t) => t.id));
      const missing = topicIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new BadRequestException(
          `Unknown topic IDs: ${missing.join(', ')}`,
        );
      }
    }

    // Replace all preferences in a transaction
    await this.prisma.$transaction([
      this.prisma.userTopicPreference.deleteMany({
        where: { profileId: profile.id },
      }),
      ...(dto.topics.length > 0
        ? [
            this.prisma.userTopicPreference.createMany({
              data: dto.topics.map((t) => ({
                profileId: profile.id,
                topicId: t.topicId,
                weight: t.weight ?? 1.0,
              })),
            }),
          ]
        : []),
    ]);

    // Re-fetch with topic relation for the response
    const preferences = await this.prisma.userTopicPreference.findMany({
      where: { profileId: profile.id },
      include: { topic: true },
      orderBy: { createdAt: 'asc' },
    });

    return preferences.map((pref) => ({
      id: pref.id,
      topic: this.toTopicResponse(pref.topic),
      weight: pref.weight,
      createdAt: pref.createdAt,
    }));
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private toTopicResponse(topic: Topic): TopicResponseDto {
    return {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      createdAt: topic.createdAt,
    };
  }

  private emitEvent(event: string, payload: Record<string, unknown>): void {
    this.logger.debug(`[event] ${event} ${JSON.stringify(payload)}`);
  }
}
