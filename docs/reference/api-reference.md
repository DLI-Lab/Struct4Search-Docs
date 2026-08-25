---
sidebar_position: 1
title: API Reference
---

# API Reference

Struct4Search API에서 제공하는 주요 경로를 정리합니다. 각 API의 전체 파라미터, 요청·응답 Schema와 직접 호출은 **Swagger UI**에서 확인할 수 있습니다.

## API 사용 정보

| 항목 | 내용 |
|---|---|
| 프레임워크 | FastAPI |
| 기본 형식 | `application/json` |
| 파일 응답 | 원본 문서·페이지·figure는 바이너리 응답 |
| 인증 | 현재 없음 |
| API 버전 | `/v1` |
| Swagger UI | `/docs` |
| OpenAPI Schema | `/openapi.json` |

## 검색과 답변

| Method | Path | 주요 입력 | 주요 출력 |
|---|---|---|---|
| `GET` | `/v1/health` | 없음 | 검색·답변 경로 상태 |
| `POST` | `/v1/response` | `query` 필수, `query_id` 선택, `X-Request-ID` 헤더 선택 | 답변과 Citation |
| `GET` | `/v1/source-pdf` | `source_uri` | 인용된 원본 PDF |

`POST /v1/response`는 [검색·답변 파이프라인](../query/overview.md)을 실행하는 API입니다.

대표 응답은 다음과 같습니다.

```json
{
  "answer": "...",
  "citations": [
    {
      "unit_id": "ruf_..."
    }
  ],
  "insufficient_evidence": false,
  "search_results": [],
  "generation_mode": "llm",
  "degraded": false,
  "retrieval_index": "...",
  "answer_context": {
    "original_block_count": 10,
    "representation_count": 10
  }
}
```

## 문서 조회

| Method | Path | 주요 입력 | 주요 출력 |
|---|---|---|---|
| `GET` | `/v1/capabilities` | 조회 조건 | 지원하는 문서 기능 |
| `GET` | `/v1/documents` | 조회 조건 | 문서 목록 |
| `GET` | `/v1/idr` | `document_id` | 문서 IDR |
| `GET` | `/v1/document-pipeline` | `document_id` | 문서 파이프라인 결과 |
| `GET` | `/v1/document-file` | `document_id` | 원본 문서 |
| `GET` | `/v1/document-page` | `document_id`, `page`, `scale` 선택 | 문서 페이지 이미지 |
| `GET` | `/v1/idr/figure` | `document_id`, `block_id` | IDR figure |
| `POST` | `/v1/kg/subgraph` | JSON 요청 본문 | 지식그래프 부분 그래프 |

## 웹 UI 호환 경로

웹 UI에서는 같은 문서 조회 기능을 `/api/documents/...` 형태로도 사용합니다.

| Method | Path | 주요 입력 | 주요 출력 |
|---|---|---|---|
| `GET` | `/api/documents/capabilities` | 조회 조건 | 지원하는 문서 기능 |
| `GET` | `/api/documents` | 조회 조건 | 문서 목록 |
| `GET` | `/api/documents/{document_id}/pipeline` | `document_id` | 문서 파이프라인 결과 |
| `GET` | `/api/documents/{document_id}/idr` | `document_id` | 문서 IDR |
| `GET` | `/api/documents/{document_id}/pdf` | `document_id` | 원본 PDF |
| `GET` | `/api/documents/{document_id}/pages/{page}` | `document_id`, `page` | 페이지 이미지 |
| `GET` | `/api/documents/{document_id}/figures/{block_id}` | `document_id`, `block_id` | figure |
| `GET` | `/api/documents/{document_id}/connections` | `document_id` | 문서 연결 관계 |

`/api/documents/{document_id}/pages/{page}`의 `page`는 **1부터 시작합니다.**

`/v1`은 Struct4Search의 API 경로이고, `/api/documents/...`는 웹 UI에서 사용하는 문서 조회 호환 경로입니다.

## 조건부로 제공되는 경로

문서 조회와 웹 UI 호환 API는 문서 조회 라우터가 애플리케이션에 연결된 경우에 제공됩니다. 해당 라우터를 사용하지 않는 구성에서는 검색·답변 API만 사용할 수 있습니다.

현재 실행 환경에서 실제로 제공되는 API 목록은 Swagger UI에서 확인합니다.

## 전체 명세 확인

이 페이지는 API 전체를 빠르게 찾기 위한 요약입니다. 다음 정보는 Swagger UI에서 확인합니다.

- Query·Path·Header 파라미터
- Request Body Schema
- Response Schema
- HTTP 상태 코드
- 필수·선택 필드
- 요청·응답 예시
- API 직접 실행

API의 요청·응답 계약과 실행 방식은 [실행 계약](api-contract.md)도 함께 참고합니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 애플리케이션 구성과 `/v1` API | `src/struct4search/entrypoints/api/legacy_response.py` |
| 문서 조회 API | `src/struct4search/entrypoints/api/document_viewer.py` |
| 웹 UI 전송 계약 | `src/struct4search/entrypoints/api/web_contracts.py` |
| API 조립 | `src/struct4search/bootstrap/composition.py` |
