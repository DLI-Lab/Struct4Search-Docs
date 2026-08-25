---
sidebar_position: 2
title: 문서 파싱
---

# 문서 파싱

디지털 PDF는 pdf4LLM으로, 스캔·복합 문서는 MinerU 2.5 Pro 1.2B로 파싱한 뒤 IDR(표준 문서 표현)로 통합합니다. 파서가 달라도 이후 단계를 같은 구조로 처리하기 위한 단계입니다.

## 입력과 출력

|    |                    |
| -- | ------------------ |
| 입력 | PDF 문서             |
| 출력 | 페이지·블록·요소로 구성된 IDR |

IDR의 요소 하나는 다음과 같은 형태입니다.

```json
{
  "canonical_element_id": "d002343_6b6d39ebe6#p2#b7#e0",
  "page_id": "d002343_6b6d39ebe6#p2",
  "page_index": 2,
  "block_type": "text",
  "element_type": "paragraph",
  "text": "개구부 덮개 상부에서 작업 중 떨어짐",
  "heading_path": ["3. 재해개요"],
  "section_id": "...",
  "regions": ["... 일부 생략 ..."]
}
```

IDR에는 각 요소의 본문과 문서 구조, 원본 페이지 위치가 함께 기록됩니다. 이 결과를 [원문 청킹](chunking.md)과 [NER](ner.md)가 공통 입력으로 사용합니다.

## 동작 방식

1. 페이지마다 텍스트층을 사용할 수 있는지 판정합니다.
2. 판정 결과에 따라 pdf4LLM 또는 MinerU로 페이지를 파싱합니다.
3. 파서별 결과를 하나의 IDR 구조로 통합합니다.

파서 선택은 페이지 단위로 이루어집니다. 따라서 한 문서 안에서도 텍스트층이 있는 페이지는 pdf4LLM으로, 스캔된 페이지는 MinerU로 처리할 수 있습니다.

### 환경변수

| 환경변수명                                 | 기본 옵션                | 의미                       |
| ------------------------------------- | -------------------- | ------------------------ |
| `parser.digital`                      | `pymupdf4llm`        | 디지털 페이지에 사용하는 파서         |
| `parser.scan`                         | `mineru`             | 스캔 페이지에 사용하는 파서          |
| `parser.mixed`                        | `hybrid_page_router` | 페이지별로 파서를 선택하는 방식        |
| `parser.hybrid_min_native_characters` | 300                  | 디지털 페이지 판정에 사용하는 최소 문자 수 |
| `parser.hybrid_min_native_blocks`     | 3                    | 디지털 페이지 판정에 사용하는 최소 블록 수 |
| `parser.mineru_endpoints`             | 서비스 주소               | MinerU 서버 주소             |
| `canonical_idr.schema`                | `2.0.0-candidate.1`  | IDR 구조 버전                |

`hybrid_*` 값은 페이지를 디지털 또는 스캔으로 판정하는 기준입니다. 값을 변경하면 어떤 파서가 페이지를 처리하는지가 달라질 수 있습니다.

파싱 결과가 달라지면 이후 생성되는 원문 청크와 검색 데이터도 달라지므로 문서 파싱 이후 단계를 다시 처리해야 합니다([실행과 재처리](rerun.md)).

## 사용 또는 결과 확인

문서 파싱은 인덱싱 과정에서 실행됩니다.

```bash
struct4search-ingest --output <출력 디렉터리> --document-id <문서 ID>
```

실행 후 문서별 IDR이 생성되었는지와 각 페이지가 어떤 파서로 처리되었는지 확인합니다.

| 확인할 것  | 정상                        |
| ------ | ------------------------- |
| IDR 요소 | 파싱된 문서 요소가 생성되어 있습니다      |
| 페이지 판정 | 각 페이지의 처리 방식이 기록되어 있습니다   |
| 스캔 페이지 | MinerU를 거친 결과가 IDR에 포함됩니다 |

스캔 페이지가 포함된 문서를 처리하려면 MinerU 서비스가 실행 중이어야 합니다. 서비스 정보는 [API Reference](../reference/api-reference.md)에서 확인할 수 있습니다.

## 코드 참조

| 확인할 내용    | 파일·심볼                                                         |
| --------- | ------------------------------------------------------------- |
| 문서 파싱     | `src/struct4search/parser_stage.py`                           |
| 페이지 판정    | `src/struct4search/page_routing.py`                           |
| IDR 통합    | `src/struct4search/adapters/parsing/canonical_builder.py`     |
| MinerU 연동 | `src/struct4search/mineru_vllm_async_service.py`              |
| 환경변수      | `configs/ingest-production.yaml` · `parser` · `canonical_idr` |
