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

저장소 루트에서 시작해 실제 처리 순서대로 내려갑니다. 같은 단계에 속한 파일은 한 행에 묶었습니다.

| 코드 영역 | 역할 | 다루는 문서 |
|---|---|---|
| `README.md`, `REQUIREMENTS.md`, `.env.example`, `pyproject.toml`, `requirements*.txt`, `constraints/` | 설치 조건, 환경 변수 서식, Python 의존성을 정의합니다 | [설치 요구사항](../reference/dependencies.md), [설치와 첫 실행](../quickstart.md) |
| `configs/`, `deploy/` | 실행 설정과 외부 서비스 구성을 관리합니다 | [설정](../reference/configuration.md), [설정 변경](../maintenance/configuration.md) |
| `prompts/` | Metadata·Triple·검색표현·답변 프롬프트와 버전을 관리합니다 | [프롬프트 목록](../reference/prompts.md), [프롬프트 변경](../maintenance/prompts.md) |
| `backend/struct4search/bootstrap/`, `backend/struct4search/config/`, `backend/struct4search/core/`, `backend/struct4search/domain/` | 설정을 읽고 검증한 뒤 단계별 구현을 조립하며 공통 계약을 정의합니다 | [개요](../overview.md), [설정](../reference/configuration.md) |
| `backend/struct4search/entrypoints/cli/ingest.py`, `backend/struct4search/ingest/front.py`, `backend/struct4search/ingest/back.py`, `backend/struct4search/ingest/service.py` | 인덱싱 명령을 받아 전체 단계의 실행 순서·재개·완료 기록을 관리합니다 | [문서 인덱싱 파이프라인](../indexing/overview.md), [파이프라인 실행 및 재처리](../indexing/rerun.md) |
| `backend/struct4search/parser_stage.py`, `backend/struct4search/page_routing.py`, `backend/struct4search/adapters/parsing/` | 페이지별 파서를 선택하고 PDF를 공통 IDR 구조로 변환합니다 | [파싱](../indexing/parsing.md) |
| `backend/struct4search/ingest/stages/fixed_chunk*.py` | 파싱 결과를 고정 규칙에 따라 원문 청크로 나눕니다 | [청킹](../indexing/chunking.md) |
| `backend/struct4search/ner_stage.py` | 문서에서 Entity를 추출하고 정규화합니다 | [NER](../indexing/ner.md) |
| `backend/struct4search/metadata_llm.py`, `backend/struct4search/ingest/stages/metadata_rules.py`, `backend/struct4search/domain/metadata_fields.*` | 문서의 18종 Metadata를 생성하고 필드 규칙을 검증합니다 | [Metadata](../indexing/metadata.md) |
| `backend/struct4search/ingest/stages/entity_local*.py` | 원문 청크와 Entity를 묶어 Triple 생성 단위를 만듭니다 | [지식그래프](../indexing/triple-kg.md) |
| `backend/struct4search/adapters/llm/*triple*.py`, `backend/struct4search/ingest/stages/triple_*.py` | Entity 주변 청크에서 Triple을 생성하고 근거를 검증합니다 | [지식그래프](../indexing/triple-kg.md) |
| `backend/struct4search/ingest/stages/graph_*.py`, `backend/struct4search/adapters/persistence/graph_sync.py` | 검증된 Triple로 문서 KG를 만들고 PostgreSQL에 반영합니다 | [지식그래프](../indexing/triple-kg.md), [저장소와 재처리](../reference/storage.md) |
| `backend/struct4search/ingest/stages/retrieval_expression_*.py` | KG와 Metadata에서 검색표현을 생성합니다 | [검색표현](../indexing/retrieval-text.md) |
| `backend/struct4search/index_stage.py` | 원문 청크와 검색표현을 임베딩하고 OpenSearch에 저장합니다 | [인덱싱](../indexing/opensearch.md), [OpenSearch 인덱스 구조](../reference/opensearch-schema.md) |
| `backend/struct4search/query/service.py`, `backend/struct4search/adapters/search/opensearch/embedding.py` | 사용자 질의를 검색어와 질의 임베딩으로 준비합니다 | [질의 처리](../query/request.md) |
| `backend/struct4search/adapters/search/opensearch/native_hybrid.py`, `backend/struct4search/resources/opensearch/` | BM25와 Dense 검색을 실행하고 OpenSearch RRF pipeline을 적용합니다 | [Hybrid 검색](../query/hybrid-search.md), [RRF](../query/rrf.md) |
| `backend/struct4search/query/retrieval/` | 검색표현의 점수를 원문 청크에 전달하고 최종 근거를 고릅니다 | [검색 결과 점수 통합](../query/score-integration.md) |
| `backend/struct4search/query/answer/context_renderer.py`, `backend/struct4search/query/answer/token_budget.py`, `backend/struct4search/query/answer/task_builder.py` | 선택한 근거를 답변 모델의 Context와 작업 지시로 구성합니다 | [Context 구성](../query/context.md) |
| `backend/struct4search/query/answer/reader*.py` | 답변 모델을 호출하고 구조화된 출력을 검증합니다 | [답변 형식](../query/structured-answer.md) |
| `backend/struct4search/query/answer/citation_*.py` | 답변의 인용을 검증하고 원본 문서 위치에 연결합니다 | [출처 연결](../query/citations.md) |
| `backend/struct4search/entrypoints/cli/`, `backend/struct4search/entrypoints/workers/`, `backend/struct4search/orchestration/`, `scripts/ops/` | CLI, worker, 서비스 실행과 종료를 담당합니다 | [실행 명령](../reference/cli.md) |
| `backend/struct4search/entrypoints/api/`, `openapi/` | 검색·답변과 문서 조회 HTTP API를 제공합니다 | [API 실행과 경로](../reference/api-reference.md), [API 계약](../reference/api-contract.md) |
| `frontend/chatkit_demo/` | 문서 관리·파이프라인·검색 결과를 보여주는 React 화면과 로컬 API 어댑터입니다 | `frontend/chatkit_demo/README.md`, [API 실행과 경로](../reference/api-reference.md) |
| `backend/struct4search/evaluation/`, `backend/struct4search/e2e/`, `backend/struct4search/observability/`, `tests/` | 검색·답변 품질, 전체 실행 흐름, 회귀 조건을 검증합니다 | [테스트와 평가 시작하기](../testing/overview.md), [검색과 QA 평가 실행](../testing/retrieval-qa.md) |

`.env`에는 접속 문자열과 API key만 둡니다. `struct4search-*` 명령은 실행할 때 `.env`를 자동으로 읽고, 이미 export한 값은 유지합니다. 검색·모델·프롬프트의 동작 값은 profile과 버전 관리된 설정 파일에서 관리합니다.
