---
sidebar_position: 2
title: 문서 파싱
---

# 문서 파싱

디지털 PDF는 pdf4LLM으로, 스캔·복합 문서는 MinerU 2.5 Pro 1.2B로 파싱한 뒤 IDR(표준 문서 표현)로 통합합니다. 파서별 출력 형식이 달라도 이후 단계를 동일한 구조로 처리하기 위해서입니다.

## 입력과 출력

| | |
|---|---|
| 입력 | PDF 문서 |
| 출력 | IDR — 페이지·블록·요소로 계층화된 표준 문서 표현 |

IDR의 요소 하나는 이런 형태입니다.

```json
{
  "canonical_element_id": "d002343_6b6d39ebe6#p2#b7#e0", // 요소 ID — 문서#페이지#블록#요소
  "page_id": "d002343_6b6d39ebe6#p2",                    // 페이지
  "page_index": 2,                                       // 0부터 세는 페이지 번호
  "block_type": "text",                                  // 블록 종류
  "element_type": "paragraph",                           // 요소 종류
  "text": "개구부 덮개 상부에서 작업 중 떨어짐",            // 본문
  "heading_path": ["3. 재해개요"],                        // 상위 제목 경로
  "section_id": "...",                                   // 문서 구조 위치
  "regions": ["... 일부 생략 ..."]                        // 원본 페이지에서의 영역
}
```

ID가 `#`로 이어져 있어 요소만 보고도 어느 문서 어느 페이지의 몇 번째 블록인지 알 수 있습니다. 이 ID가 [원문 청킹](chunking.md)과 [NER](ner.md)의 위치 기준이 됩니다.

## 동작 방식

1. 페이지마다 텍스트층이 쓸 만한지 판정합니다.
2. 판정 결과에 따라 pdf4LLM 또는 MinerU로 그 페이지를 파싱합니다.
3. 두 파서의 출력을 IDR 하나로 통합하고 제목 경로를 붙입니다.

판정은 페이지 단위입니다. 한 문서 안에서도 텍스트층이 살아 있는 페이지는 pdf4LLM이, 스캔된 페이지는 MinerU가 맡는 복합 문서가 있기 때문입니다.

### 환경변수

| 환경변수명 | 기본 옵션 | 의미 |
|---|---|---|
| `parser.digital` | `pymupdf4llm` | 텍스트층이 살아 있는 페이지를 읽는 파서 |
| `parser.scan` | `mineru` | 텍스트층이 없는 스캔 페이지를 읽는 파서 |
| `parser.mixed` | `hybrid_page_router` | 한 문서 안에서 페이지마다 파서를 나누는 방식 |
| `parser.hybrid_min_native_characters` | 300 | 이 글자 수 미만이면 텍스트층을 못 믿고 스캔으로 봅니다 |
| `parser.hybrid_min_native_blocks` | 3 | 이 블록 수 미만이면 텍스트층을 못 믿고 스캔으로 봅니다 |
| `parser.mineru_endpoints` | 서비스 주소 | 스캔 페이지를 보낼 MinerU 서버 |
| `canonical_idr.schema` | `2.0.0-candidate.1` | 파싱 결과 구조의 버전. 이후 단계가 이 구조를 전제합니다 |

`hybrid_*` 값이 페이지 판정 기준입니다. 이 값을 내리면 흐릿한 텍스트층을 그대로 쓰게 되고, 올리면 멀쩡한 페이지까지 MinerU로 넘어가 파싱이 느려집니다.

파싱 결과가 바뀌면 그 뒤 단계가 모두 무효가 되므로 **문서 파싱부터 인덱싱까지 다시 처리해야 합니다**([실행과 재처리](rerun.md)).

## 사용 또는 결과 확인

인덱싱 실행기가 호출합니다.

```bash
struct4search-ingest --output <출력 디렉터리> --document-id <문서 ID>
```

문서별 산출물에서 볼 것은 세 가지입니다.

| 확인할 것 | 정상 |
|---|---|
| IDR 요소 수 | 0이 아닙니다 |
| 페이지 판정 기록 | 페이지마다 어느 파서가 맡았는지 남습니다 |
| `text` | 스캔 페이지에서도 비어 있지 않습니다 |

MinerU 서비스가 뜨지 않으면 스캔 페이지가 있는 문서는 실패합니다. 서비스 주소는 [API Reference](../reference/api-reference.md)에 있습니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 실행 진입점 | `src/struct4search/parser_stage.py` |
| 페이지 판정 | `src/struct4search/page_routing.py` |
| IDR 통합 | `src/struct4search/adapters/parsing/canonical_builder.py` |
| MinerU 호출 | `src/struct4search/mineru_vllm_async_service.py` |
| 설정값 | `configs/ingest-production.yaml` · `parser` · `canonical_idr` |
