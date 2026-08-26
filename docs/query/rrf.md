---
sidebar_position: 4
title: RRF 통합
---

# RRF 통합

OpenSearch에서 BM25와 Dense 두 검색 채널의 순위를 RRF(Reciprocal Rank Fusion)로 통합해 Top-30 후보를 만듭니다.

## 입력과 출력

| | |
|---|---|
| 입력 | Hybrid 검색의 BM25·Dense 후보 순위 |
| 출력 | RRF 통합 순위 기준 Top-30 후보 |

RRF는 OpenSearch의 search pipeline에서 수행됩니다.

```json
{
  "description": "Struct4Search canonical hybrid reciprocal-rank fusion v1",
  "phase_results_processors": [
    {
      "score-ranker-processor": {
        "combination": {
          "technique": "rrf",
          "rank_constant": 60
        }
      }
    }
  ]
}
```

통합된 후보 하나는 다음과 같은 형태입니다.

```json
{
  "unit_id": "ruf_f0482c0499437992c339593c",
  "unit_kind": "source",
  "score": 0.0269439421,
  "rank": 1
}
```

Top-30에는 원문 청크와 검색표현이 함께 포함될 수 있으며, 아직 최종 LLM 입력은 아닙니다.

```text
1. [원문 청크] ruf_f0482c0499437992c339593c   0.0269439421
2. [원문 청크] ruf_7ae68dc5bf2926f9344d9a4d   0.0243830787
3. [검색표현]   rte_2f257c9f73b098c121fe6e39   0.0241374787
4. [원문 청크] ruf_ea2e71fd10b08d9e12a13dea   0.0240860215
5. [검색표현]   rte_43a4017a42e5b27f4f139e32   0.0229034124
...
```

## 동작 방식

1. BM25와 Dense 검색에서 각 검색 단위의 순위를 가져옵니다.
2. 각 채널의 순위를 `1 / (60 + 순위)` 형태의 점수로 변환해 합칩니다.
3. 통합 점수 기준으로 정렬해 상위 30건을 반환합니다.

RRF는 BM25와 Dense의 원래 점수를 직접 합치지 않고 **각 채널에서의 순위**를 이용합니다. 서로 다른 척도의 검색 점수를 별도로 정규화하지 않고 두 검색 결과를 함께 반영할 수 있습니다.

같은 검색 단위가 두 채널에서 모두 검색되면 두 순위의 기여가 함께 반영됩니다.

Top-30까지 유지하는 이유는 다음과 같습니다.

> 검색표현 투영과 중복 제거 후에도 최종 Top-10 원문 청크를 확보할 수 있도록 RRF 후보를 Top-30까지 유지합니다.

RRF 통합은 OpenSearch에서만 수행하며, 애플리케이션은 통합된 Top-30 결과를 받아 다음 단계인 [검색 결과 점수 통합](score-integration.md)을 수행합니다.

## 설정값

| profile key | 기본값 | 의미 |
|---|---|---|
| `query.native_rrf.id` | `s4s-native-rrf-v1` | 사용할 OpenSearch search pipeline |
| `query.native_rrf.rrf_rank_constant` | 60 | RRF 계산에 사용하는 상수 |
| `query.native_rrf.combined_depth` | 30 | RRF 통합 후 반환할 후보 수 |

OpenSearch에 등록된 search pipeline은 저장소의 정의와 일치해야 하며, 전체 설정은 `configs/production.yaml`에서 관리합니다.

## 사용 또는 결과 확인

RRF 통합은 [Hybrid 검색](hybrid-search.md)의 일부로 OpenSearch에서 자동으로 실행됩니다.

| 확인할 것 | 정상 |
|---|---|
| 후보 수 | 최대 30건입니다 |
| 후보 종류 | 원문 청크와 검색표현이 함께 나타날 수 있습니다 |
| 순위 | RRF 통합 점수 기준으로 정렬되어 있습니다 |

통합된 Top-30 후보는 다음 단계에서 검색표현을 원문 청크로 연결하고 최종 Top-10 원문 청크로 정리합니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| RRF search pipeline | `opensearch/search_pipelines/s4s-native-rrf-v1.json` |
| search pipeline 확인 | `backend/struct4search/adapters/search/opensearch/search_pipeline.py` · `SearchPipelineVerifier` |
| 검색 결과 처리 | `backend/struct4search/adapters/search/opensearch/native_hybrid.py` · `map_response` |
| profile | `configs/production.yaml` · `query.native_rrf` |
