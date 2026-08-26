---
sidebar_position: 2
title: 설치와 첫 실행
---

# 설치와 첫 실행

처음 clone한 환경에서 CPU 검증을 완료한 뒤, 필요한 외부 서비스를 준비해 실제 인덱싱과 검색·답변을 실행하는 순서입니다.

## 설치

Struct4Search는 Python 3.12 이상을 요구합니다. Debian/Ubuntu에서 `venv` 생성이 실패하면 먼저 `python3.12-venv` OS 패키지를 설치합니다. 전체 OS·서비스 요구사항은 Struct4Search 저장소의 `REQUIREMENTS.md`를 확인합니다.

```bash
git clone https://github.com/DLI-Lab/Struct4Search.git
cd Struct4Search
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt
python -m pip check
```

`requirements.txt`는 GPU runtime 없이 CPU 테스트, fixture 평가, API 실행에 필요한 패키지를 설치합니다. production ingest용 패키지는 별도로 설치합니다.

```bash
python -m pip install -e '.[ingest]'
```

## CPU 검증

먼저 외부 모델·GPU·유료 API 없이 설치 상태를 확인합니다.

```bash
python -m pytest -q
```

fixture 평가도 실제 evaluator entrypoint를 사용합니다.

```bash
struct4search-evaluate \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --evaluation-config tests/fixtures/evaluation_mini/release.json \
  --gate-config tests/fixtures/evaluation_mini/gate.yaml \
  --baseline-report tests/fixtures/evaluation_mini/baseline_report.json \
  --qa-scores tests/fixtures/evaluation_mini/qa_scores.jsonl \
  --output-root /tmp/s4s-evaluation
```

성공하면 `/tmp/s4s-evaluation/RELEASE_GATE.json`의 `status`가 `PASS`입니다.

## API 실행

외부 서비스 없이 fixture API를 실제 포트에 띄울 수 있습니다.

```bash
struct4search-api \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --host 127.0.0.1 \
  --port 3100
```

다른 터미널에서 health와 답변 계약을 확인합니다.

```bash
curl --fail http://127.0.0.1:3100/v1/health
curl --fail \
  --header 'Content-Type: application/json' \
  --data '{"query":"안전모 착용 기준은?","query_id":"q001"}' \
  http://127.0.0.1:3100/v1/response
```

종료할 때는 서버 터미널에서 `Ctrl-C`를 누릅니다. 정상 종료 로그가 출력되고 포트가 해제되어야 합니다.

## 운영 환경 확인

```bash
struct4search-env
struct4search-preflight
```

`struct4search-env`는 해석된 경로와 환경값을 출력합니다. `struct4search-preflight`는 GPU, 로컬 모델 snapshot, 서비스와 디스크 등 production 조건이 없으면 non-zero로 종료하는 것이 정상입니다.

인덱싱에 사용하는 주요 외부 서비스는 다음과 같습니다.

| 서비스 | 쓰는 곳 |
|---|---|
| MinerU | 스캔·복합 페이지 파싱 |
| Qwen | Metadata 생성 · KG 구축 · 검색표현 생성 |
| 임베딩 서버 | 색인 벡터와 질의 벡터 생성 |
| OpenSearch | 검색 단위 색인과 Native hybrid RRF 검색 |
| PostgreSQL | KG 저장 |
| Temporal | durable ingest 실행과 재개 |

서비스 정의는 `configs/services/cold-services.yaml`, pipeline 설정은 `configs/production.yaml`에서 확인합니다.

## 실제 문서 인덱싱

세 필수 인자를 모두 지정하고, 기존 산출물과 분리된 새 output 경로를 사용합니다.

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output /absolute/path/to/new-isolated-output \
  --document-id <문서 ID>
```

`--document-id`는 선택 인자이며 여러 번 지정할 수 있습니다. 생략하면 설정된 대상 코퍼스를 처리합니다.

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output /absolute/path/to/new-isolated-output
```

이 경로는 GPU, 모델 snapshot, PostgreSQL, OpenSearch와 Temporal이 필요한 production 실행입니다. `struct4search-smoke-e2e`도 같은 외부 모델·서비스가 필요하며, CPU fixture 검증 명령이 아닙니다.

## 실제 검색·답변 평가

production QueryService를 평가할 때는 `--profile`을 선택하고 평가 자산을 명시합니다. `--run-root`와 `--output-root`는 둘 중 하나만 지정할 수 있습니다.

```bash
struct4search-evaluate \
  --profile configs/production.yaml \
  --evaluation-config <평가 릴리스 JSON> \
  --gate-config configs/evaluation-gate.yaml \
  --output-root /absolute/path/to/evaluation-output
```

production API는 동일한 composition root를 사용합니다.

```bash
struct4search-api \
  --profile configs/production.yaml \
  --host 127.0.0.1 \
  --port 3100
```

실제 profile 실행에는 OpenSearch, embedding, reader 서비스가 준비되어 있어야 합니다. 재개 방법과 단계별 재처리 범위는 [파이프라인 실행 및 재처리 방법](indexing/rerun.md), 전체 CLI 계약은 [실행 명령](reference/cli.md)을 확인합니다.
