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

```json
{
  "unit_id": "ruf_11175e926dbb1e25f165a932",
  "document_id": "d002343_6b6d39ebe6",
  "text": "개구부 덮개 상부에서 작업 중 떨어짐 ...",
  "token_count": 400,
  "page_indices": [2, 3]
}
````

ID 종류와 의미는 [데이터 구조와 ID 체계](../reference/data-schema.md)에서 설명합니다.

## 동작 방식

1. IDR의 본문을 읽기 순서대로 구성합니다.
2. 본문을 최대 400토큰 단위로 나눕니다.
3. 인접한 청크가 40토큰씩 겹치도록 구성합니다.

오버랩은 청크 경계에서 문맥이 끊기는 것을 줄이기 위해 적용합니다.

### 설정

| 설정                        | 현재 값                  | 의미              |
| ------------------------- | --------------------- | --------------- |
| `chunking.strategy`       | `fixed_400_overlap40` | 고정 길이 청킹 방식     |
| `chunking.max_tokens`     | 400                   | 청크 하나의 최대 토큰 수  |
| `chunking.overlap_tokens` | 40                    | 인접 청크가 겹치는 토큰 수 |

청크 크기나 오버랩을 변경하면 검색 단위가 달라지므로 원문 청킹 이후 단계를 다시 처리하고 재색인해야 합니다([실행과 재처리](rerun.md)).

## 사용 또는 결과 확인

원문 청킹은 문서 인덱싱 과정에서 실행됩니다.

```bash
struct4search-ingest --output <출력 디렉터리> --document-id <문서 ID>
```

산출물에서 청크가 생성되었는지와 각 청크의 `token_count`가 설정한 최대값을 넘지 않는지 확인합니다.

## 코드 참조

| 확인할 내용 | 파일·심볼                                                 |
| ------ | ----------------------------------------------------- |
| 청킹 구현  | `src/struct4search/ingest/stages/fixed_chunk.py`      |
| 분할 로직  | `src/struct4search/ingest/stages/fixed_chunk_core.py` |
| 설정     | `configs/ingest-production.yaml` · `chunking`         |

