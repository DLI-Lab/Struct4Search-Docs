---
sidebar_position: 1
title: API 실행과 경로
---

# API 실행과 경로

`struct4search-api`는 검색·답변 API를 제공합니다. 먼저 외부 서비스가 필요 없는 검증용 fixture 서버로 계약을 확인할 수 있습니다.

```bash
struct4search-api \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --host 127.0.0.1 \
  --port 3100
```

운영 API는 `--fixture-results` 대신 `--profile configs/production.yaml`을 사용합니다. 두 옵션은 함께 사용할 수 없습니다.

## 검색·답변 경로

| Method | Path | 입력 | 결과 |
|---|---|---|---|
| `GET` | `/v1/health` | 없음 | 서버 상태 |
| `POST` | `/v1/response` | JSON body의 `query` 필수, `query_id`·`X-Request-ID` 선택 | 답변, Citation, 검색 결과 |
| `GET` | `/v1/source-pdf` | `source_uri` 필수 | 원본 PDF |

`POST /v1/response`의 최소 요청은 다음과 같습니다.

```json
{
  "query": "안전모를 착용한다.",
  "query_id": "q001"
}
```

`query`가 없거나 비어 있으면 `422`를 반환합니다. fixture 서버에서는 fixture에 있는 `query_id`를 사용해야 합니다.

## 현재 제공 범위

문서 조회와 원본 PDF 전송 경로는 API에 남아 있지만, 최신 기본 composition에는 문서 관리 backend와 source PDF transport가 연결되어 있지 않습니다. 따라서 `/v1/source-pdf`와 `/v1/documents` 계열, `/api/documents/...` 계열은 현재 `503`을 반환합니다. 검색·답변에는 `/v1/health`, `/v1/response`를 사용합니다.

FastAPI의 Swagger UI는 노출하지 않습니다. 기계가 읽는 OpenAPI schema는 `/openapi.json`에서 확인할 수 있습니다.

## 코드 위치

| 확인할 내용 | 파일 |
|---|---|
| API 실행 명령 | `backend/struct4search/entrypoints/cli/api.py` |
| API 조립 | `backend/struct4search/entrypoints/api/server.py` |
| 검색·답변 경로 | `backend/struct4search/entrypoints/api/legacy_response.py` |
| 문서 조회 경로 | `backend/struct4search/entrypoints/api/document_viewer.py` |
