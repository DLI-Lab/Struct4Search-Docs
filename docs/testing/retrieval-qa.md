---
sidebar_position: 3
title: 평가 실행과 결과 확인
---

# 평가 실행과 결과 확인

평가셋이 준비된 뒤 실제 질문을 실행하고, 필요한 문서를 찾았는지와 답변이 맞는지를 확인하는 방법입니다. 검색·답변 코드, 모델이나 설정을 바꾼 뒤 다음을 확인할 때 사용합니다.

- 같은 질문에서 검색 결과가 이전보다 나빠지지 않았는가?
- 답변에 필요한 내용이 모두 들어 있는가?
- 답변의 Citation이 실제로 사용한 원문을 가리키는가?
- 문제가 있다면 어느 질문의 검색 또는 답변에서 시작되었는가?

평가셋의 구성과 답변 채점 방법은 [평가셋](eval200.md)에서 먼저 확인합니다.

## 먼저 한 문항으로 실행해 보기

저장소에는 평가 명령과 결과 파일을 확인할 수 있는 한 문항 예제가 들어 있습니다. 모델 서버나 OpenSearch를 사용하지 않으므로 설치 직후에도 실행할 수 있습니다. 저장소 루트에서 다음 명령을 실행합니다.

```bash
struct4search-evaluate \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --evaluation-config tests/fixtures/evaluation_mini/release.json \
  --gate-config tests/fixtures/evaluation_mini/gate.yaml \
  --baseline-report tests/fixtures/evaluation_mini/baseline_report.json \
  --qa-scores tests/fixtures/evaluation_mini/qa_scores.jsonl \
  --output-root /tmp/struct4search-evaluation
```

명령이 끝나면 터미널의 마지막 결과와 `/tmp/struct4search-evaluation/EVALUATION_RESULTS.json`에서 `"status": "PASS"`를 확인합니다. 예제 질문은 `안전모 착용 기준은?`이며, 저장된 검색 결과와 답변이 예제 정답에 맞으면 정상입니다.

이 실행은 평가 기능이 설치되어 결과 파일을 제대로 만드는지만 확인합니다. 실제 모델의 검색·답변 품질을 측정한 결과는 아닙니다.

## 질문 하나의 결과 읽기

위 예제를 실행하면 `q001`의 결과가 다음 순서로 저장됩니다.

### 1. 필요한 문서를 찾았는지 확인

`retrieval_scores_per_query.jsonl`에서 `query_id`가 `q001`인 줄을 찾습니다.

```json
{
  "query_id": "q001",
  "reciprocal_rank": 1.0,
  "hit_at_1": 1.0,
  "required_recall_at_1": 1.0,
  "minimal_set_success_at_1": 1.0,
  "ndcg_at_1": 1.0
}
```

이 예제에서는 필요한 문서가 첫 번째 결과에 나왔기 때문에 모든 값이 `1.0`입니다. 값의 의미는 다음과 같습니다.

| 값 | 알려 주는 내용 |
|---|---|
| `reciprocal_rank` | 첫 번째 정답 문서가 앞에 나왔는지 확인합니다. 첫 결과가 정답이면 `1.0`입니다. |
| `hit_at_k` | 상위 `k`개 안에 정답 문서가 하나라도 있는 질문의 비율입니다. |
| `required_recall_at_k` | 답변에 필요한 문서 중 상위 `k`개 안에서 찾은 비율입니다. |
| `minimal_set_success_at_k` | 답변에 필요한 최소 문서 묶음을 상위 `k`개 안에서 모두 찾은 질문의 비율입니다. |
| `ndcg_at_k` | 관련도가 높은 정답 문서가 앞에 배치되었는지 확인합니다. |

실제 평가에서는 `k`가 1, 5, 10인 결과가 함께 기록됩니다. 여러 문서가 필요한 질문은 `hit_at_k`만 보지 말고 `required_recall_at_k`와 `minimal_set_success_at_k`도 함께 확인합니다.

### 2. 답변과 Citation 확인

`qa_answers.jsonl`에서 같은 `query_id`를 찾습니다.

```json
{
  "query_id": "q001",
  "query_text": "안전모 착용 기준은?",
  "answer": "안전모를 착용한다.",
  "retrieved_document_ids": ["doc_fixture_001"],
  "context_unit_ids": ["ruf_fixture_001"],
  "cited_unit_ids": ["ruf_fixture_001"]
}
```

