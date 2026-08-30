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

아래 벡터는 구조를 보여 주기 위해 앞의 세 값만 사용한 짧은 예입니다. 실제 요청에는 4,096개의 숫자가 들어갑니다.

```json
{
  "size": 30,                                      // RRF 통합 후 받을 최대 후보 수
  "query": {                                       // OpenSearch 검색 조건
    "hybrid": {                                    // BM25와 Dense 검색을 함께 실행하는 질의
      "pagination_depth": 50,                      // 각 검색 채널에서 확보할 후보 수
      "queries": [                                 // 함께 실행할 검색 채널 목록
        {
          "match": {                               // 단어가 일치하는 문서를 찾는 BM25 검색
            "text": {                              // 검색할 텍스트 필드
              "query": "온열 질환 의심자가 생기면 어떻게 하나요?" // 사용자의 원문 질의
            }
          }
        },
        {
          "knn": {                                 // 의미가 가까운 문서를 찾는 Dense 검색
            "vector": {                            // 검색할 임베딩 벡터 필드
              "vector": [0.0142, -0.0317, 0.0089], // 사용자의 질의 벡터에서 앞의 세 값만 보여 주는 예
              "k": 50                              // 벡터 검색에서 확보할 후보 수
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

| profile key                             | 현재 production 값         | 의미                          |
| ----------------------------------- | ------------- | --------------------------- |
| `query.index_name`                  | `s4s-current` | 검색할 OpenSearch 인덱스 또는 검색용 고정 이름 |
| `query.native_rrf.bm25_depth`       | 50            | BM25 채널의 후보 깊이              |
| `query.native_rrf.dense_depth`      | 50            | Dense 채널의 후보 깊이             |
| `query.native_rrf.combined_depth`   | 30            | RRF 통합 후 반환하는 후보 수          |

`pagination_depth`는 요청을 만들 때 `bm25_depth`에서 계산됩니다. OpenSearch의 전체 매핑과 분석기 설정은 [OpenSearch 인덱스 구조](../reference/opensearch-schema.md)에서 확인할 수 있습니다.

## 코드 참조

| 확인할 내용              | 파일·심볼                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| Hybrid 검색 요청과 결과 처리 | `backend/struct4search/adapters/search/opensearch/native_hybrid.py` · `OpenSearchNativeHybridRetriever` |
| 검색 파라미터             | `backend/struct4search/adapters/search/opensearch/native_hybrid.py` · `NativeHybridSearchConfig`        |
| profile                | `configs/production.yaml` · `query.native_rrf`                                                      |
