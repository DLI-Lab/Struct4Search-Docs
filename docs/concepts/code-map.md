---
sidebar_position: 2
title: 디렉터리 구조
---

# 디렉터리 구조

저장소의 구성과 코드 위치를 한곳에 정리합니다. 실행 코드, 설정, 제품 화면, 테스트는 아래 위치를 기준으로 찾습니다.

## 저장소 루트

```text
Struct4Search/
├─ backend/                    백엔드 소스 코드
├─ configs/                    실행 프로파일, 서비스 정의, 모델·기계 경로 설정
├─ constraints/                검증된 CPU 의존성의 고정 버전
├─ deploy/                     Temporal 등 서비스 배포 파일
├─ frontend/                   React 제품 화면과 로컬 API 어댑터
├─ openapi/                    HTTP API 명세
├─ prompts/                    Metadata·Triple·검색표현·답변 프롬프트
├─ scripts/                    환경 적용과 운영 보조 명령
├─ tests/                      단위·회귀·E2E 테스트와 예제 데이터
├─ .env.example                호스트별 환경 변수 서식
├─ README.md                   프로젝트 소개와 빠른 시작
├─ REQUIREMENTS.md             OS·서비스·GPU 요구사항
├─ pyproject.toml              Python 패키지 정보, 의존성 범위, CLI 정의
├─ requirements.txt            GPU 제외 Python 설치 목록
└─ requirements-gpu.txt        GPU 모델 서비스 추가 설치 목록
```

`requirements.txt`는 GPU 없이 설치하는 Python 패키지 목록이고, `constraints/py312-cpu.txt`는 CPU 환경에서 검증한 고정 버전 목록입니다.

## 설치와 구성

아래 표의 백엔드 경로는 `backend/struct4search/` 기준입니다.

| 코드·설정 영역 | 확인할 문서 |
|---|---|
| `README.md`, `REQUIREMENTS.md`, `.env.example`, `pyproject.toml`, `requirements*.txt`, `constraints/` | [설치 요구사항](../reference/dependencies.md), [설치와 첫 실행](../quickstart.md) |
| `configs/`, `deploy/` | [설정](../reference/configuration.md), [설정 변경](../maintenance/configuration.md) |
| `bootstrap/`, `config/`, `core/`, `domain/` | [개요](../overview.md), [설정](../reference/configuration.md) |

## 문서 인덱싱

| 코드·설정 영역 | 확인할 문서 |
|---|---|
| `ingest/` | [문서 인덱싱 파이프라인](../indexing/overview.md) |
| `ingest/stages/` | [파싱](../indexing/parsing.md), [청킹](../indexing/chunking.md), [NER](../indexing/ner.md), [Metadata](../indexing/metadata.md), [지식그래프](../indexing/triple-kg.md), [검색표현](../indexing/retrieval-text.md) |
| `adapters/parsing/`, `adapters/persistence/`, `adapters/llm/` | [저장소와 재처리](../reference/storage.md), [API 계약](../reference/api-contract.md) |

## 검색과 답변

| 코드·설정 영역 | 확인할 문서 |
|---|---|
| `query/` | [검색·답변 파이프라인](../query/overview.md) |
| `query/retrieval/`, `adapters/search/` | [Hybrid 검색](../query/hybrid-search.md), [RRF](../query/rrf.md), [검색 결과 점수 통합](../query/score-integration.md) |
| `query/answer/` | [Context 구성](../query/context.md), [답변 형식](../query/structured-answer.md), [출처 연결](../query/citations.md) |
| `prompts/`, `resources/opensearch/` | [프롬프트 목록](../reference/prompts.md), [프롬프트 변경](../maintenance/prompts.md), [OpenSearch 인덱스 구조](../reference/opensearch-schema.md) |

## 서비스 실행과 제품 화면

| 코드·설정 영역 | 확인할 문서 |
|---|---|
| `entrypoints/cli/`, `entrypoints/workers/`, `orchestration/`, `scripts/ops/` | [실행 명령](../reference/cli.md) |
| `entrypoints/api/`, `openapi/` | [API 실행과 경로](../reference/api-reference.md), [API 계약](../reference/api-contract.md) |
| `frontend/`, `frontend/chatkit_demo/` | `frontend/README.md`, `frontend/chatkit_demo/README.md`, [API 실행과 경로](../reference/api-reference.md) |

## 테스트와 평가

| 코드·설정 영역 | 확인할 문서 |
|---|---|
| `evaluation/`, `tests/` | [테스트와 평가 시작하기](../testing/overview.md), [검색과 QA 평가 실행](../testing/retrieval-qa.md) |
| `e2e/`, `observability/` | [테스트와 평가 시작하기](../testing/overview.md) |

`.env`에는 접속 문자열과 API key만 둡니다. `struct4search-*` 명령은 실행할 때 `.env`를 자동으로 읽고, 이미 export한 값은 유지합니다. 검색·모델·프롬프트의 동작 값은 profile과 버전 관리된 설정 파일에서 관리합니다.
