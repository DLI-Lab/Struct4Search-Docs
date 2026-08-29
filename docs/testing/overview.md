---
sidebar_position: 1
title: 테스트와 평가
---

# 테스트와 평가

Struct4Search가 실제 문서를 처리하고 질문에 답할 수 있는지 확인하는 방법을 설명합니다. 실제 서버에서는 문서 입력부터 답변까지 확인하는 E2E 평가를 실행합니다. GPU나 외부 서비스가 없는 개발 환경에서는 CPU 테스트와 저장소의 예제 파일로 코드·설정·API가 깨지지 않았는지 확인할 수 있습니다.

## E2E 평가

End-to-end(E2E) 평가는 문서를 새로 인덱싱한 뒤 검색과 답변까지 실제 구성으로 실행합니다. 모델, PostgreSQL, OpenSearch, Temporal을 포함한 전체 연결을 확인하거나 검색·답변 품질이 이전보다 나빠지지 않았는지 확인할 때 사용합니다.

| 실행 범위 | 확인하는 것 | 명령 |
|---|---|---|
| 문서 한 건 | 인덱싱·검색·답변 서비스가 서로 연결되는지 | `struct4search-smoke-e2e` |
| 100문서 평가셋 | 변경한 코드와 설정으로 검색·답변 품질이 크게 달라지지 않았는지 | `struct4search-final-100-100-e2e` |
| 전체 문서 평가셋 | 전체 2,567문서에서 최종 성능과 회귀 여부 | `struct4search-final-full-2567-200-e2e` |

```bash
# 문서 한 건으로 전체 연결 확인
struct4search-smoke-e2e

# 100문서·100질의 평가
struct4search-final-100-100-e2e

# 전체 2,567문서·200질의 평가
struct4search-final-full-2567-200-e2e
```

문서 한 건 실행은 서비스 연결만 확인하며 성능을 판단하지 않습니다. 검색·답변 품질을 비교하려면 [평가셋](eval200.md)에 설명된 100문서 평가셋이나 전체 문서 평가셋을 사용합니다.

## CPU 테스트

CPU 테스트는 GPU 모델과 외부 서비스를 실행하지 않고 Python 코드, 설정 파일, 모듈 연결, API와 evaluator의 입력·출력 형식을 검사합니다. E2E보다 빠르기 때문에 코드를 수정한 뒤 기본 기능이 깨졌는지 먼저 찾는 데 사용하며, 실제 검색이나 답변 품질은 평가하지 않습니다.

저장소 루트에서 전체 테스트를 실행합니다.

```bash
python -m pytest -q
```

특정 영역만 확인할 때는 다음 경로를 사용합니다.

```bash
python -m pytest -q tests/unit/query
python -m pytest -q tests/unit/ingest
python -m pytest -q tests/unit/config
python -m pytest -q tests/test_config_contracts.py
```

PostgreSQL이나 외부 평가 자료가 필요한 테스트는 해당 환경이 없으면 건너뜁니다.

## 설치 확인용 evaluator와 API

다음 명령은 저장소에 포함된 예제 검색 결과를 사용합니다. CLI와 API가 설치되어 실행되는지는 확인할 수 있지만 실제 모델, OpenSearch 또는 검색·답변 품질은 확인하지 않습니다.

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

API를 실행한 뒤 다른 터미널에서 `/health/ready`와 `/v1/responses`를 확인합니다. 요청 형식은 [API Reference](../reference/api-reference.md)에 있습니다.

## 변경한 부분에 따른 실행 범위

| 변경한 부분 | CPU 테스트 | 문서 한 건 E2E | 평가셋 E2E |
|---|---:|---:|---:|
| 설정 스키마·계약 | 필수 | — | — |
| 서비스 주소·모델 | 필수 | 필수 | 필수 |
| 파싱·청킹·NER·KG | 필수 | 필수 | 필수 |
| Metadata·검색표현 프롬프트 | 필수 | 필수 | 필수 |
| 검색 파라미터·점수 통합 | 필수 | — | 필수 |
| Context·답변 프롬프트 | 필수 | — | 필수 |
| 동시성·서비스 기동 | 필수 | 필수 | — |

평가셋을 실제 시스템으로 실행하고 결과를 판정하는 방법은 [평가 실행과 통과 판정](retrieval-qa.md)에 있습니다.
