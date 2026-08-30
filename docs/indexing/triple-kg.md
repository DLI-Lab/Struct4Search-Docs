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

`//` 뒤의 내용은 필드 설명이며 실제 JSON 산출물에는 포함되지 않습니다.

```json
{
  "triple_id": "kgtr_4404df7b9e441dae2f5f92ef", // 이 Triple의 고유 ID
  "document_id": "d002343_6b6d39ebe6",           // 이 Triple이 만들어진 문서의 ID
  "head_id": "e_fc7faadc51995f862469",           // 관계의 주체가 되는 Entity ID
  "relation": "이상상태",                         // 주체와 대상 사이의 관계
  "tail_id": "e_9a1c33be07d5f1204c88",          // 관계의 대상이 되는 Entity ID
  "evidence_spans": [                              // 이 관계를 뒷받침하는 원문 위치 목록
    {
      "chunk_id": "fc_8b80b90f296ec2c2b407a1d3", // 근거가 있는 원문 청크 ID
      "start": 0,                                  // 근거 문장이 시작하는 글자 위치
      "end": 21,                                   // 근거 문장이 끝나는 글자 위치
      "text": "열분해로 내부 온도가 급격히 상승하였다"   // 원문에서 확인한 근거 문장
    }
  ]
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

## 이 단계의 결과 확인

Triple 추출과 KG 구축만 따로 실행하는 공개 명령은 없습니다. [문서 인덱싱 실행과 상태 확인](rerun.md)의 `struct4search-ingest` 명령을 실행하면 NER 뒤에 자동으로 수행됩니다. 아래 경로의 `<출력_디렉터리>`와 `<문서_ID>`는 해당 명령에 지정한 값을 뜻합니다.

| 확인 대상 | 확인 위치·방법 | 정상 | 비정상 |
|---|---|---|---|
| Triple 추출 완료 | `<출력_디렉터리>/triples/documents/<문서_ID>/receipt.json` | `status`가 `complete`이고 `triples_path`가 Triple 결과 파일을 가리킵니다. | 완료 기록이 없으면 Triple 모델 호출 또는 원문 근거 검사 중에 멈춘 상태입니다. |
| Triple 결과 | 같은 디렉터리의 `triples_final_evidence_merged.jsonl` | 각 Triple의 `document_id`가 대상 문서와 같고 `evidence_spans`가 실제 원문 청크 위치와 일치합니다. 관계를 추출할 수 없는 문서는 파일이 비어 있어도 정상입니다. | 근거 청크가 없거나 근거 위치의 원문이 맞지 않으면 KG 구축으로 넘어갈 수 없습니다. |
| KG 구축 완료 | `<출력_디렉터리>/kg/documents/<문서_ID>/cold_receipt.json` | `status`가 `complete`이고 입력 Triple 수와 통합된 Triple 수가 기록됩니다. | 같은 개체 이름 확인이나 그래프 구성에 실패하면 완료 기록이 만들어지지 않습니다. |
| 문서 지식그래프 | 같은 디렉터리의 `knowledge_graphs_by_document.jsonl` | 대상 `document_id`의 그래프 한 건이 있습니다. 다른 문서의 개체나 관계는 섞이지 않습니다. | 그래프가 없거나 다른 문서 ID가 섞이면 문서 단위 그래프 계약을 위반한 상태입니다. |

Triple이 0건인 것과 단계 실패는 다릅니다. Triple 결과가 비어 있어도 완료 기록이 있으면 문서에서 근거가 있는 관계를 만들지 못한 정상 결과일 수 있습니다. 완료 기록이 없다면 `<출력_디렉터리>/documents/<문서_ID>/failure.json`에서 Triple 추출과 같은 개체 이름 확인 중 어느 부분에서 실패했는지 확인합니다.

## 코드 참조

| 확인할 내용            | 파일·심볼                                                  |
| ----------------- | ------------------------------------------------------ |
| Entity 주변 청크 묶기   | `backend/struct4search/ingest/stages/entity_local/core.py` |
| Triple 추출           | `backend/struct4search/ingest/stages/triple/stage.py`      |
| 그래프 구성             | `backend/struct4search/ingest/stages/knowledge_graph/stage.py` |
| 프롬프트              | `prompts/triple/f400-v3-entity-local/v1.txt`           |
| 설정                | `configs/ingest-production.yaml` · `triple` · `kg`     |
