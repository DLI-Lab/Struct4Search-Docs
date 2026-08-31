---
sidebar_position: 3
title: 평가 실행과 결과 확인
---

# 평가 실행과 결과 확인

이 페이지에서는 문서 1건부터 전체 2,567문서까지 실제 인덱싱·검색·답변 평가를 실행하는 명령과 결과 확인 방법을 설명합니다. 작은 범위부터 차례대로 실행하면 문제가 생겼을 때 설치와 서비스 연결 문제인지, 여러 문서 처리 문제인지, 검색 품질 문제인지 구분하기 쉽습니다.

평가 자료의 질문과 정답 구성은 [평가셋](eval200.md), GPU·모델 서버·OpenSearch와 PostgreSQL 준비 방법은 [설치 요구사항](../reference/dependencies.md)에서 확인합니다.

## 실행 전에 확인할 것

네 명령은 모두 실제 인덱싱, 검색, 답변과 Citation 생성을 실행합니다. GPU 모델 서버와 외부 서비스가 준비된 환경에서 저장소 루트로 이동한 뒤 실행합니다.

다른 서버에서는 평가 자료와 결과를 저장할 위치를 환경변수로 지정합니다.

```bash
export S4S_ARTIFACT_TEST_FIXTURE_ROOT=/absolute/path/to/test-fixtures
export S4S_ARTIFACT_PRODUCTION_ROOT=/absolute/path/to/production-artifacts
export S4S_ARTIFACT_EVALUATION_ROOT=/absolute/path/to/full-evaluation-set
export S4S_ARTIFACT_CONTROL_ROOT=/absolute/path/to/e2e-results
mkdir -p "$S4S_ARTIFACT_CONTROL_ROOT"
```

- 문서 1건, 5건과 100건 평가는 `S4S_ARTIFACT_TEST_FIXTURE_ROOT`의 고정 자료를 사용합니다.
- 2,567문서 평가는 `S4S_ARTIFACT_PRODUCTION_ROOT`의 원본 문서 목록과 `S4S_ARTIFACT_EVALUATION_ROOT`의 200개 질문을 사용합니다.
- 앞의 세 자료 디렉터리는 실행 전에 실제 파일이 들어 있어야 합니다. `S4S_ARTIFACT_CONTROL_ROOT`는 결과를 저장할 빈 디렉터리로 만들 수 있습니다.
- 모든 실행 기록과 결과는 `S4S_ARTIFACT_CONTROL_ROOT` 아래에 새 디렉터리로 저장됩니다.

각 명령이 끝나면 터미널 마지막 줄에 `status`, `run_id`, `receipt_path`와 `output_root`가 JSON으로 출력됩니다. 아래 예제의 `RECEIPT`에는 출력된 `receipt_path`, `RUN_ROOT`에는 `output_root`를 그대로 넣습니다.

100문서와 전체 문서 평가는 질의 하나가 정답 품질을 만족하지 못해도 남은 질의를 계속 실행합니다. API 요청과 응답 형식은 정상인데 답변이 없거나 틀렸거나 정답 문서를 찾지 못한 경우에는 `query_quality_misses`에 기록하고 전체 검색·답변 지표에 반영합니다. API 호출 실패, 응답 형식 오류, 다른 index 사용이나 검색 근거 밖 Citation은 `query_execution_failures`에 기록되는 실행 오류이며 전체 실행을 실패 처리합니다. 최종 배포 판정은 개별 질의의 실행 성공 여부가 아니라 모든 질의를 실행한 뒤 계산한 검색·QA 지표를 사용합니다.

## 1. 문서 1건 실행

설치와 서비스 연결을 처음 확인할 때 실행합니다. 고정 문서 1건을 새 검색 공간에 인덱싱하고, 실제 질문 1건에 답변과 Citation을 만든 뒤 HTTP 경로까지 확인합니다.

```bash
struct4search-smoke-e2e
```

실행 후 다음과 같이 결과 경로를 지정합니다.

```bash
RECEIPT=/path/printed/as/receipt_path
RUN_ROOT=/path/printed/as/output_root
```

먼저 전체 실행 결과와 질문 결과를 확인합니다.

```bash
jq '{status, run_id, query: .query_and_web.query_request, claims: .query_and_web.claims, cited_unit_ids: .query_and_web.cited_unit_ids}' "$RECEIPT"
jq '{status, documents_total, documents_complete, documents_failed}' "$RUN_ROOT/FINAL_REPORT.json"
```

