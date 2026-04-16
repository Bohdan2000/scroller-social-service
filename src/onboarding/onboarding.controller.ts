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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { OnboardingStatusDto } from './dto/onboarding-status.dto';
import { OnboardingStep1Dto } from './dto/onboarding-step1.dto';
import { OnboardingStep2Dto } from './dto/onboarding-step2.dto';
import { ProfileResponseDto } from '../profiles/dto/profile-response.dto';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('onboarding')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard)
@Controller('me/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get onboarding status' })
  @ApiResponse({ status: 200, type: OnboardingStatusDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'SOCIAL_001 — profile not found' })
  async getStatus(
    @CurrentUser('sub') userId: string,
  ): Promise<OnboardingStatusDto> {
    return this.onboardingService.getStatus(userId);
  }

  @Patch('step1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete onboarding step 1 — fill in profile info',
    description: 'Sets display name (required), job title, bio and avatar URL.',
  })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto, description: 'Validation error' })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'SOCIAL_001 — profile not found' })
  async completeStep1(
    @CurrentUser('sub') userId: string,
    @Body() dto: OnboardingStep1Dto,
  ): Promise<ProfileResponseDto> {
    return this.onboardingService.completeStep1(userId, dto);
  }

  @Post('step2')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete onboarding step 2 — choose topics',
    description: 'Selects topics of interest and marks onboarding as completed. Step 1 must be done first.',
  })
  @ApiResponse({ status: 200, type: OnboardingStatusDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto, description: 'Step 1 not done or unknown topic IDs' })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'SOCIAL_001 — profile not found' })
  async completeStep2(
    @CurrentUser('sub') userId: string,
    @Body() dto: OnboardingStep2Dto,
  ): Promise<OnboardingStatusDto> {
    return this.onboardingService.completeStep2(userId, dto);
  }
}