다음 세 가지를 확인합니다.

1. `answer`가 비어 있지 않고 질문에 답하는 내용인지 확인합니다.
2. `retrieved_document_ids`와 `context_unit_ids`에서 어떤 문서와 원문이 답변에 사용됐는지 확인합니다.
3. `cited_unit_ids`가 `context_unit_ids` 안에 있는 원문을 가리키는지 확인합니다.

검색 점수는 높은데 답변이 틀렸다면 Reader나 답변 프롬프트를 먼저 확인합니다. 검색 점수부터 낮다면 검색 설정, 검색표현 또는 인덱싱 결과부터 확인합니다.

### 3. 답변 점수 확인

답변 내용은 정답과 비교해 질문마다 `0`, `1`, `2` 중 하나로 채점합니다.

| 점수 | 뜻 |
|---:|---|
| `2` | 필요한 내용을 모두 정확하게 답했고 중대한 오류가 없음 |
| `1` | 일부는 맞지만 중요한 내용이 빠졌거나 중대한 오류가 있음 |
| `0` | 오답이거나 답변하지 못함 |

점수는 다음과 같은 JSONL 파일로 준비합니다.

```json
{"query_id": "q001", "score": 2}
```

`struct4search-evaluate`는 답변을 직접 채점하거나 유료 평가 모델을 호출하지 않습니다. 별도로 채점을 마친 점수 파일을 `--qa-scores`에 전달하고, 모든 질문에 점수가 하나씩 있는지 확인한 뒤 평균을 계산합니다.

## 실제 시스템 평가

실제 검색·답변 품질을 확인하려면 평가셋의 문서가 인덱싱되어 있고, 사용할 profile에 지정된 OpenSearch, Embedding과 Reader 서비스가 실행 중이어야 합니다.

```bash
struct4search-evaluate \
  --profile configs/production.yaml \
  --evaluation-config configs/evaluation-release.json \
  --gate-config configs/evaluation-gate.yaml \
  --baseline-report /absolute/path/to/before/EVALUATION_REPORT.json \
  --qa-scores /absolute/path/to/judgments/qa_scores.jsonl \
  --output-root /absolute/path/to/after
```

| 입력 | 준비할 내용 |
|---|---|
| `--profile` | 평가할 검색·답변 설정입니다. 이 설정으로 실제 `QueryService`를 실행합니다. |
| `--evaluation-config` | 사용할 평가셋의 파일 이름과 질문 수를 정의합니다. |
| `--gate-config` | 반드시 만들 결과 파일과 비교할 검색·답변 값을 정의합니다. |
| `--baseline-report` | 같은 평가셋과 실행 조건으로 변경 전에 만든 `EVALUATION_REPORT.json`입니다. |
| `--qa-scores` | 모든 평가 질문의 답변 점수를 기록한 JSONL 파일입니다. |
| `--output-root` | 이번 평가 결과를 저장할 새 디렉터리입니다. |

기존 E2E 실행 아래에 결과를 남기려면 `--output-root` 대신 `--run-root /absolute/path/to/run`을 사용합니다. 결과는 `/absolute/path/to/run/evaluation/final200`에 저장됩니다. 두 옵션은 함께 사용할 수 없습니다.

변경 전과 변경 후 결과를 비교할 때는 평가셋, 검색 대상 문서, profile과 모델 조건을 같게 유지합니다. 이 조건이 달라졌다면 이전 결과와 직접 비교하지 않고 새 조건의 기준 결과를 먼저 만듭니다.

## 전체 결과는 이 순서로 확인

### 1. `EVALUATION_RESULTS.json`

평가 전체 결과입니다. 먼저 최상위 `status`를 확인합니다.

| 상태 | 뜻 | 다음 확인 |
|---|---|---|
| `PASS` | 필요한 결과가 모두 있고 설정한 비교 조건을 만족함 | 질문별 결과에서 실제 품질을 확인합니다. |
| `FAIL` | 실행은 끝났지만 검색 점수, 답변 평균, 이전 결과와의 차이 또는 Citation 조건을 만족하지 못함 | `RELEASE_GATE.json`의 `failures`를 확인합니다. |
| `BLOCKED` | 기준 결과나 답변 점수처럼 비교에 필요한 입력이 없거나 형식이 잘못됨 | `RELEASE_GATE.json`의 `blockers`를 확인합니다. |

