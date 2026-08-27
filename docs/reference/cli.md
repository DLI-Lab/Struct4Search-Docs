---
sidebar_position: 2
title: CLI Reference
---

# CLI Reference

설치 후 사용할 수 있는 `struct4search-*` 명령과 각 명령에 필요한 옵션을 정리합니다.

처음 실행하는 경우에는 [설치와 첫 실행](../quickstart.md)을 먼저 진행합니다. 이 페이지에서는 실행하려는 작업에 맞는 명령을 찾고, 해당 명령의 필수 옵션과 실행 예시를 확인할 수 있습니다.

## 공통 실행 조건

- 명령은 저장소 루트에서 실행합니다.
- 공개 `struct4search-*` 명령은 시작할 때 저장소 루트의 `.env`를 읽습니다. 셸에 이미 설정된 값은 덮어쓰지 않습니다.
- `--config`와 `--profile`은 파이프라인과 검색·답변 동작을 정의한 설정 파일입니다.
- `--services`는 모델, OpenSearch와 Temporal 등 외부 서비스를 어떻게 연결할지 정의한 설정 파일입니다.
- 잘못된 옵션 조합이나 존재하지 않는 설정 파일을 지정하면 외부 서비스를 구성하기 전에 실행이 종료됩니다.
- 모든 명령은 `--help`를 지원합니다.

실제 인덱싱과 검색·답변을 실행하려면 설정에 지정된 외부 서비스가 준비되어 있어야 합니다. 필요한 서비스와 실행 조건은 [설치 요구사항](dependencies.md)에서 확인합니다.

## 어떤 명령을 선택할까

| 하려는 일 | 명령 |
|---|---|
| 설치된 Python·경로 확인 | `struct4search-env` |
| GPU·포트·디스크·OpenSearch 사전조건 확인 | `struct4search-preflight` |
| 문서 전체 인덱싱 | `struct4search-ingest` |
| 저장된 검색 결과로 답변 API 확인 | `struct4search-api --fixture-results ...` |
| 실제 검색·LLM으로 답변 생성 | `struct4search-api --profile ...` |
| 검색·답변 결과 평가 | `struct4search-evaluate` |
| 제품 화면 전체 실행 | `struct4search-stack ... up` |
| 한 문서 production E2E | `struct4search-smoke-e2e` |

파싱, NER, Metadata, KG, 검색표현, 인덱싱을 각각 직접 실행하는 공개 CLI는 없습니다. 이 단계들은 같은 profile과 receipt를 공유해야 하므로 `struct4search-ingest`가 순서와 재시작을 관리합니다. `struct4search-ingest-front`와 worker 명령은 장애 진단·운영 분리를 위한 entrypoint입니다.

## 환경과 서비스

| 명령 | 사용법 | 하는 일 |
|---|---|---|
| `struct4search-env` | `struct4search-env [--shell]` | 선택된 Python과 import path를 출력합니다. `--shell`은 적용하지 않고 `export` 문만 출력합니다. |
| `struct4search-preflight` | `struct4search-preflight` | GPU process 소유권, 필수 포트, 고아 process, 디스크와 OpenSearch 차단 상태를 검사합니다. |
| `struct4search-bootstrap` | `struct4search-bootstrap (--profile PROFILE \| --stack STACK) [--check]` | profile의 Native RRF 검색 pipeline을 생성하거나 `--check`로 읽기 전용 검증합니다. |
| `struct4search-stack` | `struct4search-stack --stack STACK {api\|document\|chatkit\|ui\|up}` | API, 문서 조회 backend, ChatKit adapter, React UI 중 하나 또는 전부를 실행합니다. |

`struct4search-preflight`가 non-zero이면 메시지에 나온 조건을 해결한 뒤 인덱싱을 시작합니다. `struct4search-bootstrap --check`는 OpenSearch를 변경하지 않습니다.

## 질의와 답변

### `struct4search-api`

```text
struct4search-api [--host HOST] [--port PORT] [--log-level LEVEL]
                  (--profile PROFILE | --fixture-results RESULTS.jsonl)
```

| 인자 | 의미 |
|---|---|
| `--profile` | OpenSearch, embedding service와 reader를 조립해 실제 검색·답변 경로를 실행합니다. |
| `--fixture-results` | 저장소의 검색 결과를 읽어 외부 서비스 없이 API 계약을 확인합니다. 모델을 호출하지 않습니다. |
| `--host` | listen 주소. 기본값 `127.0.0.1` |
| `--port` | listen 포트. 기본값 `3100`, 허용 범위 `1..65535` |
| `--log-level` | `critical`, `error`, `warning`, `info`, `debug`, `trace` 중 하나 |

한 번의 답변을 반환하는 별도 CLI는 없습니다. 서버를 실행한 뒤 `/v1/response`를 호출합니다.

```bash
struct4search-api \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --host 127.0.0.1 \
  --port 3100
```

다른 터미널에서 다음 요청을 보냅니다.

```bash
curl --fail \
  --header 'Content-Type: application/json' \
  --data '{"query":"안전모를 착용한다.","query_id":"q001"}' \
  http://127.0.0.1:3100/v1/response
```

응답의 `answer`가 비어 있지 않고 `citations`에 근거가 있으면 답변 경로가 정상입니다. 실제 검색과 모델 호출을 확인할 때는 첫 명령의 `--fixture-results ...`를 `--profile configs/production.yaml`로 바꿉니다. 두 옵션은 함께 사용할 수 없습니다.

### `struct4search-restored-snapshot-api`

```text
struct4search-restored-snapshot-api [--profile PROFILE] [--host HOST] [--port PORT]
```

