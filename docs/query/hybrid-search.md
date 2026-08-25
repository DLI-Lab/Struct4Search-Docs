---
sidebar_position: 3
title: Hybrid 검색
---

# Hybrid 검색

단일 OpenSearch 인덱스에서 원문 청크와 검색표현을 같은 검색 대상으로 두고 BM25 검색과 Dense 검색을 수행합니다.

## 입력과 출력

| | |
|---|---|
| 입력 | `query text`와 `query embedding` |
| 출력 | 두 채널을 통합한 후보 목록 |

OpenSearch에 보내는 요청은 하나입니다.

```json
{
  "size": 30,                                    // 반환할 후보 수
  "query": {
    "hybrid": {
      "pagination_depth": 50,                    // 채널별 후보 깊이
      "queries": [
        {"match": {"text": {"query": "온열 질환 의심자가 생기면 어떻게 하나요?"}}},  // BM25
        {"knn": {"vector": {"vector": ["... 4096차원 ..."], "k": 50}}}              // Dense
      ]
    }
  }
}
```

요청 URL에는 `search_pipeline` 파라미터로 [RRF 통합](rrf.md) 파이프라인을 지정합니다. 두 채널의 검색과 통합이 모두 OpenSearch 안에서 끝나고, 애플리케이션은 통합된 결과만 받습니다.

## 검색 대상은 두 종류입니다

인덱스에는 성질이 다른 검색 단위가 함께 들어 있습니다([인덱싱](../indexing/opensearch.md)).

| `unit_kind` | ID | 무엇 |
|---|---|---|
| `source` | `ruf_*` | 원문 청크 |
| `retrieval_expression` | `rte_*` | 검색표현 |

BM25와 Dense 모두 두 종류를 함께 훑습니다. 결과에는 원문 청크와 검색표현이 섞여 있고, 이 시점에는 분리하지 않습니다.

## 동작 방식

1. 질의 원문으로 BM25 검색을, 질의 벡터로 Dense 검색을 각각 수행합니다.
2. 두 채널이 각각 깊이 50까지 후보를 모읍니다.
3. 지정된 search pipeline이 두 채널의 순위를 통합합니다.
4. 통합된 상위 30건을 반환합니다.

`50`은 **채널별 후보 깊이**입니다. 채널 결과가 각각 따로 반환된다는 뜻이 아닙니다. 운영 응답은 통합된 목록 하나이므로 BM25만의 순위나 Dense만의 순위는 응답에 없습니다.

깊이를 줄이면 통합이 볼 수 있는 후보가 줄고, 늘리면 검색이 느려집니다.

### 환경변수

| 환경변수명 | 기본 옵션 | 의미 |
|---|---|---|
| `query.index_name` | `s4s-current` | 검색할 인덱스 또는 별칭 |
| `query.native_rrf.bm25_depth` | 50 | BM25 채널이 모을 후보 깊이 |
| `query.native_rrf.dense_depth` | 50 | Dense 채널이 모을 후보 깊이 |
| `query.native_rrf.pagination_depth` | 50 | hybrid 요청 안에서 각 채널이 보는 깊이 |
| `query.native_rrf.combined_depth` | 30 | 통합 뒤 돌려받을 후보 수 |

이 값들은 코드가 고정값으로 검사합니다. 프로파일에 다른 값을 적으면 기동이 막힙니다. 인덱스 매핑과 분석기는 [OpenSearch 인덱스 구조](../reference/opensearch-schema.md)에 있습니다.

## 사용 또는 결과 확인

검색·답변 경로가 호출합니다. 결과에서 볼 것은 세 가지입니다.

| 확인할 것 | 정상 |
|---|---|
| 후보 수 | `combined_depth`를 넘지 않습니다 |
| `unit_kind` | `source`와 `retrieval_expression`이 섞여 있을 수 있습니다 |
| 검색표현 후보 | `source_f400_unit_ids`가 비어 있지 않습니다 |

인덱스가 없거나 벡터 차원이 다르면 질의가 실패합니다. 결과가 0건이면 빈 후보로 다음 단계에 넘어가고, 근거 없음으로 처리됩니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 요청 조립과 응답 해석 | `src/struct4search/adapters/search/opensearch/native_hybrid.py` · `OpenSearchNativeHybridRetriever` |
| 고정값 검사 | `src/struct4search/adapters/search/opensearch/native_hybrid.py` · `NativeHybridSearchConfig` |
| 설정값 | `configs/production.yaml` · `query.native_rrf` |
