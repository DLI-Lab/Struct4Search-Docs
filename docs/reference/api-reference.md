---
sidebar_position: 1
title: API Reference
---

# API Reference

현재 API 서버가 제공하는 경로 목록입니다. 파라미터와 전체 요청·응답 Schema는 이 페이지에서 다루지 않고 [실행 계약](api-contract.md)과 각 파이프라인 페이지로 연결합니다.

## API 사용 정보

| 항목 | 내용 |
|---|---|
| 프레임워크 | FastAPI |
| 형식 | `application/json`. 원본 파일 조회는 바이너리 응답 |
| 인증 | 현재 없음 |
| API 버전 | 경로 접두어 `/v1` |
| Swagger UI | **현재 비활성** |
| OpenAPI Schema | FastAPI 기본 경로 |

:::warning Swagger UI가 켜져 있지 않습니다

애플리케이션이 `docs_url=None`, `redoc_url=None`으로 만들어져 `/docs`와 `/redoc`이 응답하지 않습니다. 다른 포트에서 열리는 Swagger 화면이 있다면 이 구현의 것이 아니므로 명세로 쓰지 않습니다.

:::

## API 목록

### 검색과 답변

| Method | Path | 주요 입력 | 주요 출력 |
|---|---|---|---|
| `GET` | `/v1/health` | 없음 | 질의 경로 상태 |
| `POST` | `/v1/response` | `query` 필수, `query_id` 선택, `X-Request-ID` 헤더 선택 | 답변과 인용 |
| `GET` | `/v1/source-pdf` | `source_uri` | 인용 원본 PDF |

`POST /v1/response`가 [검색·답변 파이프라인](../query/overview.md)을 그대로 태우는 경로입니다. 응답 형태는 다음과 같습니다.

```json
{
  "answer": "...",                              // 답변 본문
  "citations": [{"unit_id": "ruf_..."}],        // 인용된 원문 청크
  "insufficient_evidence": false,               // 근거가 없어 답하지 못한 경우 true
  "search_results": [],                         // 검색 결과
  "generation_mode": "llm",                     // 생성 방식
  "degraded": false,                            // 축소 동작 여부
  "retrieval_index": "...",                     // 검색에 쓴 인덱스
  "answer_context": {
    "original_block_count": 10,                 // Context 에 실린 원문 청크 수
    "representation_count": 10
  }
}
```

### 문서 조회

| Method | Path | 주요 입력 | 주요 출력 |
|---|---|---|---|
| `GET` | `/v1/capabilities` | 질의 문자열 전달 | 문서 기능 정보 |
| `GET` | `/v1/documents` | 질의 문자열 전달 | 문서 목록 |
| `GET` | `/v1/idr` | `document_id` | 문서 IDR |
| `GET` | `/v1/document-pipeline` | `document_id` | 문서 파이프라인 결과 |
| `GET` | `/v1/document-file` | `document_id` | 원본 문서 |
| `GET` | `/v1/document-page` | `document_id`, `page`, `scale` 선택 | 문서 페이지 이미지 |
| `GET` | `/v1/idr/figure` | `document_id`, `block_id` | IDR figure |
| `POST` | `/v1/kg/subgraph` | JSON 본문 | 지식그래프 부분 그래프 |

### 웹 UI 호환 경로

| Method | Path | 주요 입력 | 주요 출력 |
|---|---|---|---|
| `GET` | `/api/documents/capabilities` | 질의 문자열 전달 | 문서 기능 정보 |
| `GET` | `/api/documents` | 질의 문자열 전달 | 문서 목록 |
| `GET` | `/api/documents/{document_id}/pipeline` | 경로 `document_id` | 파이프라인 결과 |
| `GET` | `/api/documents/{document_id}/idr` | 경로 `document_id` | 문서 IDR |
| `GET` | `/api/documents/{document_id}/pdf` | 경로 `document_id` | 원본 PDF |
| `GET` | `/api/documents/{document_id}/pages/{page}` | 경로 `document_id`, `page` | 페이지 이미지 |
| `GET` | `/api/documents/{document_id}/figures/{block_id}` | 경로 ID | figure |
| `GET` | `/api/documents/{document_id}/connections` | 경로 `document_id` | 문서 연결 관계 |

`/api/documents/{document_id}/pages/{page}`의 `page`는 **1부터** 셉니다.

`/v1`과 `/api`는 같은 기능의 두 표기입니다. `/api` 쪽은 웹 UI가 쓰던 경로 형태를 유지하기 위한 것입니다.

## 조건부로 설치되는 경로

문서 조회와 웹 UI 호환 경로 16개는 **문서 라우터가 조립 시점에 주입된 경우에만** 설치됩니다. 주입하지 않으면 검색·답변 관련 세 경로만 응답합니다.

배포에서 어떤 경로가 살아 있는지는 조립 지점 설정으로 결정됩니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 애플리케이션 구성과 `/v1` 경로 | `src/struct4search/entrypoints/api/legacy_response.py` |
| 문서 조회 라우터 | `src/struct4search/entrypoints/api/document_viewer.py` |
| 웹 전송 계약 | `src/struct4search/entrypoints/api/web_contracts.py` |
| 라우터 주입 | `src/struct4search/bootstrap/composition.py` |
