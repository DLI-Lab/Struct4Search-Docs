---
sidebar_position: 3
title: 원문 청킹
---

# 원문 청킹

원문을 400토큰 단위로 분할하고 오버랩 40토큰을 적용해 검색 단위를 만듭니다.

## 입력과 출력

| | |
|---|---|
| 입력 | [문서 파싱](parsing.md)이 만든 IDR |
| 출력 | 원문 청크와 검색 단위 |

검색 단위 하나는 이런 형태입니다.

```json
{
  "unit_id": "ruf_11175e926dbb1e25f165a932",        // 검색 단위 ID — 색인과 답변 인용
  "source_chunk_id": "fc_11175e926dbb1e25f165a932", // 원문 청크 ID — 파이프라인 내부
  "document_id": "d002343_6b6d39ebe6",              // 문서
  "presentation": "fixed_400_overlap40",            // 청킹 방식
  "text": "개구부 덮개 상부에서 작업 중 떨어짐 ...",   // 본문 — 색인되는 텍스트
  "token_count": 400,                               // 토큰 크기
  "page_indices": [2, 3],                           // 원본 페이지
  "source_block_ids": ["d002343_6b6d39ebe6#p2#b7"], // 원문 블록
  "source_spans": ["... 일부 생략 ..."]              // 원문 위치
}
```

`fc_`와 `ruf_`의 자세한 구분은 [데이터 구조와 ID 체계](../reference/data-schema.md)에 있습니다.

## 동작 방식

1. IDR의 본문을 읽기 순서대로 이어 붙입니다.
2. 이어 붙인 본문을 400토큰 단위로 끊습니다.
3. 다음 청크를 이전 청크의 끝보다 40토큰 앞에서 시작해 두 청크가 겹치게 만듭니다.

겹치는 이유는 문장이 청크 경계에서 잘려 어느 쪽에도 온전히 남지 않는 것을 줄이기 위해서입니다. 토큰은 KURE-v1 토크나이저로 셉니다.

텍스트가 없는 요소는 검색 단위가 되지 않습니다. 청크 수가 요소 수보다 적은 것이 정상입니다.

### 환경변수

| 환경변수명 | 기본 옵션 | 의미 |
|---|---|---|
| `chunking.strategy` | `fixed_400_overlap40` | 청킹 방식. 검색 단위의 `presentation` 값으로도 실립니다 |
| `chunking.max_tokens` | 400 | 청크 하나에 담는 최대 토큰 수. 늘리면 청크가 커지고 수가 줄어듭니다 |
| `chunking.overlap_tokens` | 40 | 인접 청크가 겹치는 토큰 수. 줄이면 경계에 걸친 문장이 잘릴 확률이 커집니다 |
| `chunking.tokenizer` | `nlpai-lab/KURE-v1` | 토큰을 세는 기준. 바꾸면 같은 400토큰이라도 자르는 자리가 달라집니다 |

앞의 세 값은 설정 스키마에서 고정 리터럴이라 다른 값을 적으면 설정 로드가 실패합니다.

청크 ID는 본문이 아니라 위치와 설정 해시로 만듭니다. 그래서 위 네 값 중 하나가 바뀌면 같은 문서라도 청크 ID가 전부 달라지고, **원문 청킹부터 인덱싱까지 다시 처리하며 인덱스를 새로 만들어야 합니다**([실행과 재처리](rerun.md)).

## 사용 또는 결과 확인

청킹은 단독 실행 명령이 없습니다. 인덱싱 실행기가 호출합니다.

```bash
struct4search-ingest --output <출력 디렉터리> --document-id <문서 ID>
```

문서별 산출물에서 볼 것은 세 가지입니다.

| 확인할 것 | 정상 |
|---|---|
| 청크 수와 검색 단위 수 | 같습니다 |
| `token_count` | 400을 넘지 않습니다 |
| 청크 ID 중복 | 없습니다 |

청킹이 끝나면 본문이 모두 어느 청크에든 실렸는지 자체 감사가 돌고, 통과하지 못한 문서는 완료로 세지 않습니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 실행 진입점 | `src/struct4search/ingest/stages/fixed_chunk.py` · `FixedChunkRuntime.configured_fixed_chunks` |
| 분할과 위치 기록 | `src/struct4search/ingest/stages/fixed_chunk_core.py` · `make_fixed_chunks` · `token_windows` |
| 검색 단위 구성 | `src/struct4search/ingest/stages/fixed_chunk_core.py` · `fixed_retrieval_unit` |
| 누락 감사 | `src/struct4search/ingest/stages/fixed_chunk_core.py` · `coverage_audit` |
| 설정 스키마 | `src/struct4search/config_schema.py` · `ChunkingConfig` |
| 설정값 | `configs/ingest-production.yaml` · `chunking` |
