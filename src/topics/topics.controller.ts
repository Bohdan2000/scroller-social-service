import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TopicsService } from './topics.service';
import { SetTopicsDto } from './dto/set-topics.dto';
import {
  PaginatedTopicsResponseDto,
  TopicPreferenceResponseDto,
} from './dto/topic-response.dto';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('topics')
@Controller()
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get('topics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all topics (public)' })
  @ApiResponse({ status: 200, type: PaginatedTopicsResponseDto })
  async listTopics(
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedTopicsResponseDto> {
    return this.topicsService.listTopics(pagination);
  }

  @Get('topics/me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get topic preferences for the current user' })
  @ApiResponse({ status: 200, type: [TopicPreferenceResponseDto] })
  @ApiResponse({ status: 401, type: ErrorResponseDto, description: 'Unauthorized' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'SOCIAL_001 — profile not found' })
  async getMyTopics(
    @CurrentUser('sub') userId: string,
  ): Promise<TopicPreferenceResponseDto[]> {
    return this.topicsService.getMyTopics(userId);
  }

  @Post('topics/me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Replace topic preferences for the current user' })
  @ApiResponse({ status: 200, type: [TopicPreferenceResponseDto] })
  @ApiResponse({ status: 401, type: ErrorResponseDto, description: 'Unauthorized' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'SOCIAL_001 — profile not found' })
  async setMyTopics(
    @CurrentUser('sub') userId: string,
    @Body() dto: SetTopicsDto,
  ): Promise<TopicPreferenceResponseDto[]> {
    return this.topicsService.setTopics(userId, dto);
  }

  @Put('me/topics')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Replace all topic preferences for the current user' })
  @ApiResponse({ status: 200, type: [TopicPreferenceResponseDto] })
  @ApiResponse({ status: 400, type: ErrorResponseDto, description: 'Invalid topic IDs' })
  @ApiResponse({ status: 401, type: ErrorResponseDto, description: 'Unauthorized' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'SOCIAL_001 — profile not found' })
  async setTopics(
    @CurrentUser('sub') userId: string,
    @Body() dto: SetTopicsDto,
  ): Promise<TopicPreferenceResponseDto[]> {
    return this.topicsService.setTopics(userId, dto);
  }
}
