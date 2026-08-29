---
sidebar_position: 2
title: CLI Reference
---

# CLI Reference

Struct4Search에서 제공하는 `struct4search-*` 명령의 실행 형식, 필수 옵션과 용도를 정리합니다.

처음 설치한 환경에서는 [설치와 첫 실행](../quickstart.md)을 먼저 진행합니다.

## 기본 정보

| 항목 | 내용 |
|---|---|
| 실행 위치 | 저장소 루트 |
| 환경변수 | 명령을 시작할 때 저장소 루트의 `.env`를 읽습니다. 셸에 이미 설정된 값은 덮어쓰지 않습니다. |
| 파이프라인 설정 | `--config` 또는 `--profile`로 지정합니다. |
| 외부 서비스 설정 | 모델, OpenSearch, Temporal 등의 연결 정보가 담긴 파일을 `--services`로 지정합니다. |
| 전체 옵션 확인 | `struct4search-<명령> --help` |

잘못된 옵션 조합이나 존재하지 않는 설정 파일을 지정하면 외부 서비스를 구성하기 전에 실행이 종료됩니다. 실제 인덱싱과 검색·답변을 실행하려면 설정에 지정된 외부 서비스가 준비되어 있어야 합니다. 필요한 서비스와 실행 조건은 [설치 요구사항](dependencies.md)에서 확인합니다.

문서 인덱싱 단계별 공개 CLI는 제공하지 않습니다. 일반적인 인덱싱은 `struct4search-ingest`로 실행하며, 워커를 분리하거나 운영 중인 실행을 복구할 때만 인덱싱 운영 명령을 사용합니다.

## 전체 CLI 목록

CLI 이름을 누르면 해당 상세 항목으로 이동합니다. 이동한 항목을 펼쳐 실행 형식, 옵션과 사용 방법을 확인합니다.

### 환경 및 서비스

