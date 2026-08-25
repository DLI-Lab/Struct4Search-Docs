---
sidebar_position: 8
title: 답변 후처리 및 원본 출처 연결
---

# 답변 후처리 및 원본 출처 연결

각 청크 ID를 실제 저장된 원문 청크와 문서 ID, 원본 페이지에 매핑해 사용자에게 보여줄 형태로 후처리합니다.

## 입력과 출력

| | |
|---|---|
| 입력 | [LLM이 낸 `claims`](structured-answer.md) |
| 출력 | 후처리된 답변과 출처 링크 |

사용자에게 보이는 형태는 이렇습니다.

```text
네. 근로자가 온열질환 발생 우려 등 급박한 위험으로 작업중지를 요청하면
즉시 조치해야 합니다. [1]

또한 폭염으로 온열질환자가 발생할 급박한 위험이 있는 경우 사업주는
작업을 중지하고, 온열질환 예방 기본수칙을 점검·개선해야 합니다. [2][3]

... 중략 ...

[1] ruf_3612bfa54e64f90ad761c4c9
    문서: d000786_459d662b8a
    PDF p.1–2

[2] ruf_fabea8f9f50afd476803ad7d
    문서: d001629_54747f882e
    PDF p.1–2

[3] ruf_d65296e1e039f4e5c1a75527
    문서: d001756_64758782bc
    JPG p.1
```

출처 링크 하나는 이런 값을 가집니다.

```json
{
  "unit_id": "ruf_3612bfa54e64f90ad761c4c9", // 인용된 원문 청크
  "document_id": "d000786_459d662b8a",       // 문서
  "page_number": 1,                          // 표시용 페이지
  "href": "..."                              // 원본을 여는 주소
}
```

## 동작 방식

1. `claims`의 인용 ID를 결정적으로 정리합니다.
2. 남은 인용마다 Context에서 해당 원문 청크를 찾습니다.
3. 청크를 문서 ID와 원본 페이지로 잇고 원본을 열 주소를 받습니다.
4. 답변 문장에 인용 번호를 붙이고 출처 목록을 조립합니다.

정리는 네 단계이며 순서가 고정되어 있습니다.

| 순서 | 처리 |
|---|---|
| 1 | 한 claim 안의 중복 인용 제거 |
| 2 | 검색표현 ID 제거 |
| 3 | Context에 없는 ID 제거 |
| 4 | 인용이 남지 않은 claim 제거 |

정리가 끝나면 같은 조건을 한 번 더 검사합니다. 제거로 끝내지 않고 재검증하므로 잘못된 인용이 사용자에게 나가지 않습니다. 이 과정에서 모델을 다시 부르지 않습니다.

같은 ID를 **다른 claim에서 다시 쓰는 것은 허용**합니다. 두 문장이 같은 원문을 근거로 삼는 것은 정상입니다.

답변 문장과 인용 목록은 정리된 claim에서 다시 만듭니다. 모델이 이 둘을 따로 보고하지 않으므로 어긋날 수 없고, 인용 번호도 이 단계가 붙입니다.

### 환경변수

| 환경변수명 | 기본 옵션 | 의미 |
|---|---|---|
| `query.citation_normalization_policy` | `stable_dedup_then_drop_rte_and_noncontext_then_drop_unsupported_claims_v1` | 인용 정리 순서. 이름 자체가 네 단계의 순서입니다 |

원본을 여는 주소를 만드는 것은 이 단계가 아니라 주입된 출처 해석기입니다. 이 단계는 해석기를 호출하고 결과가 같은 청크의 것인지 확인할 뿐입니다.

## 사용 또는 결과 확인

검색·답변 경로가 호출합니다. 응답에서 볼 것은 세 가지입니다.

| 확인할 것 | 정상 |
|---|---|
| 인용 ID | 모두 `ruf_`이고 Context 안에 있습니다 |
| 출처 순서 | 각 claim의 인용 순서와 같습니다 |
| 정리 집계 | 네 값이 모두 0입니다 |

집계가 0이 아니면 이 단계가 아니라 **앞 단계의 신호**입니다. 모델이 지키지 못하는 규칙을 요구하고 있거나 Context에 없는 것을 인용하도록 유도하고 있다는 뜻이므로 [LLM Context 구성](context.md)과 [답변과 출처 표기](structured-answer.md)를 봅니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 인용 정리와 재검증 | `src/struct4search/query/answer/citation_normalizer.py` · `DeterministicCitationNormalizer` |
| 출처 연결 | `src/struct4search/query/answer/citation_linker.py` · `DefaultCitationLinker` |
| 출처 해석 계약 | `src/struct4search/query/contracts.py` · `SourceLinkResolver` · `ResolvedSourceLink` |
| 설정값 | `configs/production.yaml` · `query.citation_normalization_policy` |
