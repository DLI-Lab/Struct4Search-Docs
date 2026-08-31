---
sidebar_position: 4
title: NER
---

# NER

NER 단계는 이후 KG 구축에서 Entity-Local 문맥을 구성하기 위한 **엔티티 후보 span**을 추출합니다.

Production 프로필에서는 GLiNER에 설정된 후보 라벨을 전달하며, 이 라벨은 최종 KG의 전체 엔티티 유형을 제한하는 온톨로지가 아니라 후보 표현을 탐색하기 위한 기준입니다. 이후 Triple 추출 과정에서 관계의 endpoint로 발견된 원문 exact span이 추가 엔티티로 등록될 수 있습니다.

## 입력과 출력

| | |
|---|---|
| 입력 | [문서 파싱](parsing.md)이 만든 IDR |
| 출력 | 문서에서 추출한 엔티티 후보 span 목록 |

엔티티 후보 하나는 다음과 같은 형태입니다.

```json
{
  "doc_id": "d002343_6b6d39ebe6", // Entity가 나온 문서의 ID
  "text": "지게차",                // 원문에서 모델이 찾은 엔티티 후보 표현
  "label": "equipment",           // 후보를 찾을 때 사용한 라벨
  "confidence": 0.83,              // 모델이 이 결과를 선택한 신뢰도. 0에서 1 사이
  "page_index": 2                  // Entity가 나온 페이지 순서. 0부터 시작
}
```

## 동작 방식

1. IDR의 텍스트 요소에서 설정된 후보 라벨에 해당하는 span을 찾습니다.
2. 중복된 후보를 정리하고 각 후보를 찾을 때 사용한 라벨을 기록합니다.
3. 후보 span을 [KG 구축](triple-kg.md)의 Entity-Local 문맥 구성에 사용합니다.
4. Triple의 관계 endpoint에서 원문의 새로운 exact span이 발견되면 추가 엔티티로 등록합니다.

## 현재 production 설정

| profile key | 현재 production 값 | 의미 |
|---|---|---|
| `ner.model` | `urchade/gliner_multi-v2.1` | 엔티티 후보 span 추출 모델 |
| `ner.labels` | `organization`, `personnel`, `equipment`, `substance`, `process`, `regulation`, `metric`, `concept` | 후보 표현을 찾을 때 GLiNER에 전달하는 라벨 |
| `ner.threshold` | `0.1` | 결과를 남기는 최소 신뢰도 |

Production 기본 후보 라벨은 `organization`, `personnel`, `equipment`, `substance`, `process`, `regulation`, `metric`, `concept`입니다. 이 값은 현재 Production 실행 프로필의 기본 설정이며, 최종 KG 노드 유형의 전체 목록을 의미하지 않습니다.

모델이나 후보 라벨을 변경하면 이후 KG와 검색표현 결과도 달라지므로 NER 이후 단계를 다시 처리합니다([실행과 재처리](rerun.md)).

## 코드 참조

| 확인할 내용 | 파일·심볼                                             |
| ------ | ------------------------------------------------- |
| NER 실행 | `backend/struct4search/ingest/stages/ner/stage.py` · `GLiNERStage` |
| 설정     | `configs/ingest-production.yaml` · `ner`          |
| 다음 단계  | `backend/struct4search/ingest/stages/entity_local/stage.py` |
