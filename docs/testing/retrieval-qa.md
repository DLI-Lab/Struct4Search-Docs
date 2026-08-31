---
sidebar_position: 2
title: 평가 실행과 결과 확인
---

# 평가 실행과 결과 확인

Struct4Search 평가는 문서 1건부터 전체 2,567문서까지 네 단계로 실행합니다. 처음 실행하거나 환경·모델·파이프라인을 변경했다면 작은 범위부터 차례대로 확인합니다.

- **문서 1건·5건 실행**은 인덱싱부터 검색·답변·Citation·HTTP 응답까지 정상적으로 연결되는지 확인하는 동작 검증입니다.
- **100문서·100질의·2,567문서·200질의 실행**은 전체 질의를 실행하고 검색·답변 품질 지표를 계산하는 평가입니다.

평가 자료의 질문과 정답 구성은 [평가셋](eval200.md), GPU·모델 서버·OpenSearch·PostgreSQL 준비 방법은 [설치 요구사항](../reference/dependencies.md)에서 확인합니다.

## 실행 범위 선택

처음 실행하는 경우에는 다음 순서로 진행합니다.

| 단계 | 실행 범위 | 명령 | 실행하는 경우 |
|---|---:|---|---|
| 1 | 문서 1건·질문 1건 | `struct4search-smoke-e2e` | 설치와 모델·DB·검색·웹 서비스 연결을 처음 확인할 때 |
| 2 | 문서 5건·질문 5건 | `struct4search-five-document-e2e` | 여러 문서를 연속으로 처리해도 같은 경로가 정상인지 확인할 때 |
| 3 | 문서 100건·질문 100건 | `struct4search-final-100-100-e2e` | 파이프라인·모델·프롬프트·검색 설정 변경 후 회귀를 확인할 때 |
| 4 | 문서 2,567건·질문 200건 | `struct4search-final-full-2567-200-e2e` | 전체 검색 대상과 최종 평가셋으로 배포 전 결과를 확인할 때 |

> 문서 1건이 실패한 상태에서 더 큰 범위를 실행하면 원인을 좁히기 어렵습니다. 처음 설치했거나 실행 환경이 달라졌다면 1건 → 5건 → 100건 → 전체 순서로 확인합니다.

## 실행 전에 준비하기

네 명령은 모두 실제 문서 인덱싱, 검색, 답변과 Citation 생성을 실행합니다. GPU 모델 서버와 외부 서비스가 준비된 환경에서 저장소 루트로 이동한 뒤 실행합니다.

다른 서버에서 실행하는 경우에는 평가 자료와 결과를 저장할 위치를 환경변수로 지정합니다.

```bash
export S4S_ARTIFACT_TEST_FIXTURE_ROOT=/absolute/path/to/test-fixtures
export S4S_ARTIFACT_PRODUCTION_ROOT=/absolute/path/to/production-artifacts
export S4S_ARTIFACT_EVALUATION_ROOT=/absolute/path/to/full-evaluation-set
export S4S_ARTIFACT_CONTROL_ROOT=/absolute/path/to/e2e-results
mkdir -p "$S4S_ARTIFACT_CONTROL_ROOT"
```

| 환경변수 | 사용하는 실행 | 용도 |
|---|---|---|
| `S4S_ARTIFACT_TEST_FIXTURE_ROOT` | 문서 1건·5건·100건 | 고정 검증 문서와 질문 |
| `S4S_ARTIFACT_PRODUCTION_ROOT` | 문서 2,567건 | 전체 원본 문서 목록 |
| `S4S_ARTIFACT_EVALUATION_ROOT` | 문서 2,567건 | 최종 평가 질문 200건 |
| `S4S_ARTIFACT_CONTROL_ROOT` | 모든 실행 | 실행 기록과 결과 저장 위치 |

앞의 세 자료 디렉터리에는 실행 전에 실제 파일이 들어 있어야 합니다. `S4S_ARTIFACT_CONTROL_ROOT`는 빈 디렉터리로 만들 수 있으며, 각 실행 결과는 그 아래의 새 디렉터리에 저장됩니다.

## 공통 결과 확인 방법

