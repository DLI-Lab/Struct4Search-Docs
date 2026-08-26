---
sidebar_position: 2
title: 디렉터리 구조
---

# 디렉터리 구조

Struct4Search 코드를 처음 열었을 때 주요 구현과 설정이 어디에 있는지 정리합니다.

## 저장소 구조

```text
src/struct4search/       Struct4Search 구현
configs/                 실행 프로파일과 서비스 설정
prompts/                 프롬프트와 registry
opensearch/              OpenSearch 검색 파이프라인
tests/                   테스트
pyproject.toml           패키지와 실행 명령
```

웹 문서는 별도 `DLI-Lab/Struct4Search-Docs` 저장소에서 관리합니다.

## 단계와 코드 위치

```text
src/struct4search/
├─ ingest/               문서 인덱싱
│  └─ stages/            인덱싱 단계 구현
├─ query/                검색·답변
│  ├─ retrieval/         검색 결과 점수 통합
│  └─ answer/            Context·답변·인용
├─ adapters/             외부 서비스 연동
│  ├─ search/opensearch/ OpenSearch
│  ├─ parsing/           문서 파서
│  └─ orchestration/     실행 오케스트레이션
├─ entrypoints/          실행 진입점
│  ├─ cli/               CLI
│  ├─ api/               HTTP API
│  └─ workers/           Worker
├─ evaluation/           검색·QA 평가
├─ domain/               도메인 정의
├─ config/               설정 로드
└─ bootstrap/            구현 조립
```

| 단계                                                                                                           | 구현 위치                                              |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| [문서 파싱](../indexing/parsing.md)                                                                              | `parser_stage.py` · `adapters/parsing/`            |
| [원문 청킹](../indexing/chunking.md)                                                                             | `ingest/stages/fixed_chunk*.py`                    |
| [NER](../indexing/ner.md)                                                                                    | `ner_stage.py`                                     |
| [Metadata 생성](../indexing/metadata.md)                                                                       | `metadata_llm.py` · `domain/metadata_fields.yaml`  |
| [KG 구축](../indexing/triple-kg.md)                                                                            | `ingest/stages/entity_local*.py` · `graph_core.py` |
| [검색표현 생성](../indexing/retrieval-text.md)                                                                     | `ingest/stages/retrieval_expression_*.py`          |
| [인덱싱](../indexing/opensearch.md)                                                                             | `index_stage.py`                                   |
| [질의 처리](../query/request.md) · [Hybrid 검색](../query/hybrid-search.md) · [RRF 통합](../query/rrf.md)            | `adapters/search/opensearch/`                      |
| [검색 결과 점수 통합](../query/score-integration.md)                                                                 | `query/retrieval/`                                 |
| [LLM Context 구성](../query/context.md) · [답변](../query/structured-answer.md) · [출처 연결](../query/citations.md) | `query/answer/`                                    |

## 설정과 프롬프트

| 파일                                              | 내용                  |
| ----------------------------------------------- | ------------------- |
| `configs/ingest-production.yaml`                | 문서 인덱싱 프로파일         |
| `configs/production.yaml`                       | 검색·답변 프로파일          |
| `configs/services/cold-services.yaml`           | 실행 서비스 설정           |
| `configs/evaluation-release.json`               | 평가셋 릴리스             |
| `prompts/registry.yaml`                         | 프롬프트 등록 정보          |
| `opensearch/search_pipelines/`                  | OpenSearch 검색 파이프라인 |
| `src/struct4search/domain/metadata_fields.yaml` | Metadata 18종 정의     |

## 실행 진입점

| 명령                                              | 구현                             |
| ----------------------------------------------- | ------------------------------ |
| `struct4search-ingest`                          | `entrypoints/cli/ingest.py`    |
| `struct4search-evaluate`                        | `evaluation/service.py`        |
| `struct4search-api`                             | `entrypoints/cli/api.py`       |
| `struct4search-smoke-e2e`                       | `entrypoints/cli/smoke_e2e.py` |
| `struct4search-preflight` · `struct4search-env` | `entrypoints/cli/`             |

사용할 수 있는 전체 명령은 `pyproject.toml`의 `[project.scripts]`에서 확인할 수 있습니다.

## 하려는 작업별로 볼 위치

| 하려는 작업           | 볼 위치                                         |
| ---------------- | -------------------------------------------- |
| 문서 인덱싱 수정        | `src/struct4search/ingest/`                  |
| 검색·답변 수정         | `src/struct4search/query/`                   |
| 설정 변경            | `configs/`                                   |
| 프롬프트 변경          | `prompts/`                                   |
| OpenSearch 설정 확인 | `opensearch/`                                |
| 실제 구현 조립 확인      | `src/struct4search/bootstrap/composition.py` |
| 테스트 확인           | `tests/`                                     |
| 웹 문서 수정          | 별도 `DLI-Lab/Struct4Search-Docs` 저장소       |

실제 실행에 어떤 구현이 연결되는지 확인하려면 `bootstrap/composition.py`를 봅니다. 입력과 출력 형식이나 모듈 간 계약을 확인하려면 관련 contract와 데이터 모델을 함께 확인합니다.
