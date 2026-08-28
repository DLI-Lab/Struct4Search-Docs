---
sidebar_position: 3
title: API Reference
---

# API Reference

현재 Runtime에서 실행되는 HTTP API를 기능별로 정리합니다.

## 검색과 답변

| 프로세스 | Method | Path | 입력 | 결과 |
|---|---|---|---|---|
| `struct4search-api` | `GET` | `/v1/health` | 없음 | API 상태 |
| `struct4search-api` | `POST` | `/v1/response` | Body: `query` 필수, `query_id` 선택<br />Header: `X-Request-ID` 선택 | 답변, Citation, 검색 결과 |
| `struct4search-api` | `GET` | `/v1/source-pdf` | Query: `source_uri` 필수 | 원본 PDF. PDF 저장소가 연결되지 않았으면 `503` |
| Restored snapshot API | `GET` | `/v1/health` | 없음 | 복원 API 상태 |
| Restored snapshot API | `POST` | `/v1/response` | Body: `query` 필수, `query_id` 선택 | 복원한 OpenSearch 스냅샷의 검색·답변 |
| Restored snapshot API | `GET` | `/v1/source-pdf` | Query: `source_uri` 필수 | 원본 PDF 저장소가 없으므로 `503` |
| Full-corpus answer bridge | `GET` | `/v1/health` | 없음 | Bridge 상태 |
| Full-corpus answer bridge | `POST` | `/v1/response` | Body: `query` 필수 | 전체 corpus 검색·답변 |
| Full-corpus answer bridge | `GET` | `/v1/source-pdf` | Query: `source_uri` 필수 | 답변 근거의 원본 PDF |

## 문서 조회

Canonical IDR viewer가 문서 조회 원본 API를 제공합니다.

| Method | Path | 입력 | 결과 |
|---|---|---|---|
| `GET` | `/v1/health` | 없음 | IDR viewer 상태 |
| `GET` | `/v1/capabilities` | 없음 | 지원 기능 |
| `GET` | `/v1/documents` | `q`, `file_type`, `status`, `error_type`, `updated`, `sort`, `page`, `page_size` 선택 | 문서 목록과 페이지 정보 |
| `GET` | `/v1/idr` | `document_id` 필수, `lineage` 선택 | Canonical IDR |
| `GET` | `/v1/document-pipeline` | `document_id` 필수 | 파싱·KG·Metadata·검색표현 처리 결과 |
| `POST` | `/v1/kg/subgraph` | Body: `document_ids` 배열 필수, 최대 50개 | 선택한 문서의 KG 부분 그래프 |
| `GET` | `/v1/document-file` | `document_id` 필수, `download` 선택 | 원본 문서 파일 |
| `GET` | `/v1/document-page` | `document_id` 필수, `page`·`scale` 선택 | PDF 페이지의 PNG 이미지 |
| `GET` | `/v1/idr/figure` | `document_id`·`block_id` 필수, `lineage` 선택 | Figure 영역 이미지 |

`struct4search-api`에도 위 경로가 등록되어 있지만, 기본 실행에서는 문서 조회 backend가 연결되지 않아 `503`을 반환합니다.

## 문서 인덱싱

전체 인제션은 한 번의 비동기 작업으로 요청합니다. API client가 파싱, Metadata,
KG, 검색표현, OpenSearch 인덱싱 API를 단계별로 호출하지 않습니다. Temporal
workflow가 현재 profile에 선언된 전체 DAG를 실행하고, API는 작업 생성·상태
조회·재시도·취소만 제공합니다.

작업 생성 시 CLI와 같은 managed-service lifecycle을 먼저 실행합니다.
`--ingest-services`에 선언된 Parser·LLM·Embedding·OpenSearch endpoint의 health와
모델 ID가 맞으면 이미 실행 중인 서비스를 재사용하고, 응답하지 않으면 해당
설정의 기존 `restart_argv`로 서비스를 시작합니다. 이후
`ensure_profile_native_rrf_pipeline()`으로 profile에 고정된 OpenSearch Native
RRF pipeline을 생성하거나 현재 hash를 검증하고 기존 Temporal workflow를
시작합니다. 파싱·NER 완료 marker가 생기면 CLI와 같은 GPU handover 로직도
실행됩니다.

