import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class OnboardingStep1Dto {
  @ApiProperty({ description: 'Display name (required for step 1)', example: 'John Doe' })
  @IsString()
  @MaxLength(50)
  displayName: string;

  @ApiPropertyOptional({ description: 'Short bio', example: 'Passionate about cloud infrastructure.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ description: 'Avatar URL', example: 'https://cdn.example.com/avatars/123.jpg' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
