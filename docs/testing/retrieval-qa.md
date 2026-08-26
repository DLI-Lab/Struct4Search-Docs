---
sidebar_position: 5
title: 검색과 QA 평가 실행
---

# 검색과 QA 평가 실행

Evaluator는 저장소에 포함된 예제 검색 결과 파일 또는 운영 QueryService를 사용해 검색과 답변을 함께 평가합니다.

## CPU 환경에서 먼저 확인

```bash
struct4search-evaluate \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --evaluation-config tests/fixtures/evaluation_mini/release.json \
  --gate-config tests/fixtures/evaluation_mini/gate.yaml \
  --baseline-report tests/fixtures/evaluation_mini/baseline_report.json \
  --qa-scores tests/fixtures/evaluation_mini/qa_scores.jsonl \
  --output-root /tmp/struct4search-evaluation
```

`--fixture-results`는 예제 검색 결과 파일을 지정하는 옵션입니다. 이 명령은 GPU·OpenSearch·embedding·reader·유료 API를 호출하지 않습니다.

## 운영 평가 전 확인

* 평가 대상 코퍼스가 색인되어 있어야 합니다.
* OpenSearch, embedding, reader 서비스가 실행 중이어야 합니다.
* 평가 릴리스, 기준 report, QA score 파일을 준비해야 합니다.

| 평가셋     |    문서 |  질의 | 쓰는 때             |
| ------- | ----: | --: | ---------------- |
| 소규모 평가셋 |   100 | 100 | 변경 중 빠른 성능 확인    |
| 대규모 평가셋 | 2,567 | 200 | 기준선 비교와 최종 회귀 확인 |

소규모 평가셋은 검색 공간이 100문서로 제한되어 있어 대규모 검색 환경의 난이도를 그대로 반영하지는 않습니다. **기준 성능과 회귀 판정에는 대규모 평가셋을 사용합니다**([평가셋 구성](eval200.md)).

## 운영 평가 실행

```bash
struct4search-evaluate \
  --profile configs/production.yaml \
  --evaluation-config configs/evaluation-release.json \
  --gate-config configs/evaluation-gate.yaml \
  --baseline-report <기준_report.json> \
  --qa-scores <QA_점수.jsonl> \
  --output-root /absolute/path/to/evaluation-output
```

기존 run 아래에 결과를 남기려면 `--output-root` 대신 `--run-root <run_root>`를 사용합니다. `--run-root`와 `--output-root`, `--profile`과 `--fixture-results`는 각각 하나만 선택할 수 있습니다.

## 결과 파일

| 파일                                          | 내용          |
| ------------------------------------------- | ----------- |
| `retrieval_predictions.query_service.jsonl` | 질의별 검색 결과   |
| `retrieval_scores_per_query.jsonl`          | 질의별 검색 점수   |
| `qa_answers.jsonl`                          | 질의별 답변과 인용  |
| `EVALUATION_REPORT.json`                    | 검색·답변 평가 요약 |
| `RELEASE_GATE.json`                         | release gate 판정 |
| `EVALUATION_RESULTS.json`                   | 전체 평가 결과 요약 |

## 검색 지표

| 지표                         | 뜻                          |
| -------------------------- | -------------------------- |
| `ndcg_at_k`                | 정답 근거가 상위에 배치된 정도          |
| `required_recall_at_k`     | 필요한 정답 근거를 상위 k에서 얼마나 찾았는가 |
| `hit_at_k`                 | 상위 k에 정답 근거가 하나라도 있는가      |
| `minimal_set_success_at_k` | 답변에 필요한 최소 근거 집합을 모두 찾았는가  |

검색 결과와 정답 근거를 비교할 때는 **원문 청크가 가리키는 위치가 실제 정답 근거와 겹치는지** 확인합니다. 같은 문서라는 이유만으로 정답으로 판정하지 않습니다.

## QA 지표

답변은 정답과 필수 claim을 기준으로 채점합니다. 문자열 일치가 아니라 의미가 같은지를 평가하며, 필수 claim별 충족 여부를 보수적으로 판정합니다.

| 점수 | 뜻                              |
| -- | ------------------------------ |
| 4  | 모든 필수 내용이 정확하고 중대한 오류가 없음      |
| 3  | 대체로 정확하나 경미한 누락이나 부정확성이 있음     |
| 2  | 핵심 내용의 일부만 충족함                 |
| 1  | 최소한의 관련 내용만 있고 중대한 누락이나 오류가 있음 |
| 0  | 오답이거나 무응답                      |

정답 범위를 넘어 법적 기준·수치·요건 등을 단정한 답변은 별도로 표시합니다. 검색 근거는 맞지만 답변이 근거보다 과하게 확장되는 경우를 확인하기 위한 것입니다.

## 인용 검증

답변 결과에는 인용 정리 집계가 함께 기록됩니다.

| 집계                                       | `0`이 아니면                   |
| ---------------------------------------- | -------------------------- |
| `duplicate_citations_removed`            | 한 claim 안에서 같은 근거를 반복해 인용함 |
| `retrieval_expression_citations_removed` | 검색표현을 인용하려 함               |
| `out_of_context_citations_removed`       | Context에 없는 ID를 인용하려 함     |
| `unsupported_claims_removed`             | 원문 근거가 없는 claim이 제거됨       |

네 값이 모두 `0`이어야 정상입니다. 값이 `0`이 아니면 프롬프트, Context 구성 또는 인용 처리 과정을 확인합니다.

## 재현성 확인

같은 인덱스·평가셋·모델·설정에서는 같은 검색 결과가 나와야 합니다. 동일 조건의 두 실행에서 결과가 달라지면 인덱스나 설정 등 실행 조건이 달라졌는지 먼저 확인합니다.

평가 결과를 기록할 때는 **무엇을 평가했는지 함께 남깁니다.** 코드 commit, 실행 프로파일, 인덱스 이름, 평가셋 릴리스, 사용 모델을 함께 기록합니다([기준 성능과 회귀 판정](regression-gates.md)).

## 실패 질의 확인

`retrieval_scores_per_query.jsonl`에서 점수가 낮은 질의를 찾은 뒤, `retrieval_predictions.query_service.jsonl`에서 같은 질의의 검색 결과를 확인합니다.

정답 근거가 후보에 없으면 검색 단계에서 근거를 찾지 못한 경우이고, 후보에는 있지만 상위에 배치되지 않았다면 순위 문제로 볼 수 있습니다.