### 실행 조건

인제션 API는 `struct4search-api`를 `--ingest-output-root` 및
`--ingest-services`와 함께 실행했을 때 등록됩니다. Temporal server와 Temporal
ingest worker는 먼저 실행해야 합니다. 모델·검색 서비스는 API 작업 생성 시
자동으로 health-check하여 재사용하거나 기동합니다. 로컬 endpoint를 선언한
경우 API, worker, GPU 서비스는 같은 host에서 실행해야 합니다.

터미널 1에서 Temporal을 시작하고 ready 상태를 확인합니다.

```bash
docker compose -f deploy/temporal-compose.yaml up -d

until docker compose -f deploy/temporal-compose.yaml exec -T temporal \
  temporal operator namespace describe \
  --namespace default --address temporal:7233 >/dev/null 2>&1; do
  sleep 2
done
```

터미널 2에서 ingest worker를 계속 실행해 둡니다.

```bash
struct4search-temporal worker \
  --config configs/production.yaml
```

터미널 3에서 API를 실행합니다.

```bash
struct4search-api \
  --profile configs/production.yaml \
  --ingest-output-root outputs/api-ingest \
  --ingest-services configs/services/cold-services.yaml \
  --host 0.0.0.0 \
  --port 3100
```

`struct4search-stack --stack configs/services/local-stack.yaml api`를 사용하면
`local-stack.yaml`의 `ingest_output_root`와 `ingest_services`가 함께 자동으로
전달됩니다.

### Endpoint

| Method | Path | 입력 | 결과 |
|---|---|---|---|
| `POST` | `/v1/ingest/jobs` | Body: `document_ids` 배열 선택, `idempotency_key` 선택 | `202`; 전체 인제션 작업 생성 |
| `GET` | `/v1/ingest/jobs` | Query: `limit` 선택, 기본 50·최대 200 | 최근 인제션 작업 목록 |
| `GET` | `/v1/ingest/jobs/{job_id}` | Path: `job_id` | 전체 상태, 단계별 task 수, 진행률, 결과 요약 |
| `POST` | `/v1/ingest/jobs/{job_id}/retry` | 실패하거나 취소된 작업 | `202`; 같은 output ledger에서 재개 |
| `POST` | `/v1/ingest/jobs/{job_id}/cancel` | 실행 중인 작업 | `202`; Temporal 취소 요청 |

`document_ids`는 현재 profile의 manifest에 이미 등록된 문서 ID입니다. 생략하거나
빈 배열을 보내면 manifest 전체를 처리합니다. 임의의 로컬 파일 경로나 profile
경로는 request에서 받지 않으며, output도 서버가 관리하는
`--ingest-output-root/runs/<job_id>`로 제한합니다. API 제어 메타데이터는
`--ingest-output-root/jobs/<job_id>/`에 별도로 저장되어 기존 ingest가 요구하는
깨끗한 output 디렉터리를 침범하지 않습니다.

같은 논리 요청을 중복 생성하지 않으려면 호출자가 안정적인
`idempotency_key`를 지정합니다. 같은 key를 다른 `document_ids`와 함께 재사용하면
`409 Conflict`를 반환합니다.

```bash
curl -sS http://127.0.0.1:3100/v1/ingest/jobs \
  -H 'Content-Type: application/json' \
  -d '{
    "document_ids": ["d000001", "d000002"],
    "idempotency_key": "handoff-batch-20260828-01"
  }'
```

생성 응답의 `job_id`로 진행 상태를 조회합니다.

```bash
curl -sS \
  http://127.0.0.1:3100/v1/ingest/jobs/s4s-ingest-0123456789abcdef01234567
```

```json
{
  "job_id": "s4s-ingest-0123456789abcdef01234567",
  "status": "running",
  "temporal_status": "running",
  "document_ids": ["d000001", "d000002"],
  "active_stages": ["metadata"],
  "stages": {
    "parsing": {
      "status": "completed",
      "task_counts": {"succeeded": 2}
    },
    "metadata": {
      "status": "running",
      "task_counts": {"running": 1, "succeeded": 1}
    }
  },
  "progress": {
    "documents_total": 2,
    "documents_complete": 0,
    "documents_failed": 0
  },
  "result": null
}
```