복원한 OpenSearch snapshot을 수정하지 않고 검색·답변 API로 제공합니다. 기본 profile은 `configs/mac-dump-gpt.yaml`, 기본 포트는 `8289`입니다. 원본 PDF·IDR artifact가 없는 snapshot에서는 원문 파일 조회가 `503`일 수 있습니다.

### `struct4search-evaluate`

```text
struct4search-evaluate
  (--run-root RUN_ROOT | --output-root OUTPUT_ROOT)
  (--profile PROFILE | --fixture-results RESULTS.jsonl)
  --evaluation-config EVALUATION.json
  --gate-config GATE.yaml
  [--baseline-report BASELINE.json]
  [--qa-scores QA.jsonl]
```

`--profile`은 실제 QueryService로 질의별 검색과 답변을 실행합니다. `--fixture-results`는 저장된 결과만 평가합니다. `--run-root`는 기존 실행을 평가할 때, `--output-root`는 새 평가 결과를 쓸 때 사용합니다.

## 문서 인덱싱 pipeline

### 일반 실행

| 명령 | 사용법 | 범위 |
|---|---|---|
| `struct4search-ingest` | `struct4search-ingest --config CONFIG --services SERVICES --output OUTPUT [--document-id ID ...]` | Temporal과 모델·검색 서비스를 관리하며 파싱부터 인덱싱까지 전체 pipeline을 실행합니다. |
| `struct4search-ingest` | `struct4search-ingest --stack STACK --output OUTPUT [--document-id ID ...]` | local stack 파일에서 profile과 service 설정을 함께 선택합니다. `--config`, `--services`와 같이 쓸 수 없습니다. |

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output /absolute/path/to/new-output \
  --document-id <문서_ID>
```

이 명령이 실행하는 흐름은 문서 파싱 → Canonical IDR → 청킹 → NER → Metadata → KG → 검색표현 → OpenSearch 인덱싱입니다. PostgreSQL, OpenSearch, Temporal, 모델 snapshot과 GPU가 준비되어야 합니다.

### Worker와 복구용 명령

| 명령 | 사용법 | 용도 |
|---|---|---|
| `struct4search-ingest-front` | `struct4search-ingest-front --config CONFIG --output OUTPUT [--resume] [--document-id ID ...]` | 파싱부터 Metadata까지의 front graph만 실행합니다. |
| `struct4search-ingest-worker` | `struct4search-ingest-worker --config CONFIG --output OUTPUT [--resume] [--document-id ID ...]` | 조립된 ingest service를 worker process에서 실행합니다. Temporal profile은 직접 호출하지 않고 Temporal activity가 사용합니다. |
| `struct4search-temporal` | `struct4search-temporal {worker\|start\|all} --config CONFIG [--output OUTPUT] [--document-id ID ...]` | `worker`는 task queue 대기, `start`는 workflow 시작, `all`은 두 역할을 한 process에서 실행합니다. `start`와 `all`에는 `--output`이 필수입니다. |
| `struct4search-watchdog` | `struct4search-watchdog --config CONFIG OUTPUT [INGEST_ARGS ...]` | supervisor를 감시하고 종료·재시작 시 기존 ingest 인자를 그대로 전달합니다. |

`--resume`은 같은 config·output의 receipt를 읽어 완료된 작업을 재사용합니다. 다른 config나 다른 데이터에 이전 output을 재사용하는 옵션이 아닙니다.

## PostgreSQL 동기화

| 명령 | 사용법 | 하는 일 |
|---|---|---|
| `struct4search-document-catalog-sync` | `struct4search-document-catalog-sync --output OUTPUT [--dsn-env S4S_DOCUMENT_DSN]` | 완료된 Canonical IDR와 Metadata를 문서 DB에 동기화합니다. |
| `struct4search-kg-sync` | `struct4search-kg-sync --output OUTPUT [--run-id ID] [--dsn-env S4S_KG_DSN] [--schema s4s_kg] [--follow] [--interval-seconds 20]` | 문서별 KG artifact를 PostgreSQL에 idempotent하게 반영합니다. `--follow`는 실행 완료까지 새 receipt를 계속 확인합니다. |

두 명령은 지정한 환경변수에서 PostgreSQL DSN을 읽습니다. `struct4search-kg-sync`는 `run_config.json`에 run ID가 없으면 `--run-id`가 필요합니다.

## 평가와 release gate

| 명령 | 범위 | 필요한 것 |
|---|---|---|
| `struct4search-smoke-e2e` | 문서 1건의 격리 production E2E. `--repository-root ROOT` 지원 | 승인된 시험 문서와 기준 자료, GPU, 모델, 임시 PostgreSQL·OpenSearch |
| `struct4search-five-document-e2e` | 문서 5건 E2E. `--repository-root ROOT` 지원 | 동일 |
| `struct4search-final-100-100-e2e` | 문서 100건·질의 100건 gate. `--repository-root ROOT` 지원 | 전체 서비스와 기준 artifact |
| `struct4search-final-full-2567-200-e2e` | 문서 2,567건·질의 200건 최종 gate. `--repository-root ROOT` 지원 | 전체 corpus와 immutable 기준 artifact |

editable checkout에서는 `--repository-root`를 생략합니다. 설치된 wheel을 checkout 밖에서 실행할 때만 명시하거나 `S4S_REPOSITORY_ROOT`를 설정합니다.

## CLI 자체 확인

모든 공개 entrypoint가 설치됐는지는 다음처럼 확인합니다.

```bash
python -m pip check
struct4search-env --help
struct4search-ingest --help
struct4search-api --help
struct4search-evaluate --help
python -m pytest -q
```

환경별 설치와 답변까지의 순서는 [설치와 첫 실행](../quickstart.md), API 요청과 결과 구조는 [API Reference](api-reference.md)에서 이어집니다.
