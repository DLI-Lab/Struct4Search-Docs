---
sidebar_position: 1
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