정상이라면 실행 기록의 `status`가 `PASS`이고, 문서 1건이 완료되며 실패 문서는 없습니다. `claims`에는 생성된 답변 문장이, `cited_unit_ids`에는 그 문장을 뒷받침한 원문 ID가 들어 있어야 합니다.

| 결과 | 들어 있는 내용 | 확인할 것 |
|---|---|---|
| `receipt_path`의 JSON | 실행 설정, 사용한 임시 자원, 인덱싱 결과, 질문·답변·Citation과 자원 정리 결과 | `status: PASS`, 답변 문장과 Citation이 비어 있지 않은지 |
| `FINAL_REPORT.json` | 문서 처리 단계별 결과와 완료·실패 문서 수 | 문서 1건이 끝까지 완료되었는지 |
| `QUERY_RESULT_DIAGNOSTIC.json` | 실제 검색 요청, 최종 Context, 답변과 HTTP 응답을 한 질문 기준으로 정리한 진단 자료 | 검색된 원문이 답변과 Citation으로 이어졌는지 |

문서가 완료되지 않았다면 `FINAL_REPORT.json`에서 실패한 단계를 먼저 봅니다. 문서는 완료됐지만 답변이나 Citation이 없다면 `QUERY_RESULT_DIAGNOSTIC.json`에서 검색 결과와 Reader 응답을 확인합니다.

## 2. 문서 5건 실행

한 문서는 통과했지만 여러 문서를 연속으로 처리할 때도 같은 결과가 나오는지 확인합니다. 고정 문서 5건을 함께 인덱싱하고, 문서마다 연결된 질문 1건씩 총 5건을 실행합니다.

```bash
struct4search-five-document-e2e
```

터미널에 출력된 경로를 `RECEIPT`와 `RUN_ROOT`에 넣은 뒤 확인합니다.

```bash
jq '{status, run_id, successful_query_count: .queries_and_web.successful_query_count, failed_query_ids: .queries_and_web.failed_query_ids}' "$RECEIPT"
jq '{status, documents_total, documents_complete, documents_failed}' "$RUN_ROOT/FINAL_REPORT.json"
```

정상이라면 문서 5건이 완료되고 `successful_query_count`가 `5`, `failed_query_ids`가 빈 배열입니다.

| 결과 | 들어 있는 내용 | 확인할 것 |
|---|---|---|
| `receipt_path`의 JSON | 문서 5건의 처리 결과와 질문별 Context·답변·Citation·HTTP 확인 결과 | 전체 상태가 `PASS`이고 질문 5건이 모두 성공했는지 |
| `FINAL_REPORT.json` | 문서별 파이프라인 단계와 완료·실패 수 | 실패 문서가 없고 다섯 문서가 모두 완료됐는지 |
| `query-diagnostics/<질문 ID>.json` | 질문별 검색 요청, 최종 Context, 답변과 Citation | 실패한 질문에서 검색과 답변 중 어느 부분이 문제인지 |

특정 질문만 실패하면 `failed_query_ids`의 ID와 같은 `query-diagnostics/<질문 ID>.json`을 엽니다. 여러 문서가 같은 단계에서 실패하면 질문 결과보다 `FINAL_REPORT.json`의 해당 단계 오류를 먼저 확인합니다.

## 3. 100문서·100질의 실행

파이프라인, 모델, 프롬프트나 검색 설정을 바꾼 뒤 전체 평가 전에 실행합니다. 고정 문서 100건을 인덱싱하고 질문 100건의 검색·답변 결과와 검색 점수를 만듭니다.

```bash
struct4search-final-100-100-e2e
```

터미널에 출력된 경로를 지정한 뒤 전체 상태와 검색 점수를 확인합니다.

```bash
jq '{status, run_id, queries_total: .queries_and_web.queries_total, queries_executed: .queries_and_web.queries_executed, query_execution_failures: .queries_and_web.query_execution_failures, query_quality_misses: .queries_and_web.query_quality_misses}' "$RECEIPT"
jq '{status, queries_total, queries_executed, query_execution_failure_count, query_quality_miss_count, retrieval}' "$RUN_ROOT/EVALUATION_RESULTS.json"
```

질의 실행이 정상적으로 끝났다면 `queries_total`과 `queries_executed`가 모두 `100`이고 `query_execution_failures`가 빈 배열입니다. `query_quality_misses`가 있으면 같은 질문 ID의 검색·답변 결과를 확인하며, 해당 질의의 낮은 점수까지 포함한 전체 지표로 배포 여부를 판단합니다. `EVALUATION_RESULTS.json`의 `status: PASS`는 100개 질의 실행과 집계가 완료됐다는 뜻이며 모든 답변이 정답이라는 뜻은 아닙니다.

