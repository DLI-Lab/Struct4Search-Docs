---
sidebar_position: 3
title: API Reference
---

# API Reference

Struct4Search API는 문서를 등록하고 인덱싱한 뒤, 같은 인덱스에서 원문을 검색하거나
근거가 포함된 답변을 생성할 때 사용합니다. 설치와 서버 실행은
[설치와 첫 실행](../quickstart.md)에서 먼저 완료합니다.

## 기본 정보

| 실행 방식 | Base URL |
|---|---|
| `struct4search-api` 직접 실행 | `http://127.0.0.1:3100` |
| `configs/services/local-stack.yaml` | `http://127.0.0.1:8289` |
| `struct4search-restored-snapshot-api` | `http://127.0.0.1:8289` |

JSON 요청은 `Content-Type: application/json`을 사용합니다. 인증이 설정된 서버에는 `Authorization: Bearer $S4S_API_KEY` 또는 `X-API-Key: $S4S_API_KEY`를 보냅니다. 실행 중인 서버의 전체 요청·응답 스키마는 `/openapi.json`에서 확인합니다.

`S4S_API_KEY`가 설정되지 않은 로컬 환경에서는 인증 헤더를 생략할 수 있습니다.
아래 예제는 API 키가 설정된 환경을 기준으로 작성했습니다.

```bash
export S4S_BASE_URL='http://127.0.0.1:3100'
export S4S_API_KEY='replace-with-your-api-key'
```

### 사용 조건

| API 묶음 | 사용 조건 |
|---|---|
| 상태·검색·답변 | `--profile` 또는 `--fixture-results`로 API 실행 |
| 문서·frontend 호환 경로 | `--document-api-url`로 문서 조회 서비스를 연결. 연결하지 않으면 `503` |
| 인덱싱 작업 | `--profile`, `--ingest-output-root`, `--ingest-services`를 함께 지정 |

## 전체 API 목록

API는 수행하는 작업을 기준으로 묶었습니다. API 이름을 누른 뒤 이동한 상세 항목을 펼치면 요청, 응답, 실행 예제와 오류 정보를 확인할 수 있습니다.

### 서비스 상태