각 명령이 끝나면 터미널 마지막 줄에 다음 값이 JSON으로 출력됩니다.

- `status`: 실행의 최종 상태
- `run_id`: 이번 실행의 식별자
- `receipt_path`: 실행 설정과 최종 상태를 기록한 JSON 경로
- `output_root`: 상세 결과 파일이 저장된 디렉터리

출력된 경로를 그대로 지정합니다.

```bash
RECEIPT=/path/printed/as/receipt_path
RUN_ROOT=/path/printed/as/output_root
```

### 실행 성공과 품질 결과 구분하기

100문서와 전체 문서 평가는 모든 질의를 가능한 한 끝까지 실행한 뒤 결과를 집계합니다. 따라서 **실행 성공**과 **답변 품질**을 따로 확인해야 합니다.

| 구분 | 의미 | 확인할 값 |
|---|---|---|
| 실행 결과 | API 호출, 응답 형식, 인덱스, 검색·답변·Citation 경로가 정상적으로 완료됐는지 | `status`, `execution_status`, `documents_failed`, `query_execution_failures` |
| 품질 결과 | 필요한 문서를 찾고 정답에 맞는 답변을 생성했는지 | `query_quality_misses`, `retrieval`, 질문별 검색 점수, 답변 점수 |

- 답변이 없거나 틀렸거나 정답 문서를 찾지 못했지만 요청과 응답 자체는 정상인 경우에는 `query_quality_misses`에 기록됩니다. 이 항목은 실행 오류가 아니며 전체 검색·답변 지표에 포함됩니다.
- API 호출 실패, 응답 형식 오류, 다른 인덱스 사용 또는 검색 근거 밖 Citation은 `query_execution_failures`에 기록되며 전체 실행을 실패 처리합니다.
- `EVALUATION_RESULTS.json`의 `status: PASS`는 질의 실행과 결과 집계가 완료됐다는 뜻입니다. 모든 답변이 정답이라는 뜻은 아닙니다.

## 1. 문서 1건 실행

설치와 서비스 연결을 처음 확인할 때 실행합니다. 고정 문서 1건을 새 검색 공간에 인덱싱하고, 실제 질문 1건에 대한 답변과 Citation을 생성한 뒤 HTTP 경로까지 확인합니다.

### 실행

```bash
struct4search-smoke-e2e
```

### 결과 확인

```bash
jq '{
  status,
  run_id,
  query: .query_and_web.query_request,
  claims: .query_and_web.claims,
  cited_unit_ids: .query_and_web.cited_unit_ids
}' "$RECEIPT"

jq '{
  status,
  documents_total,
  documents_complete,
  documents_failed
}' "$RUN_ROOT/FINAL_REPORT.json"
```

정상이라면 다음 조건을 만족합니다.

- 실행 기록의 `status`가 `PASS`입니다.
- 문서 1건이 완료되고 실패 문서가 없습니다.
- `claims`에 생성된 답변 문장이 있습니다.
- `cited_unit_ids`에 답변 문장을 뒷받침한 원문 ID가 있습니다.

문서가 완료되지 않았다면 `FINAL_REPORT.json`에서 실패 단계를 먼저 확인합니다. 문서는 완료됐지만 답변이나 Citation이 없다면 `QUERY_RESULT_DIAGNOSTIC.json`에서 검색 결과와 Reader 응답을 확인합니다.

## 2. 문서 5건 실행

문서 1건은 통과했지만 여러 문서를 연속으로 처리할 때도 같은 경로가 정상인지 확인할 때 실행합니다. 고정 문서 5건을 함께 인덱싱하고, 문서마다 연결된 질문 1건씩 총 5건을 실행합니다.

### 실행

```bash
struct4search-five-document-e2e
```

### 결과 확인

```bash
jq '{
  status,
  run_id,
  successful_query_count: .queries_and_web.successful_query_count,
  failed_query_ids: .queries_and_web.failed_query_ids
}' "$RECEIPT"

jq '{
  status,
  documents_total,
  documents_complete,
  documents_failed
}' "$RUN_ROOT/FINAL_REPORT.json"
```

정상이라면 다음 조건을 만족합니다.

