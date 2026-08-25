---
sidebar_position: 7
title: 프롬프트와 출력 검증
---

# 프롬프트와 출력 검증

각 단계에서 사용하는 프롬프트의 위치와 모델 출력이 어떤 형식으로 검증되는지 정리합니다.

## 프롬프트 목록

| ID                                         | 파일                                                        | 쓰는 단계                                      |
| ------------------------------------------ | --------------------------------------------------------- | ------------------------------------------ |
| `metadata/f400-18-fields`                  | `prompts/metadata/f400-18-fields/v1.txt`                  | [Metadata 생성](../indexing/metadata.md)     |
| `triple/f400-v3-entity-local`              | `prompts/triple/f400-v3-entity-local/v1.txt`              | [KG 구축](../indexing/triple-kg.md)          |
| `kg/entity-alias-validation`               | `prompts/kg/entity-alias-validation/v1.txt`               | KG 구축                                      |
| `retrieval_expression/g2-system`           | `prompts/retrieval_expression/g2-system/v1.txt`           | [검색표현 생성](../indexing/retrieval-text.md)   |
| `retrieval_expression/g2-user`             | `prompts/retrieval_expression/g2-user/v1.txt`             | 검색표현 생성                                    |
| `answer/industrial-safety-grounded-claims` | `prompts/answer/industrial-safety-grounded-claims/v1.txt` | [답변과 출처 표기](../query/structured-answer.md) |

## 프롬프트 관리

`prompts/registry.yaml`에서 각 프롬프트의 파일과 버전, 해시, 호환 모델을 관리합니다.

| 항목                       | 의미             |
| ------------------------ | -------------- |
| `file`                   | 사용할 프롬프트 파일    |
| `version` · `status`     | 프롬프트 버전과 사용 상태 |
| `sha256` · `file_sha256` | 프롬프트 파일의 해시    |
| `variables`              | 실행할 때 채워 넣는 값  |
| `output_schema_ref`      | 연결된 출력 Schema  |
| `compatible_models`      | 사용할 수 있는 모델    |

프롬프트 파일이 변경되면 registry의 해시도 함께 갱신해야 합니다. 정의된 프롬프트와 실제 파일이 다르면 실행 전에 거부됩니다.

## 출력 검증

LLM을 사용하는 단계는 모델이 자유 형식의 텍스트를 반환하도록 두지 않고, 단계에 필요한 구조에 맞춰 결과를 검증합니다.

| 단계          | 검증하는 출력                    |
| ----------- | -------------------------- |
| Metadata 생성 | 도메인 Metadata 18종           |
| KG 구축       | Entity 사이의 Triple          |
| 검색표현 생성     | 검색표현과 근거가 된 Triple·원문 연결   |
| 답변          | `claims`와 `cited_unit_ids` |

출력 형식은 JSON Schema를 사용해 제한하며, 필요한 경우 Schema 검증을 통과하지 못한 응답을 다시 요청합니다.

형식이 맞더라도 단계별로 추가 규칙을 적용합니다. 예를 들어 Metadata는 원문에서 확인되는 값만 남기고, 답변 Citation은 현재 Context에 포함된 원문 청크만 사용할 수 있습니다.

즉 프롬프트는 **모델이 어떤 내용을 생성해야 하는지 지시하고**, Schema와 후처리는 **반드시 지켜야 하는 출력 형식과 범위를 제한합니다.**

## 프롬프트를 수정할 때

1. 해당 프롬프트 파일을 수정합니다.
2. `prompts/registry.yaml`의 해시를 갱신합니다.
3. 문서 인덱싱에 사용하는 프롬프트라면 영향을 받는 단계부터 다시 처리합니다.
4. 검색이나 답변 결과가 달라질 수 있으면 관련 평가를 다시 실행합니다.

프롬프트별 재처리 범위와 수정 절차는 [프롬프트와 규칙 수정](../maintenance/prompts.md)에서 설명합니다.
