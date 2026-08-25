---
sidebar_position: 5
title: Metadata 생성
---

# Metadata 생성

원문 청크를 근거로 LLM을 사용해 문서의 도메인 정보를 18종 Metadata로 정리합니다.

## 입력과 출력

| | |
|---|---|
| 입력 | 문서의 원문 청크 |
| 출력 | 문서 하나당 `domain_*` 18종 Metadata |

출력은 문서 단위로 생성됩니다.

```json
{
  "document_id": "d002343_6b6d39ebe6",
  "domain_doc_type": ["안전보건 지침"],
  "domain_accident_type": ["떨어짐"],
  "domain_process": ["개구부 덮개 설치"],
  "domain_equipment": ["안전난간"],
  "domain_location": ["건설현장"]
}
````

각 필드는 배열 형태이며, 문서에서 해당 정보를 찾지 못하면 빈 배열로 남습니다.

## 동작 방식

1. 문서의 원문 청크를 Metadata 생성의 근거로 구성합니다.
2. LLM이 정해진 18종 필드에 맞춰 값을 추출합니다.
3. 결과를 문서 단위 Metadata로 정리합니다.

출력 형식은 JSON Schema로 제한하며, 원문에서 확인되지 않는 값은 결과에 남기지 않습니다.

## 18종 Metadata

|    | 저장 키                    | 의미             | 예시                   |
| -- | ----------------------- | -------------- | -------------------- |
| 1  | `domain_doc_type`       | 문서 유형          | 안전보건 지침, 자율점검표       |
| 2  | `domain_accident_type`  | 재해 형태          | 추락, 끼임, 화재, 온열질환     |
| 3  | `domain_process`        | 작업 또는 공정명      | 용접작업, 중량물운반, 환기      |
| 4  | `domain_equipment`      | 설비·기계·기구·보호구   | 지게차, 안전난간, 냉각조끼      |
| 5  | `domain_industry`       | 업종             | 건설업, 제조업             |
| 6  | `domain_target_dept`    | 대상 부문 또는 업권    | 건설부문, 소규모 사업장        |
| 7  | `domain_organization`   | 기관 또는 조직명      | 고용노동부, 원청, 협력업체      |
| 8  | `domain_regulation`     | 법령·규칙·기준명      | 산업안전보건법, KOSHA GUIDE |
| 9  | `domain_metric`         | 수치와 단위가 결합된 지표 | 체감온도 33도, 산소농도 18%   |
| 10 | `domain_substance`      | 화학물질 또는 유해물질명  | 황화수소, 일산화탄소, 벤젠      |
| 11 | `domain_year`           | 역할이 명시된 연도     | 사고 2023년, 개정 2021년   |
| 12 | `domain_personnel`      | 인력·직무·대상자      | 근로자, 관리감독자, 고령자      |
| 13 | `domain_date`           | 역할이 명시된 일자     | 사고 2023-07-15        |
| 14 | `domain_location`       | 장소 또는 작업 공간    | 건설현장, 옥상, 밀폐공간       |
| 15 | `domain_safety_measure` | 안전조치 또는 예방대책   | 안전대 착용, 작업 전 환기      |
| 16 | `domain_casualty`       | 사망·부상 인원과 정도   | 사망 1명, 부상 2명         |
| 17 | `domain_cause`          | 문서가 명시한 사고 원인  | 안전난간 미설치, 환기 미실시     |
| 18 | `domain_education`      | 교육 유형·대상·내용·시간 | 정기교육 4시간, 특별안전교육     |

생성된 Metadata는 [검색표현 생성](retrieval-text.md)에서 문서의 맥락을 보강하는 데 사용됩니다.

18종 필드의 정의는 `src/struct4search/domain/metadata_fields.yaml`에서 관리합니다.

## 설정

Metadata 생성에 사용하는 모델과 출력 길이, 입력 구성 방식은 `configs/ingest-production.yaml`에서 설정합니다. 프롬프트는 `prompts/registry.yaml`을 통해 관리합니다.

Metadata 생성 방식이나 프롬프트가 달라지면 검색표현도 달라질 수 있으므로 Metadata 생성 이후 단계를 다시 처리합니다([실행과 재처리](rerun.md)).

## 사용 또는 결과 확인

Metadata 생성은 문서 인덱싱 과정에서 실행됩니다.

```bash
struct4search-ingest --output <출력 디렉터리> --document-id <문서 ID>
```

산출물에서 문서별 Metadata가 생성되었는지와 18종 필드가 정상적으로 구성되었는지 확인합니다.

## 코드 참조

| 확인할 내용      | 파일·심볼                                                        |
| ----------- | ------------------------------------------------------------ |
| Metadata 생성 | `src/struct4search/metadata_llm.py` · `MetadataLLMExtractor` |
| 18종 정의      | `src/struct4search/domain/metadata_fields.yaml`              |
| 프롬프트        | `prompts/metadata/f400-18-fields/v1.txt`                     |
| 설정          | `configs/ingest-production.yaml`                             |

