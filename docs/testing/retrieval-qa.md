---
sidebar_position: 3
title: 평가 실행과 통과 판정
---

# 평가 실행과 통과 판정

인덱싱을 마친 시스템에 평가 질문을 보내 필요한 문서를 찾았는지, 생성한 답변이 맞는지 확인하는 방법입니다. `struct4search-evaluate`는 실제 검색·답변 결과를 저장하고, 변경 전의 기준 결과(baseline)와 비교해 성능이 떨어졌는지 판정합니다.

## 실제 시스템 평가

평가셋의 문서가 색인되어 있고 OpenSearch, embedding, reader 서비스가 실행 중이어야 합니다. 검색이나 답변에 영향을 주는 코드·모델·설정을 바꾼 뒤 다음 명령을 실행합니다.

```bash
struct4search-evaluate \
  --profile configs/production.yaml \
  --evaluation-config configs/evaluation-release.json \
  --gate-config configs/evaluation-gate.yaml \
  --baseline-report <변경_전_EVALUATION_REPORT.json> \
  --qa-scores <QA_점수.jsonl> \
  --output-root /absolute/path/to/evaluation-output
```

`--profile`은 해당 설정으로 실제 QueryService를 실행합니다. 결과를 기존 run 아래에 남기려면 `--output-root` 대신 `--run-root <run_root>`를 사용하며, 파일은 `<run_root>/evaluation/final200`에 생성됩니다.

### QA 점수 파일

evaluator는 답변을 직접 채점하지 않습니다. 답변을 정답과 비교해 질의마다 정수 `0`, `1`, `2` 중 하나를 기록한 JSONL 파일을 준비합니다.

```json
{"query_id": "q001", "score": 2}
```

`2`는 필요한 내용을 정확하게 답한 경우, `1`은 일부만 맞거나 중요한 누락이 있는 경우, `0`은 오답 또는 무응답입니다. 모든 평가 질문에 점수가 하나씩 있어야 하며 다른 값이 있으면 평가가 `BLOCKED`됩니다.

### 기준 결과(baseline)

기준 결과는 변경 전에 통과한 평가의 `EVALUATION_REPORT.json`입니다. `--baseline-report`에 이 파일을 전달하면 현재 검색 지표와 QA 평균이 기준 결과보다 허용 범위 이상 떨어졌는지 확인합니다.

비교하려는 변경을 제외한 평가셋, index, profile과 모델 조건은 같아야 합니다. 평가셋이나 검색 대상 index를 바꾸면 이전 결과와 직접 비교하지 않고 새 조건에서 기준 결과를 다시 만듭니다.

## 설치 확인용 예제 평가

실제 모델과 검색 서비스를 사용하지 않고 evaluator가 설치되어 실행되는지만 확인할 때 사용합니다. 저장소의 예제 검색 결과를 읽으므로 성능 평가는 하지 않습니다.

```bash
struct4search-evaluate \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --evaluation-config tests/fixtures/evaluation_mini/release.json \
  --gate-config tests/fixtures/evaluation_mini/gate.yaml \
  --baseline-report tests/fixtures/evaluation_mini/baseline_report.json \
  --qa-scores tests/fixtures/evaluation_mini/qa_scores.jsonl \
  --output-root /tmp/struct4search-evaluation
```

`--profile`과 `--fixture-results`는 둘 중 하나만 사용합니다.

## 결과 파일

| 파일 | 내용 |
|---|---|
| `retrieval_predictions.query_service.jsonl` | 질문별 최종 문서 순위와 답변·인용 |
| `retrieval_scores_per_query.jsonl` | 질문별 검색 점수 |
| `qa_answers.jsonl` | 답변, 인용, 최종 Context |
| `EVALUATION_REPORT.json` | 검색 지표와 답변 정리 횟수 |
| `RELEASE_GATE.json` | 통과 조건별 결과와 실패 사유 |
| `EVALUATION_RESULTS.json` | 평가 전체 결과와 최종 상태 |

각 값의 뜻은 [평가 지표](metrics.md)에서 확인합니다.

## 통과 판정

통과 조건은 `configs/evaluation-gate.yaml`에 정의되어 있습니다.

| 상태 | 뜻 |
|---|---|
| `PASS` | 필요한 결과가 모두 있고 설정한 조건을 통과함 |
| `FAIL` | 검색 지표, QA 평균, 기준 결과 대비 하락 폭 또는 인용 조건을 통과하지 못함 |
| `BLOCKED` | 평가 파일, 기준 결과, QA 점수 또는 필수 지표가 없거나 형식이 잘못됨 |

`PASS`가 아니면 `RELEASE_GATE.json`의 `failures`와 `blockers`에서 원인을 확인합니다.

## 변경 후 다시 평가할 범위

| 변경한 부분 | 검색 평가 | QA 평가 |
|---|---:|---:|
| 파싱·청킹·NER·KG | 필수 | 필수 |
| Metadata·검색표현 프롬프트 | 필수 | 필수 |
| 검색 파라미터·점수 통합 | 필수 | 필수 |
| Context 구성 | — | 필수 |
| 답변 프롬프트·모델 | — | 필수 |
| 동시성·서비스 주소 | — | — |

질문별 결과를 확인할 때는 `retrieval_scores_per_query.jsonl`에서 `query_id`를 찾고, 같은 ID의 검색 순위와 답변은 `retrieval_predictions.query_service.jsonl`에서 확인합니다.
