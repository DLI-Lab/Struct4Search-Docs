---
sidebar_position: 3
title: 원문 청킹
---

# 원문 청킹

원문을 400토큰 단위로 분할하고 40토큰을 겹쳐 검색에 사용할 원문 청크를 만듭니다.

## 입력과 출력

| | |
|---|---|
| 입력 | [문서 파싱](parsing.md)이 만든 IDR |
| 출력 | 검색에 사용할 원문 청크 |

검색 단위 하나는 다음과 같은 형태입니다.

`//` 뒤의 내용은 필드 설명이며 실제 JSON 산출물에는 포함되지 않습니다.

```json
{
  "unit_id": "ruf_11175e926dbb1e25f165a932",              // 검색에 저장되는 원문 청크의 고유 ID
  "document_id": "d002343_6b6d39ebe6",                    // 이 청크가 나온 문서의 ID
  "text": "개구부 덮개 상부에서 작업 중 떨어짐",              // 청크에 포함된 원문
  "token_count": 400,                                      // tokenizer로 계산한 청크의 토큰 수
  "page_indices": [2, 3]                                   // 청크가 걸쳐 있는 페이지 순서. 0부터 시작
}
```

내부 처리에서는 400토큰 청크를 `fc_*`로 기록하고, 검색에 저장하는 원문 단위를 `ruf_*`로 기록합니다. 두 ID는 한 문서 안에서 일대일로 연결됩니다.

ID 종류와 의미는 [용어 사전](../reference/glossary.md#id)에서 설명합니다.

## 동작 방식

1. IDR의 본문을 읽기 순서대로 구성합니다.
2. 본문을 최대 400토큰 단위로 나눕니다.
3. 인접한 청크가 40토큰씩 겹치도록 구성합니다.

오버랩은 청크 경계에서 문맥이 끊기는 것을 줄이기 위해 적용합니다.

### 현재 production 설정

| profile key                        | 현재 production 값                  | 의미              |
| ------------------------- | --------------------- | --------------- |
| `chunking.strategy`       | `fixed_400_overlap40` | 고정 길이 청킹 방식     |
| `chunking.max_tokens`     | 400                   | 청크 하나의 최대 토큰 수  |
| `chunking.overlap_tokens` | 40                    | 인접 청크가 겹치는 토큰 수 |

청크 크기나 오버랩을 변경하면 검색 단위가 달라지므로 원문 청킹 이후 단계를 다시 처리하고 재색인해야 합니다([실행과 재처리](rerun.md)).

## 이 단계의 결과 확인

원문 청킹만 따로 실행하는 공개 명령은 없습니다. [문서 인덱싱 실행과 상태 확인](rerun.md)의 `struct4search-ingest` 명령을 실행하면 파싱 다음에 자동으로 수행됩니다. 아래 경로의 `<출력_디렉터리>`와 `<문서_ID>`는 해당 명령에 지정한 값을 뜻합니다.

| 확인 대상 | 확인 위치·방법 | 정상 | 비정상 |
|---|---|---|---|
| 청킹 완료 | `<출력_디렉터리>/f400/documents/<문서_ID>/receipt.json` | `status`가 `complete`, `coverage.passed`가 `true`이고 `token_limit_violations`가 빈 목록입니다. | 본문 누락이나 최대 토큰 수 초과가 발견되면 이 완료 기록을 만들지 못합니다. |
| 처리용 청크 | 같은 디렉터리의 `fixed_chunks.jsonl` | 각 줄에 청크 하나가 있으며 `token_count`가 `chunking.max_tokens` 이하입니다. | 파일이 없거나 최대 토큰 수를 넘는 청크가 있으면 청킹 결과를 사용할 수 없습니다. |
| 검색용 원문 단위 | 같은 디렉터리의 `retrieval_units.jsonl` | 각 청크와 연결된 `ruf_` 원문 검색 단위가 있습니다. | 처리용 청크와 검색용 원문 단위의 연결이 끊기면 이후 인덱싱을 진행할 수 없습니다. |

청킹 결과가 비정상이면 먼저 앞 단계의 IDR이 완성되었는지 [문서 파싱](parsing.md)의 확인 방법으로 점검합니다. 문서 전체의 실패 원인은 `<출력_디렉터리>/documents/<문서_ID>/failure.json`에도 기록됩니다.

## 코드 참조

| 확인할 내용 | 파일·심볼                                                 |
| ------ | ----------------------------------------------------- |
| 청킹 구현  | `backend/struct4search/ingest/stages/chunking/stage.py` · `FixedChunkRuntime` |
| 분할 로직  | `backend/struct4search/ingest/stages/chunking/core.py` · `make_fixed_chunks` |
| 설정     | `configs/ingest-production.yaml` · `chunking`         |
