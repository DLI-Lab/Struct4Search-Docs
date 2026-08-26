---
sidebar_position: 9
title: 실행 명령
---

# 실행 명령

Struct4Search 패키지를 설치하면 문서 인덱싱, 평가와 실행 환경 확인에 필요한 CLI 명령을 사용할 수 있습니다.

```bash
pip install -e .
```

전체 명령은 `pyproject.toml`의 `[project.scripts]`에서 확인할 수 있습니다.

## 문서 인덱싱

```bash
struct4search-ingest \
  --output <출력 디렉터리> \
  [--config <프로파일>] \
  [--services <서비스 정의>] \
  [--document-id <문서 ID>]
```

| 인자              | 필수  | 기본값                                   |
| --------------- | --- | ------------------------------------- |
| `--output`      | 예   | —                                     |
| `--config`      | 아니오 | `configs/ingest-production.yaml`      |
| `--services`    | 아니오 | `configs/services/cold-services.yaml` |
| `--document-id` | 아니오 | 생략하면 대상 코퍼스를 처리하며, 여러 번 지정할 수 있습니다    |

문서 한 건만 처리하려면 `--document-id`를 지정합니다.

```bash
struct4search-ingest \
  --output <출력 디렉터리> \
  --document-id <문서 ID>
```

인덱싱에 필요한 서비스를 실행하고 문서 파싱부터 OpenSearch 인덱싱까지 전체 파이프라인을 처리합니다. 같은 실행 조건으로 다시 호출하면 기존 진행 상태를 이어받습니다([파이프라인 실행 및 재처리 방법](../indexing/rerun.md)).

## 문서 한 건 E2E

```bash
struct4search-smoke-e2e [--repository-root <체크아웃>]
```

고정된 문서 한 건으로 인덱싱부터 검색·답변까지 전체 경로가 정상적으로 연결되는지 확인합니다.

성능을 측정하기 위한 명령이 아니라, 모델과 외부 서비스를 포함한 전체 파이프라인이 실행되는지 빠르게 확인할 때 사용합니다.

## 검색과 QA 평가

```bash
struct4search-evaluate \
  [--run-root <출력 디렉터리>] \
  [--output-root <결과 디렉터리>]
```

평가셋을 실제 검색·답변 파이프라인으로 실행해 검색과 QA 지표를 측정합니다. 평가셋과 결과 확인 방법은 [검색과 QA 평가 실행](../testing/retrieval-qa.md)에서 설명합니다.

## 실행 환경 확인

### 환경 값 확인

```bash
struct4search-env [--shell]
```

현재 실행에 사용되는 경로와 환경 값을 출력합니다.

`--shell`을 사용하면 현재 셸에 적용할 수 있는 `export` 형식으로 출력합니다.

### 사전 점검

```bash
struct4search-preflight
```

파이프라인 실행 전에 호스트와 필요한 실행 조건을 확인합니다. 조건을 만족하지 못하면 실제 파이프라인을 시작하기 전에 중단됩니다.

## 내부 작업자

| 명령                            | 역할           |
| ----------------------------- | ------------ |
| `struct4search-ingest-worker` | 문서 인덱싱 작업 처리 |
| `struct4search-ingest-front`  | 인덱싱 실행 앞단 처리 |
| `struct4search-temporal`      | 워크플로 실행      |
| `struct4search-watchdog`      | 실행 상태 감시     |

일반적인 문서 인덱싱에서는 `struct4search-ingest`가 필요한 작업자를 함께 실행하므로 직접 호출할 필요는 없습니다.

## 테스트

```bash
pytest
```

외부 모델이나 서비스 없이 코드와 데이터 계약을 확인합니다. 테스트 종류와 범위는 [테스트 구성과 실행](../testing/overview.md)에서 확인할 수 있습니다.

## 재실행

| 상황             | 동작                           |
| -------------- | ---------------------------- |
| 같은 조건으로 다시 실행  | 기존 실행을 이어받습니다                |
| 다른 실행이 이미 진행 중 | 새 실행을 거부합니다                  |
| 특정 문서만 다시 처리   | `--document-id`로 문서를 지정합니다   |
| 인덱싱 설정 변경      | 영향을 받는 단계부터 다시 처리합니다         |
| 검색·답변 설정 변경    | 기존 색인은 유지하고 필요한 평가를 다시 실행합니다 |

설정 변경에 따른 정확한 재처리 범위는 [변경 지점 찾기](../maintenance/change-map.md)와 [파이프라인 실행 및 재처리 방법](../indexing/rerun.md)에서 확인할 수 있습니다.
