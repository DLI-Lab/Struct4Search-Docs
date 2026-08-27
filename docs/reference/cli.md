---
sidebar_position: 2
title: CLI Reference
---

# CLI Reference

Struct4Search에서 제공하는 `struct4search-*` 명령의 실행 형식, 필수 옵션과 용도를 정리합니다.

처음 설치한 환경에서는 [설치와 첫 실행](../quickstart.md)을 먼저 진행합니다. 각 명령이 지원하는 전체 옵션은 `--help`에서 확인할 수 있습니다.

## 실행 전제 조건

* 명령은 저장소 루트에서 실행합니다.
* 공개 `struct4search-*` 명령은 시작할 때 저장소 루트의 `.env`를 읽습니다. 셸에 이미 설정된 값은 덮어쓰지 않습니다.
* `--config`와 `--profile`은 파이프라인과 검색·답변 설정을 지정합니다.
* `--services`는 모델, OpenSearch, Temporal 등 외부 서비스의 연결과 실행 설정을 지정합니다.
* 잘못된 옵션 조합이나 존재하지 않는 설정 파일을 지정하면 외부 서비스를 구성하기 전에 실행이 종료됩니다.
* 모든 명령은 `--help`를 지원합니다.

실제 인덱싱과 검색·답변을 실행하려면 설정에 지정된 외부 서비스가 준비되어 있어야 합니다. 필요한 서비스와 실행 조건은 [설치 요구사항](dependencies.md)에서 확인합니다.

## 주요 명령

| 용도                                | 명령                                        |
| --------------------------------- | ----------------------------------------- |
| Python 실행 환경과 import 경로 확인        | `struct4search-env`                       |
| GPU·포트·디스크·OpenSearch 사전조건 검사     | `struct4search-preflight`                 |
| OpenSearch Native RRF 검색 파이프라인 구성 | `struct4search-bootstrap`                 |
| 문서 인덱싱                            | `struct4search-ingest`                    |
| 외부 서비스 없이 답변 API 계약 확인            | `struct4search-api --fixture-results ...` |
| 실제 검색·답변 API 실행                   | `struct4search-api --profile ...`         |
| 검색·답변 결과 평가                       | `struct4search-evaluate`                  |
| API·문서 조회·ChatKit·UI 일괄 실행        | `struct4search-stack ... up`              |
| 문서 1건 프로덕션 E2E 검증                 | `struct4search-smoke-e2e`                 |

문서 인덱싱 단계별 공개 CLI는 제공하지 않습니다. 일반적인 인덱싱은 `struct4search-ingest`로 실행하며, 워커를 분리하거나 운영 중인 실행을 복구할 때만 별도의 인덱싱 운영 명령을 사용합니다.

## 환경 확인 및 서비스 실행

| 명령                        | 실행 형식                                                                    | 설명                                                                                     |
| ------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `struct4search-env`       | `struct4search-env [--shell]`                                            | 현재 선택된 Python과 import 경로를 출력합니다. `--shell`을 지정하면 환경을 직접 변경하지 않고 적용할 `export` 문을 출력합니다. |
| `struct4search-preflight` | `struct4search-preflight`                                                | GPU 프로세스 소유권, 필수 포트, 고아 프로세스, 디스크와 OpenSearch 차단 상태를 검사합니다.                            |
| `struct4search-bootstrap` | `struct4search-bootstrap (--profile PROFILE \| --stack STACK) [--check]` | 프로파일에 정의된 OpenSearch Native RRF 검색 파이프라인을 생성합니다. `--check`를 지정하면 변경하지 않고 현재 상태만 확인합니다. |
| `struct4search-stack`     | `struct4search-stack --stack STACK {api\|document\|chatkit\|ui\|up}`     | API, 문서 조회 백엔드, ChatKit adapter, React UI 중 하나를 선택하거나 `up`으로 전체 서비스를 실행합니다.            |

`struct4search-preflight`가 0이 아닌 종료 코드를 반환하면 출력된 조건을 해결한 뒤 인덱싱을 시작합니다. `struct4search-bootstrap --check`는 OpenSearch 구성을 변경하지 않습니다.

## 검색·답변 API 실행

### `struct4search-api`

```text
struct4search-api [--host HOST] [--port PORT] [--log-level LEVEL]
                  (--profile PROFILE | --fixture-results RESULTS.jsonl)
```