- 문서 5건이 모두 완료되고 실패 문서가 없습니다.
- `successful_query_count`가 `5`입니다.
- `failed_query_ids`가 빈 배열입니다.

특정 질문만 실패하면 `failed_query_ids`와 같은 ID의 `query-diagnostics/<질문 ID>.json`을 확인합니다. 여러 문서가 같은 단계에서 실패하면 질문 결과보다 `FINAL_REPORT.json`의 단계별 오류를 먼저 확인합니다.

## 3. 100문서·100질의 실행

파이프라인, 모델, 프롬프트 또는 검색 설정을 바꾼 뒤 전체 평가 전에 실행합니다. 고정 문서 100건을 인덱싱하고 질문 100건의 검색·답변 결과와 검색 점수를 생성합니다.

### 실행

```bash
struct4search-final-100-100-e2e
```

### 결과 확인

```bash
jq '{
  status,
  run_id,
  queries_total: .queries_and_web.queries_total,
  queries_executed: .queries_and_web.queries_executed,
  query_execution_failures: .queries_and_web.query_execution_failures,
  query_quality_misses: .queries_and_web.query_quality_misses
}' "$RECEIPT"

jq '{
  status,
  documents_total,
  documents_complete,
  documents_failed
}' "$RUN_ROOT/FINAL_REPORT.json"

jq '{
  status,
  queries_total,
  queries_executed,
  query_execution_failure_count,
  query_quality_miss_count,
  retrieval
}' "$RUN_ROOT/EVALUATION_RESULTS.json"
```

질의 실행이 정상적으로 끝났다면 다음 조건을 만족합니다.

- 문서 100건이 모두 완료되고 실패 문서가 없습니다.
- `queries_total`과 `queries_executed`가 모두 `100`입니다.
- `query_execution_failures`가 빈 배열입니다.

`query_quality_misses`가 있으면 같은 질문 ID의 검색·답변 결과를 확인합니다. 해당 질의의 낮은 점수도 포함한 전체 검색·QA 지표를 기준으로 결과를 판단합니다.

검색 점수가 낮으면 `retrieval_scores_per_query.jsonl`에서 값이 낮은 질문 ID를 찾고, 같은 ID를 `qa_answers.jsonl`과 `query-diagnostics/<질문 ID>.json`에서 확인합니다.

## 4. 2,567문서·200질의 실행

전체 검색 대상과 최종 평가셋으로 배포 전 결과를 확인할 때 실행합니다. 문서 2,567건을 처음부터 처리하고 질문 200건에 답한 뒤, 문서별 완료 상태와 전체 검색 점수를 함께 기록합니다.

### 실행

```bash
struct4search-final-full-2567-200-e2e
```

### 결과 확인

```bash
jq '{
  status,
  execution_status,
  queries_total: .queries_and_web.queries_total,
  queries_executed: .queries_and_web.queries_executed,
  query_execution_failures: .queries_and_web.query_execution_failures,
  query_quality_misses: .queries_and_web.query_quality_misses
}' "$RECEIPT"

jq '{
  status,
  queries_total,
  queries_executed,
  query_execution_failure_count,
  query_quality_miss_count,
  retrieval
}' "$RUN_ROOT/EVALUATION_RESULTS.json"

jq '{
  terminal_documents,
  index,
  duplicate_identity_audit
}' "$RUN_ROOT/FULL_RUN_AGGREGATES.json"
```

정상적으로 종료한 실행은 다음 조건을 만족합니다.

- `execution_status`가 `PASS`입니다.
- `queries_executed`가 `200`입니다.
- `query_execution_failures`가 빈 배열입니다.
- `FULL_RUN_AGGREGATES.json`의 `index.count_matches`가 `true`입니다.

`query_quality_misses`는 실행 오류가 아니며 전체 검색·답변 지표에 포함됩니다. 최종 정책 비교에 설명할 메모가 있으면 바깥 `status`는 `PASS_WITH_NOTE` 또는 `WARNING_NON_MATERIAL_DRIFT`가 될 수 있습니다. 그 밖의 상태라면 실행 기록의 `error`와 정책 결과를 확인합니다.

