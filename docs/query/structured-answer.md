---
sidebar_position: 7
title: 답변과 출처 표기
---

# 답변과 출처 표기

LLM이 질의에 대한 답변을 생성하고, 각 claim을 뒷받침하는 원문 청크 ID를 함께 반환합니다.

## 입력과 출력

|    |                                             |
| -- | ------------------------------------------- |
| 입력 | [시스템 프롬프트 + 질의 + 근거](context.md)            |
| 출력 | `claims` — 답변 claim과 해당 claim이 인용한 원문 청크 ID |

출력은 다음과 같은 형태입니다.

```json
{
  "claims": [
    {
      "text": "네. 근로자가 온열질환 발생 우려 등 급박한 위험으로 작업중지를 요청하면 즉시 조치해야 합니다.",
      "cited_unit_ids": [
        "ruf_3612bfa54e64f90ad761c4c9"
      ]
    },
    {
      "text": "또한 폭염으로 온열질환자가 발생할 급박한 위험이 있는 경우 사업주는 작업을 중지하고, 온열질환 예방 기본수칙을 점검·개선해야 합니다.",
      "cited_unit_ids": [
        "ruf_fabea8f9f50afd476803ad7d",
        "ruf_d65296e1e039f4e5c1a75527"
      ]
    }
  ]
}
```

`text`에는 답변의 claim을, `cited_unit_ids`에는 그 claim을 직접 뒷받침하는 원문 청크 ID를 기록합니다. 하나의 claim에 여러 원문이 필요하면 필요한 ID를 모두 포함합니다.

## 동작 방식

1. [LLM Context](context.md)와 함께 출력 JSON Schema를 모델에 전달합니다.
2. 모델이 `claims` 배열을 생성합니다.
3. 반환된 결과가 Schema에 맞는지 확인하고 파싱합니다.

출력 형식은 프롬프트만으로 요청하지 않고 **JSON Schema로 제한**합니다. `cited_unit_ids`에는 이번 질의의 Context에 포함된 원문 청크 ID만 사용할 수 있으므로, 검색표현이나 Context 밖의 청크는 Citation으로 사용할 수 없습니다.

답변을 claim 단위로 구성하면 각 내용이 어떤 원문을 근거로 하는지 직접 연결할 수 있습니다.

질문에 답할 수 있는 원문 근거가 없으면 근거 없는 답변을 만들지 않습니다.

## 답변과 인용 규칙

답변 모델에는 다음 규칙을 적용합니다.

* `근거 N [ruf_...]` 아래의 원문만 사실 근거로 사용합니다.
* 사전지식이나 추측으로 법령·수치·조건·대상·절차를 추가하지 않습니다.
* 검색표현에만 있고 원문에 없는 내용은 답변에 사용하지 않습니다.
* 검색표현 ID는 `cited_unit_ids`에 기록하지 않습니다.
* claim 하나에는 독립적으로 확인할 수 있는 사실 하나를 작성합니다.
* claim 전체를 직접 뒷받침하는 원문 청크만 인용합니다.
* 같은 원문 청크 ID를 한 claim 안에서 중복하지 않습니다.

시스템 프롬프트 전문은 [프롬프트와 출력 검증](../reference/prompts.md)에서 확인할 수 있습니다.

## 설정값

| profile key                                         | 기본값            | 의미                            |
| ----------------------------------------------- | ---------------- | ----------------------------- |
| `query.reader.model`                            | `Qwen/Qwen3-14B` | 답변 생성 모델                      |
| `query.reader.endpoint`                         | 서버 주소            | 답변 모델 서버                      |
| `query.reader.generation.temperature`           | 0                | 답변 생성의 무작위성                   |
| `query.reader.generation.seed`                  | 0                | 생성 난수 시드                      |
| `query.reader.generation.schema_retry_attempts` | 5                | 출력이 Schema를 따르지 않을 때 재시도하는 횟수 |

모델 출력이 JSON Schema를 따르지 않으면 정해진 횟수만큼 다시 시도합니다. 생성된 Citation에 대한 추가 검증과 정리는 다음 단계인 [답변 후처리 및 원본 출처 연결](citations.md)에서 수행합니다.

## 사용 또는 결과 확인

답변 생성은 검색·답변 파이프라인에서 자동으로 실행됩니다.

| 확인할 것            | 정상                             |
| ---------------- | ------------------------------ |
| 최상위 키            | `claims`입니다                    |
| claim            | `text`와 `cited_unit_ids`를 가집니다 |
| `cited_unit_ids` | 원문 청크 ID(`ruf_`)로 구성됩니다        |
| 답변 문장            | 인용 번호가 포함되지 않습니다               |

사용자에게 보이는 `[1]`, `[2]`와 같은 인용 번호는 모델이 생성하지 않고 [답변 후처리 및 원본 출처 연결](citations.md) 단계에서 붙입니다.

## 코드 참조

| 확인할 내용       | 파일·심볼                                                            |
| ------------ | ---------------------------------------------------------------- |
| 출력 Schema    | `backend/struct4search/query/answer/reader_schema.py` · `schema_for` |
| 모델 호출과 응답 처리 | `backend/struct4search/query/answer/reader.py`                       |
| 시스템 프롬프트     | `prompts/answer/industrial-safety-grounded-claims/v1.txt`        |
| profile         | `configs/production.yaml` · `query.reader`                       |