| 인자                  | 설명                                                                    |
| ------------------- | --------------------------------------------------------------------- |
| `--profile`         | OpenSearch, 임베딩 서비스와 Reader를 연결해 실제 검색·답변 경로를 실행합니다.                  |
| `--fixture-results` | 저장된 검색 결과를 사용해 외부 서비스 없이 API 계약을 확인합니다. 모델은 호출하지 않습니다.                |
| `--host`            | 서버 바인딩 주소. 기본값은 `127.0.0.1`입니다.                                       |
| `--port`            | 서버 바인딩 포트. 기본값은 `3100`이며, `1..65535` 범위에서 지정할 수 있습니다.                 |
| `--log-level`       | `critical`, `error`, `warning`, `info`, `debug`, `trace` 중 하나를 지정합니다. |

한 번의 답변만 반환하는 별도 CLI는 없습니다. API 서버를 실행한 뒤 `/v1/response`를 호출합니다.

외부 서비스 없이 API 동작을 확인하려면 다음과 같이 실행합니다.

```bash
struct4search-api \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --host 127.0.0.1 \
  --port 3100
```

다른 터미널에서 요청을 보냅니다.

```bash
curl --fail \
  --header 'Content-Type: application/json' \
  --data '{"query":"안전모는 언제 착용해야 하나요?","query_id":"q001"}' \
  http://127.0.0.1:3100/v1/response
```

응답의 `answer`가 비어 있지 않고 `citations`에 원문 근거가 있으면 답변 경로가 정상입니다.

실제 OpenSearch 검색과 모델 호출을 확인하려면 `--fixture-results` 대신 프로덕션 프로파일을 지정합니다.

```bash
struct4search-api \
  --profile configs/production.yaml \
  --host 127.0.0.1 \
  --port 3100
```

`--profile`과 `--fixture-results`는 함께 사용할 수 없습니다.

### `struct4search-restored-snapshot-api`

```text
struct4search-restored-snapshot-api [--profile PROFILE] [--host HOST] [--port PORT]
```

복원한 OpenSearch snapshot을 변경하지 않고 검색·답변 API로 제공합니다.

기본 프로파일은 `configs/mac-dump-gpt.yaml`, 기본 포트는 `8289`입니다. 원본 PDF나 IDR 산출물이 없는 snapshot에서는 원문 파일 조회 요청이 `503`을 반환할 수 있습니다.

## 검색·답변 평가

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

`--profile`을 지정하면 실제 QueryService를 통해 검색과 답변을 실행한 뒤 평가합니다. `--fixture-results`를 지정하면 저장된 결과만 평가하며 외부 검색·답변 서비스를 호출하지 않습니다.

`--run-root`는 기존 실행 결과를 평가할 때 사용하고, `--output-root`는 새로운 평가 결과를 저장할 때 사용합니다.

## 문서 인덱싱 실행

### `struct4search-ingest`

다음 두 실행 방식 중 하나를 사용합니다.

```text
struct4search-ingest
  --config CONFIG
  --services SERVICES
  --output OUTPUT
  [--document-id ID ...]
```

```text
struct4search-ingest
  --stack STACK
  --output OUTPUT
  [--document-id ID ...]
```

프로덕션 설정으로 실행할 때는 `--config`와 `--services`를 함께 지정합니다. 로컬 스택 설정을 사용할 때는 두 옵션 대신 `--stack`을 지정합니다.

`--stack`은 `--config`, `--services`와 함께 사용할 수 없습니다.

특정 문서만 인덱싱하려면 `--document-id`를 지정합니다. 여러 문서를 처리할 때는 옵션을 반복해서 지정하며, 생략하면 프로파일에 포함된 전체 문서를 처리합니다.

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output /absolute/path/to/new-output \
  --document-id <문서_ID>
