---
sidebar_position: 2
title: 실행 규칙
---

# 실행 규칙

실행 명령은 필요한 입력을 모두 확인한 뒤 서비스를 구성합니다. 잘못된 인자나 없는 파일은 외부 서비스 호출 전에 거부됩니다.

## 명령별 입력

| 명령 | 반드시 지정할 것 | 선택 항목 |
|---|---|---|
| `struct4search-ingest` | `--output`과 `--config`·`--services` 조합 또는 `--stack` | `--document-id` |
| `struct4search-evaluate` | `--run-root` 또는 `--output-root`, `--profile` 또는 `--fixture-results`, `--evaluation-config`, `--gate-config` | `--baseline-report`, `--qa-scores` |
| `struct4search-api` | `--profile` 또는 `--fixture-results` | `--host`, `--port`, `--log-level` |
| `struct4search-bootstrap` | `--profile` 또는 `--stack` | `--check` |
| `struct4search-env` | — | `--shell` |
| `struct4search-preflight` | — | — |

`struct4search-ingest`에서 `--stack`은 `--config`, `--services`와 함께 사용할 수 없습니다. `struct4search-evaluate`와 `struct4search-api`의 provider 선택도 정확히 하나여야 합니다.

## 외부 서비스

| 서비스 | 필요한 작업 |
|---|---|
| MinerU | 스캔·복합 문서 파싱 |
| LLM provider | Metadata, KG, 검색표현, 답변 생성 |
| 임베딩 서비스 | 인덱싱과 질의 벡터 생성 |
| OpenSearch | 검색 단위 색인과 Native RRF 검색 |
| PostgreSQL | KG 저장 |
| Temporal | production ingest workflow |

예제 검색 결과 파일을 사용하는 평가와 API는 이 서비스를 호출하지 않습니다. production profile을 선택한 경우에만 profile에 지정된 서비스를 사용합니다.

## 오류 처리

| 상황 | 동작 |
|---|---|
| CLI 인자 조합 또는 파일 경로가 잘못됨 | argparse 오류로 실행 전 종료 |
| profile 또는 설정 검증 실패 | 서비스 구성 전 종료 |
| API 요청의 `query`가 없거나 비어 있음 | `422` 응답 |
| 외부 서비스 또는 source transport를 사용할 수 없음 | `503` 응답 |

실제 명령 예시는 [실행 명령](cli.md), HTTP 경로는 [API Reference](api-reference.md)에서 확인합니다.
