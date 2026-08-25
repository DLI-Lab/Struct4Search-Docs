---
sidebar_position: 2
title: 실행 계약
---

# 실행 계약

파이프라인을 부르는 쪽과 파이프라인이 외부 서비스를 부르는 쪽의 약속입니다.

## 실행 진입점

| 진입점 | 필수 인자 | 선택 인자 |
|---|---|---|
| `struct4search-ingest` | `--output` | `--config` · `--services` · `--document-id` |
| `struct4search-evaluate` | — | `--run-root` · `--output-root` |
| `struct4search-smoke-e2e` | — | `--repository-root` |
| `struct4search-preflight` | — | — |
| `struct4search-env` | — | `--shell` |

`--config`를 생략하면 `configs/ingest-production.yaml`, `--services`를 생략하면 `configs/services/cold-services.yaml`을 씁니다.

## 실행 신원

같은 인자로 두 번 부르면 같은 실행으로 봅니다. 워크플로 ID가 **프로파일·출력 경로·문서 목록의 해시**이기 때문입니다.

| 상황 | 동작 |
|---|---|
| 같은 인자로 재실행 | 원래 실행에 붙어 이어받습니다 |
| 다른 인자의 실행이 진행 중 | 거부합니다 |
| 프로세스만 죽음 | 워크플로는 살아 있습니다 |

거부는 두 실행이 같은 GPU를 나눠 쓰는 상황을 막기 위한 것입니다.

## 외부 서비스 호출

| 대상 | 호출하는 단계 | 형식 |
|---|---|---|
| MinerU | 문서 파싱 | HTTP |
| Qwen | Metadata 생성 · KG 구축 · 검색표현 생성 · 답변 | OpenAI 호환 HTTP |
| 임베딩 서버 | 인덱싱 · 질의 처리 | OpenAI 호환 HTTP |
| OpenSearch | 인덱싱 · 검색 | HTTP |
| PostgreSQL | KG 저장 | 커넥션 풀 |

LLM 호출은 구조화 출력을 씁니다. 출력 형식은 프롬프트로 부탁하는 것이 아니라 JSON Schema로 강제합니다([프롬프트와 출력 검증](prompts.md)).

## 오류를 다루는 방식

| 상황 | 동작 |
|---|---|
| 설정이 스키마를 어김 | 실행 전에 거부 |
| 프롬프트·검색 파이프라인 해시 불일치 | 실행 전에 거부 |
| 호스트 사전 점검 실패 | 실행 전에 거부 |
| 외부 서비스 미응답 | 해당 문서 또는 질의 실패 |
| 출력이 Schema를 어김 | 정해진 횟수만큼 재시도 |
| 계약 위반(인용·연결·범위) | 즉시 실패 |

**부분 결과를 완료로 보고하지 않습니다.** 문서가 단계 일부만 끝났으면 완료 수에 들어가지 않고, 어느 단계가 빠졌는지가 문서별로 남습니다.

인용을 잘못한 응답은 재시도하지 않고 결정적으로 정리합니다([답변 후처리 및 원본 출처 연결](../query/citations.md)).
