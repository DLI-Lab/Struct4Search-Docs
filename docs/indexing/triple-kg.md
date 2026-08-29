---
sidebar_position: 6
title: KG 구축
---

# KG 구축

같은 Entity가 등장하는 원문 청크 중 reading order상 가까운 청크를 묶어 Triple을 추출하고, 이를 문서 단위 지식그래프로 구성합니다.

## 입력과 출력

| | |
|---|---|
| 입력 | [원문 청크](chunking.md)와 [NER](ner.md)에서 추출한 Entity |
| 출력 | Triple과 문서 단위 지식그래프 |

Triple 하나는 다음과 같은 형태입니다.

```json
{
  "triple_id": "kgtr_4404df7b9e441dae2f5f92ef",
  "document_id": "d002343_6b6d39ebe6",
  "head_id": "e_fc7faadc51995f862469",
  "relation": "이상상태",
  "tail_id": "e_9a1c33be07d5f1204c88",
  "evidence_spans": ["... 일부 생략 ..."]
}
```

각 Triple은 어떤 원문에서 추출되었는지 근거를 함께 가집니다. 생성된 Triple은 같은 문서 안에서 모여 하나의 지식그래프를 구성합니다.

## 동작 방식

1. 같은 Entity가 등장하는 원문 청크를 찾습니다.
2. 그중 문서의 reading order상 가까운 청크를 하나의 묶음으로 구성합니다.
3. 묶인 원문을 LLM에 제공해 `(주체, 관계, 대상)` 형태의 Triple을 추출합니다.
4. 이름이 비슷한 Entity 후보가 같은 개체를 가리키는지 LLM으로 확인합니다.
5. 확인된 Entity를 정리한 뒤 Triple을 문서 단위 지식그래프로 구성합니다.

같은 개체 이름 검증이 정해진 재시도 횟수 안에 성공하지 않으면 해당 문서의 KG 단계가 실패하고 실행 결과에 원인이 기록됩니다.

가까운 청크를 함께 보는 이유는 하나의 청크만으로는 드러나지 않는 관계를 주변 문맥까지 이용해 추출하면서, 문서의 멀리 떨어진 내용이 불필요하게 섞이는 것을 줄이기 위해서입니다.

KG는 **문서 단위로 구축**하며, 다른 문서의 Entity와 관계를 합치지 않습니다.

### 설정값

| profile key                              | 현재 production 값                   | 의미                         |
| ------------------------------------ | ----------------------- | -------------------------- |
| `triple.strategy`                    | `v3_near_entity_chunks` | Entity 주변 청크를 묶는 방식        |
| `triple.near_max_gap`                | 3                       | reading order상 함께 볼 청크의 범위 |
| `triple.structural_override_max_gap` | 5                       | 문서 구조상 이어진 경우 허용하는 범위      |
| `triple.targets_per_request_max`     | 8                       | 한 번의 요청에서 처리하는 Entity 수    |

청크를 묶는 방식이나 범위를 변경하면 추출되는 Triple과 검색표현이 달라질 수 있으므로 KG 구축 이후 단계를 다시 처리합니다([파이프라인 실행 및 재처리 방법](rerun.md)).

## 사용 또는 결과 확인

KG 구축은 문서 인덱싱 과정에서 실행됩니다.

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output <출력_디렉터리> \
  --document-id <문서_ID>
```

실행 후 문서별 Triple과 지식그래프가 생성되었는지 확인합니다.

| 확인할 것  | 정상                          |
| ------ | --------------------------- |
| Triple | 문서에서 추출된 관계가 생성되어 있습니다      |
| 원문 근거  | 각 Triple이 원문 근거와 연결되어 있습니다  |
| 그래프 범위 | 하나의 `document_id` 안에서 구성됩니다 |

생성된 지식그래프는 다음 단계인 [검색표현 생성](retrieval-text.md)에서 사용됩니다.

## 코드 참조

| 확인할 내용            | 파일·심볼                                                  |
| ----------------- | ------------------------------------------------------ |
| Entity 주변 청크 묶기   | `backend/struct4search/ingest/stages/entity_local/core.py` |
| Triple 추출           | `backend/struct4search/ingest/stages/triple/stage.py`      |
| 그래프 구성             | `backend/struct4search/ingest/stages/knowledge_graph/stage.py` |
| 프롬프트              | `prompts/triple/f400-v3-entity-local/v1.txt`           |
| 설정                | `configs/ingest-production.yaml` · `triple` · `kg`     |
