---
sidebar_position: 6
title: 모델 호출 지도
---

# 모델 호출 지도

파이프라인에서 어떤 모델을 사용하는지와 모델별 설정 위치를 정리합니다.

## 모델 호출 목록

| 단계                                         | 모델                  | 실행 위치      | 설정                           |
| ------------------------------------------ | ------------------- | ---------- | ---------------------------- |
| [문서 파싱](../indexing/parsing.md)            | MinerU 2.5 Pro 1.2B | 별도 서비스     | `parser.mineru_endpoints`    |
| [NER](../indexing/ner.md)                  | GLiNER              | 파이프라인 프로세스 | `ner.model` · `ner.revision` |
| [Metadata 생성](../indexing/metadata.md)     | Qwen                | 별도 서비스     | `llm`                        |
| [KG 구축](../indexing/triple-kg.md)          | Qwen                | 별도 서비스     | `llm` · `triple`             |
| [검색표현 생성](../indexing/retrieval-text.md)   | Qwen                | 별도 서비스     | `llm` · `g2`                 |
| [인덱싱](../indexing/opensearch.md)           | 임베딩 모델              | 별도 서비스     | `index.embedding_*`          |
| [질의 처리](../query/request.md)               | 임베딩 모델              | 별도 서비스     | `index.embedding_*`          |
| [답변과 출처 표기](../query/structured-answer.md) | Qwen                | 별도 서비스     | `query.reader`               |

## 모델을 호출하지 않는 단계

| 단계                                                                 | 처리 방식                       |
| ------------------------------------------------------------------ | --------------------------- |
| [원문 청킹](../indexing/chunking.md)                                   | 토크나이저를 사용해 원문을 분할합니다        |
| [Hybrid 검색](../query/hybrid-search.md) · [RRF 통합](../query/rrf.md) | OpenSearch에서 처리합니다          |
| [검색 결과 점수 통합](../query/score-integration.md)                       | 검색 점수를 규칙에 따라 계산합니다         |
| [답변 후처리](../query/citations.md)                                    | Citation을 규칙에 따라 검증하고 정리합니다 |

## GLiNER 실행 방식

MinerU, Qwen과 임베딩 모델은 별도 서비스로 실행하지만, GLiNER는 파이프라인 프로세스 안에 직접 로드됩니다.

따라서 별도의 모델 서비스로 호출하지 않으며, NER을 실행하는 프로세스가 GLiNER의 GPU 메모리를 직접 사용합니다.

## 임베딩 모델

인덱싱과 질의 처리에는 같은 임베딩 모델과 벡터 차원을 사용합니다.

* 원문 청크와 검색표현을 인덱싱할 때 임베딩을 생성합니다.
* 사용자 질의를 처리할 때 같은 모델로 질의 임베딩을 생성합니다.
* 두 단계 모두 `index.embedding_model`과 `index.dimension`을 사용합니다.

임베딩 모델이나 벡터 차원을 변경하면 기존 인덱스의 벡터와 호환되지 않으므로 다시 색인해야 합니다.

## 구조화된 출력

Metadata 생성, KG 구축, 검색표현 생성과 답변 생성은 정해진 구조로 결과를 반환합니다.

| 단계          | 출력에서 확인하는 것             |
| ----------- | ----------------------- |
| Metadata 생성 | 도메인 Metadata 18종        |
| KG 구축       | Triple 구조와 원문 근거        |
| 검색표현 생성     | 검색표현과 연결된 원문·Triple     |
| 답변          | claim과 `cited_unit_ids` |

답변 단계에서는 이번 질의의 원문 근거만 Citation으로 사용할 수 있도록 출력 범위를 제한합니다. 검색표현은 검색을 보조하지만 답변의 Citation으로 사용할 수 없습니다.

프롬프트와 출력 형식의 자세한 내용은 [프롬프트와 출력 검증](prompts.md)에서 확인할 수 있습니다.

## 모델 설정

| 설정                                    | 현재 값 또는 방식                    |
| ------------------------------------- | ----------------------------- |
| `ner.model` · `ner.revision`          | GLiNER 모델과 revision           |
| `llm`                                 | Metadata · KG · 검색표현 생성용 Qwen |
| `index.embedding_model`               | `Qwen/Qwen3-Embedding-8B`     |
| `query.reader.model`                  | 답변 생성용 Qwen                   |
| `triple.temperature`                  | 0                             |
| `query.reader.generation.temperature` | 0                             |

모델을 변경할 때의 설정 위치와 재처리 범위는 [모델 교체](../maintenance/models.md)에서 설명합니다.
