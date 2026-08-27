---
sidebar_position: 1
title: API Reference
---

# API Reference

`struct4search-api`가 제공하는 HTTP API입니다. 현재 Runtime `master`의 FastAPI 라우터에 등록된 19개 operation을 모두 정리합니다.

## 검색과 원본 출처

| Method | Path | 입력 | 결과 |
|---|---|---|---|
| `GET` | `/v1/health` | 없음 | API 서버 상태 |
| `POST` | `/v1/response` | JSON body의 `query` 필수, `query_id`·`X-Request-ID` 선택 | 답변, Citation, 검색 결과 |
| `GET` | `/v1/source-pdf` | query의 `source_uri` 필수 | 답변 근거의 원본 PDF |

`POST /v1/response`의 최소 요청은 다음과 같습니다.

```json
{
  "query": "안전모를 착용한다.",
  "query_id": "q001"
}
```

`query`가 없거나 공백이면 `422`를 반환합니다. 예제 검색 결과로 실행한 경우에는 파일에 포함된 `query_id`를 사용합니다.

## 문서 조회

다음 8개 경로는 문서 조회 backend에 요청을 그대로 전달합니다.

| Method | Path | 입력 | 결과 |
|---|---|---|---|
| `GET` | `/v1/capabilities` | 없음 | 업로드·재처리 등 지원 기능 |
| `GET` | `/v1/documents` | `q`, `file_type`, `status`, `error_type`, `updated`, `sort`, `page`, `page_size` 선택 | 문서 목록과 페이지 정보 |
| `GET` | `/v1/idr` | `document_id` 필수, `lineage` 선택 | 문서의 Canonical IDR |
| `GET` | `/v1/document-pipeline` | `document_id` 필수 | 파싱·KG·Metadata·검색표현 처리 결과 |
| `POST` | `/v1/kg/subgraph` | JSON body의 `document_ids` 필수 | 선택한 문서의 KG 부분 그래프 |
| `GET` | `/v1/document-file` | `document_id` 필수, `download` 선택 | 원본 문서 파일 |
| `GET` | `/v1/document-page` | `document_id` 필수, `page`·`scale` 선택 | 지정한 PDF 페이지의 PNG 이미지 |
| `GET` | `/v1/idr/figure` | `document_id`·`block_id` 필수, `lineage` 선택 | IDR Figure 영역의 이미지 |

현재 `struct4search-api`의 기본 composition에는 문서 조회 backend가 연결되어 있지 않으므로 이 8개 경로는 `503`을 반환합니다. 경로와 전달 계약은 유지되며, 문서 조회 구현을 주입한 환경에서 같은 API를 사용합니다.

## 제품 화면 호환 경로

다음 8개 경로는 React 제품 화면이 사용하는 URL을 위 문서 조회 API에 연결합니다. `page`는 1부터 시작합니다.

| Method | Path | 결과 |
|---|---|---|
| `GET` | `/api/documents/capabilities` | 문서 조회 지원 기능 |
| `GET` | `/api/documents` | 문서 목록과 페이지 정보 |
| `GET` | `/api/documents/{document_id}/pipeline` | 문서 파이프라인 결과 |
| `GET` | `/api/documents/{document_id}/idr` | 문서 Canonical IDR |
| `GET` | `/api/documents/{document_id}/pdf` | 원본 PDF |
| `GET` | `/api/documents/{document_id}/pages/{page}` | PDF 페이지 이미지 |
| `GET` | `/api/documents/{document_id}/figures/{block_id}` | IDR Figure 이미지 |
| `GET` | `/api/documents/{document_id}/connections` | 현재 화면 세션의 검색·답변 연결 정보 |

## 별도 프로세스의 API

아래 API도 Runtime `master`에 포함되어 있지만 `struct4search-api`와는 다른 프로세스와 포트에서 실행됩니다.

### Restored snapshot API

`struct4search-restored-snapshot-api`는 복원한 OpenSearch snapshot을 조회하며 다음 경로를 사용합니다.

| Method | Path | 기능 |
|---|---|---|
| `GET` | `/v1/health` | 서버 상태 확인 |
| `POST` | `/v1/response` | 복원한 snapshot에서 검색·답변 |
| `GET` | `/v1/source-pdf` | 원본 PDF 조회. 원본 파일 저장소가 없으면 `503` |

### Canonical IDR viewer

`frontend/chatkit_demo/idr_service.py`가 제공하는 문서 조회 원본 API입니다.

| Method | Path | 기능 |
|---|---|---|
| `GET` | `/v1/health` | IDR viewer 상태 확인 |
| `GET` | `/v1/capabilities` | 문서 조회 지원 기능 확인 |
| `GET` | `/v1/documents` | 문서 목록 조회 |
| `GET` | `/v1/idr` | Canonical IDR 조회 |
| `GET` | `/v1/document-pipeline` | 문서 파이프라인 결과 조회 |
| `POST` | `/v1/kg/subgraph` | KG 부분 그래프 조회 |
| `GET` | `/v1/document-file` | 원본 문서 파일 조회 |
| `GET` | `/v1/document-page` | 문서 페이지 이미지 조회 |
| `GET` | `/v1/idr/figure` | IDR Figure 이미지 조회 |

