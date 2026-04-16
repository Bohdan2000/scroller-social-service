import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { GroupMemberResponseDto, GroupResponseDto } from './dto/group-response.dto';
import { JwtAccessGuard, OptionalJwtAccessGuard } from '../common/guards/jwt-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a group' })
  @ApiResponse({ status: 201, type: GroupResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto, description: 'Unauthorized' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'SOCIAL_001 — profile not found' })
  async createGroup(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateGroupDto,
  ): Promise<GroupResponseDto> {
    return this.groupsService.createGroup(userId, dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get group by ID (private groups require membership)' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiResponse({ status: 200, type: GroupResponseDto })
  @ApiResponse({ status: 403, type: ErrorResponseDto, description: 'SOCIAL_021 — access denied' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'SOCIAL_020 — group not found' })
  async getGroup(
    @Param('id') groupId: string,
    @CurrentUser() user: { sub: string } | null,
  ): Promise<GroupResponseDto> {
    return this.groupsService.getGroup(groupId, user?.sub ?? null);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add a member to a group (owner or admin only)' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiResponse({ status: 201, type: GroupMemberResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto, description: 'Unauthorized' })
  @ApiResponse({ status: 403, type: ErrorResponseDto, description: 'SOCIAL_024 — insufficient role' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'SOCIAL_020 or SOCIAL_001' })
  @ApiResponse({ status: 409, type: ErrorResponseDto, description: 'SOCIAL_022 — already a member' })
  async addMember(
    @CurrentUser('sub') userId: string,
    @Param('id') groupId: string,
    @Body() dto: AddMemberDto,
  ): Promise<GroupMemberResponseDto> {
    return this.groupsService.addMember(userId, groupId, dto);
  }

  @Delete(':id/members/:profileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove a member from a group' })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiParam({ name: 'profileId', description: 'Profile ID of the member to remove' })
  @ApiResponse({ status: 204, description: 'Member removed' })
  @ApiResponse({ status: 400, type: ErrorResponseDto, description: 'SOCIAL_025 — cannot remove owner' })
  @ApiResponse({ status: 401, type: ErrorResponseDto, description: 'Unauthorized' })
  @ApiResponse({ status: 403, type: ErrorResponseDto, description: 'SOCIAL_024 — insufficient role' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'SOCIAL_020 or SOCIAL_023' })
  async removeMember(
    @CurrentUser('sub') userId: string,
    @Param('id') groupId: string,
    @Param('profileId') profileId: string,
  ): Promise<void> {
    return this.groupsService.removeMember(userId, groupId, profileId);
  }
}
