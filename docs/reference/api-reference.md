---
sidebar_position: 3
title: API Reference
---

# API Reference

Struct4Search API는 문서를 등록하고 인덱싱한 뒤, 같은 인덱스에서 문서를 검색하거나
근거가 포함된 답변을 받는 데 사용합니다. 설치가 끝난 개발자는 이 페이지의 명령을
그대로 실행하면 됩니다. 설치가 필요하면 먼저 [설치와 첫 실행](../quickstart.md)을
참고합니다.

## 전체 API 목록

외부 시스템에서는 `공개` API를 사용합니다. `호환` API는 기존 클라이언트를 유지하기
위한 경로이고, `화면 내부` API는 Struct4Search 웹 화면이 사용하는 경로입니다.

### 운영 상태

| Method | Endpoint | 용도 |
|---|---|---|
| `GET` | `/health/live` | API 프로세스가 실행 중인지 확인합니다. |
| `GET` | `/health/ready` | 검색·답변 요청을 받을 준비가 됐는지 확인합니다. |

### 외부 연동 API

| Method | Endpoint | 용도 |
|---|---|---|
| `GET` | `/v1/capabilities` | 현재 문서 저장소에서 사용할 수 있는 기능을 확인합니다. |
| `POST` | `/v1/documents` | 새 문서를 등록하고 문서 ID를 발급받습니다. |
| `GET` | `/v1/documents` | 등록된 문서를 검색·필터링하여 조회합니다. |
| `GET` | `/v1/documents/{document_id}` | 문서 한 건의 상세 정보와 인덱싱 정보를 조회합니다. |
| `PATCH` | `/v1/documents/{document_id}` | 사용자가 관리하는 문서 메타데이터를 수정합니다. |
| `DELETE` | `/v1/documents/{document_id}` | 등록된 문서를 삭제합니다. |
| `GET` | `/v1/idr` | 문서의 현재 파싱 결과(IDR)를 조회합니다. |
| `GET` | `/v1/document-pipeline` | 문서별 파싱·KG·메타데이터·검색표현 처리 상태를 조회합니다. |
| `POST` | `/v1/kg/subgraph` | 선택한 문서들의 지식그래프 일부를 조회합니다. |
| `GET` | `/v1/document-file` | 등록된 원본 문서를 열거나 내려받습니다. |
| `GET` | `/v1/document-page` | 문서의 특정 페이지를 이미지로 조회합니다. |
| `GET` | `/v1/idr/figure` | IDR 블록에 연결된 그림을 조회합니다. |
| `POST` | `/v1/ingest/jobs` | 등록한 문서의 인덱싱 작업을 시작합니다. |
| `GET` | `/v1/ingest/jobs` | 인덱싱 작업 목록을 조회합니다. |
| `GET` | `/v1/ingest/jobs/{job_id}` | 인덱싱 작업 한 건의 상태를 조회합니다. |
| `GET` | `/v1/ingest/jobs/{job_id}/documents` | 작업에 포함된 문서별 처리 결과를 조회합니다. |
| `POST` | `/v1/ingest/jobs/{job_id}/retry` | 실패한 인덱싱 작업을 다시 실행합니다. |
| `POST` | `/v1/ingest/jobs/{job_id}/cancel` | 실행 중인 인덱싱 작업의 취소를 요청합니다. |
| `POST` | `/v1/search` | 답변을 생성하지 않고 관련 원문을 검색합니다. |
| `POST` | `/v1/responses` | 검색 근거가 포함된 답변을 생성합니다. |

### 호환 API

| Method | Endpoint | 용도 |
|---|---|---|
| `GET` | `/v1/health` | 기존 클라이언트용 상태 확인 경로입니다. |
| `POST` | `/v1/response` | 기존 단일 답변 클라이언트용 경로입니다. |
| `GET` | `/v1/source-pdf` | 기존 검색 결과에 연결된 PDF 원문을 조회합니다. |

### 화면 내부 API

| Method | Endpoint | 용도 |
|---|---|---|
| `GET` | `/api/documents/capabilities` | 문서 관리 화면이 사용할 수 있는 기능을 확인합니다. |
| `GET` | `/api/documents` | 문서 관리 화면의 문서 목록을 조회합니다. |
| `GET` | `/api/documents/{document_id}/pipeline` | 문서 관리 화면의 단계별 처리 결과를 조회합니다. |
| `GET` | `/api/documents/{document_id}/idr` | 문서 관리 화면의 파싱 결과를 조회합니다. |
| `GET` | `/api/documents/{document_id}/pdf` | 문서 관리 화면에서 PDF 원문을 엽니다. |
| `GET` | `/api/documents/{document_id}/pages/{page}` | 문서 관리 화면에서 특정 페이지를 조회합니다. |
| `GET` | `/api/documents/{document_id}/figures/{block_id}` | 문서 관리 화면에서 파싱된 그림을 조회합니다. |
| `GET` | `/api/documents/{document_id}/connections` | 문서 관리 화면에서 현재 검색·답변 연결 정보를 조회합니다. |

