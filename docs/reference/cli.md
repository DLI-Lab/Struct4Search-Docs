---
sidebar_position: 9
title: 실행 명령
---

# 실행 명령

Struct4Search 패키지의 공개 CLI 계약입니다. 설치 및 CPU 검증 환경은 `python -m pip install -r requirements.txt`로 준비합니다.

전체 entrypoint는 Struct4Search 저장소의 `pyproject.toml` `[project.scripts]`가 정본입니다.

## 문서 인덱싱

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output /absolute/path/to/new-isolated-output \
  [--document-id <문서 ID> ...]
```

| 인자 | 필수 | 기본값·설명 |
|---|---|---|
| `--config` | 예 | 기본값 없음. 실행 profile 경로 |
| `--services` | 예 | 기본값 없음. 서비스 정의 경로 |
| `--output` | 예 | 기본값 없음. 산출물을 저장할 새 경로 |
| `--document-id` | 아니오 | 여러 번 지정 가능. 생략하면 대상 코퍼스 처리 |

세 필수 인자 중 하나라도 생략하면 argparse가 실행 전에 거부합니다. `configs/ingest-production.yaml`은 `configs/production.yaml`이 상속하는 pipeline 설정이며, CLI에서 사용할 통합 profile은 `configs/production.yaml`입니다.

## 문서 한 건 E2E

```bash
struct4search-smoke-e2e [--repository-root <체크아웃>]
```

고정 문서 한 건으로 production 인덱싱부터 검색·답변까지 확인합니다. GPU, 로컬 모델 snapshot과 외부 서비스가 필요하므로 CPU-only 검증 명령이 아닙니다. 새 격리 산출물·index를 사용하며 alias를 publish하지 않습니다.

## 검색과 QA 평가

출력 위치와 QueryService provider를 각각 정확히 하나 선택합니다.

```bash
struct4search-evaluate \
  (--run-root <실행 루트> | --output-root <결과 디렉터리>) \
  (--profile <검색 profile> | --fixture-results <fixture JSONL>) \
  --evaluation-config <평가 릴리스 JSON> \
  --gate-config <회귀 gate YAML> \
  [--baseline-report <기준 report JSON>] \
  [--qa-scores <QA 점수 JSONL>]
```

`--run-root`와 `--output-root`를 동시에 쓸 수 없고, `--profile`과 `--fixture-results`도 동시에 쓸 수 없습니다. 평가 절차와 실행 가능한 fixture 예시는 [검색과 QA 평가 실행](../testing/retrieval-qa.md)을 확인합니다.

## API 서버

```bash
struct4search-api \
  (--profile <검색 profile> | --fixture-results <fixture JSONL>) \
  [--host 127.0.0.1] \
  [--port 3100] \
  [--log-level info]
```

provider는 정확히 하나가 필수입니다. `--port`는 1~65535이며, `--log-level`은 `critical`, `error`, `warning`, `info`, `debug`, `trace` 중 하나입니다.

## 실행 환경 확인

```bash
struct4search-env [--shell]
struct4search-preflight
```

`struct4search-env --shell`은 export 문장을 출력할 뿐 현재 process 환경을 변경하지 않습니다. `struct4search-preflight`는 production 조건이 없으면 non-zero로 종료할 수 있습니다.

## 내부·전용 명령

| 명령 | 역할 |
|---|---|
| `struct4search-ingest-worker` | 문서 인덱싱 작업 처리 |
| `struct4search-ingest-front` | 인덱싱 실행 앞단 처리 |
| `struct4search-temporal` | 워크플로 실행 |
| `struct4search-watchdog` | 실행 상태 감시 |
| `struct4search-five-document-e2e` | 승인된 5문서 E2E |
| `struct4search-final-100-100-e2e` | 100문서·100질의 gate |
| `struct4search-final-full-2567-200-e2e` | 2,567문서·200질의 gate |

내부 worker와 승인된 대규모 E2E 명령은 준비된 production artifact와 환경을 전제로 합니다. 일반 인덱싱에서는 직접 호출하지 않습니다.

## 테스트

```bash
python -m pytest -q
```

GPU와 유료 API를 호출하지 않는 전체 테스트를 실행합니다. 서비스 integration은 각각 격리된 임시 PostgreSQL/OpenSearch를 준비한 경우에만 실행됩니다.
