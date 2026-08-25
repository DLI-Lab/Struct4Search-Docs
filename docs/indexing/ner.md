---
sidebar_position: 4
title: NER
---

# NER

GLiNER 모델로 문서 안의 엔티티를 추출합니다. IDR을 기준으로 문서 단위 병렬 처리합니다.

## 입력과 출력

| | |
|---|---|
| 입력 | [문서 파싱](parsing.md)이 만든 IDR의 element |
| 출력 | 엔티티 언급 목록 |

언급 하나는 이런 형태입니다.

```json
{
  "canonical_element_id": "d002343_6b6d39ebe6#p2#b7#e0", // 원문 요소
  "start": 12,                                           // 요소 안의 시작 위치
  "end": 15,                                             // 요소 안의 끝 위치
  "surface": "지게차",                                    // 원문에 나타난 표기
  "normalized_mention": "지게차",                         // 비교용 정규화 표기
  "label": "equipment",                                  // 엔티티 유형
  "confidence": 0.83,                                    // 모델 신뢰도
  "page_index": 2,                                       // 원본 페이지
  "section_id": "...",                                   // 문서 구조 위치
  "block_type": "...",
  "element_type": "..."
}
```

언급은 `predictions.jsonl`에 문서별로 쌓이고, 라벨에 맞지 않아 걸러진 것은 `rejects.jsonl`에 따로 남습니다.

## 동작 방식

1. IDR의 element 본문을 GLiNER에 넣어 선언된 라벨에 해당하는 구간을 찾습니다.
2. 같은 위치에 같은 라벨이 여러 번 잡히면 신뢰도가 높은 것 하나만 남깁니다.
3. element ID와 위치 순으로 정렬해 저장합니다.

이 단계는 **재현율을 우선**합니다. 여기서 놓친 엔티티는 뒤에서 되살릴 수 없고, 과하게 잡힌 것은 [KG 구축](triple-kg.md)의 검증에서 걸러집니다.

라벨은 여덟 가지입니다.

```text
organization  personnel  equipment  substance
process       regulation  metric     concept
```

### 환경변수

| 환경변수명 | 기본 옵션 | 의미 |
|---|---|---|
| `ner.model` | `urchade/gliner_multi-v2.1` | 엔티티를 뽑는 모델 |
| `ner.revision` | `443d26d6…` | 모델 스냅샷 고정값. 같은 입력에 같은 결과를 내기 위한 것입니다 |
| `ner.labels` | 여덟 유형 | 뽑을 엔티티 종류. 여기 없는 유형은 결과에 나오지 않습니다 |
| `ner.threshold` | 0.1 | 이 신뢰도 미만은 버립니다. 올리면 언급이 줄고, 내리면 레이아웃 부산물이 섞입니다 |
| `ner.batch_size` | 32 | 한 번에 모델에 넣는 문서 요소 수 |
| `ner.workers` | 1 | 동시에 처리하는 작업자 수 |

revision까지 고정하는 이유는 같은 입력·코드·프로파일이면 같은 엔티티가 나와야 하기 때문입니다.

`threshold`를 올리면 언급이 줄어 KG 구축의 재료가 줄고, 내리면 레이아웃 부산물이 엔티티로 들어옵니다. 모델이나 라벨을 바꾸면 **NER부터 인덱싱까지 다시 처리해야 합니다**.

## 사용 또는 결과 확인

인덱싱 실행기가 호출합니다.

```bash
struct4search-ingest --output <출력 디렉터리> --document-id <문서 ID>
```

문서별 산출물에서 볼 것은 세 가지입니다.

| 확인할 것 | 정상 |
|---|---|
| `predictions.jsonl` | 비어 있지 않습니다 |
| 라벨 분포 | 선언한 여덟 가지 안에만 있습니다 |
| `rejects.jsonl` | 있어도 정상입니다. 급증하면 라벨이나 임계값을 봅니다 |

단계 요약에 문서별 언급 수와 라벨별 개수가 함께 남습니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 실행 진입점 | `src/struct4search/ner_stage.py` |
| 모델 고정 | `src/struct4search/ner_stage.py` · `MODEL_ID` · `MODEL_REVISION` |
| 설정 스키마 | `src/struct4search/config_schema.py` |
| 설정값 | `configs/ingest-production.yaml` · `ner` |
| 다음 단계 입력 | `src/struct4search/ingest/stages/entity_local.py` |
