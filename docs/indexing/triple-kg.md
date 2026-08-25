---
sidebar_position: 6
title: KG 구축
---

# KG 구축

동일 Entity가 등장하는 청크 중 문서의 reading order상 가까운 청크만 묶어 Triple을 추출하고, 문서 단위 지식그래프로 조립합니다.

## 입력과 출력

| | |
|---|---|
| 입력 | [원문 청크](chunking.md)와 [NER](ner.md)이 뽑은 엔티티 |
| 출력 | Triple과 문서 지식그래프 |

Triple 하나는 이런 형태입니다.

```json
{
  "triple_id": "kgtr_4404df7b9e441dae2f5f92ef", // 관계 ID
  "document_id": "d002343_6b6d39ebe6",          // 문서
  "head_id": "e_fc7faadc51995f862469",          // 주체 엔티티
  "relation": "이상상태",                        // 관계
  "tail_id": "e_9a1c33be07d5f1204c88",          // 대상 엔티티
  "evidence_spans": ["... 일부 생략 ..."],       // 근거 — 어느 청크의 어느 구간인지
  "source_bundle_ids": ["... 생략 ..."]          // 이 관계를 만든 요청 묶음
}
```

`evidence_spans`가 관계의 근거입니다. 원문에서 확인되지 않는 관계는 그래프에 들어가지 않습니다. 문서 지식그래프는 이런 관계들을 `nodes`와 `edges`로 모은 문서 단위 한 건입니다.

## 동작 방식

1. 엔티티마다 그 엔티티가 등장하는 청크를 모읍니다.
2. 그중 문서의 reading order상 가까운 청크만 한 묶음으로 만듭니다.
3. 묶음을 LLM에 보내 (주체, 관계, 대상) Triple을 뽑습니다.
4. 같은 관계를 문서 단위로 합쳐 지식그래프로 조립합니다.

가까운 청크만 묶는 이유는 같은 단어가 문서의 먼 곳에서 다른 뜻으로 쓰이기 때문입니다. 문서 앞의 "공정"과 뒤의 "공정"을 한 묶음에 넣으면 없는 관계가 만들어집니다.

그래프의 범위는 **문서 하나**입니다. 같은 이름의 엔티티가 다른 문서에 나와도 문서를 넘어 통합하지 않습니다.

### 환경변수

| 환경변수명 | 기본 옵션 | 의미 |
|---|---|---|
| `triple.strategy` | `v3_near_entity_chunks` | 청크를 묶는 방식 |
| `triple.near_max_gap` | 3 | "가깝다"의 기준. 읽기 순서로 이만큼 떨어진 청크까지 한 묶음으로 봅니다 |
| `triple.structural_override_max_gap` | 5 | 문서 구조상 이어진 경우 허용하는 더 넓은 간격 |
| `triple.targets_per_request_max` | 8 | 한 번에 모델에 보낼 대상 엔티티 수 |
| `triple.soft_triples_per_target` | 4 | 대상 하나에서 기대하는 관계 수 |
| `triple.temperature` | 0 | 생성의 무작위성. 0이면 같은 입력에 같은 결과 |
| `triple.thinking` | `false` | 모델의 사고 과정 출력 여부 |

`near_max_gap`이 "가깝다"의 기준입니다. 올리면 먼 청크까지 묶여 관계가 늘지만 근거가 약해지고, 내리면 문서에 실제로 있는 관계를 놓칩니다.

전략이나 간격을 바꾸면 **KG 구축부터 인덱싱까지 다시 처리해야 합니다**([실행과 재처리](rerun.md)).

## 사용 또는 결과 확인

인덱싱 실행기가 호출합니다.

```bash
struct4search-ingest --output <출력 디렉터리> --document-id <문서 ID>
```

문서별 산출물에서 볼 것은 세 가지입니다.

| 확인할 것 | 정상 |
|---|---|
| Triple 수 | 0이면 [NER](ner.md) 결과부터 확인합니다 |
| `evidence_spans` | 비어 있지 않습니다 |
| 그래프 범위 | `document_id`가 하나입니다 |

문서 지식그래프는 파일 산출물과 PostgreSQL에 함께 남습니다([저장소와 보존](../reference/storage.md)).

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 청크 묶기 | `src/struct4search/ingest/stages/entity_local_core.py` · `near_components` |
| Triple 추출과 그래프 조립 | `src/struct4search/ingest/stages/graph_core.py` |
| 프롬프트 | `prompts/triple/f400-v3-entity-local/v1.txt` |
| 설정값 | `configs/ingest-production.yaml` · `triple` · `kg` |
