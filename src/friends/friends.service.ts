import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { SCROLLER_EXCHANGE, RoutingKeys } from '../events/events.constants';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import {
  FriendRequestResponseDto,
  FriendshipResponseDto,
  IncomingFriendRequestDto,
  PaginatedFriendsResponseDto,
} from './dto/friend-response.dto';
import { ProfileResponseDto } from '../profiles/dto/profile-response.dto';
import {
  AlreadyFriendsException,
  CannotSendRequestToSelfException,
  FriendRequestAlreadyExistsException,
  FriendRequestNotFoundException,
  FriendRequestNotPendingException,
  ProfileNotFoundException,
} from '../common/exceptions/domain.exceptions';
import { FriendRequest, FriendRequestStatus, Friendship, Profile } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class FriendsService {
  private readonly logger = new Logger(FriendsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
    private readonly amqp: AmqpConnection,
  ) {}

  async sendRequest(
    userId: string,
    dto: SendFriendRequestDto,
  ): Promise<FriendRequestResponseDto> {
    const requester = await this.profilesService.getProfileByUserId(userId);

    if (requester.id === dto.targetProfileId) {
      throw new CannotSendRequestToSelfException();
    }

    // Verify target profile exists
    const target = await this.prisma.profile.findUnique({
      where: { id: dto.targetProfileId },
    });
    if (!target) {
      throw new ProfileNotFoundException();
    }

    // Check if already friends (sorted IDs)
    const [profileAId, profileBId] = this.sortIds(requester.id, target.id);
    const existingFriendship = await this.prisma.friendship.findFirst({
      where: { profileAId, profileBId },
    });
    if (existingFriendship) {
      throw new AlreadyFriendsException();
    }

    // Check for pending request in EITHER direction
    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        status: 'pending',
        OR: [
          { requesterProfileId: requester.id, targetProfileId: target.id },
          { requesterProfileId: target.id, targetProfileId: requester.id },
        ],
      },
    });
    if (existingRequest) {
      throw new FriendRequestAlreadyExistsException();
    }

    const request = await this.prisma.friendRequest.create({
      data: {
        requesterProfileId: requester.id,
        targetProfileId: target.id,
        status: 'pending',
      },
    });

    void this.emitEvent('friend_request.sent', {
      requestId: request.id,
      requesterProfileId: requester.id,
      targetProfileId: target.id,
    });

    return this.toRequestResponse(request);
  }

  async acceptRequest(
    userId: string,
    requestId: string,
  ): Promise<FriendshipResponseDto> {
    const profile = await this.profilesService.getProfileByUserId(userId);

    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.targetProfileId !== profile.id) {
      throw new FriendRequestNotFoundException();
    }

    if (request.status !== 'pending') {
      throw new FriendRequestNotPendingException();
    }

    const [profileAId, profileBId] = this.sortIds(
      request.requesterProfileId,
      request.targetProfileId,
    );

    const [, friendship] = await this.prisma.$transaction([
      this.prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'accepted' },
      }),
      this.prisma.friendship.create({
        data: { profileAId, profileBId },
        include: {
          profileA: true,
          profileB: true,
        },
      }),
    ]);

    // Notify the original requester that their request was accepted
    const accepterProfile =
      friendship.profileAId === profile.id ? friendship.profileA : friendship.profileB;
    const requesterProfile =
      friendship.profileAId === request.requesterProfileId ? friendship.profileA : friendship.profileB;

    void this.emitEvent(RoutingKeys.FRIENDSHIP_CREATED, {
      followerId:       accepterProfile.userId,
      followedId:       requesterProfile.userId,
      followerName:     accepterProfile.displayName ?? accepterProfile.username,
      followerAvatarUrl: accepterProfile.avatarUrl ?? undefined,
    });

    // Return the OTHER profile as the friend
    const friendProfile =
      friendship.profileAId === profile.id ? friendship.profileB : friendship.profileA;

    return {
      id: friendship.id,
      friend: this.toProfileResponse(friendProfile as Profile),
      createdAt: friendship.createdAt,
    };
  }

  async rejectRequest(
    userId: string,
    requestId: string,
  ): Promise<FriendRequestResponseDto> {
    const profile = await this.profilesService.getProfileByUserId(userId);

    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.targetProfileId !== profile.id) {
      throw new FriendRequestNotFoundException();
    }

    if (request.status !== 'pending') {
      throw new FriendRequestNotPendingException();
    }

    const updated = await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'rejected' },
    });

    return this.toRequestResponse(updated);
  }

  async getFriends(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedFriendsResponseDto> {
    const profile = await this.profilesService.getProfileByUserId(userId);
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [friendships, total] = await Promise.all([
      this.prisma.friendship.findMany({
        where: {
          OR: [{ profileAId: profile.id }, { profileBId: profile.id }],
        },
        include: { profileA: true, profileB: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.friendship.count({
        where: {
          OR: [{ profileAId: profile.id }, { profileBId: profile.id }],
        },
      }),
    ]);

    const data: FriendshipResponseDto[] = friendships.map((fs) => {
      const friendProfile =
        fs.profileAId === profile.id ? fs.profileB : fs.profileA;
      return {
        id: fs.id,
        friend: this.toProfileResponse(friendProfile as Profile),
        createdAt: fs.createdAt,
      };
    });

    return { data, total, page, limit };
  }

  async getIncomingRequests(
    userId: string,
    pagination: PaginationDto,
  ): Promise<{ data: IncomingFriendRequestDto[]; total: number }> {
    const profile = await this.profilesService.getProfileByUserId(userId);
    const { page, limit } = pagination;

    const where = { targetProfileId: profile.id, status: FriendRequestStatus.pending };
    const [requests, total] = await Promise.all([
      this.prisma.friendRequest.findMany({
        where,
        include: { requester: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.friendRequest.count({ where }),
    ]);

    return {
      data: requests.map(r => ({
        id: r.id,
        requester: this.toProfileResponse(r.requester as Profile),
        createdAt: r.createdAt,
      })),
      total,
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Sorts two IDs lexicographically so that [a, b] satisfies a < b. */
  private sortIds(id1: string, id2: string): [string, string] {
    return id1 < id2 ? [id1, id2] : [id2, id1];
  }

  private toRequestResponse(request: FriendRequest): FriendRequestResponseDto {
    return {
      id: request.id,
      requesterProfileId: request.requesterProfileId,
      targetProfileId: request.targetProfileId,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  private toProfileResponse(profile: Profile): ProfileResponseDto {
    return {
      id: profile.id,
      userId: profile.userId,
      username: profile.username,
      displayName: profile.displayName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      onboardingCompleted: profile.onboardingCompleted,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  private async emitEvent(routingKey: string, payload: Record<string, unknown>): Promise<void> {
    try {
      await this.amqp.publish(SCROLLER_EXCHANGE, routingKey, payload);
      this.logger.debug(`[EVENT] ${routingKey}: ${JSON.stringify(payload)}`);
    } catch (err) {
      this.logger.error(`Failed to publish event ${routingKey}: ${(err as Error).message}`);
    }
  }
}