```

`struct4search-ingest`는 문서 파싱부터 OpenSearch 인덱싱까지 전체 문서 인덱싱을 실행합니다. 실행 전에 PostgreSQL, OpenSearch, Temporal, 모델 서비스와 GPU가 준비되어 있어야 합니다.

중단된 실행을 이어서 시작하거나 실패한 문서만 다시 실행하는 방법은 [문서 인덱싱 실행과 상태 확인](../indexing/rerun.md)에서 확인합니다.

### 인덱싱 운영 명령

일반적인 문서 인덱싱에는 `struct4search-ingest`를 사용합니다. 다음 명령은 워커를 분리하거나 Temporal 실행을 직접 관리하고, 운영 중인 실행을 복구해야 할 때 사용합니다.

| 명령                            | 실행 형식                                                                                                  | 설명                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `struct4search-ingest-front`  | `struct4search-ingest-front --config CONFIG --output OUTPUT [--resume] [--document-id ID ...]`         | 인덱싱 front graph만 별도로 실행합니다.                                                               |
| `struct4search-ingest-worker` | `struct4search-ingest-worker --config CONFIG --output OUTPUT [--resume] [--document-id ID ...]`        | 조립된 ingest service를 워커 프로세스로 실행합니다. Temporal 프로파일에서는 직접 호출하지 않고 Temporal activity가 사용합니다. |
| `struct4search-temporal`      | `struct4search-temporal {worker\|start\|all} --config CONFIG [--output OUTPUT] [--document-id ID ...]` | `worker`는 task queue를 대기하고, `start`는 workflow를 시작합니다. `all`은 두 역할을 한 프로세스에서 실행합니다.        |
| `struct4search-watchdog`      | `struct4search-watchdog --config CONFIG OUTPUT [INGEST_ARGS ...]`                                      | 인덱싱 supervisor를 감시하고, 종료 후 재시작할 때 기존 ingest 인자를 그대로 전달합니다.                                |

`struct4search-temporal`의 `start`와 `all`에는 `--output`이 필요합니다.

`--resume`은 같은 설정과 출력 디렉터리에 남아 있는 완료 기록을 읽어 이미 완료된 작업을 재사용합니다. 다른 설정이나 다른 데이터의 이전 출력 디렉터리를 재사용하기 위한 옵션은 아닙니다.

## PostgreSQL 동기화

| 명령                                    | 실행 형식                                                                                                                             | 설명                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `struct4search-document-catalog-sync` | `struct4search-document-catalog-sync --output OUTPUT [--dsn-env S4S_DOCUMENT_DSN]`                                                | 완료된 Canonical IDR와 Metadata를 문서 데이터베이스에 동기화합니다.                                     |
| `struct4search-kg-sync`               | `struct4search-kg-sync --output OUTPUT [--run-id ID] [--dsn-env S4S_KG_DSN] [--schema s4s_kg] [--follow] [--interval-seconds 20]` | 문서별 KG 산출물을 PostgreSQL에 중복 없이 반영합니다. `--follow`를 지정하면 실행이 끝날 때까지 새 완료 기록을 계속 확인합니다. |

두 명령은 `--dsn-env`로 지정한 환경변수에서 PostgreSQL DSN을 읽습니다.

`struct4search-kg-sync`는 `run_config.json`에서 run ID를 확인할 수 없는 경우 `--run-id`를 직접 지정해야 합니다.

## E2E 검증 및 릴리스 게이트

| 명령                                      | 검증 범위                        | 실행 조건                                               |
| --------------------------------------- | ---------------------------- | --------------------------------------------------- |
| `struct4search-smoke-e2e`               | 문서 1건의 격리 프로덕션 E2E           | 승인된 시험 문서와 기준 자료, GPU, 모델, 임시 PostgreSQL·OpenSearch |
| `struct4search-five-document-e2e`       | 문서 5건 E2E                    | 승인된 시험 문서와 기준 자료, GPU, 모델, 임시 PostgreSQL·OpenSearch |
| `struct4search-final-100-100-e2e`       | 문서 100건·질의 100건 릴리스 게이트      | 전체 서비스와 기준 산출물                                      |
| `struct4search-final-full-2567-200-e2e` | 문서 2,567건·질의 200건 최종 릴리스 게이트 | 전체 코퍼스와 변경하지 않는 기준 산출물                              |

네 명령은 모두 `--repository-root ROOT`를 지원합니다.

저장소 checkout에서 editable 설치로 실행하는 경우에는 `--repository-root`를 생략합니다. 설치된 wheel을 checkout 밖에서 실행할 때만 해당 옵션을 지정하거나 `S4S_REPOSITORY_ROOT` 환경변수를 설정합니다.

## 설치 및 동작 확인

다음 명령으로 패키지 의존성, 공개 CLI 엔트리포인트와 테스트를 확인합니다.

```bash
python -m pip check
struct4search-env --help
struct4search-ingest --help
struct4search-api --help
struct4search-evaluate --help
python -m pytest -q
```

환경별 설치와 첫 실행 방법은 [설치와 첫 실행](../quickstart.md), HTTP 요청과 응답 구조는 [API Reference](api-reference.md)에서 확인합니다.
