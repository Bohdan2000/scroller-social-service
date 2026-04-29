import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const CONTENT_TYPE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const PRESIGNED_URL_EXPIRES_SECONDS = 300; // 5 minutes

export interface UploadUrlResult {
  uploadUrl: string;
  fileUrl: string;
}

@Injectable()
export class UploadService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly cdnUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('s3.bucket', '');
    this.cdnUrl = config.get<string>('s3.cdnUrl', '');

    this.client = new S3Client({
      region: config.get<string>('s3.region', 'us-east-1'),
      credentials: {
        accessKeyId: config.get<string>('s3.accessKeyId', ''),
        secretAccessKey: config.get<string>('s3.secretAccessKey', ''),
      },
    });
  }

  async getImageUploadUrl(userId: string, contentType: string, folder = 'uploads'): Promise<UploadUrlResult> {
    const ext = CONTENT_TYPE_EXT[contentType] ?? 'jpg';
    const key = `${folder}/${userId}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: 'max-age=31536000',
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: PRESIGNED_URL_EXPIRES_SECONDS,
    });

    const fileUrl = this.cdnUrl
      ? `${this.cdnUrl}/${key}`
      : `https://${this.bucket}.s3.${this.config.get('s3.region')}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl };
  }

  async getAvatarUploadUrl(userId: string, contentType: string): Promise<UploadUrlResult> {
    const ext = CONTENT_TYPE_EXT[contentType] ?? 'jpg';
    const key = `avatars/${userId}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      // Only the uploader can write; objects are readable via bucket policy or CDN
      CacheControl: 'max-age=31536000',
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: PRESIGNED_URL_EXPIRES_SECONDS,
    });

    const fileUrl = this.cdnUrl
      ? `${this.cdnUrl}/${key}`
      : `https://${this.bucket}.s3.${this.config.get('s3.region')}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl };
  }
}
