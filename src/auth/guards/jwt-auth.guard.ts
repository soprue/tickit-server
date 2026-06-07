import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 기반 인증을 처리하는 가드입니다.
 * Passport의 'jwt' 전략을 사용하여 요청의 유효성을 검사합니다.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
