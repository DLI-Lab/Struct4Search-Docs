---
sidebar_position: 1
title: 테스트 구성과 실행
---

# 테스트 구성과 실행

검증 경로는 CPU 자동 테스트, 격리 서비스 integration, production E2E로 구분합니다.

| 구분 | 확인하는 것 | GPU·유료 API | 외부 서비스 |
|---|---|---|---|
| 전체 pytest | 코드·설정·offline contract | 없음 | 기본적으로 없음 |
| fixture evaluator/API | 실제 entrypoint와 composition | 없음 | 없음 |
| PostgreSQL/OpenSearch integration | 실제 저장·Native RRF | 없음 | 격리 instance 필요 |
| production E2E | 모델 포함 전체 pipeline | GPU 필요 | 모두 필요 |

## 전체 비GPU 테스트

```bash
python -m pytest -q
```

테스트 collection의 integration case는 명시적으로 준비된 임시 서비스나 immutable fixture가 있을 때만 실행합니다. 외부 GPT API를 실제로 호출하지 않고 mock/offline contract로 검증합니다.

## fixture evaluator

```bash
struct4search-evaluate \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --evaluation-config tests/fixtures/evaluation_mini/release.json \
  --gate-config tests/fixtures/evaluation_mini/gate.yaml \
  --baseline-report tests/fixtures/evaluation_mini/baseline_report.json \
  --qa-scores tests/fixtures/evaluation_mini/qa_scores.jsonl \
  --output-root /tmp/s4s-evaluation
```

이 명령은 외부 모델·OpenSearch 없이 evaluator의 실제 파일 출력과 release gate를 검증합니다.

## fixture API

```bash
struct4search-api \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --host 127.0.0.1 \
  --port 3100
```

`GET /v1/health`, `POST /v1/response`, SIGINT graceful shutdown과 포트 해제를 확인합니다.

## production E2E

```bash
struct4search-smoke-e2e
```

이 명령은 고정 문서 한 건으로 production 경로를 실행합니다. GPU, local model snapshot, PostgreSQL, OpenSearch, Temporal과 모델 서비스가 필요합니다. CPU 설치 확인 명령으로 사용하지 않습니다.

실제 평가셋 E2E는 `struct4search-evaluate --profile configs/production.yaml ...`을 사용합니다. 평가 자산·gate·output 인자를 반드시 명시하며, 자세한 계약은 [검색과 QA 평가 실행](retrieval-qa.md)을 확인합니다.

## 변경별 최소 검증

| 바꾼 것 | pytest | fixture entrypoint | production E2E |
|---|---|---|---|
| 설정 schema·composition | 필수 | 필수 | 영향 시 필수 |
| 서비스 주소·모델·prompt | 필수 | offline contract | 필수 |
| 파싱·청킹·NER·KG | 필수 | — | 필수 |
| 검색·RRF·Context | 필수 | 필수 | 평가셋 필수 |
| API transport | 필수 | 실제 listening 필수 | 필요 시 필수 |

모듈 테스트 통과만으로 검색·답변 품질이 보장되지는 않습니다. 성능 변경은 동일 index·평가 release·model revision을 기록한 production 평가로 별도 판정합니다.
