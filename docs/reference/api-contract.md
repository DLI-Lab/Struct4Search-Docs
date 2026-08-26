---
sidebar_position: 2
title: 실행 계약
---

# 실행 계약

Struct4Search의 공개 진입점과 외부 서비스 호출, 오류 처리 규칙입니다.

## 실행 진입점

| 진입점 | 필수 | 선택 |
|---|---|---|
| `struct4search-ingest` | `--config` · `--services` · `--output` | `--document-id` |
| `struct4search-evaluate` | 출력 1개 · provider 1개 · `--evaluation-config` · `--gate-config` | `--baseline-report` · `--qa-scores` |
| `struct4search-api` | `--profile` 또는 `--fixture-results` 중 1개 | `--host` · `--port` · `--log-level` |
| `struct4search-smoke-e2e` | — | `--repository-root` |
| `struct4search-preflight` | — | — |
| `struct4search-env` | — | `--shell` |

`struct4search-ingest`의 세 필수 경로에는 기본값이 없습니다. `struct4search-evaluate`의 출력은 `--run-root`와 `--output-root` 중 하나, provider는 `--profile`과 `--fixture-results` 중 하나만 선택합니다.

각 명령의 전체 사용법은 [실행 명령](cli.md)에서 확인합니다.

## composition 계약

Evaluator와 API는 같은 canonical QueryService composition root를 사용합니다. `--profile`은 실제 OpenSearch·embedding·reader 구현을 구성하고, `--fixture-results`는 외부 서비스 없는 deterministic fixture 구현을 구성합니다. provider를 생략하거나 동시에 둘을 고르면 실행 전에 거부합니다.

## 외부 서비스 호출

| 대상 | 사용하는 단계 | 호출 방식 |
|---|---|---|
| MinerU | 문서 파싱 | HTTP |
| Qwen 또는 선택한 LLM provider | Metadata · KG · 검색표현 · 답변 | 구성된 client 계약 |
| 임베딩 서버 | 인덱싱 · 질의 처리 | OpenAI 호환 HTTP |
| OpenSearch | 인덱싱 · Native hybrid RRF | HTTP |
| PostgreSQL | KG 저장 | connection pool |

fixture evaluator/API는 이 외부 서비스를 호출하지 않습니다. production profile은 해당 endpoint와 인증·모델 설정이 준비되어 있어야 합니다.

## 오류 처리

| 상황 | 동작 |
|---|---|
| 필수 CLI 인자나 파일 누락 | composition 전에 실행 거부 |
| profile schema 또는 필수 active key 오류 | 실행 전에 중단 |
| Reader endpoint가 HTTP/HTTPS URL이 아님 | profile load 단계에서 거부 |
| prompt 또는 OpenSearch search pipeline 정의 불일치 | 실행 전에 중단 |
| 외부 서비스 호출 실패 | 해당 문서 또는 질의 처리 실패 |
| structured output 계약 위반 | provider 정책에 따른 재시도·오류 처리 |
| Citation 계약 위반 | deterministic 후처리 정책 적용 |

문서 인덱싱의 재개와 단계별 재처리 방법은 [파이프라인 실행 및 재처리 방법](../indexing/rerun.md), API 경로는 [API Reference](api-reference.md)를 확인합니다.