| 결과 | 들어 있는 내용 | 확인할 것 |
|---|---|---|
| `FINAL_REPORT.json` | 100문서의 파이프라인 완료 결과 | 100문서가 모두 완료되고 실패 문서가 없는지 |
| `INDEX_SNAPSHOT.json` | 이번 실행에서 새로 만든 검색 index의 설정과 저장된 검색 단위 수 | 원문 청크와 검색표현이 예상한 index에 저장됐는지 |
| `EVALUATION_RESULTS.json` | 질문 수, 전체 검색 지표와 Citation 정리 횟수 | `status`, `query_count`와 `retrieval` 점수 |
| `retrieval_scores_per_query.jsonl` | 질문별 MRR, Hit, Recall과 nDCG | 전체 평균이 낮을 때 어느 질문의 순위가 나빠졌는지 |
| `qa_answers.jsonl` | 질문별 답변, 최종 검색 문서, Context와 Citation | 답변이 필요한 근거를 사용했고 Citation이 Context 안의 원문을 가리키는지 |
| `query_observations.jsonl` | 질문별 `execution_status`, `quality_status`와 HTTP 확인 결과 | 실행 오류인지 정상 실행 후 품질 miss인지 |
| `query-diagnostics/<질문 ID>.json` | 질문 하나의 검색 요청과 답변 생성 과정 | 문제가 검색에서 시작됐는지 답변 생성에서 시작됐는지 |

검색 점수가 낮으면 `retrieval_scores_per_query.jsonl`에서 값이 낮은 질문 ID를 찾고, 같은 ID를 `qa_answers.jsonl`과 `query-diagnostics`에서 확인합니다. 검색된 문서는 맞지만 답변이 부정확하면 Reader와 답변 프롬프트를 확인하고, 필요한 문서가 검색되지 않았다면 인덱싱 결과와 검색 설정을 확인합니다.

## 4. 2,567문서·200질의 실행

전체 검색 대상과 최종 평가셋으로 배포 전 결과를 확인할 때 실행합니다. 문서 2,567건을 처음부터 처리하고 질문 200건에 답한 뒤, 문서별 완료 상태와 전체 검색 점수를 함께 남깁니다.

```bash
struct4search-final-full-2567-200-e2e
```

터미널에 출력된 경로를 지정한 뒤 다음 결과부터 확인합니다.

```bash
jq '{status, execution_status, queries_total: .queries_and_web.queries_total, queries_executed: .queries_and_web.queries_executed, query_execution_failures: .queries_and_web.query_execution_failures, query_quality_misses: .queries_and_web.query_quality_misses}' "$RECEIPT"
jq '{status, queries_total, queries_executed, query_execution_failure_count, query_quality_miss_count, retrieval}' "$RUN_ROOT/EVALUATION_RESULTS.json"
jq '{terminal_documents, index, duplicate_identity_audit}' "$RUN_ROOT/FULL_RUN_AGGREGATES.json"
```

정상 종료한 실행은 `execution_status`가 `PASS`이고, `queries_executed`가 `200`, `query_execution_failures`가 빈 배열입니다. `query_quality_misses`는 실행 오류가 아니며 전체 검색·답변 지표에 포함됩니다. 최종 정책 비교에 설명할 메모가 있으면 바깥 `status`는 `PASS_WITH_NOTE` 또는 `WARNING_NON_MATERIAL_DRIFT`가 될 수 있습니다. 그 밖의 상태는 실행 기록의 `error`와 정책 결과를 확인해야 합니다.

