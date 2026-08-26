---
sidebar_position: 1
title: 테스트와 평가 시작하기
---

# 테스트와 평가 시작하기

먼저 CPU에서 재현 가능한 테스트를 실행하고, 외부 서비스를 준비한 경우에만 integration과 운영 E2E를 실행합니다.

## 먼저 실행할 것

| 목적 | 명령 | GPU·유료 API |
|---|---|---|
| 코드·설정 확인 | `python -m pytest -q` | 불필요 |
| evaluator 확인 | 예제 검색 결과 파일 평가 명령 | 불필요 |
| API 확인 | 예제 검색 결과 파일 API 명령 | 불필요 |
| PostgreSQL·OpenSearch 연동 | 격리한 임시 서비스로 integration test | 불필요 |
| 전체 운영 경로 | `struct4search-smoke-e2e` | 필요 |

## CPU 테스트

```bash
python -m pytest -q
```

이 명령은 코드, profile, prompt, API와 evaluator의 offline 계약을 확인합니다. 외부 서비스를 사용하는 integration test는 준비된 임시 서비스나 artifact가 있을 때만 실행합니다.

## 예제 검색 결과 파일로 평가 확인

```bash
struct4search-evaluate \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --evaluation-config tests/fixtures/evaluation_mini/release.json \
  --gate-config tests/fixtures/evaluation_mini/gate.yaml \
  --baseline-report tests/fixtures/evaluation_mini/baseline_report.json \
  --qa-scores tests/fixtures/evaluation_mini/qa_scores.jsonl \
  --output-root /tmp/struct4search-evaluation
```

`--fixture-results`는 저장소에 포함된 예제 검색 결과 파일을 지정합니다. 이 명령은 evaluator의 실제 output과 release gate를 확인하며, OpenSearch·embedding·reader를 호출하지 않습니다.

## 예제 검색 결과 파일로 API 확인

```bash
struct4search-api \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --host 127.0.0.1 \
  --port 3100
```

다른 터미널에서 `/v1/health`, `/v1/response`를 확인합니다. API 경로와 예시는 [API 실행과 경로](../reference/api-reference.md)에 있습니다.

## 운영 E2E

```bash
struct4search-smoke-e2e
```

이 명령은 고정 문서로 실제 ingest·검색·답변 경로를 확인합니다. GPU, model snapshot, PostgreSQL, OpenSearch, Temporal과 필요한 모델 서비스가 준비된 환경에서만 실행합니다.

평가셋 실행과 결과 해석은 [검색과 QA 평가 실행](retrieval-qa.md), 변경별 최소 테스트는 [테스트 범위](test-levels.md)에서 확인합니다.
