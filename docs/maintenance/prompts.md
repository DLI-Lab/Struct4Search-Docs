---
sidebar_position: 3
title: 프롬프트와 규칙 수정
---

# 프롬프트와 규칙 수정

프롬프트 문구를 고치고, 그 규칙이 실제로 어디서 강제되는지 확인합니다.

## 프롬프트 위치

| 프롬프트 | 파일 | 쓰는 단계 |
|---|---|---|
| Metadata 추출 | `prompts/metadata/f400-18-fields/v1.txt` | [Metadata 생성](../indexing/metadata.md) |
| Triple 추출 | `prompts/triple/f400-v3-entity-local/v1.txt` | [KG 구축](../indexing/triple-kg.md) |
| 엔티티 별칭 검증 | `prompts/kg/entity-alias-validation/v1.txt` | KG 구축 |
| 검색표현 생성 | `prompts/retrieval_expression/g2-system/v1.txt` · `g2-user/v1.txt` | [검색표현 생성](../indexing/retrieval-text.md) |
| 답변 | `prompts/answer/industrial-safety-grounded-claims/v1.txt` | [답변과 출처 표기](../query/structured-answer.md) |

`prompts/registry.yaml`이 각 프롬프트의 파일·해시·버전·호환 모델을 고정합니다. 파일만 고치고 registry를 그대로 두면 해시가 어긋나 실행이 막힙니다. **두 곳을 함께 고칩니다.**

## 프롬프트로 지시하는 규칙과 코드가 강제하는 규칙

프롬프트를 고쳐도 바뀌지 않는 규칙이 있습니다. 어디서 강제되는지 먼저 확인합니다.

| 규칙 | 강제 위치 |
|---|---|
| 인용 가능한 ID 집합 | 답변 JSON Schema |
| claim 형식과 필수 키 | 답변 JSON Schema |
| 검색표현 ID를 인용에서 제거 | 인용 정규화 |
| 한 claim 안의 중복 인용 제거 | 인용 정규화 |
| Context 밖 ID 제거 | 인용 정규화 |
| Metadata 필드 목록과 값 개수 | Metadata 출력 Schema |
| Metadata 값이 원문에 있는지 | 추출 뒤 코드 검사 |
| 원문 근거만 사용 | 시스템 프롬프트 |
| 근거가 충돌하면 나눠 서술 | 시스템 프롬프트 |

아래 두 줄만 프롬프트로 지시합니다. 나머지는 문구를 바꿔도 동작이 그대로입니다.

## 필드 목록은 정의 파일에서 렌더됩니다

Metadata 프롬프트의 필드 설명은 손으로 쓴 것이 아니라 `src/struct4search/domain/metadata_fields.yaml`에서 렌더됩니다. 필드를 바꾸려면 그 파일을 고칩니다. 프롬프트 본문에서 필드를 직접 고치면 정의와 어긋납니다.

## 변경 절차

1. 프롬프트 파일을 고칩니다.
2. `prompts/registry.yaml`의 해시를 새로 계산해 넣습니다.
3. 그 프롬프트를 쓰는 단계부터 다시 처리합니다.
4. 평가를 다시 측정합니다.

## 재실행 범위

| 고친 프롬프트 | 다시 도는 단계 | 재색인 |
|---|---|---|
| Metadata | Metadata 생성 · 검색표현 생성 · 인덱싱 | 필요 |
| Triple · 별칭 검증 | KG 구축 · 검색표현 생성 · 인덱싱 | 필요 |
| 검색표현 | 검색표현 생성 · 인덱싱 | 필요 |
| 답변 | 없음 | 없음 |

답변 프롬프트는 색인에 영향을 주지 않습니다. QA 평가만 다시 재면 됩니다.

## 확인

답변 프롬프트를 고쳤다면 인용 정리 집계를 봅니다. 값이 0이 아니면 **모델이 지키지 못하는 규칙을 요구하고 있다는 신호**입니다([답변 후처리 및 원본 출처 연결](../query/citations.md)).