문서 처리 수가 예상과 다르면 질문 결과보다 `DOCUMENT_TERMINAL_STATUSES.jsonl`과 `STAGE_TERMINAL_SUMMARY.json`을 먼저 확인합니다.

## 결과 파일 읽는 순서

처음 결과를 확인할 때는 다음 순서로 봅니다.

1. `receipt_path`의 JSON에서 전체 상태와 결과 경로를 확인합니다.
2. `FINAL_REPORT.json`에서 문서가 끝까지 처리됐는지 확인합니다.
3. 100문서·전체 평가에서는 `EVALUATION_RESULTS.json`에서 질의 실행 수와 전체 검색 점수를 확인합니다.
4. 점수가 낮거나 실패한 질문은 질문별 파일에서 원인을 확인합니다.
5. 전체 실행에서 문서 수나 인덱스 수가 맞지 않으면 전체 집계와 단계별 문서 상태를 확인합니다.

### 모든 실행에서 확인하는 파일

| 결과 | 들어 있는 내용 | 먼저 확인할 것 |
|---|---|---|
| `receipt_path`의 JSON | 실행 설정, 사용한 자원, 전체 상태, 질문 실행 요약과 자원 정리 결과 | `status`, `run_id`, 실행 오류 |
| `FINAL_REPORT.json` | 문서 처리 단계별 결과와 완료·실패 문서 수 | 전체 문서가 완료됐는지, 실패 단계가 있는지 |
| `QUERY_RESULT_DIAGNOSTIC.json` 또는 `query-diagnostics/<질문 ID>.json` | 실제 검색 요청, 최종 Context, 답변·Citation과 HTTP 응답 | 검색된 원문이 답변과 Citation으로 이어졌는지 |

### 100문서·전체 평가에서 확인하는 파일

| 결과 | 들어 있는 내용 | 먼저 확인할 것 |
|---|---|---|
| `INDEX_SNAPSHOT.json` | 이번 실행에서 만든 인덱스 설정과 실제 저장 수 | 예상한 인덱스를 사용했고 저장 수가 맞는지 |
| `EVALUATION_RESULTS.json` | 전체 질의 수, 실행·품질 상태와 검색 지표 | `status`, `queries_total`, `queries_executed`, `retrieval` |
| `retrieval_scores_per_query.jsonl` | 질문별 MRR, Hit, Recall과 nDCG | 전체 평균을 낮춘 질문 ID와 지표 |
| `qa_answers.jsonl` | 질문별 답변, 검색 결과, 최종 Context와 Citation | 필요한 근거로 답했고 Citation이 Context의 원문을 가리키는지 |
| `query_observations.jsonl` | 질문별 `execution_status`, `quality_status`와 HTTP 확인 결과 | 실행 오류와 정상 실행 후 품질 miss의 구분 |
| `query-diagnostics/<질문 ID>.json` | 질문 하나의 검색 요청과 답변 생성 과정 | 문제가 검색에서 시작됐는지 답변 생성에서 시작됐는지 |

### 전체 실행에서 추가로 확인하는 파일

| 결과 | 들어 있는 내용 | 먼저 확인할 것 |
|---|---|---|
| `DOCUMENT_TERMINAL_STATUSES.jsonl` | 문서별 완료, 승인된 부분 완료 또는 예상하지 못한 실패 상태 | 2,567문서가 모두 기록됐고 예상하지 못한 실패가 없는지 |
| `STAGE_TERMINAL_SUMMARY.json` | 파싱부터 인덱싱까지 단계별 완료·건너뜀·실패 수 | 실패가 어느 단계에 집중됐는지 |
| `FULL_RUN_AGGREGATES.json` | 문서 처리 수, 원문 청크·검색표현 수, 인덱스 저장 수와 중복 ID 검사 | 문서 수와 인덱스 수가 맞고 `index.count_matches`가 `true`인지 |
| `DOCUMENT_PROCESSING_TIMES.jsonl` | 문서별·단계별 처리 시간 | 느린 문서와 오래 걸린 단계 |

## 검색 점수 읽기

100문서와 2,567문서 실행은 다음 검색 지표를 계산합니다.