요청·응답 스키마를 바로 확인하려면 서버 실행 후 Swagger UI
`http://127.0.0.1:8289/docs` 또는 OpenAPI JSON
`http://127.0.0.1:8289/openapi.json`을 엽니다.

## 서버 실행

제품 화면까지 함께 실행할 때는 저장소 루트에서 다음 명령을 사용합니다.

```bash
export S4S_DOCUMENT_DSN='postgresql://USER:PASSWORD@HOST:PORT/DATABASE'
export S4S_KG_DSN='postgresql://USER:PASSWORD@HOST:PORT/DATABASE'

# 서버를 외부에 공개할 때 설정합니다. 로컬 개발에서는 생략할 수 있습니다.
export S4S_API_KEY='충분히-긴-임의-값'

struct4search-bootstrap --stack configs/services/local-stack.yaml
struct4search-stack --stack configs/services/local-stack.yaml up
```

명령을 실행한 터미널을 열어 둡니다. 서버를 모두 종료할 때는 그 터미널에서 `Ctrl-C`를
누릅니다.

기본 주소는 다음과 같습니다.

| 용도 | 주소 |
|---|---|
| API | `http://127.0.0.1:8289` |
| Swagger UI | `http://127.0.0.1:8289/docs` |
| 웹 화면 | `http://127.0.0.1:5173` |

`struct4search-bootstrap`은 검색에 필요한 OpenSearch RRF 설정을 생성하거나 현재 설정을
검증합니다. 기존 문서와 인덱스는 변경하지 않습니다.

## 공통 설정

제품 전체를 실행했다면 다른 터미널에서 다음 값을 준비합니다.

```bash
export S4S_BASE_URL='http://127.0.0.1:8289'
```

`S4S_API_KEY`를 서버에 설정했다면 모든 데이터 요청에 다음 헤더 중 하나가 필요합니다.

```bash
-H "Authorization: Bearer $S4S_API_KEY"
```

또는 `X-API-Key: $S4S_API_KEY`를 사용할 수 있습니다. API 키를 설정하지 않은 로컬
서버에서는 인증 헤더를 빼고 호출합니다.

서버 상태와 전체 요청 스키마는 다음 주소에서 확인합니다.

```bash
curl --fail "$S4S_BASE_URL/health/ready"
```

정상적으로 시작된 서버는 다음과 같이 응답합니다.

```json
{
  "status": "ready",
  "transport": "canonical-query-service"
}
```

## 문서 등록

**요청** `POST /v1/documents` · **Content-Type** `application/pdf`

PDF 파일 자체를 요청 본문으로 보냅니다. 서버의 파일 경로를 JSON으로 보내는 방식은
지원하지 않습니다.

```bash
curl --fail-with-body "$S4S_BASE_URL/v1/documents" \
  -X POST \
  -H 'Content-Type: application/pdf' \
  -H 'X-Filename: safety-guide.pdf' \
  -H 'X-Corpus-Modality: mixed' \
  -H "Authorization: Bearer $S4S_API_KEY" \
  --data-binary @safety-guide.pdf
```

### 요청 헤더

| 이름 | 필수 | 설명 |
|---|---:|---|
| `X-Filename` | 아니요 | 화면에 표시할 PDF 파일명. 기본값은 `document.pdf`입니다. |
| `X-Corpus-Modality` | 아니요 | `digital`, `mixed`, `scan` 중 하나. 기본값은 `mixed`입니다. |
| `X-Document-ID` | 아니요 | 호출자가 문서 ID를 관리할 때 지정합니다. 생략하면 파일 SHA-256으로 생성합니다. |

### 성공 응답

```http
HTTP/1.1 201 Created
```

```json
{
  "document_id": "dapi_0fe5f782cf5a5df74f4f1938",
  "status": "uploaded",
  "filename": "safety-guide.pdf",
  "page_count": 8,
  "size": 1076066,
  "sha256": "0fe5f782cf5a5df74f4f1938..."
}
```

응답의 `document_id`를 인덱싱 요청에 사용합니다. 같은 파일을 다시 등록하면 기본적으로
같은 ID가 만들어집니다.

## 문서 인덱싱

**요청** `POST /v1/ingest/jobs`

등록한 문서의 ID를 보내면 파싱부터 OpenSearch 인덱싱까지 한 작업으로 실행됩니다.
단계별 API를 따로 호출할 필요가 없습니다.

