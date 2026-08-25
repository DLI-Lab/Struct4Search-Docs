---
sidebar_position: 9
title: 실행 명령
---

# 실행 명령

패키지를 설치하면 깔리는 명령입니다.

```bash
pip install -e .
```

전체 목록은 `pyproject.toml`의 `[project.scripts]`에 있습니다.

## 인덱싱

```bash
struct4search-ingest --output <출력 디렉터리> [--config <프로파일>] [--services <서비스 정의>] [--document-id <문서 ID>]
```

| 인자 | 필수 | 기본값 |
|---|---|---|
| `--output` | 예 | — |
| `--config` | 아니오 | `configs/ingest-production.yaml` |
| `--services` | 아니오 | `configs/services/cold-services.yaml` |
| `--document-id` | 아니오 | 생략하면 코퍼스 전체. 여러 번 줄 수 있습니다 |

필요한 서비스를 함께 띄우고 파이프라인 일곱 단계를 돕니다. 같은 인자로 다시 부르면 이어받습니다([실행과 재처리](../indexing/rerun.md)).

## 검증과 평가

```bash
struct4search-smoke-e2e [--repository-root <체크아웃>]
```

고정된 문서 한 건으로 인덱싱부터 답변까지 통과시킵니다. 별칭을 바꾸거나 서비스를 재시작하지 않습니다.

```bash
struct4search-evaluate [--run-root <출력 디렉터리>] [--output-root <결과 디렉터리>]
```

평가셋으로 검색·QA 평가를 돌립니다([검색과 QA 평가 실행](../testing/retrieval-qa.md)).

## 환경 확인

```bash
struct4search-env [--shell]
```

해석된 경로와 환경 값을 출력합니다. `--shell`은 셸에 넣을 `export` 문으로 냅니다.

```bash
struct4search-preflight
```

호스트가 파이프라인을 돌릴 수 있는 상태인지 점검하고, 조건을 만족하지 못하면 실패합니다.

## 작업자

| 명령 | 하는 일 |
|---|---|
| `struct4search-ingest-worker` | 인덱싱 작업자 |
| `struct4search-ingest-front` | 인덱싱 앞단 작업자 |
| `struct4search-temporal` | 워크플로 작업자 |
| `struct4search-watchdog` | 실행 감시 |

`struct4search-ingest`가 필요한 작업자를 띄우므로 보통은 직접 부르지 않습니다.

## 테스트

```bash
pytest
```

모델도 외부 서비스도 없이 돕니다([테스트 구성과 실행](../testing/overview.md)).

## 재실행 동작

| 상황 | 동작 |
|---|---|
| 같은 인자로 재실행 | 이어받습니다 |
| 다른 인자의 실행이 진행 중 | 거부합니다 |
| 특정 문서만 재처리 | `--document-id`로 지정 |
| 설정을 바꾼 뒤 | 바뀐 단계부터 다시 돕니다 |
