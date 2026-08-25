---
sidebar_position: 6
title: 모델 호출 지도
---

# 모델 호출 지도

어느 단계가 어떤 모델을 부르는지, 모델을 바꾸려면 어디를 고치는지 정리합니다.

## 호출 목록

| 단계 | 모델 | 실행 위치 | 설정 |
|---|---|---|---|
| [문서 파싱](../indexing/parsing.md) | MinerU 2.5 Pro 1.2B | 별도 서비스 | `parser.mineru_endpoints` |
| [NER](../indexing/ner.md) | GLiNER | 파이프라인 프로세스 안 | `ner.model` · `ner.revision` |
| [Metadata 생성](../indexing/metadata.md) | Qwen | 별도 서비스 | `llm` |
| [KG 구축](../indexing/triple-kg.md) | Qwen | 별도 서비스 | `llm` · `triple` |
| [검색표현 생성](../indexing/retrieval-text.md) | Qwen | 별도 서비스 | `llm` · `g2` |
| [인덱싱](../indexing/opensearch.md) | 임베딩 | 별도 서비스 | `index.embedding_*` |
| [질의 처리](../query/request.md) | 임베딩 | 별도 서비스 | `index.embedding_*` |
| [답변과 출처 표기](../query/structured-answer.md) | Qwen | 별도 서비스 | `query.reader` |

## 모델을 부르지 않는 단계

| 단계 | 이유 |
|---|---|
| [원문 청킹](../indexing/chunking.md) | 토크나이저로 토큰만 셉니다 |
| [Hybrid 검색](../query/hybrid-search.md) · [RRF 통합](../query/rrf.md) | OpenSearch가 처리합니다 |
| [검색 결과 점수 통합](../query/score-integration.md) | 순수 계산입니다 |
| [답변 후처리](../query/citations.md) | 결정적 정리입니다 |

같은 입력에 항상 같은 결과가 나오는 단계들입니다.

## GLiNER만 프로세스 안에서 돕니다

다른 모델은 별도 서비스로 뜨지만 GLiNER는 파이프라인 프로세스 안에 로드됩니다. 그래서 **서비스 목록에 나타나지 않고** GPU 메모리를 파이프라인 프로세스가 직접 잡습니다.

## 임베딩은 양쪽이 같아야 합니다

색인할 때와 질의할 때 같은 모델·같은 차원을 씁니다. 두 곳 모두 `index.embedding_model`과 `index.dimension`을 읽습니다.

다르면 벡터를 비교할 수 없고, 차원이 다르면 검색 요청 자체가 거부됩니다.

## 출력 형식은 강제됩니다

LLM을 부르는 네 단계 모두 JSON Schema로 출력을 강제합니다. 프롬프트로 형식을 부탁하는 것이 아닙니다.

| 단계 | 강제하는 것 |
|---|---|
| Metadata 생성 | 필드 18종, 필드당 값 개수와 길이 |
| KG 구축 | 관계 구조 |
| 검색표현 생성 | 표현과 근거 관계 |
| 답변 | claim 구조와 **인용 가능한 ID 집합** |

마지막 줄이 특히 중요합니다. 인용 가능한 ID를 이번 질의의 Top-10으로 못박기 때문에 검색표현 ID는 생성될 수 없습니다.

## 결정성 설정

| 설정 | 값 |
|---|---|
| `triple.temperature` · `thinking` | 0 · `false` |
| `query.reader.generation.temperature` · `seed` | 0 · 0 |
| `ner.revision` | 스냅샷 고정 |
| `chunking.tokenizer` | 스냅샷 고정 |

같은 입력·코드·프로파일이면 같은 결과가 나오도록 맞춰 둔 값들입니다.

## 모델을 바꾸는 방법

[모델 교체](../maintenance/models.md)에 절차와 재실행 범위가 있습니다. 프로파일과 서비스 정의 두 곳을 함께 고쳐야 합니다.
