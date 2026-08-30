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
  "claims": [ // 답변을 근거 단위로 나눈 목록
    {
      "text": "네. 근로자가 온열질환 발생 우려 등 급박한 위험으로 작업중지를 요청하면 즉시 조치해야 합니다.", // 답변에 포함할 하나의 사실 문장
      "cited_unit_ids": [ // 이 문장을 직접 뒷받침하는 원문 청크 ID 목록
        "ruf_3612bfa54e64f90ad761c4c9"
      ]
    },
    {
      "text": "또한 폭염으로 온열질환자가 발생할 급박한 위험이 있는 경우 사업주는 작업을 중지하고, 온열질환 예방 기본수칙을 점검·개선해야 합니다.", // 두 번째 사실 문장
      "cited_unit_ids": [ // 두 번째 문장을 직접 뒷받침하는 원문 청크 ID 목록
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

* `근거 N` 아래에 표시된 `ruf_` 원문 청크만 사실 근거로 사용합니다.
* 사전지식이나 추측으로 법령·수치·조건·대상·절차를 추가하지 않습니다.
* 검색표현에만 있고 원문에 없는 내용은 답변에 사용하지 않습니다.
* 검색표현 ID는 `cited_unit_ids`에 기록하지 않습니다.
* claim 하나에는 독립적으로 확인할 수 있는 사실 하나를 작성합니다.
* claim 전체를 직접 뒷받침하는 원문 청크만 인용합니다.
* 같은 원문 청크 ID를 한 claim 안에서 중복하지 않습니다.

시스템 프롬프트 전문은 [프롬프트와 출력 검증](../reference/prompts.md)에서 확인할 수 있습니다.

## 설정값

| profile key                                         | 현재 production 값            | 의미                            |
| ----------------------------------------------- | ---------------- | ----------------------------- |
| `query.reader.model`                            | `Qwen/Qwen3-14B` | 답변 생성 모델                      |
| `query.reader.endpoint`                         | 서버 주소            | 답변 모델 서버                      |
| `query.reader.generation.temperature`           | 0                | 답변 생성의 무작위성                   |
| `query.reader.generation.seed`                  | 0                | 생성 난수 시드                      |
| `query.reader.generation.schema_retry_attempts` | 5                | 출력이 Schema를 따르지 않을 때 재시도하는 횟수 |

모델 출력이 JSON Schema를 따르지 않으면 정해진 횟수만큼 다시 시도합니다. 생성된 Citation에 대한 추가 검증과 정리는 다음 단계인 [답변 후처리 및 원본 출처 연결](citations.md)에서 수행합니다.

## API 요청에서 이 단계 확인하기

답변 모델은 `POST /v1/responses` 요청에서 원문 근거가 있을 때만 호출됩니다. 모델이 만든 `claims`는 내부 검증을 거친 뒤 공개 응답의 `answer`와 `citations`로 바뀌므로, 공개 응답에서 `claims` 키를 찾지 않습니다.

| 확인 대상 | 확인 위치·방법 | 정상 | 비정상 |
|---|---|---|---|
| 요청 완료 | 응답의 `status`를 확인합니다. | HTTP 200이며 `status`가 `completed`입니다. | 모델 서버 연결 실패, 출력 형식 오류 또는 인용 계약 위반이 해결되지 않으면 오류 응답을 반환합니다. |
| 답변 | 응답의 `answer`를 확인합니다. | 근거가 있으면 답변 문장이 있고, 각 문장 뒤의 대괄호에는 인용한 `ruf_` 원문 청크 ID가 붙습니다. | 근거와 연결되지 않은 문장이 있거나 `rte_` ID가 인용되면 비정상입니다. |
| 인용 목록 | 응답의 `citations`를 확인합니다. | 답변에 사용한 `ruf_` ID가 중복 없이 처음 나타난 순서대로 들어 있습니다. | 답변의 ID와 인용 목록이 다르거나 같은 ID가 중복되면 후처리 계약을 위반한 상태입니다. |
| 답할 근거가 없음 | `insufficient_evidence`, `answer`, `citations`를 함께 확인합니다. | `insufficient_evidence`가 `true`이고 답변은 빈 문자열, 인용은 빈 목록입니다. | 근거가 없는데 모델이 만든 답변이 남으면 비정상입니다. |

모델의 원래 출력에는 답변 문장과 `cited_unit_ids`만 있으며 대괄호 표기는 없습니다. 공개 응답의 `[ruf_원문_청크_ID]` 표시는 [답변 후처리 및 원본 출처 연결](citations.md) 단계에서 코드가 붙입니다. 내부 출력 형식과 근거 제한은 설치할 때 만든 가상환경을 활성화한 뒤 Struct4Search 저장소의 최상위 디렉터리에서 다음 명령으로 확인할 수 있습니다.

```bash
python -m pytest tests/test_reader_e2e_blockers.py tests/unit/query/test_canonical_query_service.py
```

이 테스트는 실제 답변 모델을 호출하지 않고 준비된 모델 응답으로 출력 형식, 근거 ID 제한과 최종 응답 변환을 검사합니다.

## 코드 참조

| 확인할 내용       | 파일·심볼                                                            |
| ------------ | ---------------------------------------------------------------- |
| 출력 Schema    | `backend/struct4search/query/answer/reader_schema.py` · `schema_for` |
| 모델 호출과 응답 처리 | `backend/struct4search/query/answer/reader.py`                       |
| 시스템 프롬프트     | `prompts/answer/industrial-safety-grounded-claims/v1.txt`        |
| profile         | `configs/production.yaml` · `query.reader`                       |
