# 🎫 Tickit Server (틱잇 서버)

> **Tickit의 클라우드 전환 및 데이터 동기화를 위한 Nest.js 백엔드**

<div align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</div>

## 📖 프로젝트 소개

Tickit Server는 데스크탑 리마인더 애플리케이션 **Tickit**의 백엔드 시스템입니다. 
로컬 환경에 머물러 있던 데이터를 클라우드로 확장하고, 다바이스 간 동기화 및 사용자 인증을 담당합니다.

## 🛠 기술 스택

- **Framework**: Nest.js (TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Passport.js, JWT
- **Deployment**: Railway

## 📅 개발 로드맵 (Roadmap - Phase 2)

현재 **Phase 2: 클라우드 전환 및 백엔드 구축** 단계를 진행 중입니다.

- [ ] **백엔드 아키텍처 설계**: Nest.js 기반의 RESTful API 서버 초기 구축 및 환경 설정.
- [ ] **데이터 모델링**: Prisma ORM을 활용한 PostgreSQL 스키마 설계 및 마이그레이션.
- [ ] **인증 시스템 구현**: Passport.js와 JWT를 이용한 커스텀 인증(회원가입/로그인) 로직 개발.
- [ ] **클라우드 배포**: Railway를 연동한 지속적 배포(CD) 환경 구축.
- [ ] **데이터 동기화 API**: 클라이언트(Zustand)와 서버 DB 간의 리마인더 데이터 동기화 API 구현.

## 🚀 시작하기

### 설치

```bash
$ npm install
```

### 실행

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

### 테스트

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e
```

---

**Author**: [soprue](https://github.com/soprue)
