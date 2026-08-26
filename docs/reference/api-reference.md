---
sidebar_position: 1
title: API Reference
---

# API Reference

`struct4search-api`가 제공하는 canonical HTTP 계약입니다.

## 서버 실행

fixture provider는 외부 서비스 없이 실행할 수 있습니다.

```bash
struct4search-api \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --host 127.0.0.1 \
  --port 3100
```

production provider는 같은 위치에 `--profile configs/production.yaml`을 사용합니다. 두 provider를 동시에 지정하거나 모두 생략할 수 없습니다.

현재 canonical app은 FastAPI의 Swagger UI와 ReDoc UI를 비활성화하지만, 기계 판독용 OpenAPI JSON은 `GET /openapi.json`으로 제공합니다. 이 schema에는 아래 검색·답변·문서 조회 경로 19개 operation이 포함됩니다.

## 검색과 답변

| Method | Path | 주요 입력 | 주요 출력 |
|---|---|---|---|
| `GET` | `/v1/health` | 없음 | `status`, `transport` |
| `POST` | `/v1/response` | JSON `query` 필수, `query_id` 선택, `X-Request-ID` 헤더 선택 | 답변과 Citation |
| `GET` | `/v1/source-pdf` | `source_uri` | 인용 원본 바이너리 |

```bash
curl --fail http://127.0.0.1:3100/v1/health
curl --fail \
  --header 'Content-Type: application/json' \
  --data '{"query":"안전모 착용 기준은?","query_id":"q001"}' \
  http://127.0.0.1:3100/v1/response
```

대표 응답 필드는 `answer`, `citations`, `insufficient_evidence`, `search_results`, `generation_mode`, `degraded`, `retrieval_index`, `answer_context`입니다. Citation의 `unit_id`는 원문 근거인 `ruf_` ID여야 합니다.

## 문서 조회 경로

canonical server는 아래 route schema를 등록하지만, 현재 기본 composition에는 document-management backend가 연결되지 않아 모두 HTTP 503을 반환합니다.

| Method | Path |
|---|---|
| `GET` | `/v1/capabilities` |
| `GET` | `/v1/documents` |
| `GET` | `/v1/idr` |
| `GET` | `/v1/document-pipeline` |
| `GET` | `/v1/document-file` |
| `GET` | `/v1/document-page` |
| `GET` | `/v1/idr/figure` |
| `POST` | `/v1/kg/subgraph` |

웹 UI 호환 경로 `/api/documents`, `/api/documents/capabilities`, `/api/documents/{document_id}/...`도 같은 backend port로 전달됩니다. 페이지 번호는 1부터 시작합니다.

## 오류와 종료

transport는 입력 오류·근거 부족·source 조회 실패를 canonical JSON 오류로 변환합니다. SIGINT/SIGTERM 종료 시 FastAPI lifespan과 Uvicorn shutdown이 완료된 뒤 listening port가 해제되어야 합니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| CLI와 listening | `backend/struct4search/entrypoints/cli/api.py` · `main` |
| provider composition | `backend/struct4search/entrypoints/api/server.py` · `compose_api_app` |
| `/v1` transport | `backend/struct4search/entrypoints/api/legacy_response.py` · `create_app` |
| 문서 route schema | `backend/struct4search/entrypoints/api/document_viewer.py` · `create_document_router` |
| QueryService 조립 | `backend/struct4search/bootstrap/composition.py` |