### ChatKit adapter

`frontend/chatkit_demo/server.py`가 제품 화면에 제공하는 API입니다.

| Method | Path | 기능 |
|---|---|---|
| `GET` | `/health` | ChatKit adapter와 답변 API 연결 상태 확인 |
| `POST` | `/chatkit` | ChatKit 대화 요청 처리 |
| `GET` | `/sources/{source_id}` | 현재 세션의 출처 정보 조회 |
| `GET` | `/source-runs/{run_id}` | 한 답변 요청에서 검색된 출처 묶음 조회 |
| `GET` | `/threads/{thread_id}/source-run` | 대화 thread의 최근 출처 묶음 조회 |
| `GET` | `/sources/{source_id}/idr` | 출처 문서의 IDR 조회 |
| `GET` | `/sources/{source_id}/pipeline` | 출처 문서의 파이프라인 결과 조회 |
| `GET` | `/source-runs/{run_id}/kg` | 출처 묶음의 KG 조회 |
| `GET` | `/sources/{source_id}/idr/figures/{block_id}` | 출처 문서의 Figure 이미지 조회 |
| `GET` | `/sources/{source_id}/pdf` | 출처 원본 PDF 조회 |
| `GET` | `/api/documents/capabilities` | 제품 화면용 문서 조회 지원 기능 |
| `GET` | `/api/documents` | 제품 화면용 문서 목록 |
| `GET` | `/api/documents/{document_id}/pipeline` | 제품 화면용 파이프라인 결과 |
| `GET` | `/api/documents/{document_id}/idr` | 제품 화면용 Canonical IDR |
| `GET` | `/api/documents/{document_id}/pdf` | 제품 화면용 원본 PDF |
| `GET` | `/api/documents/{document_id}/pages/{page}` | 제품 화면용 페이지 이미지 |
| `GET` | `/api/documents/{document_id}/figures/{block_id}` | 제품 화면용 Figure 이미지 |
| `GET` | `/api/documents/{document_id}/connections` | 제품 화면용 검색·답변 연결 정보 |
| `GET` | `/conversation-list` | 로컬 화면에 표시할 대화 목록 |

### Full-corpus answer bridge

`frontend/chatkit_demo/full_corpus_answer_bridge.py`가 전체 corpus 답변 후보를 전달합니다.

| Method | Path | 기능 |
|---|---|---|
| `GET` | `/v1/health` | bridge 상태 확인 |
| `GET` | `/v1/source-pdf` | 답변 후보의 원본 PDF 조회 |
| `POST` | `/v1/response` | 전체 corpus 답변 후보 생성 |

### MinerU parsing service

`backend/struct4search/mineru_vllm_async_service.py`가 GPU Parser worker에 제공합니다.

| Method | Path | 기능 |
|---|---|---|
| `GET` | `/health` | Parser 모델과 queue 상태 확인 |
| `GET` | `/metrics` | 처리량과 실패 횟수 확인 |
| `POST` | `/v1/two-step-extract` | 이미지 한 장 파싱 |
| `POST` | `/v1/two-step-extract-batch` | 여러 페이지 이미지 일괄 파싱 |

### Policy review API

`backend/struct4search/entrypoints/api/policy_review.py`가 로컬 검토 화면에 제공합니다.

| Method | Path | 기능 |
|---|---|---|
| `GET` | `/api/decisions` | 저장된 정책 검토 결과 조회 |
| `POST` | `/api/decisions` | 정책 검토 결과 추가 |

## 구현되지 않은 OpenAPI draft

`openapi/struct4search-v1.yaml`에는 향후 계약 검토용 경로가 정의되어 있습니다. 다음 경로는 현재 실행되는 FastAPI app에 등록되어 있지 않으며 호출하면 `404`입니다.

| Method | Path |
|---|---|
| `POST` | `/api/v1/queries` |
| `POST` | `/api/v1/ingest-jobs` |
| `GET` | `/api/v1/ingest-jobs/{job_id}` |
| `GET` | `/api/v1/documents/{document_id}` |
| `GET` | `/api/v1/documents/{document_id}/pages/{page_index}` |
| `GET` | `/health/live` |
| `GET` | `/health/ready` |

## 코드 위치

| 확인할 내용 | 파일 |
|---|---|
| API 실행 명령 | `backend/struct4search/entrypoints/cli/api.py` |
| API 조립 | `backend/struct4search/entrypoints/api/server.py` |
| 검색·답변 | `backend/struct4search/entrypoints/api/legacy_response.py` |
| 문서 조회 경로 | `backend/struct4search/entrypoints/api/document_viewer.py` |
| 계약 검토용 draft | `openapi/struct4search-v1.yaml` |
