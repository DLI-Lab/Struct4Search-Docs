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

`//` 뒤의 내용은 필드 설명이며 실제 JSON 산출물에는 포함되지 않습니다.

```json
{
  "canonical_element_id": "d002343_6b6d39ebe6#p2#b7#e0", // 문서 전체에서 이 요소를 구분하는 고유 ID
  "page_id": "d002343_6b6d39ebe6#p2",                     // 이 요소가 있는 페이지의 고유 ID
  "page_index": 2,                                        // 문서 안의 페이지 순서. 0부터 시작
  "block_type": "text",                                  // 파서가 분류한 상위 블록 종류
  "element_type": "paragraph",                           // 블록 안에서 이 요소가 맡는 역할
  "text": "개구부 덮개 상부에서 작업 중 떨어짐",             // 검색과 후속 처리에 사용하는 원문
  "heading_path": ["3. 재해개요"],                         // 이 요소까지 이어지는 상위 제목 경로
  "section_id": "d002343_6b6d39ebe6#s3",                 // 이 요소가 속한 문서 구역의 ID
  "regions": [                                            // 원본 페이지에서 이 요소가 차지하는 영역 정보
    {
      "page_index": 2,                                    // 영역이 있는 페이지 순서. 0부터 시작
      "bbox": [72.0, 184.5, 493.2, 226.8]                 // 페이지 안의 왼쪽·위·오른쪽·아래 좌표
    }
  ]
}
```

IDR에는 각 요소의 본문과 문서 구조, 원본 페이지 위치가 함께 기록됩니다. 이 결과를 [원문 청킹](chunking.md)과 [NER](ner.md)가 공통 입력으로 사용합니다.

## 동작 방식

1. 페이지마다 텍스트층을 사용할 수 있는지 판정합니다.
2. 판정 결과에 따라 pdf4LLM 또는 MinerU로 페이지를 파싱합니다.
3. 파서별 결과를 하나의 IDR 구조로 통합합니다.

파서 선택은 페이지 단위로 이루어집니다. 따라서 한 문서 안에서도 텍스트층이 있는 페이지는 pdf4LLM으로, 스캔된 페이지는 MinerU로 처리할 수 있습니다.

### 설정값

| profile key                               | 현재 production 값                | 의미                       |
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

## 이 단계의 결과 확인

문서 파싱만 따로 실행하는 공개 명령은 없습니다. [문서 인덱싱 실행과 상태 확인](rerun.md)의 `struct4search-ingest` 명령을 실행하면 첫 단계로 문서 파싱이 수행됩니다. 아래 경로에서 `<출력_디렉터리>`는 그 명령의 `--output`에 지정한 디렉터리이고, `<문서_ID>`는 `--document-id`에 지정한 값입니다.

| 확인 대상 | 확인 위치·방법 | 정상 | 비정상 |
|---|---|---|---|
| 파싱 완료 | `<출력_디렉터리>/canonical/receipts/<문서_ID>.json` | 파일이 있고 `status`가 `complete`입니다. | 파일이 없거나 `status`가 다르면 파싱이 끝나지 않은 상태입니다. |
| IDR | `<출력_디렉터리>/canonical/canonical_idr/<문서_ID>.json` | `pages`에 페이지가 있고 각 요소에 본문과 페이지 위치가 기록되어 있습니다. | 파일이 없거나 페이지·요소 구조를 읽을 수 없으면 IDR 변환에 실패한 상태입니다. |
| 페이지별 파서 선택 | `<출력_디렉터리>/page_parser_routes.json` | 문서의 각 페이지에 적용한 파서가 기록되어 있습니다. | 처리한 페이지가 빠져 있으면 페이지 판정 또는 파서 호출 결과를 확인해야 합니다. |

스캔 페이지에서 파싱이 멈췄다면 MinerU 서비스 상태를 먼저 확인합니다. 필요한 서비스는 [설치 요구사항](../reference/dependencies.md)에서 설명합니다. 문서 전체의 성공 여부는 `<출력_디렉터리>/documents/<문서_ID>/complete.json`에서, 실패 원인은 같은 위치의 `failure.json`에서 확인합니다.

## 코드 참조

| 확인할 내용    | 파일·심볼                                                         |
| --------- | ------------------------------------------------------------- |
| 문서 파싱     | `backend/struct4search/ingest/stages/parsing/stage.py` · `build_canonical_idr` |
| 페이지 판정    | `backend/struct4search/ingest/stages/parsing/routing.py` · `ConservativeHybridPageRouting` |
| IDR 통합    | `backend/struct4search/adapters/parsing/canonical_builder.py`     |
| MinerU 연동 | `backend/struct4search/mineru_vllm_async_service.py`              |
| profile      | `configs/ingest-production.yaml` · `parser` · `canonical_idr` |
