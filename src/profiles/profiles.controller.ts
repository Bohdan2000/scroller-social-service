import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { ProfilesService } from './profiles.service';
import { UploadService, UploadUrlResult } from '../upload/upload.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

class GetAvatarUploadUrlDto {
  @ApiProperty({ enum: ['image/jpeg', 'image/png', 'image/webp'] })
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType: string;
}

@ApiTags('profiles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard)
@Controller('me/profile')
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly uploadService: UploadService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get own profile' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto, description: 'Unauthorized' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'SOCIAL_001 — profile not found' })
  async getMyProfile(
    @CurrentUser('sub') userId: string,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.getMyProfile(userId);
  }

  @Post('avatar/upload-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a presigned S3 URL to upload an avatar image' })
  @ApiResponse({ status: 200, description: '{ uploadUrl, fileUrl }' })
  @ApiResponse({ status: 401, type: ErrorResponseDto, description: 'Unauthorized' })
  async getAvatarUploadUrl(
    @CurrentUser('sub') userId: string,
    @Body() dto: GetAvatarUploadUrlDto,
  ): Promise<UploadUrlResult> {
    return this.uploadService.getAvatarUploadUrl(userId, dto.contentType);
  }

  @Post('image-upload-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a presigned S3 URL to upload a general-purpose image (e.g. group photo)' })
  @ApiResponse({ status: 200, description: '{ uploadUrl, fileUrl }' })
  @ApiResponse({ status: 401, type: ErrorResponseDto, description: 'Unauthorized' })
  async getImageUploadUrl(
    @CurrentUser('sub') userId: string,
    @Body() dto: GetAvatarUploadUrlDto,
  ): Promise<UploadUrlResult> {
    return this.uploadService.getImageUploadUrl(userId, dto.contentType, 'group-images');
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upsert own profile' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto, description: 'SOCIAL_004 — username required on creation' })
  @ApiResponse({ status: 401, type: ErrorResponseDto, description: 'Unauthorized' })
  @ApiResponse({ status: 409, type: ErrorResponseDto, description: 'SOCIAL_002 — username taken' })
  async upsertProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.upsertProfile(userId, dto);
  }
}
