---
sidebar_position: 5
title: Metadata 생성
---

# Metadata 생성

원문 청크를 근거로 LLM을 사용해 도메인 특화 18종 스키마를 추출합니다.

## 입력과 출력

| | |
|---|---|
| 입력 | 문서의 원문 청크 |
| 출력 | 문서 하나당 `domain_*` 18종 값 |

출력은 문서 단위 한 행입니다.

```json
{
  "document_id": "d002343_6b6d39ebe6",        // 문서
  "domain_doc_type": ["안전보건 지침"],         // 문서 유형
  "domain_accident_type": ["떨어짐"],          // 재해 형태
  "domain_process": ["개구부 덮개 설치"],       // 작업 또는 공정명
  "domain_equipment": ["안전난간"],            // 설비·기계·기구·보호구
  "domain_location": ["건설현장"],             // 장소 또는 작업 공간
  "... 나머지 13종 생략 ...": []               // 값이 없으면 빈 배열
}
```

값은 모두 배열이고, 문서에 해당 내용이 없으면 빈 배열입니다. 필드당 값은 최대 8개, 값 하나는 최대 40자입니다.

## 동작 방식

1. 문서의 원문 청크를 모아 LLM에 넣습니다.
2. 18종 필드를 채운 JSON을 받습니다. 출력 형식은 프롬프트로 부탁하는 것이 아니라 **JSON Schema로 강제**합니다.
3. 원문에서 확인되지 않는 값은 버립니다. 이 규칙은 부탁이 아니라 코드가 검사합니다.

모델은 접두어 없는 필드 이름(`doc_type`, `accident_type` …)으로 답하고, **저장할 때 `domain_` 접두어를 붙입니다.** 문서에서 쓰는 저장 키는 아래 표의 형태입니다.

### 18종 스키마

저장 키는 필드 이름 앞에 `domain_`을 붙인 형태입니다.

| | 저장 키 | 의미 | 예시 |
|---|---|---|---|
| 1 | `domain_doc_type` | 문서 유형 | 안전보건 지침, 자율점검표 |
| 2 | `domain_accident_type` | 재해 형태 | 추락, 끼임, 화재, 온열질환 |
| 3 | `domain_process` | 작업 또는 공정명 | 용접작업, 중량물운반, 환기 |
| 4 | `domain_equipment` | 설비·기계·기구·보호구 | 지게차, 안전난간, 냉각조끼 |
| 5 | `domain_industry` | 업종 | 건설업, 제조업 |
| 6 | `domain_target_dept` | 대상 부문 또는 업권 | 건설부문, 소규모 사업장 |
| 7 | `domain_organization` | 기관 또는 조직명 | 고용노동부, 원청, 협력업체 |
| 8 | `domain_regulation` | 법령·규칙·기준명 | 산업안전보건법, KOSHA GUIDE |
| 9 | `domain_metric` | 수치와 단위가 결합된 지표 | 체감온도 33도, 산소농도 18% |
| 10 | `domain_substance` | 화학물질 또는 유해물질명 | 황화수소, 일산화탄소, 벤젠 |
| 11 | `domain_year` | 역할이 명시된 연도 | 사고 2023년, 개정 2021년 |
| 12 | `domain_personnel` | 인력·직무·대상자 | 근로자, 관리감독자, 고령자 |
| 13 | `domain_date` | 역할이 명시된 일자 | 사고 2023-07-15 |
| 14 | `domain_location` | 장소 또는 작업 공간 | 건설현장, 옥상, 밀폐공간 |
| 15 | `domain_safety_measure` | 안전조치 또는 예방대책 | 안전대 착용, 작업 전 환기 |
| 16 | `domain_casualty` | 사망·부상 인원과 정도 | 사망 1명, 부상 2명 |
| 17 | `domain_cause` | 문서가 명시한 사고 원인 | 안전난간 미설치, 환기 미실시 |
| 18 | `domain_education` | 교육 유형·대상·내용·시간 | 정기교육 4시간, 특별안전교육 |

이 18종은 NER 단계에서 엔티티 유형을 함께 분류한 뒤 문서 전체에서 자주 등장하고 커버리지가 높은 유형을 골라 확정한 것입니다.

추출한 Metadata는 [검색표현 생성](retrieval-text.md)에서 문맥을 보강하는 데 씁니다.

필드 목록·한국어 의미·우선순위의 정의는 `metadata_fields.yaml` 한 곳에 있고 코드와 프롬프트가 모두 그 파일에서 읽습니다. 필드를 바꾸려면 그 파일을 고칩니다.

### 환경변수

| 환경변수명 | 기본 옵션 | 의미 |
|---|---|---|
| `llm.metadata_max_output_tokens` | 1024 | 모델이 낼 수 있는 최대 출력 길이 |
| `g2.metadata_context_policy` | `document_deduplicated_unbounded` | 모델에 넣을 청크를 문서 단위로 중복 없이 모으는 방식 |
| `g2.metadata_priority` | 정의 파일과 동일 | 검색표현에 쓸 때의 필드 우선순위. `metadata_fields.yaml`과 어긋나면 실행이 막힙니다 |

프롬프트는 `prompts/registry.yaml`이 `metadata/f400-18-fields` 항목으로 파일과 해시를 고정합니다. 필드를 바꾸면 프롬프트 렌더 결과가 달라지므로 **Metadata 생성부터 인덱싱까지 다시 처리해야 합니다**.

## 사용 또는 결과 확인

인덱싱 실행기가 호출합니다.

```bash
struct4search-ingest --output <출력 디렉터리> --document-id <문서 ID>
```

산출물에서 볼 것은 세 가지입니다.

| 확인할 것 | 정상 |
|---|---|
| 문서당 행 수 | 하나입니다 |
| 키 집합 | `domain_*` 18종이 모두 있습니다 |
| 값 | 배열입니다. 없으면 빈 배열이고 누락 키가 아닙니다 |

값이 전부 빈 배열이면 LLM 호출이나 프롬프트를 확인합니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 실행 진입점 | `src/struct4search/metadata_llm.py` · `MetadataLLMExtractor` |
| 요청·응답 처리 | `src/struct4search/metadata_llm.py` · `build_requests` · `parse_response` |
| 출력 스키마와 상한 | `src/struct4search/metadata_llm.py` · `OUTPUT_SCHEMA` · `MAX_VALUES_PER_FIELD` · `MAX_VALUE_CHARACTERS` |
| 근거 검사 | `src/struct4search/metadata_llm.py` · `grounded` |
| 18종 정의 | `src/struct4search/domain/metadata_fields.yaml` |
| 정의 로더 | `src/struct4search/domain/metadata_fields.py` · `domain_schema` |
| 프롬프트 | `prompts/metadata/f400-18-fields/v1.txt` · `prompts/registry.yaml` |
| 설정값 | `configs/ingest-production.yaml` · `llm` · `g2` |
