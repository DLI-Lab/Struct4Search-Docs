---
sidebar_position: 4
title: RRF 통합
---

# RRF 통합

BM25와 Dense 두 채널의 순위를 RRF로 통합해 Top-30 후보를 만듭니다. OpenSearch의 search pipeline이 수행합니다.

## 입력과 출력

| | |
|---|---|
| 입력 | 하나의 hybrid 요청 안에서 모인 두 채널의 후보 |
| 출력 | 통합 순위 기준 Top-30 후보 |

파이프라인 정의는 이렇습니다.

```json
{
  "description": "Struct4Search canonical hybrid reciprocal-rank fusion v1",
  "phase_results_processors": [
    {
      "score-ranker-processor": {
        "combination": {
          "technique": "rrf",   // 순위 기반 통합
          "rank_constant": 60   // RRF 상수
        }
      }
    }
  ]
}
```

후보 하나는 이렇게 나옵니다.

```json
{
  "unit_id": "ruf_f0482c0499437992c339593c", // 검색 단위 ID
  "unit_kind": "source",                     // 원문 청크 또는 검색표현
  "score": 0.0269439421,                     // RRF 통합 점수
  "rank": 1                                  // 응답 순위
}
```

Top-30에는 **여전히 원문 청크와 검색표현이 섞여 있습니다.** 아직 최종 LLM 입력이 아닙니다.

```text
1. [원문 청크] ruf_f0482c0499437992c339593c   0.0269439421
2. [원문 청크] ruf_7ae68dc5bf2926f9344d9a4d   0.0243830787
3. [검색표현]  rte_2f257c9f73b098c121fe6e39   0.0241374787
4. [원문 청크] ruf_ea2e71fd10b08d9e12a13dea   0.0240860215
5. [검색표현]  rte_43a4017a42e5b27f4f139e32   0.0229034124
...
```

## 동작 방식

1. 각 채널에서 검색 단위의 순위를 가져옵니다.
2. 채널마다 `1 / (60 + 순위)`를 더해 통합 점수를 만듭니다.
3. 통합 점수 순으로 정렬해 상위 30건을 반환합니다.

**점수가 아니라 순위를 더합니다.** BM25 점수는 수십 단위이고 코사인 유사도는 0에서 1 사이라 척도가 달라 직접 더할 수 없습니다. 순위로 바꾸면 어느 채널이 점수를 크게 내는지에 결과가 좌우되지 않습니다.

같은 검색 단위가 양쪽 채널에 있으면 두 기여분이 더해집니다. 그래서 한쪽에서만 상위인 것보다 양쪽에서 중간인 것이 위로 올 수 있습니다. 이것이 Hybrid 검색을 쓰는 이유입니다.

Top-30까지 유지하는 이유는 다음과 같습니다.

> 검색표현 투영과 중복 제거 후에도 최종 Top-10 원문 청크를 확보할 수 있도록 RRF 후보를 Top-30까지 유지합니다.

애플리케이션에는 RRF를 다시 계산하는 경로가 없습니다. 통합은 OpenSearch에서만 일어납니다.

### 환경변수

| 환경변수명 | 기본 옵션 | 의미 |
|---|---|---|
| `query.native_rrf.id` | `s4s-native-rrf-v1` | 쓸 search pipeline 이름 |
| `query.native_rrf.sha256` | 본문 해시 | 서버의 파이프라인이 저장소 정의와 같은지 검사하는 값 |
| `query.native_rrf.rrf_rank_constant` | 60 | RRF 계산의 상수. 클수록 상위 순위의 우위가 줄어듭니다 |
| `query.native_rrf.combined_depth` | 30 | 통합 뒤 돌려받을 후보 수 |

프로파일이 파이프라인 본문 해시를 고정합니다. 서버에 올라간 파이프라인이 저장소의 정의와 다르면 검색을 시작하기 전에 실패합니다.

## 사용 또는 결과 확인

검색·답변 경로가 호출합니다. 결과에서 볼 것은 세 가지입니다.

| 확인할 것 | 정상 |
|---|---|
| 후보 수 | 30을 넘지 않습니다 |
| `rank` | 1부터 시작합니다 |
| 점수 | 유한한 값입니다 |

파이프라인이 서버에 없거나 해시가 다르면 그 실행은 시작되지 않습니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 파이프라인 정의 | `opensearch/search_pipelines/s4s-native-rrf-v1.json` |
| 파이프라인 검증 | `src/struct4search/adapters/search/opensearch/search_pipeline.py` · `SearchPipelineVerifier` |
| 응답 해석 | `src/struct4search/adapters/search/opensearch/native_hybrid.py` · `map_response` |
| 설정값 | `configs/production.yaml` · `query.native_rrf` |
