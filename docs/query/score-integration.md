---
sidebar_position: 5
title: 검색 결과 점수 통합
---

# 검색 결과 점수 통합

검색표현의 점수를 연결된 원문 청크에 전달하고, 청크가 받은 점수 중 최댓값으로 최종 Top-10 원문 청크를 구성합니다.

## 입력과 출력

| | |
|---|---|
| 입력 | 원문 청크와 검색표현이 섞인 [RRF Top-30 후보](rrf.md) |
| 출력 | 통합 점수 기준 Top-10 원문 청크와 그 청크를 찾아낸 검색표현 |

최종 결과 하나는 이런 형태입니다.

```json
{
  "unit_id": "ruf_69b7096d428d67de25c37a08",       // 원문 청크 — 인용 가능
  "document_id": "d001468_7f73511172",             // 문서
  "text": "... 원문 청크 본문 ...",                  // 답변 근거로 쓰이는 원문
  "score": 0.0241374787,                           // 통합 점수
  "page_number": 1,                                // 표시용 페이지
  "winner_retrieval_expression_id": "rte_2f257c9f73b098c121fe6e39", // 이 청크를 찾아낸 검색표현
  "winner_retrieval_expression_text": "온열질환 발생 시 ..."          // 그 표현의 문장
}
```

**최종 순위는 원문 청크로만 구성됩니다.** 검색표현은 순위 항목이 아니라, 그 청크가 어떻게 발견됐는지 알려 주는 정보로 붙습니다. 직접 검색으로 올라온 청크에는 붙지 않습니다.

## 동작 방식

1. 검색표현의 점수를 연결된 모든 원문 청크에 그대로 부여합니다.
2. 청크마다 받은 점수 중 최댓값을 최종 점수로 삼고, 점수 순으로 정렬합니다.
3. 같은 청크가 남지 않았는지 다시 확인합니다.
4. 앞에서부터 10건을 자릅니다.

점수는 **나누지도 더하지도 않습니다.** 나누면 여러 청크를 묶은 검색표현이 불리해지고, 더하면 링크가 많은 검색표현이 유리해집니다. 둘 다 검색표현의 연결 개수가 순위를 바꾸게 만드는데, 연결 개수는 질의와의 관련성이 아닙니다.

점수가 같으면 먼저 반환된 후보가 이깁니다. 같은 입력이면 항상 같은 Top-10이 나옵니다.

### 검색표현의 점수를 연결 청크에 전달

```text
[검색표현] rte_c721e454a741beba87385a0e  RRF=0.0195015375
  ├─ [원문 청크] ruf_d0e6ad7d2fe1b06cb8df0f2b  후보점수=0.0195015375
  └─ [원문 청크] ruf_9379e0b51c1f291293ae787d  후보점수=0.0195015375
```

### 한 청크가 여러 경로로 점수를 받은 경우

```text
[원문 청크] ruf_d0e6ad7d2fe1b06cb8df0f2b
  - 직접 검색된 원문 청크 점수 = 0.0226023976
  - 검색표현에서 전달된 점수   = 0.0195015375
  - 최종 점수 = max(...)      = 0.0226023976
```

### 최종 Top-10

```text
1   ruf_f0482c0499437992c339593c   0.0269439421
2   ruf_7ae68dc5bf2926f9344d9a4d   0.0243830787
3   ruf_69b7096d428d67de25c37a08   0.0241374787  ← rte_2f257c9f73b098c121fe6e39 를 통해 진입
4   ruf_ea2e71fd10b08d9e12a13dea   0.0240860215
5   ruf_fa0772dd49096df35fd3bc52   0.0226423903
6   ruf_d0e6ad7d2fe1b06cb8df0f2b   0.0226023976
7   ruf_fdcc99e7fdb84d2fb2e975d6   0.0225392887
8   ruf_9b5cf2a08ad30a601abb67ec   0.0221230159
9   ruf_87c736ea241e82375e747538   0.0213546880
10  ruf_a76f73294b0550361c4cefd1   0.0206307308
```

### 환경변수

| 환경변수명 | 기본 옵션 | 의미 |
|---|---|---|
| `query.native_rrf.final_source_top_k` | 10 | 답변 근거로 쓸 원문 청크 수. 상한 10은 코드가 고정합니다 |

상한 10은 코드 상수로도 고정되어 있어 설정으로 올릴 수 없습니다. 값을 바꾸면 [LLM Context](context.md)의 근거 건수가 그대로 따라가므로 검색 평가와 QA 평가를 다시 측정합니다.

이 단계는 모델을 호출하지 않습니다.

## 사용 또는 결과 확인

검색·답변 경로가 호출합니다. 결과에서 볼 것은 세 가지입니다.

| 확인할 것 | 정상 |
|---|---|
| ID | 모두 `ruf_`로 시작합니다 |
| 중복 | 같은 청크가 두 번 나오지 않습니다 |
| 건수 | `final_source_top_k` 이하입니다 |

원문으로 되돌아갈 수 없는 검색표현이 후보에 있으면 그 질의는 실패합니다. 그런 표현은 [인덱싱](../indexing/opensearch.md)에서 이미 막혔어야 합니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 호출 순서 | `src/struct4search/query/service.py` · `DefaultQueryService.execute` |
| 점수 전달 | `src/struct4search/query/retrieval/projection.py` · `DefaultF400ProjectionPolicy` |
| 최댓값과 정렬 | `src/struct4search/query/retrieval/max_score.py` · `DefaultMaxScorePolicy` |
| Top-10 절단 | `src/struct4search/query/retrieval/top_k.py` · `MAX_FINAL_F400_TOP_K` |
| 설정값 | `configs/production.yaml` · `query.native_rrf.final_source_top_k` |
