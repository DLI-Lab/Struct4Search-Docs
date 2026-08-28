---
sidebar_position: 3
title: API Reference
---

# API Reference

이 페이지는 현재 Runtime Master가 제공하는 HTTP 계약을 **외부 client용 공개 API**와
제품 내부 adapter API로 나누어 설명합니다. 공개 API의 OpenAPI 문서는 서버 실행 후
`/docs`, `/redoc`, `/openapi.json`에서 확인합니다.

## 공개 API 시작

제품 stack을 사용하면 답변 API, 문서 API, ChatKit adapter와 UI가 같은 설정으로
연결됩니다. PostgreSQL DSN은 파일에 기록하지 않고 환경변수로 전달합니다.

```bash
export S4S_DOCUMENT_DSN='postgresql://...'
export S4S_KG_DSN='postgresql://...'
# 외부에 노출할 때만 설정합니다. 설정하면 health와 OpenAPI 이외 요청에 인증이 필요합니다.
export S4S_API_KEY='충분히-긴-임의-값'

struct4search-stack --stack configs/services/local-stack.yaml up
```

API만 직접 실행할 때는 문서 backend URL을 함께 지정해야 문서 API가 `503` 대신
현재 PostgreSQL·OpenSearch 데이터를 반환합니다.

```bash
struct4search-api \
  --profile configs/production.yaml \
  --document-api-url http://127.0.0.1:8214 \
  --ingest-output-root outputs/api-ingest \
  --ingest-services configs/services/cold-services.yaml \
  --host 0.0.0.0 \
  --port 3100
```

`S4S_API_KEY`가 설정되어 있으면 다음 두 방식 중 하나로 인증합니다.

```bash
curl -H "Authorization: Bearer $S4S_API_KEY" http://127.0.0.1:3100/v1/documents
curl -H "X-API-Key: $S4S_API_KEY" http://127.0.0.1:3100/v1/documents
```

## 상태와 OpenAPI

| Method | Path | 용도 | 인증 |
|---|---|---|---|
| `GET` | `/health/live` | HTTP process 생존 확인 | 불필요 |
| `GET` | `/health/ready` | profile과 API composition 완료 확인 | 불필요 |
| `GET` | `/v1/health` | 기존 client 호환 상태 API | 필요 |
| `GET` | `/openapi.json` | OpenAPI 3 schema | 불필요 |
| `GET` | `/docs` | Swagger UI | 불필요 |
| `GET` | `/redoc` | ReDoc | 불필요 |

## 검색 전용 API

`POST /v1/search`는 현재 profile의 QueryService에서 **질의 Embedding과 OpenSearch
Hybrid/RRF 검색만** 실행합니다. 답변 Reader는 호출하지 않습니다. 따라서 색인에 사용한
`index.embedding_model`과 같은 model endpoint가 질의 vector를 생성합니다.

```bash
curl -sS http://127.0.0.1:3100/v1/search \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -d '{"query":"밀폐공간 작업 전 확인 사항은?"}'
```

| 입력 | 형식 | 필수 |
|---|---|---|
| `query` | 비어 있지 않은 문자열 | 예 |
| `query_id` | 호출자가 부여한 추적 ID | 아니요 |
| `X-Request-ID` | HTTP 요청 추적 ID | 아니요 |

응답의 `search_results`는 최종 F400 원문 청크입니다. 검색표현 ID는 검색 경로 설명에만
사용되며 Citation 원문으로 반환되지 않습니다.

## 근거 기반 답변 API

### 일반 응답

`POST /v1/responses`는 `/v1/search`와 같은 검색 경로 뒤에 profile의 Reader를 호출하고,
검증된 F400 Citation과 원본 연결 정보를 반환합니다.

```bash
curl -sS http://127.0.0.1:3100/v1/responses \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -d '{"query":"밀폐공간 작업 전 확인 사항은?","stream":false}'
```

| 입력 | 형식 | 기본값 |
|---|---|---|
| `query` | 비어 있지 않은 문자열 | 필수 |
| `query_id` | 호출자 추적 ID | 없음 |
| `stream` | Boolean | `false` |

응답은 `id`, `object: "response"`, `status`, `answer`, `citations`,
`search_results`를 포함합니다. `POST /v1/response`는 기존 UI와 client를 위한 호환
alias이며 `Deprecation: true`와 successor `Link` header를 반환합니다. 신규 client는
`/v1/responses`를 사용합니다.

### SSE event stream

`stream: true`이면 `text/event-stream`으로 다음 event를 보냅니다.

1. `response.created`
2. `response.completed` 또는 `response.failed`
3. `done`

