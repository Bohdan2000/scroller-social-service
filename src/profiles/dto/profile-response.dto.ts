import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'f1a2b3c4-d5e6-7890-abcd-ef1234567890', description: 'Identity Service user ID' })
  userId: string;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  displayName: string | null;

  @ApiPropertyOptional({ example: 'Senior software engineer' })
  bio: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatars/123.jpg' })
  avatarUrl: string | null;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
