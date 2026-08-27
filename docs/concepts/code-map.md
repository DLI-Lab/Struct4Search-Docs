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

경로 하나를 표의 한 행으로 두고, 저장소 루트에서 백엔드의 기능별 폴더로 내려가는 순서로 정리합니다. 세부 구현 파일은 각 문서의 `코드 참조`에서 확인합니다.

| 코드 영역 | 역할 | 다루는 문서 |
|---|---|---|
| `configs/` | 실행 설정과 외부 서비스 구성을 관리합니다 | [설치 요구사항](../reference/dependencies.md), [설정 수정](../maintenance/configuration.md) |
| `prompts/` | Metadata·Triple·검색표현·답변 프롬프트와 버전을 관리합니다 | [프롬프트와 출력 검증](../reference/prompts.md) |
| `openapi/` | HTTP 요청과 응답 형식의 명세를 보관합니다 | [API Reference](../reference/api-reference.md) |
| `frontend/chatkit_demo/` | 문서 관리·파이프라인·검색 결과를 보여주는 React 화면과 로컬 API 어댑터입니다 | `frontend/chatkit_demo/README.md`, [API Reference](../reference/api-reference.md) |
| `tests/` | 단위·회귀·통합 테스트와 예제 입력을 보관합니다 | [테스트와 평가 시작하기](../testing/overview.md) |
| `backend/struct4search/bootstrap/` | 설정에 맞는 Parser·LLM·저장소·검색 구현을 조립합니다 | [개요](../overview.md), [설정 수정](../maintenance/configuration.md) |
| `backend/struct4search/ingest/` | 인덱싱 단계의 실행 순서, 재개와 완료 기록을 관리합니다 | [문서 인덱싱 파이프라인](../indexing/overview.md), [파이프라인 실행 및 재처리](../indexing/rerun.md) |
| `backend/struct4search/ingest/stages/parsing/` | PDF 파싱과 페이지별 Parser 선택을 담당합니다 | [파싱](../indexing/parsing.md) |
| `backend/struct4search/ingest/stages/chunking/` | 파싱 결과를 고정 크기 원문 청크로 나눕니다 | [청킹](../indexing/chunking.md) |
| `backend/struct4search/ingest/stages/ner/` | 원문에서 Entity를 추출합니다 | [NER](../indexing/ner.md) |
| `backend/struct4search/ingest/stages/metadata/` | 문서 Metadata 18종의 규칙과 모델 추출을 담당합니다 | [Metadata](../indexing/metadata.md) |
| `backend/struct4search/ingest/stages/entity_local/` | Entity 주변의 관련 청크를 Triple 입력 단위로 묶습니다 | [지식그래프](../indexing/triple-kg.md) |
| `backend/struct4search/ingest/stages/triple/` | Entity와 근거 청크에서 Triple을 생성하고 검증합니다 | [지식그래프](../indexing/triple-kg.md) |
| `backend/struct4search/ingest/stages/knowledge_graph/` | 검증된 Triple을 문서 지식그래프로 구성하고 통합합니다 | [지식그래프](../indexing/triple-kg.md) |
| `backend/struct4search/ingest/stages/retrieval_expression/` | 지식그래프에서 G2 검색표현을 생성합니다 | [검색표현](../indexing/retrieval-text.md) |
| `backend/struct4search/ingest/stages/indexing/` | 원문·검색표현 embedding과 OpenSearch 색인을 담당합니다 | [OpenSearch 인덱싱](../indexing/opensearch.md) |
| `backend/struct4search/query/retrieval/` | 검색 결과를 정리하고 통합하여 최종 근거를 선택합니다 | [검색·답변 파이프라인](../query/overview.md), [검색 결과 통합](../query/score-integration.md) |
| `backend/struct4search/query/answer/` | 답변 Context, token 예산, 구조화 답변과 Citation을 처리합니다 | [Context 구성](../query/context.md), [구조화 답변](../query/structured-answer.md), [출처 표기](../query/citations.md) |
| `backend/struct4search/adapters/parsing/` | Parser 결과를 공통 IDR 구조로 변환합니다 | [파싱](../indexing/parsing.md) |
| `backend/struct4search/adapters/llm/` | local Qwen과 hosted GPT 호출을 공통 계약으로 제공합니다 | [모델 사용 위치](../reference/model-calls.md) |
| `backend/struct4search/adapters/persistence/` | PostgreSQL 문서·Metadata·KG 저장소를 연결합니다 | [저장소와 재처리](../reference/storage.md) |
| `backend/struct4search/adapters/search/` | 질의 embedding과 OpenSearch Hybrid 검색을 실행합니다 | [Hybrid 검색](../query/hybrid-search.md), [RRF](../query/rrf.md) |
| `backend/struct4search/entrypoints/` | CLI, API와 백그라운드 worker의 실행 진입점을 제공합니다 | [CLI Reference](../reference/cli.md), [API Reference](../reference/api-reference.md) |
| `backend/struct4search/orchestration/` | Temporal workflow, 단계 의존성과 실행 상태를 관리합니다 | [문서 인덱싱 파이프라인](../indexing/overview.md), [CLI Reference](../reference/cli.md) |
| `backend/struct4search/evaluation/` | 검색·답변 지표와 회귀 기준을 계산합니다 | [평가 실행과 통과 판정](../testing/retrieval-qa.md), [평가 지표](../testing/metrics.md) |

`.env`에는 접속 문자열과 API key만 둡니다. `struct4search-*` 명령은 실행할 때 `.env`를 자동으로 읽고, 이미 export한 값은 유지합니다. 검색·모델·프롬프트의 동작 값은 profile과 버전 관리된 설정 파일에서 관리합니다.