현재 Reader adapter는 구조화된 답변 전체를 검증한 뒤 반환하므로 token delta가 아니라
작업 lifecycle event를 streaming합니다. 완성 전의 검증되지 않은 Citation을 노출하지
않기 위한 계약입니다.

## 문서 lifecycle

문서 API는 `S4S_DOCUMENT_DSN`, `S4S_KG_DSN`, `S4S_SEARCH_INDEX_URL`,
`S4S_SEARCH_INDEX_NAME`이 가리키는 **현재 저장소**를 사용합니다. 업로드 원본은
`S4S_DOCUMENT_UPLOAD_ROOT` 아래에만 저장합니다. `struct4search-stack`은 이 경로를
`<ingest_output_root>/uploads`로 설정합니다.

| Method | Path | 결과 |
|---|---|---|
| `POST` | `/v1/documents` | PDF 업로드와 ingest-ready manifest 등록 |
| `GET` | `/v1/documents` | 검색·filter·pagination된 문서 목록 |
| `GET` | `/v1/documents/{document_id}` | 문서 상세, 사용자 Metadata, ingest manifest |
| `PATCH` | `/v1/documents/{document_id}` | 사용자 Metadata 교체 |
| `DELETE` | `/v1/documents/{document_id}` | 현재 OpenSearch·KG·문서 DB와 server-owned 원본에서 삭제 |
| `GET` | `/v1/idr` | `document_id`의 Canonical IDR |
| `GET` | `/v1/document-pipeline` | 파싱·KG·Metadata·검색표현 결과 |
| `POST` | `/v1/kg/subgraph` | 최대 50개 문서의 KG 부분 그래프 |
| `GET` | `/v1/document-file` | 원본 PDF |
| `GET` | `/v1/document-page` | 1부터 시작하는 PDF page PNG |
| `GET` | `/v1/idr/figure` | IDR Figure 영역 이미지 |

### PDF 업로드

파일 경로를 JSON으로 보내지 않습니다. PDF bytes를 전송하고 이름·문서 유형을 header로
지정합니다. 현재 자동 ingest 입력은 PDF만 지원합니다.

```bash
curl -sS http://127.0.0.1:3100/v1/documents \
  -X POST \
  -H 'Content-Type: application/pdf' \
  -H 'X-Filename: safety-guide.pdf' \
  -H 'X-Corpus-Modality: mixed' \
  -H "Authorization: Bearer $S4S_API_KEY" \
  --data-binary @safety-guide.pdf
```

`X-Corpus-Modality`은 `digital`, `mixed`, `scan` 중 하나이며 기본값은 `mixed`입니다.
응답의 `document_id`를 인제션 작업에 넘깁니다. 같은 bytes를 다시 보내면 SHA-256 기반의
같은 기본 ID를 사용합니다. 호출자가 `X-Document-ID`를 지정할 수도 있습니다.

### 사용자 Metadata 수정

```bash
curl -sS http://127.0.0.1:3100/v1/documents/<document_id> \
  -X PATCH \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -d '{"metadata":{"owner":"안전팀","retention":"5y"}}'
```

`metadata` 외의 시스템 IDR·pipeline 필드는 이 API로 변경할 수 없습니다.

### 삭제

삭제는 검색 index와 KG 삭제가 성공한 뒤 문서 DB를 삭제합니다. 중간 저장소 연결이
실패하면 `502` 또는 `503`으로 종료하고 문서 DB를 남겨 재시도할 수 있게 합니다. 원본
파일은 `S4S_DOCUMENT_UPLOAD_ROOT` 아래에서 API가 소유한 파일만 삭제합니다.

## 비동기 문서 인덱싱

API client는 파싱·Metadata·KG·검색표현·Embedding 단계를 각각 호출하지 않습니다.
`POST /v1/ingest/jobs` 한 번이 CLI와 동일한 기존 DAG를 Temporal workflow로 실행합니다.
업로드 문서의 manifest도 서버가 생성하며 request에서 임의의 profile·output·source 경로를
받지 않습니다.

| Method | Path | 결과 |
|---|---|---|
| `POST` | `/v1/ingest/jobs` | `202`; 비동기 전체 pipeline 작업 생성 |
| `GET` | `/v1/ingest/jobs` | `limit`, `status`, `cursor` 기반 목록 |
| `GET` | `/v1/ingest/jobs/{job_id}` | 전체·단계별 진행과 catalog 동기화 결과 |
| `GET` | `/v1/ingest/jobs/{job_id}/documents` | 문서별 완료·부분 완료·실패 결과 |
| `POST` | `/v1/ingest/jobs/{job_id}/retry` | 실패·취소 작업을 같은 ledger에서 재개 |
| `POST` | `/v1/ingest/jobs/{job_id}/cancel` | 실행 중인 Temporal workflow 취소 요청 |

