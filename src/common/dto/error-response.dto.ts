import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'SOCIAL_001', description: 'Machine-readable error code' })
  code: string;

  @ApiProperty({ example: 'Profile not found' })
  message: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/me/profile' })
  path: string;
}
