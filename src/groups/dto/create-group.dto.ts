import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ description: 'Group name', example: 'TypeScript Enthusiasts' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Short description of the group', example: 'A group for TS lovers' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the group is private (invite-only)', example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
