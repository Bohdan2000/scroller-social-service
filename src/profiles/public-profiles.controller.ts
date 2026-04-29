import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProfilesService } from './profiles.service';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class SearchProfilesDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

@ApiTags('profiles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard)
@Controller('profiles')
export class PublicProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search profiles by username or display name' })
  async searchProfiles(
    @CurrentUser('sub') userId: string,
    @Query() dto: SearchProfilesDto,
  ): Promise<{ data: ProfileResponseDto[]; total: number }> {
    return this.profilesService.searchProfiles(
      userId,
      dto.q ?? '',
      dto.page ?? 1,
      dto.limit ?? 20,
    );
  }
}
