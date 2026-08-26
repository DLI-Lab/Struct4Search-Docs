---
sidebar_position: 2
title: 설치와 첫 실행
---

# 설치와 첫 실행

처음 clone한 개발자가 CPU 환경에서 설치와 기본 동작을 확인하는 순서입니다. 실제 문서 인덱싱은 GPU와 외부 서비스를 준비한 뒤 실행합니다.

## 1. 설치

Struct4Search는 Python 3.12 이상을 사용합니다. 아래 설치는 CPU 테스트와 외부 서비스 없이 API를 확인하는 데 필요한 패키지를 함께 설치합니다.

```bash
git clone https://github.com/DLI-Lab/Struct4Search.git
cd Struct4Search
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -e '.[test,api]'
python -m pip check
```

문서 인덱싱까지 실행할 서버에는 다음 옵션 패키지를 추가합니다.

```bash
python -m pip install -e '.[ingest]'
```

MinerU·Qwen을 이 서버에서 직접 실행하는 경우에는 NVIDIA/Linux 환경에서만 `requirements-gpu.txt`도 설치합니다. 전체 요구사항은 [설치 요구사항](reference/dependencies.md)에서 확인합니다.

## 2. CPU 환경 확인

외부 모델·GPU·유료 API 없이 전체 테스트를 실행합니다.

```bash
python -m pytest -q
```

평가 명령도 저장소에 포함된 예제 검색 결과 파일을 사용하면 같은 조건에서 실행할 수 있습니다. `--fixture-results`는 이 파일을 지정하는 옵션입니다.

```bash
struct4search-evaluate \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --evaluation-config tests/fixtures/evaluation_mini/release.json \
  --gate-config tests/fixtures/evaluation_mini/gate.yaml \
  --baseline-report tests/fixtures/evaluation_mini/baseline_report.json \
  --qa-scores tests/fixtures/evaluation_mini/qa_scores.jsonl \
  --output-root /tmp/struct4search-evaluation
```

성공하면 출력 경로의 `RELEASE_GATE.json`에 `"status": "PASS"`가 기록됩니다.

## 3. API 확인

다음 명령은 저장소에 포함된 예제 검색 결과 파일을 사용해 API를 로컬 포트에 띄웁니다.

```bash
struct4search-api \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --host 127.0.0.1 \
  --port 3100
```

다른 터미널에서 상태와 응답을 확인합니다.

```bash
curl --fail http://127.0.0.1:3100/v1/health
curl --fail \
  --header 'Content-Type: application/json' \
  --data '{"query":"안전모를 착용한다.","query_id":"q001"}' \
  http://127.0.0.1:3100/v1/response
```

서버는 실행한 터미널에서 `Ctrl-C`로 종료합니다.

## 4. 실제 문서 인덱싱

실제 인덱싱은 PostgreSQL, OpenSearch, Temporal, 모델·임베딩·파싱 서비스가 준비된 환경에서 실행합니다. 기존 산출물과 분리된 새 output 경로를 사용합니다.

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output /absolute/path/to/new-output \
  --document-id <문서_ID>
```

`--document-id`는 여러 번 지정할 수 있으며, 생략하면 profile에 정의된 전체 대상 문서를 처리합니다. 실행 환경과 서비스 조건은 먼저 `struct4search-env`, `struct4search-preflight`로 확인합니다.

명령별 전체 인자와 평가 실행은 [실행 명령](reference/cli.md), [검색과 QA 평가 실행](testing/retrieval-qa.md)에서 확인합니다.