업로드한 문서 한 건을 실행하는 예입니다.

```bash
curl -sS http://127.0.0.1:3100/v1/ingest/jobs \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -d '{
    "document_ids":["dapi_0123456789abcdef01234567"],
    "idempotency_key":"upload-20260828-001"
  }'
```

`document_ids`가 기존 profile manifest에 있으면 그 행을 그대로 사용합니다. 업로드 ID라면
문서 DB의 `s4s_intake.manifest`를 검증해 job 전용 파생 profile을 만듭니다. 완료 후 기존
`sync_document_catalog()`가 Canonical IDR와 Metadata를 `public.documents`와
`public.document_metadata`에 반영하므로 문서 관리 화면이 같은 DB에서 바로 읽습니다.

선택 문서 작업은 `s4s-current` 전체 alias를 새 1문서 index로 교체하지 않습니다. alias가
가리키는 단일 현재 index에서 해당 `document_id`의 source·retrieval-expression partition만
갱신합니다. 새 vector bulk가 실패하면 기존 partition을 먼저 삭제하지 않으며, 성공한 뒤
사라진 이전 unit만 정리합니다. 전체 manifest 실행만 새 index 검증 후 alias를 이동합니다.

작업 목록 pagination 예입니다.

```bash
curl -sS 'http://127.0.0.1:3100/v1/ingest/jobs?status=running&limit=20'
curl -sS 'http://127.0.0.1:3100/v1/ingest/jobs?limit=20&cursor=<next_cursor>'
```

주요 오류 코드는 다음과 같습니다.

| 상태 | 의미 |
|---|---|
| `401` | API key가 설정되었지만 credentials가 없거나 다름 |
| `404` | 문서 또는 job이 없음 |
| `409` | idempotency 충돌, 허용되지 않는 retry/cancel 상태 |
| `413` | PDF가 server upload 제한보다 큼 |
| `415` | PDF가 아니거나 Content-Type이 다름 |
| `422` | request schema, manifest, 파일 검증 실패 |
| `502` | 연결된 OpenSearch 등 downstream이 요청을 거부함 |
| `503` | Temporal, 문서 backend, 모델·검색 prerequisite가 연결되지 않음 |

## 제품 UI adapter 경로

다음 `/api/documents/*` 경로는 React 제품 화면을 위한 BFF 호환 경로입니다. 외부 신규
client는 `/v1/*`를 사용합니다.

| Method | Path |
|---|---|
| `GET` | `/api/documents/capabilities` |
| `GET` | `/api/documents` |
| `GET` | `/api/documents/{document_id}/pipeline` |
| `GET` | `/api/documents/{document_id}/idr` |
| `GET` | `/api/documents/{document_id}/pdf` |
| `GET` | `/api/documents/{document_id}/pages/{page}` |
| `GET` | `/api/documents/{document_id}/figures/{block_id}` |
| `GET` | `/api/documents/{document_id}/connections` |

## 내부 service API

다음 API는 공개 client surface가 아니라 stack 내부 adapter·worker용입니다.

| Service | Method·Path | 용도 |
|---|---|---|
| ChatKit adapter | `POST /chatkit` | 제품 대화 transport |
| ChatKit adapter | `GET /sources/{source_id}` | 현재 session 출처 조회 |
| ChatKit adapter | `GET /source-runs/{run_id}` | 답변별 출처 묶음 |
| ChatKit adapter | `GET /threads/{thread_id}/source-run` | 대화의 최근 출처 묶음 |
| ChatKit adapter | `GET /sources/{source_id}/idr` | 출처 IDR proxy |
| ChatKit adapter | `GET /sources/{source_id}/pipeline` | 출처 pipeline proxy |
| MinerU worker | `GET /health`, `GET /metrics` | parser 상태·metric |
| MinerU worker | `POST /v1/two-step-extract` | 단일 page parsing |
| MinerU worker | `POST /v1/two-step-extract-batch` | page batch parsing |
| Policy review | `GET`, `POST /api/decisions` | 로컬 정책 검토 UI |

단계별 파싱·NER·Metadata·KG·검색표현 API, raw embedding API, model start/stop API,
OpenSearch admin API와 DB dump API는 공개하지 않습니다. 이 기능은 전체 ingest DAG 또는
운영 도구가 소유하며, 외부 client가 중간 상태를 건너뛰거나 저장소 관리 권한을 얻지 않게
합니다.
