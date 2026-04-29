import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import {
  ProfileNotFoundException,
  UsernameAlreadyTakenException,
  UsernameRequiredForCreationException,
} from '../common/exceptions/domain.exceptions';
import { Profile } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Internal helper ────────────────────────────────────────────────────────

  /**
   * Returns the profile for the given Identity-Service userId, or null.
   * Used internally by all services that need to resolve userId → profile.
   */
  async findProfileByUserId(userId: string): Promise<Profile | null> {
    return this.prisma.profile.findUnique({ where: { userId } });
  }

  /**
   * Returns the profile for the given userId, throwing if not found.
   */
  async getProfileByUserId(userId: string): Promise<Profile> {
    const profile = await this.findProfileByUserId(userId);
    if (!profile) {
      throw new ProfileNotFoundException();
    }
    return profile;
  }

  /**
   * Returns the profile for the given userId, creating a minimal one if it does
   * not yet exist. Handles the race condition between the USER_REGISTERED event
   * being consumed and the user reaching the onboarding screen.
   */
  async ensureProfile(userId: string): Promise<Profile> {
    const existing = await this.findProfileByUserId(userId);
    if (existing) return existing;

    const username = `user_${userId.replace(/-/g, '').slice(0, 12)}`;
    try {
      return await this.prisma.profile.create({ data: { userId, username } });
    } catch (err: unknown) {
      if (this.isUniqueConstraintViolation(err, 'username')) {
        const fallback = `${username}_${randomBytes(2).toString('hex')}`;
        return await this.prisma.profile.create({ data: { userId, username: fallback } });
      }
      // Concurrent request may have created it — retry the read once
      const profile = await this.findProfileByUserId(userId);
      if (profile) return profile;
      throw err;
    }
  }

  // ─── Event-driven creation ───────────────────────────────────────────────────

  /**
   * Called when `user.registered` is received from RabbitMQ.
   * Creates a minimal profile with a generated username.
   * Idempotent — does nothing if the profile already exists.
   */
  async createFromEvent(userId: string, email: string): Promise<void> {
    const existing = await this.findProfileByUserId(userId);
    if (existing) {
      this.logger.debug(`Profile already exists for userId=${userId}, skipping`);
      return;
    }

    const username = this.generateUsername(email, userId);

    try {
      await this.prisma.profile.create({
        data: { userId, username },
      });
      this.logger.log(`Auto-created profile for userId=${userId} username=${username}`);
    } catch (err: unknown) {
      if (this.isUniqueConstraintViolation(err, 'username')) {
        // Collision — append more entropy and retry once
        const fallback = `${username}_${randomBytes(2).toString('hex')}`;
        await this.prisma.profile.create({
          data: { userId, username: fallback },
        });
        this.logger.log(`Auto-created profile (fallback) for userId=${userId} username=${fallback}`);
        return;
      }
      throw err;
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  async searchProfiles(
    callerUserId: string,
    q: string,
    page: number,
    limit: number,
  ): Promise<{ data: ProfileResponseDto[]; total: number }> {
    const trimmed = q.trim();
    const where = {
      userId: { not: callerUserId },
      onboardingCompleted: true,
      ...(trimmed && {
        OR: [
          { username: { contains: trimmed, mode: 'insensitive' as const } },
          { displayName: { contains: trimmed, mode: 'insensitive' as const } },
        ],
      }),
    };
    const [profiles, total] = await this.prisma.$transaction([
      this.prisma.profile.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { displayName: 'asc' },
      }),
      this.prisma.profile.count({ where }),
    ]);
    return { data: profiles.map(p => this.toResponse(p)), total };
  }

  async getMyProfile(userId: string): Promise<ProfileResponseDto> {
    const profile = await this.getProfileByUserId(userId);
    return this.toResponse(profile);
  }

  async upsertProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const existing = await this.findProfileByUserId(userId);

    // On first creation username is mandatory
    if (!existing && !dto.username) {
      throw new UsernameRequiredForCreationException();
    }

    try {
      if (existing) {
        const updated = await this.prisma.profile.update({
          where: { userId },
          data: {
            ...(dto.username !== undefined && { username: dto.username }),
            ...(dto.displayName !== undefined && { displayName: dto.displayName }),
            ...(dto.bio !== undefined && { bio: dto.bio }),
            ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
          },
        });
        this.emitEvent('profile.updated', { profileId: updated.id, userId });
        return this.toResponse(updated);
      } else {
        const created = await this.prisma.profile.create({
          data: {
            userId,
            username: dto.username as string,
            displayName: dto.displayName ?? null,
            bio: dto.bio ?? null,
            avatarUrl: dto.avatarUrl ?? null,
          },
        });
        this.emitEvent('profile.created', {
          profileId: created.id,
          userId,
          username: created.username,
        });
        return this.toResponse(created);
      }
    } catch (err: unknown) {
      if (this.isUniqueConstraintViolation(err, 'username')) {
        throw new UsernameAlreadyTakenException();
      }
      throw err;
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private toResponse(profile: Profile): ProfileResponseDto {
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

  /**
   * Derives a username from the email local-part + a short userId suffix.
   * Replaces non-alphanumeric chars with underscores; truncates to keep total ≤ 30 chars.
   */
  private generateUsername(email: string, userId: string): string {
    const localPart = email.split('@')[0] ?? 'user';
    const sanitized = localPart.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20);
    const suffix = userId.replace(/-/g, '').slice(0, 6);
    return `${sanitized}_${suffix}`;
  }

  private isUniqueConstraintViolation(err: unknown, field?: string): boolean {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as Record<string, unknown>)['code'] === 'P2002'
    ) {
      if (!field) return true;
      const meta = (err as Record<string, unknown>)['meta'] as
        | Record<string, unknown>
        | undefined;
      const target = meta?.['target'];
      if (Array.isArray(target)) {
        return target.includes(field);
      }
      return true;
    }
    return false;
  }

  private emitEvent(event: string, payload: Record<string, unknown>): void {
    this.logger.debug(`[event] ${event} ${JSON.stringify(payload)}`);
  }
}
