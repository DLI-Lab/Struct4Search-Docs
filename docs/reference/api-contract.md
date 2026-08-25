---
sidebar_position: 2
title: 실행 계약
---

# 실행 계약

Struct4Search의 실행 진입점과 외부 서비스 호출, 실행 중 오류를 처리하는 기본 규칙을 정리합니다.

## 실행 진입점

| 진입점                       | 필수 인자      | 선택 인자                                       |
| ------------------------- | ---------- | ------------------------------------------- |
| `struct4search-ingest`    | `--output` | `--config` · `--services` · `--document-id` |
| `struct4search-evaluate`  | —          | `--run-root` · `--output-root`              |
| `struct4search-smoke-e2e` | —          | `--repository-root`                         |
| `struct4search-preflight` | —          | —                                           |
| `struct4search-env`       | —          | `--shell`                                   |

`struct4search-ingest`는 `--config`를 생략하면 `configs/ingest-production.yaml`, `--services`를 생략하면 `configs/services/cold-services.yaml`을 사용합니다.

각 명령의 사용 방법은 [실행 명령](commands.md)에서 확인할 수 있습니다.

## 실행과 재개

같은 실행 조건으로 다시 호출하면 기존 실행을 이어받습니다.

| 상황             | 동작                       |
| -------------- | ------------------------ |
| 같은 조건으로 재실행    | 기존 실행을 이어받습니다            |
| 다른 실행이 이미 진행 중 | 새 실행을 거부합니다              |
| 실행 프로세스가 중단됨   | 기존 진행 상태에서 다시 시작할 수 있습니다 |

문서 인덱싱의 재개와 단계별 재처리 방법은 [파이프라인 실행 및 재처리 방법](../indexing/rerun.md)에서 설명합니다.

## 외부 서비스 호출

| 대상         | 사용하는 단계                            | 호출 방식          |
| ---------- | ---------------------------------- | -------------- |
| MinerU     | 문서 파싱                              | HTTP           |
| Qwen       | Metadata 생성 · KG 구축 · 검색표현 생성 · 답변 | OpenAI 호환 HTTP |
| 임베딩 서버     | 인덱싱 · 질의 처리                        | OpenAI 호환 HTTP |
| OpenSearch | 인덱싱 · Hybrid 검색 · RRF 통합           | HTTP           |
| PostgreSQL | KG 저장                              | 커넥션 풀          |

각 서비스의 주소와 API는 [API Reference](api-reference.md)에서 확인할 수 있습니다.

LLM이 정해진 구조로 결과를 반환해야 하는 단계에서는 JSON Schema를 사용해 출력 형식을 제한합니다. 프롬프트와 출력 규칙은 [프롬프트와 출력 검증](prompts.md)에서 설명합니다.

## 오류 처리

| 상황                                           | 동작                |
| -------------------------------------------- | ----------------- |
| 설정이 Schema를 따르지 않음                           | 실행 전에 중단          |
| 프롬프트 또는 OpenSearch search pipeline 정의가 맞지 않음 | 실행 전에 중단          |
| 호스트 사전 점검 실패                                 | 실행 전에 중단          |
| 외부 서비스 호출 실패                                 | 해당 문서 또는 질의 처리 실패 |
| LLM 출력이 JSON Schema를 따르지 않음                  | 정해진 횟수만큼 재시도      |
| 파이프라인 계약을 만족하지 못함                            | 해당 단계에서 실패 처리     |

문서 인덱싱은 일부 단계만 끝난 문서를 완료된 것으로 처리하지 않습니다. 중단된 문서는 완료되지 않은 단계부터 다시 처리할 수 있습니다.

답변의 Citation은 별도의 재생성 없이 후처리 단계에서 검증하고 정리합니다. 자세한 내용은 [답변 후처리 및 원본 출처 연결](../query/citations.md)에서 확인할 수 있습니다.
