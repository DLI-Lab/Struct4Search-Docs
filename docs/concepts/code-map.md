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

## 코드 ↔ 문서 대응

코드를 찾을 때 먼저 확인할 폴더만 정리합니다. 세부 구현 파일은 각 문서의 `코드 참조`에서 확인합니다.

| 코드 영역 | 역할 | 다루는 문서 |
|---|---|---|
| `configs/` | 실행 설정과 외부 서비스 구성을 관리합니다 | [설정](../reference/configuration.md), [설정 변경](../maintenance/configuration.md) |
| `prompts/` | Metadata·Triple·검색표현·답변 프롬프트와 버전을 관리합니다 | [프롬프트 목록](../reference/prompts.md), [프롬프트 변경](../maintenance/prompts.md) |
| `backend/struct4search/bootstrap/` | 설정에 맞는 Parser·LLM·저장소·검색 구현을 조립합니다 | [개요](../overview.md), [설정](../reference/configuration.md) |
| `backend/struct4search/ingest/` | 문서 인덱싱 단계의 순서, 재개와 완료 기록을 관리합니다 | [문서 인덱싱 파이프라인](../indexing/overview.md), [파이프라인 실행 및 재처리](../indexing/rerun.md) |
| `backend/struct4search/adapters/parsing/` | MinerU·Docling 등 Parser 결과를 공통 IDR 구조로 변환합니다 | [파싱](../indexing/parsing.md) |
| `backend/struct4search/adapters/llm/` | Metadata·Triple·답변 생성에 사용하는 모델 호출 구현을 둡니다 | [프롬프트 목록](../reference/prompts.md), [API 계약](../reference/api-contract.md) |
| `backend/struct4search/adapters/persistence/` | PostgreSQL을 비롯한 저장소 연동을 담당합니다 | [저장소와 재처리](../reference/storage.md) |
| `backend/struct4search/adapters/search/` | 질의 임베딩과 OpenSearch Hybrid 검색을 실행합니다 | [Hybrid 검색](../query/hybrid-search.md), [RRF](../query/rrf.md) |
| `backend/struct4search/query/` | 질의 처리, 검색 결과 통합, 답변과 출처 연결을 담당합니다 | [검색·답변 파이프라인](../query/overview.md) |
| `backend/struct4search/entrypoints/` | CLI, API와 백그라운드 worker의 실행 진입점을 제공합니다 | [실행 명령](../reference/cli.md), [API Reference](../reference/api-reference.md) |
| `backend/struct4search/orchestration/` | Temporal workflow와 실행 상태를 관리합니다 | [실행 명령](../reference/cli.md) |
| `openapi/` | HTTP 요청과 응답 형식의 명세를 보관합니다 | [API Reference](../reference/api-reference.md), [API 계약](../reference/api-contract.md) |
| `frontend/chatkit_demo/` | 문서 관리·파이프라인·검색 결과를 보여주는 React 화면과 로컬 API 어댑터입니다 | `frontend/chatkit_demo/README.md`, [API Reference](../reference/api-reference.md) |
| `backend/struct4search/evaluation/` | 검색·답변 지표와 회귀 gate를 계산합니다 | [검색과 QA 평가 실행](../testing/retrieval-qa.md) |
| `tests/` | 단위·회귀·통합 테스트와 예제 입력을 보관합니다 | [테스트와 평가 시작하기](../testing/overview.md) |

`.env`에는 접속 문자열과 API key만 둡니다. `struct4search-*` 명령은 실행할 때 `.env`를 자동으로 읽고, 이미 export한 값은 유지합니다. 검색·모델·프롬프트의 동작 값은 profile과 버전 관리된 설정 파일에서 관리합니다.
