---
sidebar_position: 2
title: 평가 실행과 통과 판정
---

# 평가 실행과 통과 판정

`struct4search-evaluate`는 QueryService의 최종 검색 결과와 답변을 저장하고 통과 여부를 판정합니다. 검색 점수는 evaluator가 계산하지만, 답변의 의미 품질 점수는 별도 평가 결과를 `--qa-scores`로 전달해야 합니다.

## CPU에서 evaluator 확인

```bash
struct4search-evaluate \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --evaluation-config tests/fixtures/evaluation_mini/release.json \
  --gate-config tests/fixtures/evaluation_mini/gate.yaml \
  --baseline-report tests/fixtures/evaluation_mini/baseline_report.json \
  --qa-scores tests/fixtures/evaluation_mini/qa_scores.jsonl \
  --output-root /tmp/struct4search-evaluation
```

이 명령은 저장소의 예제 검색 결과를 다시 읽어 평가 흐름과 산출물 형식을 확인합니다. 실제 검색·답변 서비스나 유료 API는 호출하지 않습니다.

## 운영 결과 평가

평가 대상 코퍼스를 색인하고 OpenSearch, embedding, reader 서비스를 실행한 뒤 다음 명령을 사용합니다.

```bash
struct4search-evaluate \
  --profile configs/production.yaml \
  --evaluation-config configs/evaluation-release.json \
  --gate-config configs/evaluation-gate.yaml \
  --baseline-report <기준_EVALUATION_REPORT.json> \
  --qa-scores <정규화한_QA_점수.jsonl> \
  --output-root /absolute/path/to/evaluation-output
```

`--profile`은 실제 QueryService를 실행하고, `--fixture-results`는 이미 저장한 결과를 읽습니다. 두 옵션 중 하나만 사용합니다. 결과를 기존 run 아래에 남기려면 `--output-root` 대신 `--run-root <run_root>`를 사용하며, 파일은 `<run_root>/evaluation/final200`에 생성됩니다.

`--qa-scores` 파일은 평가 질의마다 다음 형식의 행을 하나씩 가져야 합니다. `score`는 0 이상 1 이하의 값입니다.

```json
{"query_id": "q001", "score": 1.0}
```

답변 평가자가 0–4 점수를 출력했다면 `score = correctness_score / 4`로 정규화합니다. evaluator는 이 판단을 직접 생성하지 않습니다.

## 결과 파일

| 파일 | 내용 |
|---|---|
| `retrieval_predictions.query_service.jsonl` | 최종 Context의 문서 순위와 답변·인용 |
| `retrieval_scores_per_query.jsonl` | 질의별 검색 점수 |
| `qa_answers.jsonl` | 답변, 인용, Context 검색 결과 |
| `EVALUATION_REPORT.json` | 검색 지표와 인용 정리 집계 |
| `RELEASE_GATE.json` | 통과 기준의 검사 항목과 판정 사유 |
| `EVALUATION_RESULTS.json` | 전체 결과와 최종 상태 |

지표의 계산 단위와 해석은 [평가 지표](metrics.md)에서 확인합니다.

## 통과 판정

실제 조건은 `configs/evaluation-gate.yaml`이 정합니다.

| 상태 | 뜻 |
|---|---|
| `PASS` | 필요한 자료가 있고 모든 조건을 통과함 |
| `FAIL` | 지표, 기준선 하락 폭 또는 인용 조건을 통과하지 못함 |
| `BLOCKED` | 필요한 산출물, 기준선, QA 점수 또는 지표가 없거나 형식이 잘못됨 |

통과 판정은 다음 항목을 확인합니다.

- 필수 평가 산출물이 생성됐는지
- 검색 지표가 설정된 최소값 이상인지
- QA 점수가 모든 질의에 있고 평균 기준을 만족하는지
- 내용이 있는 답변에 최종 Context의 원문 인용이 있는지
- 기준 보고서보다 지표가 허용 범위 이상 하락하지 않았는지

판정이 `PASS`가 아니면 `RELEASE_GATE.json`의 `failures`와 `blockers`를 먼저 확인합니다.

## 기준선과 재평가 범위

기준 보고서는 같은 코드, profile, index, 평가셋 릴리스, 전처리 모델, 답변 모델에서 만든 결과를 사용합니다. 평가셋 릴리스나 index, 전처리 모델이 바뀌면 새 조건에서 기준 보고서를 다시 만듭니다.

| 변경한 부분 | 검색 평가 | QA 평가 |
|---|---:|---:|
| 파싱·청킹·NER·KG | 필수 | 필수 |
| Metadata·검색표현 프롬프트 | 필수 | 필수 |
| 검색 파라미터·점수 통합 | 필수 | 필수 |
| Context 구성 | — | 필수 |
| 답변 프롬프트·모델 | — | 필수 |
| 동시성·서비스 주소 | — | — |

`retrieval_scores_per_query.jsonl`에서 점수가 낮은 질의를 찾은 뒤 `retrieval_predictions.query_service.jsonl`의 같은 `query_id`를 확인하면 검색 누락과 순위 문제를 구분할 수 있습니다.
