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

```json
{
  "surface": "지게차",
  "label": "equipment",
  "confidence": 0.83,
  "page_index": 2
}
````

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

## 환경 변수

| 환경 변수              | 현재 값                        | 의미             |
| --------------- | --------------------------- | -------------- |
| `ner.model`     | `urchade/gliner_multi-v2.1` | Entity 추출 모델   |
| `ner.revision`  | `443d26d6…`                 | 사용하는 모델 버전     |
| `ner.labels`    | 8종                          | 추출할 Entity 유형  |
| `ner.threshold` | 0.1                         | 결과를 남기는 최소 신뢰도 |

모델이나 Entity 유형을 변경하면 이후 KG와 검색표현 결과도 달라지므로 NER 이후 단계를 다시 처리합니다([실행과 재처리](rerun.md)).

## 사용 또는 결과 확인

NER은 문서 인덱싱 과정에서 실행됩니다.

```bash
struct4search-ingest --output <출력 디렉터리> --document-id <문서 ID>
```

산출물에서 문서별 Entity가 생성되었는지와 결과의 `label`이 정의된 여덟 유형 안에 있는지 확인합니다.

## 코드 참조

| 확인할 내용 | 파일·심볼                                             |
| ------ | ------------------------------------------------- |
| NER 실행 | `src/struct4search/ner_stage.py`                  |
| 설정     | `configs/ingest-production.yaml` · `ner`          |
| 다음 단계  | `src/struct4search/ingest/stages/entity_local.py` |

