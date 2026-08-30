---
sidebar_position: 2
title: 문서 파싱
---

# 문서 파싱

운영 인덱싱은 PDF와 PNG·JPEG 이미지를 입력으로 받습니다. 디지털 PDF는 pdf4LLM으로 처리하고, 스캔 PDF와 이미지는 MinerU 2.5 Pro 1.2B로 처리합니다. 형식과 파서가 달라도 결과는 같은 IDR(표준 문서 표현) 구조로 변환됩니다.

## 입력과 출력

|    |                    |
| -- | ------------------ |
| 입력 | 아래 표에서 `사용 가능`으로 표시한 문서 파일 |
| 출력 | 페이지·블록·요소로 구성된 IDR |

### 입력할 수 있는 파일

| 파일 종류 | 확장자 | 현재 상태 | 사용하는 파서와 조건 |
|---|---|---|---|
| PDF | `.pdf` | 사용 가능 | 디지털 페이지는 `pymupdf4llm`, 스캔 페이지는 MinerU를 사용합니다. 디지털 페이지와 스캔 페이지가 섞인 PDF는 페이지마다 파서를 선택합니다. |
| PNG 이미지 | `.png` | 사용 가능 | 이미지 한 장을 한 페이지짜리 스캔 문서로 보고 MinerU로 처리합니다. |
| JPEG 이미지 | `.jpg`, `.jpeg` | 사용 가능 | 이미지 한 장을 한 페이지짜리 스캔 문서로 보고 MinerU로 처리합니다. |
| 한글 문서 | `.hwp`, `.hwpx` | 아직 사용 불가 | 확장자와 `hwp` 파서 이름만 등록되어 있으며 실제 파싱 코드는 구현되지 않았습니다. |
| PowerPoint | `.pptx` | 아직 사용 불가 | 확장자와 `pptx` 파서 이름만 등록되어 있으며 실제 파싱 코드는 구현되지 않았습니다. |

PNG와 JPEG는 별도의 선택형 파서를 지정할 필요가 없습니다. 인덱싱 입력 목록에서 `corpus_modality`를 `scan`으로, `page_count`를 `1`로 기록하면 기존 MinerU 경로가 처리합니다. `corpus_modality`는 이 문서를 디지털 문서, 스캔 문서 또는 두 형식이 섞인 문서 중 어느 방식으로 처리할지 나타내는 값입니다.

다만 `POST /v1/documents`로 파일을 등록하는 현재 문서 API는 PDF만 받습니다. PNG와 JPEG는 인덱싱 파이프라인에서는 처리할 수 있지만, 공개 업로드 API를 통해 바로 등록할 수는 없습니다.

IDR의 요소 하나는 다음과 같은 형태입니다.

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

## 형식별 동작 방식

1. 디지털 PDF는 pdf4LLM으로 처리합니다.
2. 스캔 PDF는 각 페이지를 이미지로 만든 뒤 MinerU로 처리합니다.
3. 디지털 페이지와 스캔 페이지가 섞인 PDF는 페이지마다 사용할 파서를 정합니다.
4. PNG와 JPEG는 한 페이지짜리 스캔 문서로 보고 MinerU로 처리합니다.
5. 파서별 결과를 하나의 IDR 구조로 통합합니다.

파서 선택은 페이지 단위로 이루어집니다. 따라서 한 문서 안에서도 텍스트층이 있는 페이지는 pdf4LLM으로, 스캔된 페이지는 MinerU로 처리할 수 있습니다.

### 설정값

| profile key                               | 현재 운영 설정 값                | 의미                       |
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

## 코드 참조

| 확인할 내용    | 파일·심볼                                                         |
| --------- | ------------------------------------------------------------- |
| 문서 파싱     | `backend/struct4search/ingest/stages/parsing/stage.py` · `build_canonical_idr` |
| 페이지 판정    | `backend/struct4search/ingest/stages/parsing/routing.py` · `ConservativeHybridPageRouting` |
| IDR 통합    | `backend/struct4search/adapters/parsing/canonical_builder.py`     |
| MinerU 연동 | `backend/struct4search/mineru_vllm_async_service.py`              |
| 운영 입력 형식 검사 | `backend/struct4search/e2e/full_corpus_fixture.py` · `_MEDIA_TYPES`, `detected_media_type` |
| HWP·PPTX 구현 상태 | `backend/struct4search/adapters/parsing/canonical_runtime/parsing/more_parsers.py` |
| profile      | `configs/ingest-production.yaml` · `parser` · `canonical_idr` |
