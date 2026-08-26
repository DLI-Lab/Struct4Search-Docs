---
sidebar_position: 9
title: 실행 명령
---

# 실행 명령

처음 설치한 개발자가 자주 사용하는 명령만 정리합니다. 모든 명령은 패키지를 설치한 뒤 사용할 수 있습니다.

```bash
python -m pip install -e '.[test,api]'
```

## 환경 확인

```bash
struct4search-env
struct4search-env --shell
struct4search-preflight
```

`struct4search-env --shell`은 현재 셸을 바꾸지 않고 `export` 문을 출력합니다. `struct4search-preflight`는 GPU·서비스 등 production 조건이 준비되지 않은 환경에서는 non-zero로 끝날 수 있습니다.

## 문서 인덱싱

운영 프로파일을 직접 지정할 때는 `--config`와 `--services`를 함께 전달합니다.

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output /absolute/path/to/new-output
```

| 인자 | 설명 |
|---|---|
| `--output` | 필수. 새 실행의 산출물 경로 |
| `--config` · `--services` | `--stack`을 사용하지 않을 때 함께 필수인 운영 프로파일과 서비스 정의 |
| `--stack` | local stack 설정 파일. `--config`, `--services`와 함께 사용할 수 없음 |
| `--document-id` | 선택. 여러 번 지정할 수 있으며, 생략하면 profile의 전체 대상 문서를 처리 |

이 명령은 운영 인덱싱이므로 PostgreSQL, OpenSearch, Temporal과 모델·임베딩·파싱 서비스가 필요합니다.

## 평가

CPU 환경에서는 검증용 fixture 평가를 사용합니다.

```bash
struct4search-evaluate \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --evaluation-config tests/fixtures/evaluation_mini/release.json \
  --gate-config tests/fixtures/evaluation_mini/gate.yaml \
  --baseline-report tests/fixtures/evaluation_mini/baseline_report.json \
  --qa-scores tests/fixtures/evaluation_mini/qa_scores.jsonl \
  --output-root /tmp/struct4search-evaluation
```

`--run-root` 또는 `--output-root` 중 하나와, `--profile` 또는 `--fixture-results` 중 하나를 각각 선택해야 합니다. 운영 평가에서는 `--fixture-results` 대신 `--profile configs/production.yaml`을 사용합니다.

## API 서버

검증용 fixture API는 외부 서비스 없이 실행할 수 있습니다.

```bash
struct4search-api \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --host 127.0.0.1 \
  --port 3100
```

`--profile configs/production.yaml`은 실제 OpenSearch·embedding·reader를 사용하는 운영 API를 구성합니다. `--profile`과 `--fixture-results`는 함께 사용할 수 없습니다. `--port`는 1부터 65535까지 지정할 수 있습니다.

## 운영 전용 명령

| 명령 | 용도 |
|---|---|
| `struct4search-bootstrap (--profile <profile> \| --stack <stack>) [--check]` | profile의 Native RRF 준비 상태 확인 또는 생성 |
| `struct4search-stack --stack <stack> {api\|document\|chatkit\|ui\|up}` | local stack 실행 |
| `struct4search-smoke-e2e [--repository-root <checkout>]` | 승인된 문서 한 건 production E2E |
| `struct4search-five-document-e2e [--repository-root <checkout>]` | 승인된 5문서 E2E |
| `struct4search-final-100-100-e2e [--repository-root <checkout>]` | 승인된 100문서·100질의 E2E |
| `struct4search-final-full-2567-200-e2e [--repository-root <checkout>]` | 승인된 2,567문서·200질의 E2E |

이 명령들은 준비된 서비스와 artifact를 전제로 합니다. 일반 개발 환경에서는 먼저 `python -m pytest -q`, fixture 평가, fixture API를 실행합니다.

## 테스트

```bash
python -m pytest -q
```

테스트 범위와 production E2E의 조건은 [테스트와 평가](../testing/overview.md)에서 확인합니다.
