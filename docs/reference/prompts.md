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
| `kg/entity-alias-validation`               | `prompts/kg/entity-alias-validation/v1.txt`               | [KG 구축](../indexing/triple-kg.md)          |
| `retrieval_expression/g2-system`           | `prompts/retrieval_expression/g2-system/v1.txt`           | [검색표현 생성](../indexing/retrieval-text.md)   |
| `retrieval_expression/g2-user`             | `prompts/retrieval_expression/g2-user/v1.txt`             | 검색표현 생성                                    |
| `answer/industrial-safety-grounded-claims` | `prompts/answer/industrial-safety-grounded-claims/v1.txt` | [답변과 출처 표기](../query/structured-answer.md) |

## 단계 목적과 프롬프트 검토 기준

프롬프트가 단순히 JSON을 반환하도록 작성되었는지만 보지 않고, 해당 단계가 해야 할 일과 하지 말아야 할 일을 모두 설명하는지 확인합니다.

| 단계 | 프롬프트가 지시하는 일 | 코드가 추가로 확인하는 내용 |
|---|---|---|
| Metadata 생성 | 원문에 실제로 나온 값만 18개 항목으로 분류하고, 없는 값은 만들지 않습니다. | 항목 이름, 배열 형식, 항목별 최대 개수와 원문 포함 여부를 확인합니다. |
| Triple 생성 | 원문에서 확인되는 Entity 관계만 방향·부정·조건과 함께 추출하고, 각 관계의 근거 청크를 기록합니다. | Entity 위치, 관계 형식, 근거 청크, 대상 Entity 포함 여부와 최대 개수를 확인합니다. |
| Entity 별칭 검증 | 같은 문서에서 같은 대상을 가리키는 표기만 합치고, 불확실한 쌍은 합치지 않습니다. | 요청에 포함된 후보 번호만 반환했는지 확인합니다. |
| 검색표현 생성 | Triple을 주된 근거로 검색용 문장을 만들고, Metadata는 필요한 문맥을 보충할 때만 사용합니다. | 문장에 사용한 Triple과 Metadata 번호가 실제 입력에 있으며 근거 관계가 유지되는지 확인합니다. |
| 답변 생성 | 검색된 원문으로 직접 확인되는 내용만 독립된 답변 문장으로 만들고, 각 문장에 사용한 원문 ID를 기록합니다. | 답변 문장과 인용 목록의 형식, 중복, 현재 근거에 없는 ID와 검색표현 ID 사용 여부를 확인합니다. |

## 프롬프트 관리

`prompts/registry.yaml`에서 각 프롬프트의 파일과 버전, 해시, 호환 모델을 관리합니다.

| 항목 | 의미 |
|---|---|
| `file` | 사용할 프롬프트 파일 |
| `version` · `status` | 프롬프트 버전과 사용 상태 |
| `file_sha256` | 줄바꿈을 포함한 프롬프트 파일 전체의 해시 |
| `sha256` | 줄바꿈 처리 규칙을 적용한 뒤 실제로 모델에 전달되는 문자열의 해시 |
| `variables` | 실행할 때 채워 넣는 값 |
| `output_schema_ref` | 연결된 출력 Schema |
| `compatible_models` | 사용할 수 있는 모델 |

두 해시는 실행 기록에서 어떤 프롬프트 파일과 실제 입력 문자열을 사용했는지 확인하고, 의도하지 않은 파일 변경을 실행 전에 막기 위해 필요합니다. 해시는 직접 계산하지 않고 `struct4search-prompts sync`로 갱신합니다.

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
2. `struct4search-prompts sync`를 실행합니다. 이 명령이 두 해시와 프로파일의 프롬프트 참조를 함께 갱신합니다.
3. `git diff -- prompts configs`로 프롬프트 내용과 자동으로 바뀐 해시를 함께 검토합니다.
4. `python -m pytest -q tests/unit/config/test_profiles_and_prompts.py tests/unit/config/test_prompt_sync.py`로 registry, 파일과 프로파일이 일치하는지 확인합니다.
5. 인덱싱 프롬프트라면 새 `--output`에서 영향받는 문서를 다시 인덱싱합니다.
6. 검색이나 답변 결과가 달라질 수 있으면 관련 평가를 다시 실행합니다.

Metadata 필드의 이름·순서·의미는 프롬프트 문구가 아니라 `backend/struct4search/domain/metadata_fields.yaml`에서 수정합니다. Metadata 프롬프트는 이 정의를 사용해 구성됩니다.

## 수정 후 다시 실행할 범위

| 수정한 프롬프트 | 다시 생성해야 하는 데이터 | OpenSearch 데이터 갱신 |
|---|---|---|
| Metadata | Metadata 생성 → 검색표현 생성 → 인덱싱 | 필요 |
| Triple·Entity 별칭 검증 | KG 구축 → 검색표현 생성 → 인덱싱 | 필요 |
| 검색표현 | 검색표현 생성 → 인덱싱 | 필요 |
| 답변 | 답변 생성 | 불필요 |

인덱싱 프롬프트를 수정하면 영향받는 문서의 OpenSearch 데이터를 갱신합니다. 답변 프롬프트는 기존 검색 데이터를 바꾸지 않습니다.
