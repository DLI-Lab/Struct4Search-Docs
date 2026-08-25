---
sidebar_position: 7
title: 답변과 출처 표기
---

# 답변과 출처 표기

LLM이 질의에 대한 답변을 생성하고, 각 주장에 사용한 원문 청크 ID를 함께 출력합니다.

## 입력과 출력

| | |
|---|---|
| 입력 | [시스템 프롬프트 + 질의 + 근거](context.md) |
| 출력 | `claims` — 주장 문장과 그 문장이 인용한 원문 청크 ID |

```json
{
  "claims": [
    {
      "text": "네. 근로자가 온열질환 발생 우려 등 급박한 위험으로 작업중지를 요청하면 즉시 조치해야 합니다.", // 주장 하나
      "cited_unit_ids": ["ruf_3612bfa54e64f90ad761c4c9"]  // 이 문장을 뒷받침하는 원문 청크
    },
    {
      "text": "또한 폭염으로 온열질환자가 발생할 급박한 위험이 있는 경우 사업주는 작업을 중지하고, 온열질환 예방 기본수칙을 점검·개선해야 합니다.",
      "cited_unit_ids": [
        "ruf_fabea8f9f50afd476803ad7d",                   // 여러 원문을 결합한 주장이면
        "ruf_d65296e1e039f4e5c1a75527"                    // 필요한 ID 를 모두 기록
      ]
    }
  ]
}
```

## 동작 방식

1. Context와 함께 JSON Schema를 붙여 모델을 호출합니다.
2. 모델이 `claims` 배열을 생성합니다.
3. 최상위 키가 `claims` 하나인지 확인하고 파싱합니다.

출력 형식은 프롬프트로 부탁하는 것이 아니라 **Schema로 강제**합니다. 특히 `cited_unit_ids`의 값 집합을 **이번 질의의 Top-10 원문 청크 ID로 못박습니다.** 그래서 검색표현 ID나 Context 밖의 ID는 애초에 생성될 수 없습니다.

답변 단위를 문장이 아니라 claim으로 두는 이유는 검증 때문입니다. 답변 전체에 인용 목록 하나만 두면 어느 문장을 어느 청크가 뒷받침하는지 말할 수 없고, 근거 없는 문장이 있는 문장과 구별되지 않습니다.

질문에 답할 원문 근거가 전혀 없으면 `claims`를 빈 배열로 반환합니다. 억지로 문장을 만들지 않습니다.

### 프롬프트가 요구하는 것

시스템 프롬프트의 규칙 가운데 이 단계의 계약에 해당하는 것은 다음입니다.

- `근거 N [ruf_...]` 아래의 원문만 사실 근거로 쓴다.
- 사전지식이나 추측으로 법령·수치·조건·대상·절차를 추가하지 않는다.
- 검색표현에만 있고 원문에 없는 내용은 답변에 쓰지 않는다.
- 검색표현 ID는 `cited_unit_ids`에 기록하지 않는다.
- claim 하나에는 독립적으로 검증할 수 있는 사실 하나만 쓴다.
- 같은 `cited_unit_id`를 한 claim 안에서 중복해 기록하지 않는다.

전문은 [프롬프트와 출력 검증](../reference/prompts.md)에 있습니다.

### 환경변수

| 환경변수명 | 기본 옵션 | 의미 |
|---|---|---|
| `query.reader.model` | `Qwen/Qwen3-14B` | 답변을 생성하는 모델 |
| `query.reader.endpoint` | 서버 주소 | 답변 모델 서버 |
| `query.reader.generation.temperature` | 0 | 생성의 무작위성. 0이면 같은 입력에 같은 답변 |
| `query.reader.generation.seed` | 0 | 생성 난수 시드 |
| `query.reader.generation.schema_retry_attempts` | 5 | 출력이 Schema 를 어겼을 때 다시 시도할 횟수 |

Schema를 지키지 못한 응답은 정해진 횟수만큼 재시도합니다. 인용을 잘못한 응답은 재시도하지 않고 다음 단계에서 결정적으로 정리합니다.

## 사용 또는 결과 확인

검색·답변 경로가 호출합니다. 응답에서 볼 것은 세 가지입니다.

| 확인할 것 | 정상 |
|---|---|
| 최상위 키 | `claims` 하나입니다 |
| `cited_unit_ids` | 비어 있지 않고 모두 `ruf_`입니다 |
| claim 문장 | 인용 번호가 들어 있지 않습니다 |

번호는 모델이 아니라 [답변 후처리](citations.md)가 붙입니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 출력 Schema | `src/struct4search/query/answer/reader_schema.py` · `schema_for` |
| 모델 호출과 파싱 | `src/struct4search/query/answer/reader.py` |
| 프롬프트 | `prompts/answer/industrial-safety-grounded-claims/v1.txt` |
| 설정값 | `configs/production.yaml` · `query.reader` |