| CLI | 설명 |
|---|---|
| [`struct4search-env`](#cli-env) | Python 실행 환경과 import 경로를 확인합니다. |
| [`struct4search-preflight`](#cli-preflight) | GPU, 포트, 디스크와 OpenSearch 사전조건을 검사합니다. |
| [`struct4search-bootstrap`](#cli-bootstrap) | OpenSearch Native RRF 검색 파이프라인을 구성하거나 확인합니다. |
| [`struct4search-stack`](#cli-stack) | API, 문서 조회, ChatKit과 React UI를 개별 또는 일괄 실행합니다. |

### API 및 평가

| CLI | 설명 |
|---|---|
| [`struct4search-api`](#cli-api) | 검색·답변 API를 실행합니다. |
| [`struct4search-restored-snapshot-api`](#cli-restored-snapshot-api) | 복원한 OpenSearch snapshot을 사용하는 검색·답변 API를 실행합니다. |
| [`struct4search-evaluate`](#cli-evaluate) | 검색·답변 결과를 평가하고 회귀 gate를 판정합니다. |

### 문서 인덱싱

| CLI | 설명 |
|---|---|
| [`struct4search-ingest`](#cli-ingest) | 문서 파싱부터 OpenSearch 인덱싱까지 전체 파이프라인을 실행합니다. |
| [`struct4search-ingest-front`](#cli-ingest-front) | 인덱싱 front graph만 별도로 실행합니다. |
| [`struct4search-ingest-worker`](#cli-ingest-worker) | 조립된 ingest service를 워커 프로세스로 실행합니다. |
| [`struct4search-temporal`](#cli-temporal) | Temporal worker 또는 workflow를 실행합니다. |
| [`struct4search-watchdog`](#cli-watchdog) | 인덱싱 supervisor를 감시하고 종료 시 재시작합니다. |

### PostgreSQL 동기화

| CLI | 설명 |
|---|---|
| [`struct4search-document-catalog-sync`](#cli-document-catalog-sync) | 완료된 IDR와 Metadata를 문서 데이터베이스에 동기화합니다. |
| [`struct4search-kg-sync`](#cli-kg-sync) | 문서별 KG 산출물을 PostgreSQL에 동기화합니다. |

### E2E 검증 및 릴리스 gate

| CLI | 설명 |
|---|---|
| [`struct4search-smoke-e2e`](#cli-smoke-e2e) | 문서 1건의 격리 프로덕션 E2E를 검증합니다. |
| [`struct4search-five-document-e2e`](#cli-five-document-e2e) | 문서 5건 E2E를 검증합니다. |
| [`struct4search-final-100-100-e2e`](#cli-final-100-100-e2e) | 문서 100건·질의 100건 릴리스 gate를 실행합니다. |
| [`struct4search-final-full-2567-200-e2e`](#cli-final-full-2567-200-e2e) | 문서 2,567건·질의 200건 최종 릴리스 gate를 실행합니다. |

## CLI 상세

### 환경 및 서비스

<details id="cli-env">
<summary><strong>struct4search-env</strong></summary>

설정과 환경변수에서 해석된 실행 Python과 import 경로를 출력합니다.

```text
struct4search-env [--shell]
```

`--shell`을 지정하면 현재 프로세스의 환경을 직접 변경하지 않고, 적용할 `export` 문을 출력합니다.

</details>

<details id="cli-preflight">
<summary><strong>struct4search-preflight</strong></summary>

GPU 프로세스 소유권, 필수 포트, 고아 프로세스, 디스크와 OpenSearch 차단 상태를 검사합니다.

```text
struct4search-preflight
```

0이 아닌 종료 코드를 반환하면 출력된 조건을 해결한 뒤 인덱싱을 시작합니다.

</details>

<details id="cli-bootstrap">
<summary><strong>struct4search-bootstrap</strong></summary>

프로파일에 정의된 OpenSearch Native RRF 검색 파이프라인을 생성하거나 현재 구성을 확인합니다.

```text
struct4search-bootstrap (--profile PROFILE | --stack STACK) [--check]
```

| 옵션 | 설명 |
|---|---|
| `--profile` | 확인할 프로파일을 지정합니다. |
| `--stack` | 프로파일을 선택하는 개발용 stack 설정을 지정합니다. |
| `--check` | 구성을 변경하지 않고 현재 상태만 확인합니다. |

</details>

<details id="cli-stack">
<summary><strong>struct4search-stack</strong></summary>

API, 문서 조회 백엔드, ChatKit adapter와 React UI 중 하나를 선택하거나 전체 서비스를 실행합니다.

```text
struct4search-stack --stack STACK {api|document|chatkit|ui|up}
```

`up`을 선택하면 네 서비스를 함께 실행하며, 종료할 때 실행한 하위 프로세스도 함께 정리합니다.

</details>

### API 및 평가

<details id="cli-api">
<summary><strong>struct4search-api</strong></summary>

검색·답변, 문서 조회 연결과 선택적인 비동기 인덱싱 API를 실행합니다.

```text
struct4search-api
  [--host HOST]
  [--port PORT]
  [--log-level LEVEL]
  [--document-api-url URL]
  [--api-key-env ENV_NAME]
  (--profile PROFILE | --fixture-results RESULTS.jsonl)
  [--ingest-output-root OUTPUT]
  [--ingest-services SERVICES]
```

| 옵션 | 설명 |
|---|---|
| `--profile` | OpenSearch, 임베딩 서비스와 Reader를 연결해 실제 검색·답변 경로를 실행합니다. |
| `--fixture-results` | 저장된 검색 결과를 사용해 외부 서비스 없이 API 계약을 확인합니다. 모델은 호출하지 않습니다. |
| `--host` | 서버 바인딩 주소. 기본값은 `127.0.0.1`입니다. |
| `--port` | 서버 바인딩 포트. 기본값은 `3100`이며 `1..65535` 범위에서 지정합니다. |
| `--log-level` | `critical`, `error`, `warning`, `info`, `debug`, `trace` 중 하나를 지정합니다. |
| `--document-api-url` | 연결할 문서 조회 서비스의 Base URL입니다. 생략하면 `S4S_DOCUMENT_API_URL`을 사용합니다. |
| `--api-key-env` | 공개 API 키를 읽을 환경변수 이름입니다. 기본값은 `S4S_API_KEY`입니다. |
| `--ingest-output-root` | 비동기 `/v1/ingest/jobs` 경로를 활성화하고 작업 결과를 저장할 디렉터리를 지정합니다. |
| `--ingest-services` | 비동기 인덱싱에 사용할 Parser, LLM, Embedding과 OpenSearch 서비스 설정을 지정합니다. |

`--profile`과 `--fixture-results`는 함께 사용할 수 없습니다. `--ingest-output-root`와 `--ingest-services`는 함께 지정해야 하며, 비동기 인덱싱은 `--profile` 실행에서만 사용할 수 있습니다.

외부 서비스 없이 API 동작을 확인합니다.

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
  http://127.0.0.1:3100/v1/responses
```

응답의 `answer`가 비어 있지 않고 `citations`에 원문 근거가 있으면 답변 경로가 정상입니다.

실제 OpenSearch 검색과 모델 호출을 확인하려면 `--fixture-results` 대신 프로덕션 프로파일을 지정합니다.

```bash
struct4search-api \
  --profile configs/production.yaml \
  --host 127.0.0.1 \
  --port 3100
```

한 번의 답변만 반환하는 별도 CLI는 없습니다. API 서버를 실행한 뒤 `/v1/responses`를 호출합니다.

</details>

<details id="cli-restored-snapshot-api">
<summary><strong>struct4search-restored-snapshot-api</strong></summary>

복원한 OpenSearch snapshot을 변경하지 않고 검색·답변 API로 제공합니다.

```text
struct4search-restored-snapshot-api [--profile PROFILE] [--host HOST] [--port PORT]
```

기본 프로파일은 `configs/mac-dump-gpt.yaml`, 기본 포트는 `8289`입니다. 원본 PDF나 IDR 산출물이 없는 snapshot에서는 원문 파일 조회 요청이 `503`을 반환할 수 있습니다.

</details>

<details id="cli-evaluate">
<summary><strong>struct4search-evaluate</strong></summary>

검색·답변 결과를 평가하고 gate 설정에 따라 회귀 여부를 판정합니다.

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

</details>

### 문서 인덱싱

<details id="cli-ingest">
<summary><strong>struct4search-ingest</strong></summary>

문서 파싱부터 OpenSearch 인덱싱까지 전체 문서 인덱싱 파이프라인을 실행합니다.

프로덕션 설정은 다음과 같이 지정합니다.

```text
struct4search-ingest
  --config CONFIG
  --services SERVICES
  --output OUTPUT
  [--document-id ID ...]
```

로컬 stack 설정은 다음과 같이 지정합니다.

```text
struct4search-ingest
  --stack STACK
  --output OUTPUT
  [--document-id ID ...]
```

`--stack`은 `--config`, `--services`와 함께 사용할 수 없습니다. 특정 문서만 인덱싱하려면 `--document-id`를 지정하고, 여러 문서를 처리할 때는 옵션을 반복합니다. 생략하면 프로파일에 포함된 전체 문서를 처리합니다.

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output /absolute/path/to/new-output \
  --document-id <문서_ID>
```

실행 전에 PostgreSQL, OpenSearch, Temporal, 모델 서비스와 GPU가 준비되어 있어야 합니다. 중단된 실행을 이어서 시작하거나 실패한 문서만 다시 실행하는 방법은 [문서 인덱싱 실행과 상태 확인](../indexing/rerun.md)에서 확인합니다.

</details>

<details id="cli-ingest-front">
<summary><strong>struct4search-ingest-front</strong></summary>

인덱싱 front graph만 별도로 실행합니다.

```text
struct4search-ingest-front
  --config CONFIG
  --output OUTPUT
  [--resume]
  [--document-id ID ...]
```

`--resume`은 같은 설정과 출력 디렉터리에 남아 있는 완료 기록을 읽어 이미 완료된 작업을 재사용합니다.

</details>

<details id="cli-ingest-worker">
<summary><strong>struct4search-ingest-worker</strong></summary>

조립된 ingest service를 워커 프로세스로 실행합니다. Temporal 프로파일에서는 직접 호출하지 않고 Temporal activity가 사용합니다.

```text
struct4search-ingest-worker
  --config CONFIG
  --output OUTPUT
  [--resume]
  [--document-id ID ...]
```

`--resume`은 같은 설정과 출력 디렉터리에 남아 있는 완료 기록을 읽어 이미 완료된 작업을 재사용합니다.

</details>

<details id="cli-temporal">
<summary><strong>struct4search-temporal</strong></summary>

Temporal task queue를 대기하거나 workflow를 시작합니다.

```text
struct4search-temporal
  {worker|start|all}
  --config CONFIG
  [--output OUTPUT]
  [--document-id ID ...]
```

| 동작 | 설명 |
|---|---|
| `worker` | Temporal task queue를 대기합니다. |
| `start` | 인덱싱 workflow를 시작합니다. |
| `all` | worker와 workflow 시작을 한 프로세스에서 실행합니다. |

`start`와 `all`에는 `--output`이 필요합니다.

</details>

<details id="cli-watchdog">
<summary><strong>struct4search-watchdog</strong></summary>

인덱싱 supervisor를 감시하고, 종료 후 재시작할 때 기존 ingest 인자를 그대로 전달합니다.

```text
struct4search-watchdog --config CONFIG OUTPUT [INGEST_ARGS ...]
```

</details>

### PostgreSQL 동기화

<details id="cli-document-catalog-sync">
<summary><strong>struct4search-document-catalog-sync</strong></summary>

완료된 Canonical IDR와 Metadata를 문서 데이터베이스에 동기화합니다.

```text
struct4search-document-catalog-sync
  --output OUTPUT
  [--dsn-env S4S_DOCUMENT_DSN]
```

`--dsn-env`로 지정한 환경변수에서 PostgreSQL DSN을 읽습니다.

</details>

<details id="cli-kg-sync">
<summary><strong>struct4search-kg-sync</strong></summary>

문서별 KG 산출물을 PostgreSQL에 중복 없이 반영합니다.

```text
struct4search-kg-sync
  --output OUTPUT
  [--run-id ID]
  [--dsn-env S4S_KG_DSN]
  [--schema s4s_kg]
  [--follow]
  [--interval-seconds 20]
```

`--dsn-env`로 지정한 환경변수에서 PostgreSQL DSN을 읽습니다. `--follow`를 지정하면 실행이 끝날 때까지 새 완료 기록을 계속 확인합니다.

`run_config.json`에서 run ID를 확인할 수 없는 경우 `--run-id`를 직접 지정해야 합니다.

</details>

### E2E 검증 및 릴리스 gate

다음 명령은 승인된 시험 자료나 전체 코퍼스, GPU, 모델과 격리된 PostgreSQL·OpenSearch 등 각 gate에 필요한 환경이 준비된 상태에서 실행합니다.

<details id="cli-smoke-e2e">
<summary><strong>struct4search-smoke-e2e</strong></summary>

문서 1건의 격리 프로덕션 E2E를 검증합니다.

```text
struct4search-smoke-e2e [--repository-root ROOT]
```

</details>

<details id="cli-five-document-e2e">
<summary><strong>struct4search-five-document-e2e</strong></summary>

문서 5건 E2E를 검증합니다.

```text
struct4search-five-document-e2e [--repository-root ROOT]
```

</details>

<details id="cli-final-100-100-e2e">
<summary><strong>struct4search-final-100-100-e2e</strong></summary>

문서 100건·질의 100건 릴리스 gate를 실행합니다.

```text
struct4search-final-100-100-e2e [--repository-root ROOT]
```

</details>

<details id="cli-final-full-2567-200-e2e">
<summary><strong>struct4search-final-full-2567-200-e2e</strong></summary>

문서 2,567건·질의 200건 최종 릴리스 gate를 실행합니다.

```text
struct4search-final-full-2567-200-e2e [--repository-root ROOT]
```

</details>

네 E2E 명령은 모두 `--repository-root`를 지원합니다. 저장소 checkout에서 editable 설치로 실행하는 경우에는 생략합니다. 설치된 wheel을 checkout 밖에서 실행할 때만 지정하거나 `S4S_REPOSITORY_ROOT` 환경변수를 설정합니다.

### 설치 및 동작 확인

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
