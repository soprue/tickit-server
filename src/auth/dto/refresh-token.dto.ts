import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: '로그인 또는 토큰 갱신 응답으로 발급받은 리프레시 토큰',
  })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
