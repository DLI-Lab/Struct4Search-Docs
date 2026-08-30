---
sidebar_position: 4
title: NER
---

# NER

GLiNER 모델로 문서에서 KG 구축에 사용할 Entity를 추출합니다.

## 입력과 출력

| | |
|---|---|
| 입력 | [문서 파싱](parsing.md)이 만든 IDR |
| 출력 | 문서에서 추출한 Entity 언급 목록 |

Entity 하나는 다음과 같은 형태입니다.

`//` 뒤의 내용은 필드 설명이며 실제 JSON 산출물에는 포함되지 않습니다.

```json
{
  "doc_id": "d002343_6b6d39ebe6", // Entity가 나온 문서의 ID
  "text": "지게차",                // 원문에서 모델이 찾은 Entity 표현
  "label": "equipment",           // Entity 유형
  "confidence": 0.83,              // 모델이 이 결과를 선택한 신뢰도. 0에서 1 사이
  "page_index": 2                  // Entity가 나온 페이지 순서. 0부터 시작
}
```

## 동작 방식

1. IDR의 텍스트 요소에서 지정된 유형의 Entity를 찾습니다.
2. 중복된 결과를 정리하고 Entity 유형을 함께 기록합니다.
3. 추출 결과를 [KG 구축](triple-kg.md)의 입력으로 전달합니다.

현재 사용하는 Entity 유형은 여덟 가지입니다.

| 유형             | 의미           |
| -------------- | ------------ |
| `organization` | 기관·조직        |
| `personnel`    | 인력·직무·대상자    |
| `equipment`    | 설비·기계·기구·보호구 |
| `substance`    | 화학물질·유해물질    |
| `process`      | 작업·공정        |
| `regulation`   | 법령·규칙·기준     |
| `metric`       | 수치·지표        |
| `concept`      | 그 밖의 주요 개념   |

## 현재 production 설정

| profile key              | 현재 production 값                        | 의미             |
| --------------- | --------------------------- | -------------- |
| `ner.model`     | `urchade/gliner_multi-v2.1` | Entity 추출 모델   |
| `ner.labels`    | 8종                          | 추출할 Entity 유형  |
| `ner.threshold` | 0.1                         | 결과를 남기는 최소 신뢰도 |

모델이나 Entity 유형을 변경하면 이후 KG와 검색표현 결과도 달라지므로 NER 이후 단계를 다시 처리합니다([실행과 재처리](rerun.md)).

## 이 단계의 결과 확인

NER만 따로 실행하는 공개 명령은 없습니다. [문서 인덱싱 실행과 상태 확인](rerun.md)의 `struct4search-ingest` 명령을 실행하면 파싱된 본문을 대상으로 자동으로 수행됩니다. 아래 경로의 `<출력_디렉터리>`와 `<문서_ID>`는 해당 명령에 지정한 값을 뜻합니다.

| 확인 대상 | 확인 위치·방법 | 정상 | 비정상 |
|---|---|---|---|
| NER 완료 | `<출력_디렉터리>/ner/documents/<문서_ID>/receipt.json` | `status`가 `complete` 또는 `complete_with_rejects`입니다. | 완료 기록이 없으면 모델 호출 또는 결과 처리 중에 멈춘 상태입니다. |
| 추출 결과 | 같은 디렉터리의 `predictions.jsonl` | 각 결과의 `label`이 설정에 정의된 유형 중 하나입니다. 문서에 해당 개체가 없으면 파일이 비어 있어도 정상입니다. | 알 수 없는 `label`이 있거나 원문 위치 정보가 맞지 않으면 결과 계약을 위반한 상태입니다. |
| 제외된 결과 | 같은 디렉터리의 `rejects.jsonl`과 `receipt.json`의 `rejected_items` | 제외된 결과가 있으면 이유와 개수가 함께 기록됩니다. | 제외 수가 예상보다 많으면 입력 본문과 `rejected_reasons`를 확인해야 합니다. |

완료 기록은 있는데 추출 결과가 비어 있다면 곧바로 오류로 판단하지 않습니다. 먼저 해당 문서에 설정한 개체 유형이 실제로 등장하는지 확인합니다. 모델 호출 자체가 실패했다면 `<출력_디렉터리>/documents/<문서_ID>/failure.json`에서 원인을 확인합니다.

## 코드 참조

| 확인할 내용 | 파일·심볼                                             |
| ------ | ------------------------------------------------- |
| NER 실행 | `backend/struct4search/ingest/stages/ner/stage.py` · `GLiNERStage` |
| 설정     | `configs/ingest-production.yaml` · `ner`          |
| 다음 단계  | `backend/struct4search/ingest/stages/entity_local/stage.py` |