이 상태는 자동 실행과 배포 전 검사에서 결과를 빠르게 구분하기 위한 값입니다. `PASS`만 보고 답변 품질이 좋다고 판단하지 말고, 답변 점수가 포함되었는지와 질문별 결과를 함께 확인합니다.

### 2. `RELEASE_GATE.json`

설정한 비교 조건을 하나씩 검사한 결과입니다. `FAIL`이면 `failures`, `BLOCKED`이면 `blockers`를 먼저 읽습니다. 예를 들어 답변 점수 파일이 빠졌다면 검색 실행이 정상이어도 `BLOCKED`가 됩니다.

### 3. `EVALUATION_REPORT.json`

모든 질문의 검색 지표와 Citation 정리 횟수를 모아 둔 보고서입니다. 현재 검색 결과가 전체적으로 어떤 수준인지 확인하고 변경 전 보고서와 비교할 때 사용합니다. 답변 점수 평균은 `RELEASE_GATE.json`의 `qa_mean_score` 검사에서 확인합니다.

### 4. 질문별 파일

전체 평균이 나빠졌다면 `retrieval_scores_per_query.jsonl`에서 값이 낮은 `query_id`를 찾은 뒤, 같은 ID를 `retrieval_predictions.query_service.jsonl`과 `qa_answers.jsonl`에서 확인합니다. 이 순서로 보면 문제가 문서 검색에서 시작됐는지, 답변 생성에서 시작됐는지 구분할 수 있습니다.

## Citation 정리 횟수

Reader가 같은 출처를 반복하거나 실제로 사용하지 않은 원문을 가리키면 Struct4Search가 잘못된 Citation을 제거합니다. 다음 값은 최종 답변에 남은 Citation 수가 아니라, 평가 중 제거한 항목의 수입니다.

| 필드 | 제거한 항목 |
|---|---|
| `duplicate_citations_removed` | 같은 답변 문장에 반복해서 붙은 동일한 원문 ID |
| `retrieval_expression_citations_removed` | 원문이 아니라 검색을 위해 만든 문장을 가리킨 ID |
| `out_of_context_citations_removed` | 해당 질문의 최종 Context에 들어 있지 않은 원문 ID |
| `unsupported_claims_removed` | 유효한 원문 Citation이 하나도 남지 않은 답변 문장 |

모두 `0`이면 제거할 항목이 없었다는 뜻입니다. 값이 크면 최종 답변은 정상으로 보여도 Reader의 원래 출력에 잘못된 Citation이나 근거 없는 문장이 많았다는 뜻이므로, 해당 질문의 `citation_normalization`을 확인합니다.

## 생성되는 파일

| 파일 | 확인하는 내용 |
|---|---|
| `EVALUATION_RESULTS.json` | 평가 전체 상태와 나머지 결과를 합친 최종 파일 |
| `RELEASE_GATE.json` | 설정한 비교 조건별 결과와 실패·입력 누락 사유 |
| `EVALUATION_REPORT.json` | 전체 질문의 검색 지표와 Citation 정리 횟수 |
| `retrieval_scores_per_query.jsonl` | 질문별 검색 점수 |
| `retrieval_predictions.query_service.jsonl` | 질문별 최종 문서 순위, 답변과 Citation |
| `qa_answers.jsonl` | 답변, Citation, 최종 Context와 검색 결과 |

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 평가 명령과 결과 파일 생성 | `backend/struct4search/evaluation/service.py` · `main`, `EvaluationService.evaluate_release` |
| 실제 QueryService 연결 | `backend/struct4search/entrypoints/cli/evaluate.py` · `_query_service` |
| 검색 지표 계산 | `backend/struct4search/evaluation/retrieval.py` · `score_prediction_rows` |
| 자동 비교 상태 계산 | `backend/struct4search/evaluation/gate.py` · `evaluate_release_gate` |
| 답변 점수 검사와 평균 계산 | `backend/struct4search/evaluation/gate.py` · `evaluate_release_gate` |