재시도는 `failed` 또는 `canceled` 작업에만 허용되고, 취소는 `running` 작업에만
허용됩니다. 재시도 시 새 파이프라인을 복제하지 않고 기존 SQLite ledger와
Temporal workflow ID를 사용해 완료된 task를 재사용합니다.

```bash
curl -sS -X POST \
  http://127.0.0.1:3100/v1/ingest/jobs/s4s-ingest-0123456789abcdef01234567/retry

curl -sS -X POST \
  http://127.0.0.1:3100/v1/ingest/jobs/s4s-ingest-0123456789abcdef01234567/cancel
```

주요 오류 코드는 다음과 같습니다.

| 상태 코드 | 의미 |
|---|---|
| `404` | 존재하지 않거나 형식이 잘못된 `job_id` |
| `409` | idempotency 충돌 또는 현재 상태에서 허용되지 않는 retry/cancel |
| `422` | 잘못된 request body·query 값 |
| `503` | Temporal, managed service 또는 OpenSearch prerequisite 연결·기동·검증 실패 |

## 제품 화면의 문서 조회

ChatKit adapter가 React 제품 화면에 다음 경로를 제공합니다.

| Method | Path | 결과 |
|---|---|---|
| `GET` | `/api/documents/capabilities` | 문서 조회 지원 기능 |
| `GET` | `/api/documents` | 문서 목록과 페이지 정보 |
| `GET` | `/api/documents/{document_id}/pipeline` | 문서 파이프라인 결과 |
| `GET` | `/api/documents/{document_id}/idr` | Canonical IDR |
| `GET` | `/api/documents/{document_id}/pdf` | 원본 PDF |
| `GET` | `/api/documents/{document_id}/pages/{page}` | PDF 페이지 이미지 |
| `GET` | `/api/documents/{document_id}/figures/{block_id}` | Figure 영역 이미지 |
| `GET` | `/api/documents/{document_id}/connections` | 현재 화면 세션의 검색·답변 연결 정보 |

`page`는 1부터 시작합니다.

## 대화와 출처

ChatKit adapter가 대화와 답변 출처를 관리합니다.

| Method | Path | 결과 |
|---|---|---|
| `GET` | `/health` | ChatKit adapter와 답변 API 연결 상태 |
| `POST` | `/chatkit` | ChatKit 대화 요청 처리 |
| `GET` | `/sources/{source_id}` | 현재 세션의 출처 정보 |
| `GET` | `/source-runs/{run_id}` | 한 답변 요청에서 검색된 출처 묶음 |
| `GET` | `/threads/{thread_id}/source-run` | 대화의 최근 출처 묶음 |
| `GET` | `/sources/{source_id}/idr` | 출처 문서의 IDR |
| `GET` | `/sources/{source_id}/pipeline` | 출처 문서의 파이프라인 결과 |
| `GET` | `/source-runs/{run_id}/kg` | 출처 묶음의 KG |
| `GET` | `/sources/{source_id}/idr/figures/{block_id}` | 출처 문서의 Figure 이미지 |
| `GET` | `/sources/{source_id}/pdf` | 출처 원본 PDF |
| `GET` | `/conversation-list` | 로컬 화면에 표시할 대화 목록 |

## 문서 파싱

MinerU parsing service가 GPU Parser worker에 다음 API를 제공합니다.

| Method | Path | 입력 | 결과 |
|---|---|---|---|
| `GET` | `/health` | 없음 | Parser 모델과 queue 상태 |
| `GET` | `/metrics` | 없음 | 처리량과 실패 횟수 |
| `POST` | `/v1/two-step-extract` | Body: `image_png_base64` 필수 | 이미지 한 장의 파싱 결과 |
| `POST` | `/v1/two-step-extract-batch` | Body: `images_png_base64` 배열 필수 | 여러 페이지의 파싱 결과 |

## 정책 검토

Policy review API는 로컬 검토 화면에서 사용합니다.

| Method | Path | 결과 |
|---|---|---|
| `GET` | `/api/decisions` | 저장된 정책 검토 결과 |
| `POST` | `/api/decisions` | 정책 검토 결과 추가 |
