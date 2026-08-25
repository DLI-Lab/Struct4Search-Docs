---
sidebar_position: 7
title: 프롬프트와 출력 검증
---

# 프롬프트와 출력 검증

프롬프트가 어디 있고, 그 출력이 어떻게 검증되는지 정리합니다.

## 프롬프트 목록

| ID | 파일 | 쓰는 단계 |
|---|---|---|
| `metadata/f400-18-fields` | `prompts/metadata/f400-18-fields/v1.txt` | [Metadata 생성](../indexing/metadata.md) |
| `triple/f400-v3-entity-local` | `prompts/triple/f400-v3-entity-local/v1.txt` | [KG 구축](../indexing/triple-kg.md) |
| `kg/entity-alias-validation` | `prompts/kg/entity-alias-validation/v1.txt` | KG 구축 |
| `retrieval_expression/g2-system` | `prompts/retrieval_expression/g2-system/v1.txt` | [검색표현 생성](../indexing/retrieval-text.md) |
| `retrieval_expression/g2-user` | `prompts/retrieval_expression/g2-user/v1.txt` | 검색표현 생성 |
| `answer/industrial-safety-grounded-claims` | `prompts/answer/industrial-safety-grounded-claims/v1.txt` | [답변과 출처 표기](../query/structured-answer.md) |

## registry가 프롬프트를 고정합니다

`prompts/registry.yaml`이 항목마다 다음을 선언합니다.

| 항목 | 의미 |
|---|---|
| `file` | 프롬프트 파일 경로 |
| `sha256` · `file_sha256` | 본문 해시. 파일이 바뀌면 어긋납니다 |
| `version` · `status` | 버전과 사용 여부 |
| `variables` | 렌더할 때 채우는 값 |
| `output_schema_ref` | 출력 Schema 이름 |
| `compatible_models` | 이 프롬프트가 검증된 모델 |
| `terminal_newline` | 끝 줄바꿈 처리 |

파일만 고치고 registry의 해시를 그대로 두면 **실행이 막힙니다.** 두 곳을 함께 고칩니다.

## 프롬프트를 고칠 때

1. 프롬프트 파일을 고칩니다.
2. registry의 해시를 새로 계산해 넣습니다.
3. 그 프롬프트를 쓰는 단계부터 다시 처리합니다.

절차와 재실행 범위는 [프롬프트와 규칙 수정](../maintenance/prompts.md)에 있습니다.
