---
sidebar_position: 2
title: 디렉터리 구조
---

# 디렉터리 구조

저장소의 구성과 코드 위치를 한곳에 정리합니다. 실행 코드, 설정, 제품 화면, 테스트는 아래 위치를 기준으로 찾습니다.

## 저장소 루트

```text
Struct4Search/
├─ backend/
│  └─ struct4search/           Python 서비스 코드
├─ configs/                    실행 프로파일, 서비스 정의, 모델·기계 경로 설정
├─ constraints/                검증된 CPU 의존성의 고정 버전
├─ deploy/                     Temporal 등 서비스 배포 파일
├─ docs/                       저장소 내부의 설치·운영·설계 기록
├─ frontend/
│  └─ chatkit_demo/            React 제품 화면과 로컬 API 어댑터
├─ openapi/                    HTTP API 명세
├─ opensearch/                 검색 pipeline·mapping 정본
├─ prompts/                    Metadata·Triple·검색표현·답변 프롬프트
├─ scripts/
│  └─ ops/                     환경 적용과 운영 보조 명령
├─ tests/                      단위·회귀·E2E 테스트와 예제 데이터
├─ .env.example                호스트별 환경 변수 서식
├─ AGENTS.md                   저장소 작업 규칙
├─ CLAUDE.md                   Claude 작업 규칙
├─ README.md                   프로젝트 소개와 빠른 시작
├─ REQUIREMENTS.md             OS·서비스·GPU 요구사항
├─ pyproject.toml              Python 패키지 정보, 의존성 범위, CLI 정의
├─ requirements.txt            GPU 제외 Python 설치 목록
└─ requirements-gpu.txt        GPU 모델 서비스 추가 설치 목록
```

`requirements.txt`는 GPU 없이 설치하는 Python 패키지 목록이고, `constraints/py312-cpu.txt`는 CPU 환경에서 검증한 고정 버전 목록입니다.

## Python 서비스 코드

```text
backend/struct4search/
├─ ingest/                     문서 파싱부터 색인까지의 흐름
│  └─ stages/                  청킹·NER·Metadata·Triple·그래프·검색표현 단계
├─ query/                      검색·답변 흐름
│  ├─ retrieval/               검색 결과 투영·점수 통합·중복 제거
│  └─ answer/                  Context·답변·인용 처리
├─ adapters/                   OpenSearch·PostgreSQL·LLM·파서·Temporal 연결
├─ bootstrap/                  설정을 읽고 실제 구현을 조립하는 위치
├─ config/                     profile과 프롬프트 해석
├─ core/                       공통 계약, 오류, 실행 기록
├─ domain/                     문서·메타데이터의 도메인 정의
├─ entrypoints/                실행 진입점
│  ├─ cli/                     `struct4search-*` 명령
│  ├─ api/                     FastAPI 경로
│  └─ workers/                 ingest·Temporal·감시 worker
├─ evaluation/                 검색·QA 평가와 release gate
├─ e2e/                        승인된 E2E 실행 구성
├─ orchestration/              서비스 상태·workflow·실행 환경 관리
├─ resources/                  package에 포함되는 프롬프트·OpenSearch 파일
└─ observability/              상태와 인수인계 지표
```

## 제품 화면

```text
frontend/chatkit_demo/
├─ src/                         React 화면과 상태·API 연결 코드
├─ public/                      정적 파일
├─ scripts/                     화면·문서 관리 확인 스크립트
├─ server.py                    ChatKit 로컬 API 어댑터
├─ idr_service.py               문서 처리 결과를 읽는 로컬 API
├─ .env.example                 화면 전용 환경 변수 서식
├─ package.json                 Node.js 패키지와 실행 명령
└─ README.md                    화면 실행과 API 연결 방법
```

제품 화면은 OpenSearch나 PostgreSQL에 직접 연결하지 않습니다. `struct4search-stack --stack <stack> up`이 Response API, 문서 결과 API, ChatKit 어댑터, Vite 화면을 같은 설정으로 실행합니다. 화면만 따로 실행할 때는 `frontend/chatkit_demo/.env.example`을 사용합니다.

## 코드와 문서 대응

| 코드·설정 영역 | 확인할 문서 |
|---|---|
| `backend/struct4search/ingest/` | [문서 인덱싱 파이프라인](../indexing/overview.md) |
| `ingest/stages/` | [파싱](../indexing/parsing.md), [청킹](../indexing/chunking.md), [NER](../indexing/ner.md), [Metadata](../indexing/metadata.md), [지식그래프](../indexing/triple-kg.md), [검색표현](../indexing/retrieval-text.md) |
| `backend/struct4search/query/` | [검색·답변 파이프라인](../query/overview.md) |
| `query/retrieval/` | [Hybrid 검색](../query/hybrid-search.md), [RRF](../query/rrf.md), [검색 결과 점수 통합](../query/score-integration.md) |
| `query/answer/` | [Context 구성](../query/context.md), [답변 형식](../query/structured-answer.md), [출처 연결](../query/citations.md) |
| `adapters/` | [저장소와 재처리](../reference/storage.md), [API 계약](../reference/api-contract.md) |
| `bootstrap/`, `config/`, `configs/` | [설정](../reference/configuration.md), [설정 변경](../maintenance/configuration.md) |
| `entrypoints/cli/` | [실행 명령](../reference/cli.md) |
| `entrypoints/api/`, `openapi/` | [API 실행과 경로](../reference/api-reference.md), [API 계약](../reference/api-contract.md) |
| `evaluation/`, `e2e/`, `tests/` | [테스트와 평가 시작하기](../testing/overview.md), [검색과 QA 평가 실행](../testing/retrieval-qa.md) |
| `frontend/chatkit_demo/` | `frontend/README.md`, `frontend/chatkit_demo/README.md`, [API 실행과 경로](../reference/api-reference.md) |
| `opensearch/` | [OpenSearch 인덱스 구조](../reference/opensearch-schema.md), [Hybrid 검색](../query/hybrid-search.md) |
| `prompts/`, `resources/prompts/` | [프롬프트 목록](../reference/prompts.md), [프롬프트 변경](../maintenance/prompts.md) |
| `.env.example`, `requirements*.txt`, `constraints/` | [설치 요구사항](../reference/dependencies.md), [설치와 첫 실행](../quickstart.md) |

## 자주 바꾸는 위치

| 변경 대상 | 위치 |
|---|---|
| 실행 프로파일과 서비스 주소 | `configs/production.yaml`, `configs/services/` |
| 호스트별 DSN·API key·모델 경로 | `.env` — `.env.example`을 복사해 작성 |
| 검색 pipeline과 매핑 | `backend/struct4search/resources/opensearch/` |
| 프롬프트 본문과 등록 정보 | `backend/struct4search/resources/prompts/` |
| 제품 화면 | `frontend/chatkit_demo/src/` |
| Python 의존성 | `pyproject.toml`, `requirements.txt`, `constraints/py312-cpu.txt` |

`.env` 값을 적용하려면 `source scripts/ops/env.sh`를 실행합니다. `.env`에는 접속 문자열과 API key만 두고, 검색·모델·프롬프트의 동작 값은 profile과 버전 관리된 설정 파일에서 관리합니다.
