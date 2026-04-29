import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import {
  GroupMemberResponseDto,
  GroupResponseDto,
} from './dto/group-response.dto';
import {
  AlreadyGroupMemberException,
  CannotRemoveGroupOwnerException,
  GroupAccessDeniedException,
  GroupMemberNotFoundException,
  GroupNotFoundException,
  InsufficientGroupRoleException,
  ProfileNotFoundException,
} from '../common/exceptions/domain.exceptions';
import { Group, GroupMember } from '@prisma/client';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async createGroup(
    userId: string,
    dto: CreateGroupDto,
  ): Promise<GroupResponseDto> {
    const profile = await this.profilesService.getProfileByUserId(userId);

    const [group] = await this.prisma.$transaction(async (tx) => {
      const newGroup = await tx.group.create({
        data: {
          ownerProfileId: profile.id,
          name: dto.name,
          description: dto.description ?? null,
          isPrivate: dto.isPrivate ?? false,
        },
      });

      await tx.groupMember.create({
        data: {
          groupId: newGroup.id,
          profileId: profile.id,
          role: 'owner',
        },
      });

      return [newGroup];
    });

    this.emitEvent('group.created', {
      groupId: group.id,
      ownerProfileId: group.ownerProfileId,
      name: group.name,
      isPrivate: group.isPrivate,
    });

    const memberCount = await this.prisma.groupMember.count({
      where: { groupId: group.id },
    });

    return this.toGroupResponse(group, memberCount);
  }

  async getGroup(
    groupId: string,
    userId: string | null,
  ): Promise<GroupResponseDto> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new GroupNotFoundException();
    }

    // Private group requires the requester to be a member
    if (group.isPrivate) {
      let profileId: string | null = null;

      if (userId) {
        const profile = await this.profilesService.findProfileByUserId(userId);
        profileId = profile?.id ?? null;
      }

      if (!profileId) {
        throw new GroupAccessDeniedException();
      }

      const membership = await this.prisma.groupMember.findFirst({
        where: { groupId: group.id, profileId },
      });

      if (!membership) {
        throw new GroupAccessDeniedException();
      }
    }

    const memberCount = await this.prisma.groupMember.count({
      where: { groupId: group.id },
    });

    return this.toGroupResponse(group, memberCount);
  }

  async updateGroup(
    userId: string,
    groupId: string,
    dto: UpdateGroupDto,
  ): Promise<GroupResponseDto> {
    const profile = await this.profilesService.getProfileByUserId(userId);

    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new GroupNotFoundException();

    const membership = await this.prisma.groupMember.findFirst({
      where: { groupId, profileId: profile.id },
    });
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new InsufficientGroupRoleException();
    }

    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      },
    });

    const memberCount = await this.prisma.groupMember.count({ where: { groupId } });
    return this.toGroupResponse(updated, memberCount);
  }

  async addMember(
    userId: string,
    groupId: string,
    dto: AddMemberDto,
  ): Promise<GroupMemberResponseDto> {
    const profile = await this.profilesService.getProfileByUserId(userId);

    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new GroupNotFoundException();
    }

    // Verify requester is owner or admin
    const requesterMembership = await this.prisma.groupMember.findFirst({
      where: { groupId, profileId: profile.id },
    });

    if (
      !requesterMembership ||
      (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin')
    ) {
      throw new InsufficientGroupRoleException();
    }

    // Verify target profile exists
    const targetProfile = await this.prisma.profile.findUnique({
      where: { id: dto.profileId },
    });
    if (!targetProfile) {
      throw new ProfileNotFoundException();
    }

    try {
      const newMember = await this.prisma.groupMember.create({
        data: {
          groupId,
          profileId: dto.profileId,
          role: 'member',
        },
      });

      this.emitEvent('group.member_added', {
        groupId,
        profileId: dto.profileId,
        role: 'member',
      });

      return this.toMemberResponse(newMember);
    } catch (err: unknown) {
      if (this.isUniqueConstraintViolation(err)) {
        throw new AlreadyGroupMemberException();
      }
      throw err;
    }
  }

  async removeMember(
    userId: string,
    groupId: string,
    targetProfileId: string,
  ): Promise<void> {
    const profile = await this.profilesService.getProfileByUserId(userId);

    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new GroupNotFoundException();
    }

    // Verify target member exists
    const targetMembership = await this.prisma.groupMember.findFirst({
      where: { groupId, profileId: targetProfileId },
    });
    if (!targetMembership) {
      throw new GroupMemberNotFoundException();
    }

    // Owner cannot be removed
    if (targetMembership.role === 'owner') {
      throw new CannotRemoveGroupOwnerException();
    }

    const requesterMembership = await this.prisma.groupMember.findFirst({
      where: { groupId, profileId: profile.id },
    });

    const isSelf = profile.id === targetProfileId;
    const isOwnerOrAdmin =
      requesterMembership?.role === 'owner' || requesterMembership?.role === 'admin';

    // Allow: owner/admin removing anyone, or a member removing themselves
    if (!isSelf && !isOwnerOrAdmin) {
      throw new InsufficientGroupRoleException();
    }

    // Admin cannot remove another admin — only owner can
    if (
      targetMembership.role === 'admin' &&
      requesterMembership?.role === 'admin' &&
      !isSelf
    ) {
      throw new InsufficientGroupRoleException();
    }

    await this.prisma.groupMember.delete({
      where: { id: targetMembership.id },
    });

    this.emitEvent('group.member_removed', { groupId, profileId: targetProfileId });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private toGroupResponse(group: Group, memberCount: number): GroupResponseDto {
    return {
      id: group.id,
      ownerProfileId: group.ownerProfileId,
      name: group.name,
      description: group.description,
      imageUrl: group.imageUrl ?? null,
      isPrivate: group.isPrivate,
      memberCount,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  private toMemberResponse(member: GroupMember): GroupMemberResponseDto {
    return {
      id: member.id,
      profileId: member.profileId,
      role: member.role,
      joinedAt: member.joinedAt,
    };
  }

  private isUniqueConstraintViolation(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as Record<string, unknown>)['code'] === 'P2002'
    );
  }

  private emitEvent(event: string, payload: Record<string, unknown>): void {
    this.logger.debug(`[event] ${event} ${JSON.stringify(payload)}`);
  }
}