```bash
curl --fail-with-body "$S4S_BASE_URL/v1/ingest/jobs" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -d '{
    "document_ids": ["dapi_0fe5f782cf5a5df74f4f1938"],
    "idempotency_key": "safety-guide-20260828"
  }'
```

| 필드 | 필수 | 설명 |
|---|---:|---|
| `document_ids` | 예 | 등록된 문서 ID 목록입니다. 빈 값이나 중복 ID는 허용하지 않습니다. |
| `idempotency_key` | 아니요 | 같은 요청이 중복 접수되는 것을 막을 때 지정합니다. 최대 200자입니다. |

### 접수 응답

```http
HTTP/1.1 202 Accepted
```

```json
{
  "job_id": "s4s-ingest-111111111111111111111111",
  "status": "running",
  "document_ids": ["dapi_0fe5f782cf5a5df74f4f1938"]
}
```

### 작업 상태 확인

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $S4S_API_KEY" \
  "$S4S_BASE_URL/v1/ingest/jobs/<job_id>"
```

일반적인 `status` 값은 `running`, `completed`, `failed`, `canceled`입니다. 연결 상태를
확인할 수 없으면 `unknown`, 취소를 요청한 직후에는 `cancel_requested`가 반환될 수
있습니다. `completed`가 되면 문서를 검색하고 답변에 사용할 수 있습니다. 여러 문서를
한 번에 요청한 경우 문서별 결과는 다음 주소에서 확인합니다.

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $S4S_API_KEY" \
  "$S4S_BASE_URL/v1/ingest/jobs/<job_id>/documents"
```

실패한 작업은 `POST /v1/ingest/jobs/<job_id>/retry`, 실행 중인 작업은
`POST /v1/ingest/jobs/<job_id>/cancel`로 처리합니다.

## 문서 검색

**요청** `POST /v1/search` · **Content-Type** `application/json`

답변 모델을 호출하지 않고 관련 원문만 검색합니다. 질의 벡터를 따로 만들어 보낼 필요는
없습니다. 서버가 현재 인덱스를 만들 때 사용한 임베딩 모델로 질문을 변환합니다.

```bash
curl --fail-with-body "$S4S_BASE_URL/v1/search" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -H 'X-Request-ID: search-001' \
  -d '{"query":"위험성평가의 목적은 무엇인가요?"}'
```

| 필드 | 필수 | 설명 |
|---|---:|---|
| `query` | 예 | 검색할 질문입니다. 빈 문자열은 허용하지 않습니다. |
| `query_id` | 아니요 | 호출 시스템에서 관리하는 질의 ID입니다. |
| `X-Request-ID` | 아니요 | HTTP 요청을 로그에서 추적할 때 사용하는 헤더입니다. |

### 성공 응답

```http
HTTP/1.1 200 OK
```

```json
{
  "object": "search.result",
  "search_results": [
    {
      "unit_id": "ruf_43626fd2205a5c8bb5e30acd",
      "doc_id": "d001843_0aa8cde082",
      "score": 0.030886196,
      "content": [
        {
          "type": "text",
          "text": "위험성평가의 목적은 사업장 내 유해·위험요인을 찾아내는 것입니다."
        }
      ],
      "grounding": {
        "source_uri": "/v1/document-page?document_id=d001843_0aa8cde082&unit_id=ruf_43626fd2205a5c8bb5e30acd&page=5",
        "source_display_name": "d001843_0aa8cde082"
      }
    }
  ],
  "count": 10,
  "retrieval_index": "s4s-current"
}
```

검색 결과에서 화면에 표시할 본문은 `content[].text`, 문서 ID는 `doc_id`, 원문 연결은
`grounding.source_uri`를 사용합니다.

## 근거가 포함된 답변

**요청** `POST /v1/responses` · **Content-Type** `application/json`

검색 결과를 바탕으로 답변을 생성하고, 답변에 사용한 원문 ID를 함께 반환합니다.

```bash
curl --fail-with-body "$S4S_BASE_URL/v1/responses" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -H 'X-Request-ID: response-001' \
  -d '{
    "query": "위험성평가의 목적은 무엇인가요?",
    "stream": false
  }'
```

| 필드 | 필수 | 설명 |
|---|---:|---|
| `query` | 예 | 답변할 질문입니다. |
| `query_id` | 아니요 | 호출 시스템에서 관리하는 질의 ID입니다. |
| `stream` | 아니요 | `false`이면 JSON, `true`이면 SSE로 응답합니다. 기본값은 `false`입니다. |

### 성공 응답

