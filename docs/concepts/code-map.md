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

저장소 루트에서 시작해 실제 처리 순서대로 내려갑니다. 표의 한 행은 하나의 파일 또는 폴더만 가리킵니다.

| 코드 영역 | 역할 | 다루는 문서 |
|---|---|---|
| `README.md` | 프로젝트 소개와 기본 실행 순서를 안내합니다 | [개요](../overview.md), [설치와 첫 실행](../quickstart.md) |
| `REQUIREMENTS.md` | OS, Python, 외부 서비스와 GPU 요구사항을 정리합니다 | [설치 요구사항](../reference/dependencies.md) |
| `.env.example` | 호스트마다 입력할 환경 변수의 서식을 제공합니다 | [설치와 첫 실행](../quickstart.md), [설정](../reference/configuration.md) |
| `pyproject.toml` | Python 패키지, 의존성 범위와 공개 CLI를 정의합니다 | [설치 요구사항](../reference/dependencies.md), [실행 명령](../reference/cli.md) |
| `requirements.txt` | GPU 없이 설치하는 Python 패키지 목록입니다 | [설치 요구사항](../reference/dependencies.md) |
| `requirements-gpu.txt` | GPU 모델 서비스에 추가로 필요한 패키지 목록입니다 | [설치 요구사항](../reference/dependencies.md) |
| `constraints/` | CPU 환경에서 검증한 의존성 버전을 고정합니다 | [설치 요구사항](../reference/dependencies.md) |
| `configs/` | 실행 설정과 외부 서비스 구성을 관리합니다 | [설정](../reference/configuration.md), [설정 변경](../maintenance/configuration.md) |
| `deploy/` | Temporal 등 외부 서비스를 배포하는 파일을 둡니다 | [설치 요구사항](../reference/dependencies.md), [실행 명령](../reference/cli.md) |
| `prompts/` | Metadata·Triple·검색표현·답변 프롬프트와 버전을 관리합니다 | [프롬프트 목록](../reference/prompts.md), [프롬프트 변경](../maintenance/prompts.md) |
| `backend/struct4search/bootstrap/` | 설정에 맞는 Parser·LLM·저장소·검색 구현을 조립합니다 | [개요](../overview.md), [설정](../reference/configuration.md) |
| `backend/struct4search/config/` | YAML 설정을 읽고 상속·필수값·형식을 검증합니다 | [설정](../reference/configuration.md) |
| `backend/struct4search/core/` | 공통 오류, 설정 view와 실행 기반을 제공합니다 | [개요](../overview.md), [설정](../reference/configuration.md) |
| `backend/struct4search/domain/` | 단계 사이에서 사용하는 데이터 계약과 Metadata 정의를 둡니다 | [개요](../overview.md), [Metadata](../indexing/metadata.md) |
| `backend/struct4search/entrypoints/cli/ingest.py` | 문서 인덱싱 명령의 인자와 시작 절차를 담당합니다 | [파이프라인 실행 및 재처리](../indexing/rerun.md), [실행 명령](../reference/cli.md) |
| `backend/struct4search/ingest/front.py` | 파싱부터 Metadata까지 앞부분의 실행 순서를 연결합니다 | [문서 인덱싱 파이프라인](../indexing/overview.md) |
| `backend/struct4search/ingest/back.py` | Entity 주변 청크부터 KG·검색표현·인덱싱까지 연결합니다 | [문서 인덱싱 파이프라인](../indexing/overview.md) |
| `backend/struct4search/ingest/service.py` | 재개, 단계 완료 기록과 문서 완료 판정을 관리합니다 | [파이프라인 실행 및 재처리](../indexing/rerun.md), [저장소와 재처리](../reference/storage.md) |
| `backend/struct4search/parser_stage.py` | 선택된 Parser를 실행하고 파싱 결과를 다음 단계로 넘깁니다 | [파싱](../indexing/parsing.md) |
| `backend/struct4search/page_routing.py` | 페이지 특성에 따라 사용할 Parser를 정합니다 | [파싱](../indexing/parsing.md) |
| `backend/struct4search/adapters/parsing/` | MinerU·Docling 등 Parser 결과를 공통 IDR 구조로 변환합니다 | [파싱](../indexing/parsing.md) |
| `backend/struct4search/ingest/stages/fixed_chunk.py` | 원문 청킹 단계를 실행합니다 | [청킹](../indexing/chunking.md) |
| `backend/struct4search/ingest/stages/fixed_chunk_core.py` | 원문을 나누는 고정 청킹 규칙을 구현합니다 | [청킹](../indexing/chunking.md) |
| `backend/struct4search/ner_stage.py` | 문서에서 Entity를 추출하고 정규화합니다 | [NER](../indexing/ner.md) |
| `backend/struct4search/metadata_llm.py` | LLM을 호출해 문서의 18종 Metadata를 생성합니다 | [Metadata](../indexing/metadata.md) |
| `backend/struct4search/ingest/stages/metadata_rules.py` | Metadata 입력과 출력 규칙을 검증합니다 | [Metadata](../indexing/metadata.md) |
| `backend/struct4search/domain/metadata_fields.yaml` | 18종 Metadata 필드의 이름과 형식을 정의합니다 | [Metadata](../indexing/metadata.md) |
| `backend/struct4search/ingest/stages/entity_local.py` | Entity 주변의 원문 청크를 묶는 단계를 실행합니다 | [지식그래프](../indexing/triple-kg.md) |
| `backend/struct4search/ingest/stages/entity_local_core.py` | Entity와 원문 청크를 연결하는 규칙을 구현합니다 | [지식그래프](../indexing/triple-kg.md) |
| `backend/struct4search/adapters/llm/` | Metadata·Triple·답변 생성에 사용하는 모델 호출 구현을 둡니다 | [프롬프트 목록](../reference/prompts.md), [API 계약](../reference/api-contract.md) |
| `backend/struct4search/ingest/stages/triple_candidate_gate.py` | 생성된 Triple 후보가 저장 조건을 만족하는지 검사합니다 | [지식그래프](../indexing/triple-kg.md) |
| `backend/struct4search/ingest/stages/triple_evidence.py` | Triple과 원문 근거의 연결을 검증합니다 | [지식그래프](../indexing/triple-kg.md) |
| `backend/struct4search/ingest/stages/graph_core.py` | 검증된 Triple로 문서 KG를 구성합니다 | [지식그래프](../indexing/triple-kg.md) |
| `backend/struct4search/ingest/stages/graph_integration.py` | 문서별 KG를 저장 가능한 구조로 통합합니다 | [지식그래프](../indexing/triple-kg.md) |
| `backend/struct4search/adapters/persistence/graph_sync.py` | KG를 PostgreSQL에 반영합니다 | [저장소와 재처리](../reference/storage.md) |
| `backend/struct4search/ingest/stages/retrieval_expression_core.py` | KG와 Metadata에서 검색표현을 생성합니다 | [검색표현](../indexing/retrieval-text.md) |
| `backend/struct4search/ingest/stages/retrieval_expression_topology.py` | KG의 연결 관계를 검색표현의 중요도에 반영합니다 | [검색표현](../indexing/retrieval-text.md) |
| `backend/struct4search/index_stage.py` | 원문 청크와 검색표현을 임베딩하고 OpenSearch에 저장합니다 | [인덱싱](../indexing/opensearch.md), [OpenSearch 인덱스 구조](../reference/opensearch-schema.md) |
| `backend/struct4search/query/service.py` | 질의 처리부터 답변 반환까지 검색·답변 순서를 연결합니다 | [검색·답변 파이프라인](../query/overview.md), [질의 처리](../query/request.md) |
| `backend/struct4search/adapters/search/opensearch/` | 질의 임베딩과 OpenSearch Hybrid 검색을 실행합니다 | [질의 처리](../query/request.md), [Hybrid 검색](../query/hybrid-search.md) |
| `backend/struct4search/resources/opensearch/` | OpenSearch RRF search pipeline의 정본을 보관합니다 | [RRF](../query/rrf.md) |
| `backend/struct4search/query/retrieval/` | 검색표현의 점수를 원문 청크에 전달하고 최종 근거를 고릅니다 | [검색 결과 점수 통합](../query/score-integration.md) |
| `backend/struct4search/query/answer/` | Context 구성, 답변 생성·검증과 출처 연결을 담당합니다 | [Context 구성](../query/context.md), [답변 형식](../query/structured-answer.md), [출처 연결](../query/citations.md) |
| `backend/struct4search/entrypoints/cli/` | 공개 `struct4search-*` 명령을 제공합니다 | [실행 명령](../reference/cli.md) |
| `backend/struct4search/entrypoints/workers/` | 백그라운드 인덱싱 worker와 상태 감시를 실행합니다 | [실행 명령](../reference/cli.md) |
| `backend/struct4search/orchestration/` | Temporal workflow와 실행 상태를 관리합니다 | [실행 명령](../reference/cli.md) |
| `scripts/ops/` | 환경 적용, 서비스 기동과 운영 점검을 보조합니다 | [실행 명령](../reference/cli.md) |
| `backend/struct4search/entrypoints/api/` | 검색·답변과 문서 조회 HTTP API를 구현합니다 | [API 실행과 경로](../reference/api-reference.md), [API 계약](../reference/api-contract.md) |
| `openapi/` | HTTP 요청과 응답 형식의 명세를 보관합니다 | [API 실행과 경로](../reference/api-reference.md), [API 계약](../reference/api-contract.md) |
| `frontend/chatkit_demo/` | 문서 관리·파이프라인·검색 결과를 보여주는 React 화면과 로컬 API 어댑터입니다 | `frontend/chatkit_demo/README.md`, [API 실행과 경로](../reference/api-reference.md) |
| `backend/struct4search/evaluation/` | 검색·답변 지표와 회귀 gate를 계산합니다 | [검색과 QA 평가 실행](../testing/retrieval-qa.md) |
| `backend/struct4search/e2e/` | 승인된 E2E 실행 절차와 결과 계약을 관리합니다 | [테스트와 평가 시작하기](../testing/overview.md) |
| `backend/struct4search/observability/` | 실행 상태와 로그를 기록합니다 | [테스트와 평가 시작하기](../testing/overview.md) |
| `tests/` | 단위·회귀·통합 테스트와 예제 입력을 보관합니다 | [테스트와 평가 시작하기](../testing/overview.md) |

`.env`에는 접속 문자열과 API key만 둡니다. `struct4search-*` 명령은 실행할 때 `.env`를 자동으로 읽고, 이미 export한 값은 유지합니다. 검색·모델·프롬프트의 동작 값은 profile과 버전 관리된 설정 파일에서 관리합니다.