| 결과 | 들어 있는 내용 | 확인할 것 |
|---|---|---|
| `FINAL_REPORT.json` | 2,567문서의 실제 단계별 처리 결과 | 전체 문서 수와 문서별 실패 단계 |
| `DOCUMENT_TERMINAL_STATUSES.jsonl` | 문서마다 완료, 승인된 부분 완료 또는 예상하지 못한 실패 상태 | 2,567문서가 모두 기록됐고 예상하지 못한 실패가 없는지 |
| `STAGE_TERMINAL_SUMMARY.json` | 파싱부터 인덱싱까지 단계별 완료·건너뜀·실패 수 | 실패가 어느 단계에 몰렸는지 |
| `FULL_RUN_AGGREGATES.json` | 문서 처리 수, 원문 청크·검색표현 수, index 저장 수와 중복 ID 검사 | 문서 수가 맞고 `index.count_matches`가 `true`인지 |
| `DOCUMENT_PROCESSING_TIMES.jsonl` | 문서별·단계별 처리 시간 | 느린 문서와 오래 걸린 단계를 찾을 때 |
| `INDEX_SNAPSHOT.json` | 격리된 최종 index의 설정과 실제 저장 수 | 실행 결과와 index의 문서 수가 일치하는지 |
| `EVALUATION_RESULTS.json` | 200개 질문의 전체 검색 지표와 Citation 정리 횟수 | `status: PASS`, `query_count: 200`과 전체 검색 점수 |
| `retrieval_scores_per_query.jsonl` | 200개 질문 각각의 검색 점수 | 점수가 낮아진 질문과 질문 유형 |
| `qa_answers.jsonl` | 200개 질문의 답변, 검색 결과, Context와 Citation | 답변 내용과 원문 근거 연결 |
| `query_observations.jsonl` | 질문별 실행 상태와 품질 상태 | 실행 오류와 정상 실행 후 품질 miss의 구분 |

전체 평균만 보고 끝내지 않습니다. `EVALUATION_RESULTS.json`에서 검색 점수를 확인한 뒤, 낮은 질문은 `retrieval_scores_per_query.jsonl`에서 찾고 같은 질문의 답변과 Citation을 `qa_answers.jsonl`에서 확인합니다. 문서 처리 수가 예상과 다르면 질문 결과보다 `DOCUMENT_TERMINAL_STATUSES.jsonl`과 `STAGE_TERMINAL_SUMMARY.json`을 먼저 확인합니다.

## 검색 점수 읽기

100문서와 2,567문서 실행은 다음 검색 지표를 계산합니다.

| 값 | 알려 주는 내용 |
|---|---|
| `reciprocal_rank` 또는 MRR | 첫 번째 정답 문서가 얼마나 앞에 나왔는지 보여줍니다. 첫 결과가 정답이면 질문별 값은 `1.0`입니다. |
| `hit_at_k` | 상위 `k`개 안에 정답 문서가 하나라도 있는 질문의 비율입니다. |
| `required_recall_at_k` | 답변에 필요한 문서 가운데 상위 `k`개 안에서 찾은 비율입니다. |
| `minimal_set_success_at_k` | 답변에 필요한 최소 문서 묶음을 상위 `k`개 안에서 모두 찾은 질문의 비율입니다. |
| `ndcg_at_k` | 관련도가 높은 정답 문서가 앞에 배치됐는지 보여줍니다. |

`single-hop` 질문은 MRR과 Hit를 먼저 보고, 여러 근거가 필요한 `multi-hop` 질문은 `required_recall_at_k`와 `minimal_set_success_at_k`를 함께 봅니다.

## 답변 정확도와 Citation 확인

`EVALUATION_RESULTS.json`의 검색 점수는 필요한 문서를 잘 찾았는지 보여줍니다. 답변 내용이 정답인지 보려면 `qa_answers.jsonl`의 답변을 평가셋의 필수 내용과 비교한 별도 답변 점수도 확인해야 합니다. 답변 채점 기준과 LLM-as-Judge 구성은 [평가셋](eval200.md#3-독립-답변-평가)에서 설명합니다.

Citation은 다음 순서로 확인합니다.

1. `qa_answers.jsonl`에서 확인할 `query_id`를 찾습니다.
2. `answer`가 질문에 직접 답하는지 읽습니다.
3. `search_results`에서 답변에 사용한 원문과 문서를 확인합니다.
4. 각 `claim`의 `cited_unit_ids`가 `search_results` 안의 원문 ID를 가리키는지 확인합니다.

검색 점수는 높은데 답변이 틀리면 Reader나 답변 프롬프트를 먼저 확인합니다. 검색 점수부터 낮으면 검색 설정, 검색표현이나 인덱싱 결과부터 확인합니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 문서 1건 실행 | `backend/struct4search/e2e/service.py` · `OneDocumentE2ERunner` |
| 문서 5건 실행 | `backend/struct4search/e2e/five_document.py` · `FiveDocumentE2ERunner` |
| 100문서·100질의 실행 | `backend/struct4search/e2e/final_100_100.py` · `Final100E2ERunner` |
| 2,567문서·200질의 실행 | `backend/struct4search/e2e/final_full_2567_200.py` · `FinalFull2567E2ERunner` |
| 검색 점수 계산 | `backend/struct4search/evaluation/retrieval.py` · `score_prediction_rows` |
| 답변 점수 형식과 집계 | `backend/struct4search/evaluation/qa.py`, `terra_judgments.py` |