```json
{
  "id": "response-001",
  "object": "response",
  "status": "completed",
  "answer": "위험성평가의 목적은 사업주와 근로자가 함께 유해·위험요인을 찾아 산업재해를 예방하는 것입니다. [ruf_43626fd2205a5c8bb5e30acd]",
  "citations": [
    {
      "unit_id": "ruf_43626fd2205a5c8bb5e30acd"
    }
  ],
  "insufficient_evidence": false,
  "search_results": [
    {
      "unit_id": "ruf_43626fd2205a5c8bb5e30acd",
      "doc_id": "d001843_0aa8cde082",
      "grounding": {
        "source_uri": "/v1/document-page?document_id=d001843_0aa8cde082&unit_id=ruf_43626fd2205a5c8bb5e30acd&page=5"
      },
      "answer_used": true
    }
  ]
}
```

`answer`의 대괄호 ID와 `citations[].unit_id`가 일치합니다. 원문 위치와 문서 정보는 같은
응답의 `search_results`에서 찾습니다. 근거가 부족하면 `insufficient_evidence`가
`true`로 반환됩니다.

### SSE 응답

실시간 작업 상태가 필요하면 `stream`을 `true`로 지정합니다.

```bash
curl -N "$S4S_BASE_URL/v1/responses" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -d '{"query":"위험성평가의 목적은 무엇인가요?","stream":true}'
```

서버는 `response.created` 뒤에 `response.completed` 또는 `response.failed`를 보내고,
마지막에 `done` 이벤트를 보냅니다. 현재 답변은 검증이 끝난 뒤 한 번에 전달되며 토큰
단위 스트리밍은 제공하지 않습니다.

## 문서 관리 화면에 연결할 때

문서 목록과 단계별 결과는 같은 API 서버에서 조회합니다.

```bash
# 문서 목록
curl --fail-with-body \
  -H "Authorization: Bearer $S4S_API_KEY" \
  "$S4S_BASE_URL/v1/documents?q=위험성평가&page=1&page_size=20"

# 문서 상세
curl --fail-with-body \
  -H "Authorization: Bearer $S4S_API_KEY" \
  "$S4S_BASE_URL/v1/documents/<document_id>"

# 파싱·메타데이터·지식그래프·검색표현 결과
curl --fail-with-body \
  -H "Authorization: Bearer $S4S_API_KEY" \
  "$S4S_BASE_URL/v1/document-pipeline?document_id=<document_id>"

# 원본 PDF
curl --fail-with-body \
  -H "Authorization: Bearer $S4S_API_KEY" \
  "$S4S_BASE_URL/v1/document-file?document_id=<document_id>" \
  -o document.pdf
```

사용자가 입력한 관리용 메타데이터는 다음 요청으로 저장합니다. 인덱싱 결과인 메타데이터,
IDR과 지식그래프는 이 API로 수정할 수 없습니다.

```bash
curl --fail-with-body "$S4S_BASE_URL/v1/documents/<document_id>" \
  -X PATCH \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $S4S_API_KEY" \
  -d '{"metadata":{"owner":"안전팀","retention":"5y"}}'
```

문서를 현재 문서 DB, 지식그래프와 검색 인덱스에서 삭제하려면 다음 요청을 사용합니다.

```bash
curl --fail-with-body "$S4S_BASE_URL/v1/documents/<document_id>" \
  -X DELETE \
  -H "Authorization: Bearer $S4S_API_KEY"
```

성공하면 응답 본문 없이 `204 No Content`를 반환합니다.

## 오류 응답

오류는 `detail` 필드가 있는 JSON으로 반환됩니다.

```json
{
  "detail": "document is unavailable"
}
```

| HTTP 상태 | 확인할 내용 |
|---:|---|
| `401` | API 키가 설정된 서버에 인증 헤더를 보내지 않았거나 값이 다릅니다. |
| `404` | 문서 ID 또는 작업 ID가 없거나 원본 파일에 접근할 수 없습니다. |
| `409` | 같은 중복 방지 키로 다른 요청을 보냈거나 현재 상태에서 재시도·취소할 수 없습니다. |
| `413` | PDF가 서버의 업로드 크기 제한을 넘었습니다. |
| `415` | 파일이 PDF가 아니거나 `Content-Type`이 `application/pdf`가 아닙니다. |
| `422` | 필수 필드, 문서 ID, PDF 또는 요청 형식이 올바르지 않습니다. |
| `502` | 연결된 OpenSearch 등 외부 저장소가 요청을 거부했습니다. |
| `503` | 문서 API, Temporal, 모델 서버 또는 검색 설정이 준비되지 않았습니다. |

전체 경로와 요청 형식은 실행 중인 서버의 `/docs` 또는 `/openapi.json`을 기준으로 합니다.
`/api/documents/*`, `/chatkit`, MinerU worker API는 제품 내부 연결용이므로 새 연동에서는
`/v1/*` API를 사용합니다. 기존 `/v1/response`는 호환용이며 신규 코드는
`/v1/responses`를 사용합니다.