| API | HTTP 요청 | 설명 |
|---|---|---|
| [실행 상태 확인](#api-health-live) | `GET /health/live` | API 프로세스가 실행 중인지 확인합니다. |
| [준비 상태 확인](#api-health-ready) | `GET /health/ready` | 설정과 서비스 조립이 완료됐는지 확인합니다. |
| 간단 상태 확인 | `GET /v1/health` | canonical QueryService transport가 조립됐는지 확인합니다. |

### 문서

| API | HTTP 요청 | 설명 |
|---|---|---|
| [기능 확인](#api-capabilities) | `GET /v1/capabilities` | 현재 문서 저장소에서 사용할 수 있는 기능을 확인합니다. |
| [문서 등록](#api-document-create) | `POST /v1/documents` | PDF 문서를 등록하고 문서 ID를 발급받습니다. |
| [문서 목록 조회](#api-document-list) | `GET /v1/documents` | 등록된 문서를 검색·필터링하여 조회합니다. |
| [문서 상세 조회](#api-document-get) | `GET /v1/documents/{document_id}` | 문서 한 건의 상세 정보와 등록 정보를 조회합니다. |
| [문서 메타데이터 수정](#api-document-update) | `PATCH /v1/documents/{document_id}` | 사용자가 관리하는 문서 메타데이터를 수정합니다. |
| [문서 삭제](#api-document-delete) | `DELETE /v1/documents/{document_id}` | 문서와 연결된 저장소 데이터를 삭제합니다. |
| [파싱 결과 조회](#api-idr-get) | `GET /v1/idr` | 문서의 현재 IDR 파싱 결과를 조회합니다. |
| [파이프라인 결과 조회](#api-document-pipeline) | `GET /v1/document-pipeline` | 파싱·KG·메타데이터·검색표현을 한 번에 조회합니다. |
| [지식그래프 조회](#api-kg-subgraph) | `POST /v1/kg/subgraph` | 선택한 문서들의 지식그래프 일부를 조회합니다. |
| [원본 문서 조회](#api-document-file) | `GET /v1/document-file` | 등록된 원본 파일을 열거나 내려받습니다. |
| [문서 페이지 조회](#api-document-page) | `GET /v1/document-page` | PDF의 특정 페이지를 PNG 이미지로 조회합니다. |
| [파싱 이미지 조회](#api-idr-figure) | `GET /v1/idr/figure` | IDR의 그림 블록을 PNG 이미지로 조회합니다. |
| 원본 출처 조회 | `GET /v1/source-pdf` | source transport가 연결된 실행에서 원본 PDF를 조회합니다. |

### Frontend 호환 경로

다음 경로는 frontend 요청을 위 문서 API에 연결합니다. `--document-api-url`이 필요합니다.

| HTTP 요청 | 연결되는 기능 |
|---|---|
| `GET /api/documents` | 문서 목록 조회 |
| `GET /api/documents/capabilities` | 문서 기능 확인 |
| `GET /api/documents/{document_id}/connections` | 문서 연결 정보 조회 |
| `GET /api/documents/{document_id}/figures/{block_id}` | 파싱 이미지 조회 |
| `GET /api/documents/{document_id}/idr` | 파싱 결과 조회 |
| `GET /api/documents/{document_id}/pages/{page}` | 문서 페이지 조회 |
| `GET /api/documents/{document_id}/pdf` | 원본 문서 조회 |
| `GET /api/documents/{document_id}/pipeline` | 파이프라인 결과 조회 |

### 인덱싱 작업

| API | HTTP 요청 | 설명 |
|---|---|---|
| [인덱싱 시작](#api-ingest-create) | `POST /v1/ingest/jobs` | 등록한 문서의 인덱싱 작업을 시작합니다. |
| [인덱싱 작업 목록](#api-ingest-list) | `GET /v1/ingest/jobs` | 최근 인덱싱 작업을 조회합니다. |
| [인덱싱 작업 상태](#api-ingest-get) | `GET /v1/ingest/jobs/{job_id}` | 작업 한 건의 단계별 상태를 조회합니다. |
| [문서별 인덱싱 결과](#api-ingest-documents) | `GET /v1/ingest/jobs/{job_id}/documents` | 작업에 포함된 문서별 처리 결과를 조회합니다. |
| [인덱싱 재시도](#api-ingest-retry) | `POST /v1/ingest/jobs/{job_id}/retry` | 실패하거나 취소된 작업을 다시 실행합니다. |
| [인덱싱 취소](#api-ingest-cancel) | `POST /v1/ingest/jobs/{job_id}/cancel` | 실행 중인 작업의 취소를 요청합니다. |

### 검색

| API | HTTP 요청 | 설명 |
|---|---|---|
| [문서 검색](#api-search) | `POST /v1/search` | 답변을 만들지 않고 관련 원문과 점수를 조회합니다. |

### 답변

| API | HTTP 요청 | 설명 |
|---|---|---|
| [근거 기반 답변 생성](#api-responses) | `POST /v1/responses` | 검색 결과를 근거로 답변과 인용 정보를 생성합니다. |

## API 상세

### 서비스 상태

<details id="api-health-live">
<summary><strong>실행 상태 확인</strong></summary>

API 프로세스가 요청을 받을 수 있는지 확인합니다. 인증이 필요하지 않습니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `GET /health/live` |
| 인증 | 없음 |
| 요청 본문 | 없음 |
| 성공 응답 | `200 OK` |

```bash
curl "$S4S_BASE_URL/health/live"
```

```json
{"status":"ok"}
```

</details>

<details id="api-health-ready">
<summary><strong>준비 상태 확인</strong></summary>

API 설정과 QueryService 조립이 완료됐는지 확인합니다. 인증이 필요하지 않습니다. OpenSearch, embedding과 Reader 상태는 실제 검색·답변 요청에서 확인합니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `GET /health/ready` |
| 인증 | 없음 |
| 요청 본문 | 없음 |
| 성공 응답 | `200 OK` |

```bash
curl "$S4S_BASE_URL/health/ready"
```

```json
{
  "status": "ready",
  "transport": "canonical-query-service"
}
```

</details>

### 문서

<details id="api-capabilities">
<summary><strong>기능 확인</strong></summary>

현재 문서 저장소에서 문서 업로드 등 어떤 기능을 사용할 수 있는지 확인합니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `GET /v1/capabilities` |
| 인증 | API key |
| 요청 본문 | 없음 |
| 성공 응답 | `200 OK` |

```bash
curl "$S4S_BASE_URL/v1/capabilities" \
  -H "Authorization: Bearer $S4S_API_KEY"
```

```json
{
  "upload": true,
  "retry": false,
  "snapshot_catalog_fallback": false,
  "reason": "문서·IDR·메타데이터는 구성된 문서 저장소에서 읽습니다."
}
```

`upload`가 `false`이면 서버에 문서 업로드 경로가 설정되지 않은 상태입니다.

</details>

<details id="api-document-create">
<summary><strong>문서 등록</strong></summary>

PDF 원본을 그대로 전송해 문서를 등록합니다. 현재 이 API가 직접 받는 형식은 PDF입니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `POST /v1/documents` |
| 인증 | API key |
| Content-Type | `application/pdf` |
| 성공 응답 | `201 Created` |

요청 헤더:

| 헤더 | 필수 | 설명 |
|---|---|---|
| `X-Filename` | 아니요 | 저장할 파일명. 기본값은 `document.pdf`입니다. |
| `X-Corpus-Modality` | 아니요 | `digital`, `mixed`, `scan` 중 하나. 기본값은 `mixed`입니다. |
| `X-Document-ID` | 아니요 | 호출자가 사용할 문서 ID. 생략하면 파일 내용으로 ID를 생성합니다. |

```bash
curl -X POST "$S4S_BASE_URL/v1/documents" \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -H 'Content-Type: application/pdf' \
  -H 'X-Filename: safety-guide.pdf' \
  -H 'X-Corpus-Modality: mixed' \
  --data-binary @safety-guide.pdf
```

```json
{
  "document_id": "dapi_58c840a7d2f0",
  "status": "uploaded",
  "filename": "safety-guide.pdf",
  "page_count": 12,
  "size": 842113,
  "sha256": "58c840a7d2f0...",
  "manifest": "document-manifest.jsonl"
}
```

주요 오류는 빈 파일 또는 용량 초과 `413`, PDF가 아닌 요청 `415`, 손상된 PDF나 잘못된 헤더 값 `422`입니다.

</details>

<details id="api-document-list">
<summary><strong>문서 목록 조회</strong></summary>

등록된 문서를 검색하고 상태, 파일 형식, 수정일로 필터링합니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `GET /v1/documents` |
| 인증 | API key |
| 요청 본문 | 없음 |
| 성공 응답 | `200 OK` |

쿼리 파라미터:

| 이름 | 기본값 | 설명 |
|---|---|---|
| `q` | 빈 문자열 | 제목 또는 문서 ID 검색어 |
| `file_type` | `all` | 파일 형식 필터 |
| `status` | `all` | 처리 상태 필터 |
| `error_type` | 없음 | 오류 유형. 여러 번 전달할 수 있습니다. |
| `updated` | `all` | `all`, `day`, `week`, `month` |
| `sort` | `updated_desc` | `updated_desc`, `updated_asc`, `name_asc`, `name_desc` |
| `page` | `1` | 1부터 시작하는 페이지 번호 |
| `page_size` | `20` | 페이지당 10~100건 |

```bash
curl "$S4S_BASE_URL/v1/documents?q=safety&status=all&page=1&page_size=20" \
  -H "Authorization: Bearer $S4S_API_KEY"
```

```json
{
  "items": [
    {
      "document_id": "dapi_58c840a7d2f0",
      "title": "safety-guide.pdf",
      "file_type": "pdf",
      "file_size": 842113,
      "source_available": true,
      "status": {"overall": "completed", "label": "완료", "error_type": null},
      "counts": {"pages": 12, "blocks": 186, "entities": 41, "relations": 12}
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "page_count": 1,
  "available_error_types": []
}
```

</details>

<details id="api-document-get">
<summary><strong>문서 상세 조회</strong></summary>

문서 한 건의 카탈로그 정보, 원본 위치, 사용자 메타데이터와 등록 정보를 조회합니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `GET /v1/documents/{document_id}` |
| 인증 | API key |
| 경로 변수 | `document_id` |
| 성공 응답 | `200 OK` |

```bash
curl "$S4S_BASE_URL/v1/documents/dapi_58c840a7d2f0" \
  -H "Authorization: Bearer $S4S_API_KEY"
```

```json
{
  "document_id": "dapi_58c840a7d2f0",
  "title": "safety-guide.pdf",
  "file_type": "pdf",
  "source_available": true,
  "status": {"overall": "completed", "label": "완료", "error_type": null},
  "source": "/data/uploads/safety-guide.pdf",
  "metadata": {"department": "안전관리팀"},
  "ingest": {"corpus_modality": "mixed"}
}
```

문서가 없으면 `404 Not Found`를 반환합니다.

</details>

<details id="api-document-update">
<summary><strong>문서 메타데이터 수정</strong></summary>

사용자가 관리하는 문서 메타데이터를 교체합니다. 본문에는 `metadata`만 전달할 수 있습니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `PATCH /v1/documents/{document_id}` |
| 인증 | API key |
| Content-Type | `application/json` |
| 성공 응답 | `200 OK` |

```bash
curl -X PATCH "$S4S_BASE_URL/v1/documents/dapi_58c840a7d2f0" \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"metadata":{"department":"안전관리팀","retention_years":5}}'
```

```json
{
  "document_id": "dapi_58c840a7d2f0",
  "metadata": {"department": "안전관리팀", "retention_years": 5}
}
```

문서가 없으면 `404`, 허용되지 않은 필드나 잘못된 본문은 `422`를 반환합니다.

</details>

<details id="api-document-delete">
<summary><strong>문서 삭제</strong></summary>

문서 DB 행, 검색 인덱스, KG 데이터와 서버가 소유한 업로드 원본을 삭제합니다. 복구가 필요한 데이터는 먼저 백업합니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `DELETE /v1/documents/{document_id}` |
| 인증 | API key |
| 요청 본문 | 없음 |
| 성공 응답 | `204 No Content` |

```bash
curl -i -X DELETE "$S4S_BASE_URL/v1/documents/dapi_58c840a7d2f0" \
  -H "Authorization: Bearer $S4S_API_KEY"
```

성공 응답에는 본문이 없습니다. 문서가 없으면 `404`, 검색 저장소 삭제에 실패하면 `502`를 반환할 수 있습니다.

</details>

<details id="api-idr-get">
<summary><strong>파싱 결과 조회</strong></summary>

문서 DB에 저장된 현재 IDR을 페이지와 블록 단위로 조회합니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `GET /v1/idr` |
| 인증 | API key |
| 성공 응답 | `200 OK` |

쿼리 파라미터:

| 이름 | 필수 | 설명 |
|---|---|---|
| `document_id` | 예 | 조회할 문서 ID |
| `lineage` | 아니요 | `current`, `kg`, `kg_or_current`. 현재 구현은 문서 DB의 최신 저장본을 반환합니다. |

```bash
curl "$S4S_BASE_URL/v1/idr?document_id=dapi_58c840a7d2f0" \
  -H "Authorization: Bearer $S4S_API_KEY"
```

```json
{
  "document_id": "dapi_58c840a7d2f0",
  "title": "safety-guide.pdf",
  "parser": "mineru",
  "schema": "canonical-idr",
  "lineage": {"kind": "current", "source_store": "public.documents.idr"},
  "page_count": 12,
  "block_count": 186,
  "type_counts": {"text": 141, "figure": 9, "table": 6},
  "pages": [
    {
      "page_index": 0,
      "page_number": 1,
      "blocks": [{"id": "b1", "type": "text", "order": 0, "text": "안전 수칙"}]
    }
  ]
}
```

문서 또는 IDR이 없으면 `404 Not Found`를 반환합니다.

</details>

<details id="api-document-pipeline">
<summary><strong>파이프라인 결과 조회</strong></summary>

문서 한 건의 처리 상태와 지식그래프, 메타데이터, 검색표현을 한 번에 조회합니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `GET /v1/document-pipeline` |
| 인증 | API key |
| 필수 쿼리 | `document_id` |
| 성공 응답 | `200 OK` |

```bash
curl "$S4S_BASE_URL/v1/document-pipeline?document_id=dapi_58c840a7d2f0" \
  -H "Authorization: Bearer $S4S_API_KEY"
```

```json
{
  "document_id": "dapi_58c840a7d2f0",
  "title": "safety-guide.pdf",
  "document": {"document_id": "dapi_58c840a7d2f0", "file_type": "pdf"},
  "pipeline": {
    "overall": "completed",
    "label": "완료",
    "stages": [],
    "counts": {"pages": 12, "entities": 41, "relations": 12}
  },
  "kg": {"entities": [], "relations": []},
  "metadata": [],
  "search_expressions": {"items": []},
  "lineage": {"parser_run_id": null, "pipeline_run_id": null}
}
```

문서가 없으면 `404`, 검색 저장소 조회에 실패하면 `502`를 반환할 수 있습니다.

</details>

<details id="api-kg-subgraph">
<summary><strong>지식그래프 조회</strong></summary>

1~50개 문서 ID를 기준으로 엔터티와 관계를 묶어 조회합니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `POST /v1/kg/subgraph` |
| 인증 | API key |
| Content-Type | `application/json` |
| 성공 응답 | `200 OK` |

```bash
curl -X POST "$S4S_BASE_URL/v1/kg/subgraph" \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"document_ids":["dapi_58c840a7d2f0"]}'
```

```json
{
  "document_ids": ["dapi_58c840a7d2f0"],
  "documents": [{"document_id": "dapi_58c840a7d2f0", "title": "safety-guide.pdf", "kg_available": true}],
  "entities": [{"id": "e1", "text": "보호구", "label": "EQUIPMENT", "document_ids": ["dapi_58c840a7d2f0"]}],
  "relations": [{"id": "r1", "subject": "작업자", "predicate": "착용", "object": "보호구"}],
  "metadata": {},
  "lineage": {"document_id_aligned": true}
}
```

문서 ID가 없거나 50개를 초과하면 `422 Unprocessable Entity`를 반환합니다.

</details>

<details id="api-document-file">
<summary><strong>원본 문서 조회</strong></summary>

등록된 원본 파일을 브라우저에서 열거나 첨부 파일로 내려받습니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `GET /v1/document-file` |
| 인증 | API key |
| 성공 응답 | `200 OK`, 파일 바이너리 |

쿼리 파라미터:

| 이름 | 필수 | 설명 |
|---|---|---|
| `document_id` | 예 | 조회할 문서 ID |
| `download` | 아니요 | `true`이면 첨부 파일로 내려받습니다. 기본값은 `false`입니다. |

```bash
curl "$S4S_BASE_URL/v1/document-file?document_id=dapi_58c840a7d2f0&download=true" \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -o safety-guide.pdf
```

원본이 없거나 접근할 수 없으면 `404 Not Found`를 반환합니다.

</details>

<details id="api-document-page">
<summary><strong>문서 페이지 조회</strong></summary>

PDF 원본의 특정 페이지를 PNG 이미지로 렌더링합니다. `page`는 1부터 시작합니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `GET /v1/document-page` |
| 인증 | API key |
| 성공 응답 | `200 OK`, `image/png` |

| 쿼리 | 기본값 | 설명 |
|---|---|---|
| `document_id` | 필수 | 조회할 문서 ID |
| `page` | `1` | 1부터 시작하는 페이지 번호 |
| `scale` | `1.35` | `0.5`~`3.0` 범위의 렌더링 배율 |

```bash
curl "$S4S_BASE_URL/v1/document-page?document_id=dapi_58c840a7d2f0&page=1&scale=1.35" \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -o page-1.png
```

PDF 원본이나 요청한 페이지가 없으면 `404 Not Found`를 반환합니다.

</details>

<details id="api-idr-figure">
<summary><strong>파싱 이미지 조회</strong></summary>

IDR의 그림 블록 좌표를 사용해 원본 PDF에서 해당 영역을 잘라 PNG로 반환합니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `GET /v1/idr/figure` |
| 인증 | API key |
| 성공 응답 | `200 OK`, `image/png` |

| 쿼리 | 필수 | 설명 |
|---|---|---|
| `document_id` | 예 | 조회할 문서 ID |
| `block_id` | 예 | IDR 그림 블록 ID |
| `lineage` | 아니요 | `current` 또는 `kg`. 현재 구현은 최신 IDR 저장본을 사용합니다. |

```bash
curl "$S4S_BASE_URL/v1/idr/figure?document_id=dapi_58c840a7d2f0&block_id=figure-1" \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -o figure-1.png
```

그림 블록, 좌표 또는 원본 PDF를 찾지 못하면 `404 Not Found`를 반환합니다.

</details>

### 인덱싱 작업

인덱싱 작업 응답의 공통 상태는 `running`, `completed`, `failed`, `canceled`, `unknown`입니다.
취소 요청 직후에는 `cancel_requested`가 반환될 수 있습니다.

<details id="api-ingest-create">
<summary><strong>인덱싱 시작</strong></summary>

등록한 문서를 지정해 비동기 인덱싱 작업을 시작합니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `POST /v1/ingest/jobs` |
| 인증 | API key |
| Content-Type | `application/json` |
| 성공 응답 | `202 Accepted` |

요청 본문:

| 필드 | 필수 | 설명 |
|---|---|---|
| `document_ids` | 아니요 | 중복되지 않은 문서 ID 배열. 생략하거나 비우면 서버에 구성된 기본 manifest/profile을 사용합니다. |
| `idempotency_key` | 아니요 | 같은 작업의 중복 생성을 막는 1~200자 키 |

```bash
curl -X POST "$S4S_BASE_URL/v1/ingest/jobs" \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"document_ids":["dapi_58c840a7d2f0"],"idempotency_key":"safety-guide-v1"}'
```

```json
{
  "job_id": "ingest-01J...",
  "status": "running",
  "temporal_status": "RUNNING",
  "document_ids": ["dapi_58c840a7d2f0"],
  "active_stages": ["parsing"],
  "stages": [],
  "progress": {"completed": 0, "total": 1},
  "result": null
}
```

같은 멱등 키를 다른 요청에 재사용하면 `409`, 실행 백엔드를 사용할 수 없으면 `503`을 반환합니다.

</details>

<details id="api-ingest-list">
<summary><strong>인덱싱 작업 목록</strong></summary>

최근 인덱싱 작업을 상태별로 조회합니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `GET /v1/ingest/jobs` |
| 인증 | API key |
| 성공 응답 | `200 OK` |

| 쿼리 | 기본값 | 설명 |
|---|---|---|
| `limit` | `50` | 1~200건 |
| `status` | 없음 | `running`, `completed`, `failed`, `canceled`, `unknown` |
| `cursor` | 없음 | 다음 페이지를 조회할 작업 ID |

```bash
curl "$S4S_BASE_URL/v1/ingest/jobs?status=running&limit=20" \
  -H "Authorization: Bearer $S4S_API_KEY"
```

```json
{
  "jobs": [{"job_id": "ingest-01J...", "status": "running", "document_ids": ["dapi_58c840a7d2f0"]}],
  "count": 1,
  "next_cursor": null
}
```

잘못된 상태나 커서는 `422`, 실행 백엔드 연결 실패는 `503`입니다.

</details>

<details id="api-ingest-get">
<summary><strong>인덱싱 작업 상태</strong></summary>

작업 한 건의 현재 단계, 진행률, 결과와 오류를 조회합니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `GET /v1/ingest/jobs/{job_id}` |
| 인증 | API key |
| 경로 변수 | `job_id` |
| 성공 응답 | `200 OK` |

```bash
curl "$S4S_BASE_URL/v1/ingest/jobs/ingest-01J..." \
  -H "Authorization: Bearer $S4S_API_KEY"
```

```json
{
  "job_id": "ingest-01J...",
  "status": "completed",
  "document_ids": ["dapi_58c840a7d2f0"],
  "active_stages": [],
  "stages": [],
  "progress": {"completed": 1, "total": 1},
  "completion": {"completed_at": "2026-08-28T10:00:00Z"},
  "completion_error": null
}
```

작업이 없으면 `404`, 실행 백엔드 연결 실패는 `503`입니다.

</details>

<details id="api-ingest-documents">
<summary><strong>문서별 인덱싱 결과</strong></summary>

한 작업에 포함된 각 문서의 처리 상태와 활성 단계를 조회합니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `GET /v1/ingest/jobs/{job_id}/documents` |
| 인증 | API key |
| 경로 변수 | `job_id` |
| 성공 응답 | `200 OK` |

```bash
curl "$S4S_BASE_URL/v1/ingest/jobs/ingest-01J.../documents" \
  -H "Authorization: Bearer $S4S_API_KEY"
```

```json
{
  "items": [
    {"document_id": "dapi_58c840a7d2f0", "status": "completed", "active_stages": []}
  ],
  "count": 1
}
```

작업이 없으면 `404`, 실행 백엔드 연결 실패는 `503`입니다.

</details>

<details id="api-ingest-retry">
<summary><strong>인덱싱 재시도</strong></summary>

`failed` 또는 `canceled` 상태의 작업을 다시 실행합니다. 요청 본문은 없습니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `POST /v1/ingest/jobs/{job_id}/retry` |
| 인증 | API key |
| 성공 응답 | `202 Accepted` |

```bash
curl -X POST "$S4S_BASE_URL/v1/ingest/jobs/ingest-01J.../retry" \
  -H "Authorization: Bearer $S4S_API_KEY"
```

응답 형식은 [인덱싱 작업 상태](#api-ingest-get)와 같습니다. 재시도할 수 없는 상태는 `409`, 없는 작업은 `404`, 실행 백엔드 연결 실패는 `503`입니다.

</details>

<details id="api-ingest-cancel">
<summary><strong>인덱싱 취소</strong></summary>

`running` 상태의 작업에 취소를 요청합니다. 요청 본문은 없습니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `POST /v1/ingest/jobs/{job_id}/cancel` |
| 인증 | API key |
| 성공 응답 | `202 Accepted` |

```bash
curl -X POST "$S4S_BASE_URL/v1/ingest/jobs/ingest-01J.../cancel" \
  -H "Authorization: Bearer $S4S_API_KEY"
```

```json
{
  "job_id": "ingest-01J...",
  "status": "cancel_requested",
  "document_ids": ["dapi_58c840a7d2f0"]
}
```

취소할 수 없는 상태는 `409`, 없는 작업은 `404`, 실행 백엔드 연결 실패는 `503`입니다.

</details>

### 검색

<details id="api-search">
<summary><strong>문서 검색</strong></summary>

서버에 설정된 임베딩 모델로 질의를 벡터화하고 OpenSearch에서 관련 원문을 검색합니다. 답변은 생성하지 않습니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `POST /v1/search` |
| 인증 | API key |
| Content-Type | `application/json` |
| 성공 응답 | `200 OK` |

요청 헤더와 본문:

| 위치 | 이름 | 필수 | 설명 |
|---|---|---|---|
| 헤더 | `X-Request-ID` | 아니요 | 로그 추적용 요청 ID |
| 본문 | `query` | 예 | 빈 문자열이 아닌 검색 질의 |
| 본문 | `query_id` | 아니요 | 호출자가 지정하는 질의 ID |

```bash
curl -X POST "$S4S_BASE_URL/v1/search" \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'X-Request-ID: example-search-001' \
  -d '{"query":"보호구 착용 기준은 무엇인가요?","query_id":"q-001"}'
```

```json
{
  "object": "search.result",
  "search_results": [
    {
      "unit_id": "dapi_58c840a7d2f0:p3:b12",
      "doc_id": "dapi_58c840a7d2f0",
      "score": 0.87,
      "content": [{"type": "text", "text": "작업자는 지정된 보호구를 착용해야 합니다."}],
      "grounding": {
        "source_uri": "/v1/document-page?document_id=dapi_58c840a7d2f0&page=3",
        "source_display_name": "safety-guide.pdf"
      }
    }
  ],
  "count": 1,
  "retrieval_index": "s4s-current"
}
```

잘못된 요청은 `422`, 검색 또는 모델 호출 실패는 `502`, 필수 서비스 미구성은 `503`을 반환할 수 있습니다.

</details>

### 답변

<details id="api-responses">
<summary><strong>근거 기반 답변 생성</strong></summary>

문서를 검색한 뒤 설정된 LLM으로 답변을 생성하고 사용한 근거를 함께 반환합니다.

| 항목 | 값 |
|---|---|
| HTTP 요청 | `POST /v1/responses` |
| 인증 | API key |
| Content-Type | `application/json` |
| 성공 응답 | `200 OK` |

요청 헤더와 본문:

| 위치 | 이름 | 필수 | 설명 |
|---|---|---|---|
| 헤더 | `X-Request-ID` | 아니요 | 로그 추적용 요청 ID. 생략하면 서버가 생성합니다. |
| 본문 | `query` | 예 | 빈 문자열이 아닌 질문 |
| 본문 | `query_id` | 아니요 | 호출자가 지정하는 질의 ID |
| 본문 | `stream` | 아니요 | `true`이면 SSE 이벤트로 응답합니다. 기본값은 `false`입니다. |

일반 응답:

```bash
curl -X POST "$S4S_BASE_URL/v1/responses" \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"query":"보호구 착용 기준은 무엇인가요?","query_id":"q-001","stream":false}'
```

```json
{
  "id": "resp_01J...",
  "object": "response",
  "status": "completed",
  "answer": "작업자는 작업 유형에 맞게 지정된 보호구를 착용해야 합니다.",
  "citations": [{"unit_id": "dapi_58c840a7d2f0:p3:b12"}],
  "insufficient_evidence": false,
  "search_results": []
}
```

SSE 응답:

```bash
curl -N -X POST "$S4S_BASE_URL/v1/responses" \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"query":"보호구 착용 기준은 무엇인가요?","stream":true}'
```

서버는 `response.created` 뒤에 `response.completed` 또는 `response.failed` 이벤트를 보내고 마지막에 `done`을 보냅니다. 현재 스트리밍은 토큰 단위 출력이 아니라 처리 상태와 최종 응답을 전달합니다.

잘못된 요청은 `422`, 검색 또는 LLM 호출 실패는 `502`, 필수 서비스 미구성은 `503`을 반환할 수 있습니다.

</details>

## 공통 오류

오류 응답은 HTTP 상태 코드와 함께 원인을 설명하는 `detail` 필드를 반환합니다.

| 상태 | 의미 | 확인할 항목 |
|---|---|---|
| `401 Unauthorized` | 인증 실패 | API 키와 인증 헤더 형식을 확인합니다. |
| `404 Not Found` | 문서, 작업 또는 산출물을 찾지 못함 | ID와 연결된 DB·원본 파일·인덱스를 확인합니다. |
| `409 Conflict` | 현재 상태에서 요청을 수행할 수 없음 | 멱등 키 또는 작업 상태를 확인합니다. |
| `413 Content Too Large` | 업로드 파일이 비어 있거나 제한을 초과함 | 파일과 서버 업로드 제한을 확인합니다. |
| `415 Unsupported Media Type` | 지원하지 않는 업로드 형식 | 문서 등록 API에는 PDF 바이너리를 전송합니다. |
| `422 Unprocessable Entity` | 경로, 쿼리 또는 본문 검증 실패 | OpenAPI 스키마와 요청 값을 비교합니다. |
| `502 Bad Gateway` | 검색·모델·저장소 호출 실패 | OpenSearch 및 모델 서비스 상태를 확인합니다. |
| `503 Service Unavailable` | 필수 서비스가 구성되지 않았거나 연결 불가 | DB, OpenSearch, Temporal 및 모델 설정을 확인합니다. |

```json
{"detail":"Document is not available: dapi_58c840a7d2f0"}
```
