---
sidebar_position: 3
title: Hybrid 검색
---

# Hybrid 검색

하나의 OpenSearch 인덱스에서 원문 청크와 검색표현을 함께 검색 대상으로 두고 BM25 검색과 Dense 검색을 수행합니다.

## 입력과 출력

|    |                                 |
| -- | ------------------------------- |
| 입력 | `query text`와 `query embedding` |
| 출력 | BM25와 Dense 검색을 통합한 후보 목록       |

OpenSearch에는 하나의 Hybrid 검색 요청을 보냅니다.

```json
{
  "size": 30,
  "query": {
    "hybrid": {
      "pagination_depth": 50,
      "queries": [
        {
          "match": {
            "text": {
              "query": "온열 질환 의심자가 생기면 어떻게 하나요?"
            }
          }
        },
        {
          "knn": {
            "vector": {
              "vector": ["... 4096차원 ..."],
              "k": 50
            }
          }
        }
      ]
    }
  }
}
```

첫 번째 `queries` 항목은 질의 원문을 사용하는 BM25 검색이고, 두 번째는 질의 임베딩을 사용하는 Dense 검색입니다. 요청 URL에는 `search_pipeline` 파라미터로 [RRF 통합](rrf.md) 파이프라인을 지정합니다.

BM25와 Dense 검색부터 RRF 통합까지 모두 OpenSearch 안에서 수행되며, 애플리케이션은 통합된 결과만 전달받습니다.

## 검색 대상

OpenSearch 인덱스에는 두 종류의 검색 단위가 함께 저장되어 있습니다([인덱싱](../indexing/opensearch.md)).

| `unit_kind`            | ID      | 검색 단위 |
| ---------------------- | ------- | ----- |
| `source`               | `ruf_*` | 원문 청크 |
| `retrieval_expression` | `rte_*` | 검색표현  |

BM25와 Dense 모두 원문 청크와 검색표현을 함께 검색합니다. 따라서 통합 결과에는 두 종류가 섞여 있을 수 있으며, 이 단계에서는 원문 청크만 따로 추리지 않습니다.

## 동작 방식

1. 질의 원문으로 BM25 검색을 수행하고, 질의 벡터로 Dense 검색을 수행합니다.
2. 두 채널에서 각각 최대 50개의 후보를 탐색합니다.
3. 지정된 OpenSearch search pipeline이 두 채널의 순위를 RRF로 통합합니다.
4. 통합된 후보 중 상위 30건을 애플리케이션에 반환합니다.

여기서 `50`은 **각 검색 채널의 후보 깊이**입니다. BM25 Top-50과 Dense Top-50이 애플리케이션에 각각 반환된다는 뜻은 아닙니다. 실제 검색·답변 경로에서는 RRF로 통합된 하나의 후보 목록만 전달됩니다.

## 설정값

| profile key                             | 기본값         | 의미                          |
| ----------------------------------- | ------------- | --------------------------- |
| `query.index_name`                  | `s4s-current` | 검색할 OpenSearch 인덱스 또는 연결 이름(alias) |
| `query.native_rrf.bm25_depth`       | 50            | BM25 채널의 후보 깊이              |
| `query.native_rrf.dense_depth`      | 50            | Dense 채널의 후보 깊이             |
| `query.native_rrf.combined_depth`   | 30            | RRF 통합 후 반환하는 후보 수          |

`pagination_depth`는 요청을 만들 때 `bm25_depth`에서 계산됩니다. OpenSearch의 전체 매핑과 분석기 설정은 [OpenSearch 인덱스 구조](../reference/opensearch-schema.md)에서 확인할 수 있습니다.

## 사용 또는 결과 확인

Hybrid 검색은 검색·답변 파이프라인에서 자동으로 실행됩니다.

결과에서는 다음을 확인합니다.

| 확인할 것       | 정상                                              |
| ----------- | ----------------------------------------------- |
| 후보 수        | `combined_depth`인 30을 넘지 않습니다                   |
| `unit_kind` | `source`와 `retrieval_expression`이 함께 나타날 수 있습니다 |
| 검색표현        | 연결된 원문 청크 정보를 가지고 있습니다                          |

OpenSearch 인덱스가 없거나 질의 벡터의 차원이 색인 벡터와 다르면 검색이 실패합니다. 검색 결과가 없으면 빈 후보가 다음 단계로 전달되고, 이후 답변 단계에서 근거 없음으로 처리됩니다.

## 코드 참조

| 확인할 내용              | 파일·심볼                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| Hybrid 검색 요청과 결과 처리 | `backend/struct4search/adapters/search/opensearch/native_hybrid.py` · `OpenSearchNativeHybridRetriever` |
| 검색 파라미터             | `backend/struct4search/adapters/search/opensearch/native_hybrid.py` · `NativeHybridSearchConfig`        |
| profile                | `configs/production.yaml` · `query.native_rrf`                                                      |
