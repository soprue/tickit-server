# 📝 Tickit Server 개발 태스크 (Phase 2)

이 파일은 **Phase 2: 클라우드 전환 및 백엔드 구축**을 위한 진행 상황을 관리합니다.

---

## 🧱 Step 1: 데이터베이스 인프라 및 Prisma 설정
- [ ] Prisma 및 관련 의존성 패키지 설치 (`@prisma/client`, `prisma`)
- [ ] `npx prisma init`으로 초기 환경 구성
- [ ] `User` 및 `Reminder` 기본 모델 설계 (`schema.prisma`)
- [ ] PostgreSQL DB 연결 환경 변수 설정 (`.env`)
- [ ] Prisma Service 및 Module 생성 (Global Module 권장)

## 🔐 Step 2: 인증 시스템 구현 (Auth)
- [ ] Passport.js 및 JWT 관련 패키지 설치
- [ ] `AuthModule`, `AuthService` 생성
- [ ] `User` 회원가입 및 로그인 로직 구현 (bcrypt 암호화 포함)
- [ ] JWT 발급 및 검증 Strategy 구현
- [ ] API 보호를 위한 `JwtAuthGuard` 작성

## 📋 Step 3: 리마인더 CRUD API 개발
- [ ] `RemindersModule` 리소스 생성 (Controller, Service, DTO)
- [ ] `User` - `Reminder` 1:N 관계 매핑 및 저장 로직 구현
- [ ] 리마인더 목록 조회, 생성, 수정, 삭제 API 구현
- [ ] `class-validator`를 이용한 요청 데이터 검증 (DTO)

## 🔄 Step 4: 데이터 동기화 전략 구현
- [ ] 리마인더 모델에 `updatedAt`, `deletedAt` (Soft Delete) 필드 추가
- [ ] 벌크 업데이트(Bulk Update/Upsert)를 위한 동기화 전용 엔드포인트 설계
- [ ] 클라이언트-서버 간 데이터 충돌 해결 로직(LWW: Last Write Wins) 구현

## 🚀 Step 5: 배포 및 운영 환경 설정
- [ ] `main.ts`에 CORS(Cross-Origin Resource Sharing) 설정
- [ ] Railway 배포 설정 및 환경 변수 등록
- [ ] 운영 환경용 빌드 및 실행 테스트
- [ ] 프론트엔드(`tickit-app`)와 연동 테스트

---

## ✅ 완료된 태스크
- [x] README.md 업데이트 및 로드맵 수립
- [x] 개발 단계별 상세 계획 수립
