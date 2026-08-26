---
sidebar_position: 5
title: 검색과 QA 평가 실행
---

# 검색과 QA 평가 실행

Evaluator는 fixture provider와 production profile provider를 같은 canonical QueryService 계약으로 실행합니다.

## 실행 계약

다음 두 쌍에서 각각 하나만 선택합니다.

- 출력: `--run-root` 또는 `--output-root`
- provider: `--profile` 또는 `--fixture-results`

`--evaluation-config`와 `--gate-config`는 항상 필수입니다. 회귀 판정에 기준 report나 QA score가 필요한 gate라면 `--baseline-report`, `--qa-scores`도 전달합니다.

## 외부 서비스 없는 fixture 실행

```bash
struct4search-evaluate \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --evaluation-config tests/fixtures/evaluation_mini/release.json \
  --gate-config tests/fixtures/evaluation_mini/gate.yaml \
  --baseline-report tests/fixtures/evaluation_mini/baseline_report.json \
  --qa-scores tests/fixtures/evaluation_mini/qa_scores.jsonl \
  --output-root /tmp/s4s-evaluation
```

fixture 명령은 GPU, OpenSearch, embedding server, reader와 유료 API를 호출하지 않습니다. evaluator 설치·출력·gate 재현성 확인에 사용합니다.

## production profile 실행

```bash
struct4search-evaluate \
  --profile configs/production.yaml \
  --evaluation-config <평가 릴리스 JSON> \
  --gate-config configs/evaluation-gate.yaml \
  --baseline-report <기준 report JSON> \
  --qa-scores <QA 점수 JSONL> \
  --output-root /absolute/path/to/evaluation-output
```

이 경로는 profile이 지정한 OpenSearch, embedding과 reader를 실제 사용합니다. 실행 전에 평가 대상 index, endpoint, model ID·revision과 prompt를 확인합니다.

이미 존재하는 run root 아래 표준 위치에 결과를 쓰려면 `--output-root` 대신 다음처럼 사용합니다.

```bash
struct4search-evaluate \
  --run-root /absolute/path/to/run-root \
  --profile configs/production.yaml \
  --evaluation-config <평가 릴리스 JSON> \
  --gate-config configs/evaluation-gate.yaml
```

결과는 `<run-root>/evaluation/final200`에 기록됩니다.

## 결과 파일

| 파일 | 내용 |
|---|---|
| `retrieval_predictions.query_service.jsonl` | 질의별 실제 QueryService 결과 |
| `retrieval_scores_per_query.jsonl` | 질의별 검색 점수 |
| `qa_answers.jsonl` | 질의별 답변과 Citation |
| `EVALUATION_REPORT.json` | 평가 지표 요약 |
| `RELEASE_GATE.json` | gate 판정과 blocker |
| `EVALUATION_RESULTS.json` | CLI 최종 결과 |

CLI exit code는 gate가 `PASS`이면 0, 그 외에는 1입니다. 입력 인자·파일 계약 오류는 argparse exit code 2로 composition 전에 종료됩니다.

## 재현성 기록

결과와 함께 code commit, resolved profile, index 이름, 평가 release, model ID·immutable revision, tokenizer, machine locator의 effective value와 provenance를 보존합니다. 같은 조건에서 검색 결과가 달라지면 먼저 이 receipt와 live OpenSearch pipeline hash를 비교합니다.

지표 의미는 [평가 지표와 검증 방법](metrics.md), 평가셋 구성은 [평가셋 구성](eval200.md), 회귀 판정은 [기준 성능과 회귀 판정](regression-gates.md)을 확인합니다.
