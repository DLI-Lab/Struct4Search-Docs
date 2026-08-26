---
sidebar_position: 3
title: 프롬프트와 규칙 수정
---

# 프롬프트와 규칙 수정

각 단계에서 사용하는 프롬프트를 수정하고, 프롬프트와 코드가 각각 어떤 규칙을 담당하는지 설명합니다.

## 프롬프트 위치

| 프롬프트         | 파일                                                                 | 쓰는 단계                                      |
| ------------ | ------------------------------------------------------------------ | ------------------------------------------ |
| Metadata 추출  | `prompts/metadata/f400-18-fields/v1.txt`                           | [Metadata 생성](../indexing/metadata.md)     |
| Triple 추출    | `prompts/triple/f400-v3-entity-local/v1.txt`                       | [KG 구축](../indexing/triple-kg.md)          |
| Entity 별칭 검증 | `prompts/kg/entity-alias-validation/v1.txt`                        | KG 구축                                      |
| 검색표현 생성      | `prompts/retrieval_expression/g2-system/v1.txt` · `g2-user/v1.txt` | [검색표현 생성](../indexing/retrieval-text.md)   |
| 답변           | `prompts/answer/industrial-safety-grounded-claims/v1.txt`          | [답변과 출처 표기](../query/structured-answer.md) |

`prompts/registry.yaml`에서 각 프롬프트의 파일, 해시, 버전과 호환 모델을 관리합니다. 프롬프트 파일을 수정하면 registry의 해시도 함께 갱신해야 합니다.

## 프롬프트와 코드가 담당하는 규칙

일부 규칙은 프롬프트로 모델에 지시하고, 출력 형식이나 인용 가능 범위처럼 반드시 지켜야 하는 규칙은 Schema와 후처리 코드에서 제한합니다.

| 규칙                   | 적용 위치              |
| -------------------- | ------------------ |
| 인용 가능한 ID 집합         | 답변 JSON Schema     |
| claim 형식과 필수 키       | 답변 JSON Schema     |
| 검색표현 ID 제거           | 인용 정규화             |
| 한 claim 안의 중복 인용 제거  | 인용 정규화             |
| Context 밖 ID 제거      | 인용 정규화             |
| Metadata 필드 목록과 값 개수 | Metadata 출력 Schema |
| Metadata 값의 원문 근거 확인 | Metadata 후처리       |
| 제공된 원문만 사실 근거로 사용    | 시스템 프롬프트           |
| 근거가 충돌하면 차이를 나누어 서술  | 시스템 프롬프트           |

따라서 프롬프트 문구만 수정해서는 Schema나 후처리에서 강제하는 규칙이 바뀌지 않습니다. 이러한 규칙을 변경하려면 해당 Schema나 구현도 함께 수정해야 합니다.

## Metadata 필드 수정

Metadata 프롬프트에서 사용하는 18종 필드의 정의는 `backend/struct4search/domain/metadata_fields.yaml`에서 관리합니다.

필드 이름이나 의미를 변경하려면 프롬프트 본문을 직접 수정하기보다 이 정의 파일을 변경합니다. 프롬프트는 해당 정의를 바탕으로 구성됩니다.

## 변경 절차

1. 변경할 프롬프트 파일을 수정합니다.
2. `prompts/registry.yaml`의 해당 프롬프트 해시를 갱신합니다.
3. 문서 인덱싱 프롬프트라면 해당 단계 이후를 다시 처리합니다.
4. 검색이나 답변 품질에 영향을 주는 경우 관련 평가를 다시 실행합니다.

## 재실행 범위

| 고친 프롬프트               | 다시 도는 단계                    | 재색인 |
| --------------------- | --------------------------- | --- |
| Metadata              | Metadata 생성 · 검색표현 생성 · 인덱싱 | 필요  |
| Triple · Entity 별칭 검증 | KG 구축 · 검색표현 생성 · 인덱싱       | 필요  |
| 검색표현                  | 검색표현 생성 · 인덱싱               | 필요  |
| 답변                    | 답변                          | 없음  |

답변 프롬프트는 기존 색인에 영향을 주지 않으므로 재색인은 필요하지 않습니다. 변경 후에는 QA 평가를 다시 확인합니다.

## 변경 후 확인

문서 인덱싱에 사용하는 프롬프트를 변경했다면 [변경 지점 찾기](change-map.md)에서 재처리 범위를 확인합니다.

답변 프롬프트를 변경했다면 답변 품질과 함께 인용 정리 집계를 확인합니다. 집계가 `0`이 아니면 모델 출력에 인용 계약을 벗어난 항목이 있었다는 뜻이므로 [답변 후처리 및 원본 출처 연결](../query/citations.md)을 함께 확인합니다.
