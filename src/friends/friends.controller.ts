import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import {
  FriendRequestResponseDto,
  FriendshipResponseDto,
  PaginatedFriendsResponseDto,
} from './dto/friend-response.dto';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('friends')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard)
@Controller()
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('friends/requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiResponse({ status: 201, type: FriendRequestResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto, description: 'SOCIAL_010 — cannot send to self' })
  @ApiResponse({ status: 401, type: ErrorResponseDto, description: 'Unauthorized' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'SOCIAL_001 — profile not found' })
  @ApiResponse({ status: 409, type: ErrorResponseDto, description: 'SOCIAL_011 or SOCIAL_012' })
  async sendRequest(
    @CurrentUser('sub') userId: string,
    @Body() dto: SendFriendRequestDto,
  ): Promise<FriendRequestResponseDto> {
    return this.friendsService.sendRequest(userId, dto);
  }

  @Post('friends/requests/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a friend request (target only)' })
  @ApiParam({ name: 'id', description: 'Friend request ID' })
  @ApiResponse({ status: 200, type: FriendshipResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto, description: 'SOCIAL_014 — request not pending' })
  @ApiResponse({ status: 401, type: ErrorResponseDto, description: 'Unauthorized' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'SOCIAL_013 — request not found' })
  async acceptRequest(
    @CurrentUser('sub') userId: string,
    @Param('id') requestId: string,
  ): Promise<FriendshipResponseDto> {
    return this.friendsService.acceptRequest(userId, requestId);
  }

  @Post('friends/requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a friend request (target only)' })
  @ApiParam({ name: 'id', description: 'Friend request ID' })
  @ApiResponse({ status: 200, type: FriendRequestResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto, description: 'SOCIAL_014 — request not pending' })
  @ApiResponse({ status: 401, type: ErrorResponseDto, description: 'Unauthorized' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'SOCIAL_013 — request not found' })
  async rejectRequest(
    @CurrentUser('sub') userId: string,
    @Param('id') requestId: string,
  ): Promise<FriendRequestResponseDto> {
    return this.friendsService.rejectRequest(userId, requestId);
  }

  @Get('friends')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List friends (paginated)' })
  @ApiResponse({ status: 200, type: PaginatedFriendsResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto, description: 'Unauthorized' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'SOCIAL_001 — profile not found' })
  async getFriends(
    @CurrentUser('sub') userId: string,
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedFriendsResponseDto> {
    return this.friendsService.getFriends(userId, pagination);
  }
}
