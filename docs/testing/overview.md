---
sidebar_position: 1
title: 테스트와 평가
---

# 테스트와 평가

변경 범위에 맞는 검증부터 실행합니다. 외부 서비스가 필요 없는 테스트를 먼저 실행하고, 인덱싱·검색·답변 경로를 바꾼 경우에만 해당 E2E를 이어서 실행합니다.

## 검증 단계

| 확인할 것 | 명령 | 필요한 환경 |
|---|---|---|
| 코드와 설정 계약 | `python -m pytest -q` | CPU |
| evaluator와 API 계약 | 저장소의 예제 파일을 사용하는 명령 | CPU |
| 문서 한 건의 전체 연결 | `struct4search-smoke-e2e` | GPU, 모델, PostgreSQL, OpenSearch, Temporal |
| 고정 100문서·100질의 | `struct4search-final-100-100-e2e` | GPU, 모델, 외부 평가 자산과 서비스 |
| 전체 2,567문서·200질의 | `struct4search-final-full-2567-200-e2e` | GPU, 모델, 외부 평가 자산과 서비스 |

## CPU 테스트

저장소 루트에서 전체 테스트를 실행합니다.

```bash
python -m pytest -q
```

외부 서비스나 별도 평가 자산이 필요한 테스트는 해당 환경변수와 자산이 없으면 건너뜁니다. 특정 영역만 확인할 때는 다음 경로를 사용합니다.

```bash
python -m pytest -q tests/unit/query
python -m pytest -q tests/unit/ingest
python -m pytest -q tests/unit/config
python -m pytest -q tests/test_config_contracts.py
```

## evaluator와 API 확인

다음 명령은 저장소에 포함된 예제 검색 결과를 사용하므로 GPU, OpenSearch, embedding, reader, 유료 API가 필요하지 않습니다.

```bash
struct4search-evaluate \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --evaluation-config tests/fixtures/evaluation_mini/release.json \
  --gate-config tests/fixtures/evaluation_mini/gate.yaml \
  --baseline-report tests/fixtures/evaluation_mini/baseline_report.json \
  --qa-scores tests/fixtures/evaluation_mini/qa_scores.jsonl \
  --output-root /tmp/struct4search-evaluation
```

```bash
struct4search-api \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --host 127.0.0.1 \
  --port 3100
```

API를 실행한 뒤 다른 터미널에서 `/v1/health`와 `/v1/response`를 확인합니다. 요청 형식은 [API Reference](../reference/api-reference.md)에 있습니다.

## E2E 실행

서비스와 모델을 준비한 뒤 필요한 규모의 명령을 실행합니다.

```bash
# 문서 한 건으로 전체 연결 확인
struct4search-smoke-e2e

# 고정 100문서·100질의 실행
struct4search-final-100-100-e2e

# 전체 2,567문서·200질의 실행
struct4search-final-full-2567-200-e2e
```

평가 자산과 각 명령의 용도는 [평가셋과 릴리스](eval200.md), evaluator 실행 결과와 통과 판정은 [평가 실행과 통과 판정](retrieval-qa.md)에서 확인합니다.

## 변경별 최소 검증

| 변경한 부분 | CPU 테스트 | 문서 한 건 E2E | 평가셋 E2E |
|---|---:|---:|---:|
| 설정 스키마·계약 | 필수 | — | — |
| 서비스 주소·모델 | 필수 | 필수 | 필수 |
| 파싱·청킹·NER·KG | 필수 | 필수 | 필수 |
| Metadata·검색표현 프롬프트 | 필수 | 필수 | 필수 |
| 검색 파라미터·점수 통합 | 필수 | — | 필수 |
| Context·답변 프롬프트 | 필수 | — | 필수 |
| 동시성·서비스 기동 | 필수 | 필수 | — |

CPU 테스트는 코드 계약을 확인할 뿐 검색이나 답변 품질을 판단하지 않습니다. 검색 또는 답변 결과가 달라지는 변경에는 평가셋 E2E를 포함합니다.