| 값 | 알려 주는 내용 |
|---|---|
| `reciprocal_rank` 또는 MRR | 첫 번째 정답 문서가 얼마나 앞에 나왔는지 보여줍니다. 첫 결과가 정답이면 질문별 값은 `1.0`입니다. |
| `hit_at_k` | 상위 `k`개 안에 정답 문서가 하나라도 있는 질문의 비율입니다. |
| `required_recall_at_k` | 답변에 필요한 문서 가운데 상위 `k`개 안에서 찾은 비율입니다. |
| `minimal_set_success_at_k` | 답변에 필요한 최소 문서 묶음을 상위 `k`개 안에서 모두 찾은 질문의 비율입니다. |
| `ndcg_at_k` | 관련도가 높은 정답 문서가 앞에 배치됐는지 보여줍니다. |

`single-hop` 질문은 MRR과 Hit를 먼저 봅니다. 여러 근거가 필요한 `multi-hop` 질문은 `required_recall_at_k`와 `minimal_set_success_at_k`를 함께 확인합니다.

## 답변 정확도와 Citation 확인

`EVALUATION_RESULTS.json`의 검색 점수는 필요한 문서를 잘 찾았는지 보여줍니다. 답변 내용이 정답인지 확인하려면 `qa_answers.jsonl`의 답변을 평가셋의 필수 내용과 비교한 별도 답변 점수도 함께 봐야 합니다. 답변 채점 기준과 LLM-as-Judge 구성은 [평가셋](eval200.md#3-독립-답변-평가)에서 설명합니다.

특정 질문의 답변과 Citation은 다음 순서로 확인합니다.

1. `qa_answers.jsonl`에서 확인할 `query_id`를 찾습니다.
2. `answer`가 질문에 직접 답하는지 확인합니다.
3. `search_results`에서 답변에 사용한 원문과 문서를 확인합니다.
4. 각 `claim`의 `cited_unit_ids`가 `search_results` 안의 원문 ID를 가리키는지 확인합니다.

## 문제 원인 찾기

| 증상 | 먼저 확인할 결과 | 다음 확인 대상 |
|---|---|---|
| 문서가 완료되지 않음 | `FINAL_REPORT.json` | 실패한 파이프라인 단계 |
| 전체 문서 수가 예상과 다름 | `DOCUMENT_TERMINAL_STATUSES.jsonl`, `STAGE_TERMINAL_SUMMARY.json` | 누락·부분 완료·실패 문서 |
| 인덱스 저장 수가 맞지 않음 | `FULL_RUN_AGGREGATES.json`, `INDEX_SNAPSHOT.json` | `index.count_matches`, 중복 ID 검사 |
| `query_execution_failures`가 있음 | `query_observations.jsonl` | 같은 ID의 `query-diagnostics/<질문 ID>.json` |
| 검색 점수가 낮음 | `retrieval_scores_per_query.jsonl` | 인덱싱 결과, 검색 설정, 검색표현 |
| 검색 점수는 높지만 답변이 틀림 | `qa_answers.jsonl` | Reader 응답과 답변 프롬프트 |
| 답변 또는 Citation이 비어 있음 | `QUERY_RESULT_DIAGNOSTIC.json` 또는 질문별 진단 파일 | 최종 Context, Reader 응답, `cited_unit_ids` |
| 일부 문서가 지나치게 느림 | `DOCUMENT_PROCESSING_TIMES.jsonl` | 오래 걸린 문서와 단계 |

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 문서 1건 실행 | `backend/struct4search/e2e/service.py` · `OneDocumentE2ERunner` |
| 문서 5건 실행 | `backend/struct4search/e2e/five_document.py` · `FiveDocumentE2ERunner` |
| 100문서·100질의 실행 | `backend/struct4search/e2e/final_100_100.py` · `Final100E2ERunner` |
| 2,567문서·200질의 실행 | `backend/struct4search/e2e/final_full_2567_200.py` · `FinalFull2567E2ERunner` |
| 검색 점수 계산 | `backend/struct4search/evaluation/retrieval.py` · `score_prediction_rows` |
| 답변 점수 형식과 집계 | `backend/struct4search/evaluation/qa.py`, `terra_judgments.py` |
