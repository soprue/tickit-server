# Tickit Server

Tickit Server는 Tickit Electron 앱의 사용자 인증, 섹션/리마인더 데이터 관리, 클라우드 동기화를 담당하는 NestJS 백엔드입니다.

## 기술 스택

- NestJS
- TypeScript
- PostgreSQL
- Prisma
- JWT / Passport
- Google OAuth
- Railway

## 주요 기능

- 이메일/비밀번호 회원가입 및 로그인
- JWT access token / refresh token 발급
- Google OAuth 로그인
- 섹션 CRUD
- 리마인더 CRUD
- 매일 반복 리마인더 초기화
- Swagger API 문서 제공

## 환경변수

`.env.example`을 참고해 `.env` 파일을 생성합니다.

```env
DATABASE_URL=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
ALLOWED_ORIGINS=
PORT=
```

예시:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/tickit?schema=public"
JWT_SECRET="your_very_secret_key_here"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"
ALLOWED_ORIGINS="http://localhost:5173"
PORT=3000
```

## 로컬 실행

```bash
npm install
npx prisma migrate deploy
npm run start:dev
```

서버는 기본적으로 아래 주소에서 실행됩니다.

```text
http://localhost:3000
```

## Prisma

Prisma Client 생성:

```bash
npx prisma generate
```

마이그레이션 적용:

```bash
npx prisma migrate deploy
```

## API 문서

로컬:

```text
http://localhost:3000/api/docs
```

Railway:

```text
https://tickit-server-production.up.railway.app/api/docs
```

## Railway 배포

Railway 백엔드 서비스에 아래 환경변수를 설정합니다.

```env
DATABASE_URL=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://tickit-server-production.up.railway.app/api/auth/google/callback
ALLOWED_ORIGINS=http://localhost:5173
```

Deploy 설정:

```text
Pre-deploy Command: npx prisma migrate deploy
Start Command: npm run start:prod
```

Railway는 `PORT` 환경변수를 자동으로 주입합니다. 서버는 Railway 배포 환경에서 `0.0.0.0`으로 바인딩됩니다.

## CORS

개발 중 Electron/Vite 프론트엔드는 기본적으로 아래 origin을 허용합니다.

```text
http://localhost:5173
```

패키징된 Electron 앱의 `file://` origin과 앱 전용 프로토콜인 `app://` origin도 서버 코드에서 허용합니다.

## 테스트

Unit test:

```bash
npm run test
```

E2E test:

```bash
npm run test:e2e
```

## Author

[soprue](https://github.com/soprue)
