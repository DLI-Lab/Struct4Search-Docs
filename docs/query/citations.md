---
sidebar_position: 8
title: 답변 후처리 및 원본 출처 연결
---

# 답변 후처리 및 원본 출처 연결

LLM이 반환한 인용을 검증하고, 인용된 원문 청크를 실제 문서와 원본 페이지에 연결해 사용자에게 보여줄 형태로 구성합니다.

## 입력과 출력

| | |
|---|---|
| 입력 | [LLM이 생성한 `claims`](structured-answer.md) |
| 출력 | 후처리된 답변과 원본 출처 |

사용자에게는 다음과 같은 형태로 반환됩니다.

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

출처 하나는 다음과 같은 정보를 가집니다.

```json
{
  "unit_id": "ruf_3612bfa54e64f90ad761c4c9",
  "document_id": "d000786_459d662b8a",
  "page_number": 1,
  "href": "..."
}
```

## 동작 방식

1. LLM이 반환한 `cited_unit_ids`를 정리하고 검증합니다.
2. 유효한 원문 청크를 실제 문서와 원본 페이지에 연결합니다.
3. 답변 문장에 인용 번호를 붙이고 출처 목록을 구성합니다.

인용은 다음 순서로 정리합니다.

| 순서 | 처리                     |
| -- | ---------------------- |
| 1  | 같은 claim 안의 중복 인용 제거   |
| 2  | 검색표현 ID 제거             |
| 3  | Context에 없는 ID 제거      |
| 4  | 유효한 인용이 남지 않은 claim 제거 |

검색표현은 검색을 돕기 위한 데이터이므로 최종 Citation으로 사용할 수 없습니다. 또한 LLM Context에 포함되지 않은 원문 청크도 인용할 수 없습니다.

같은 원문 청크를 여러 claim이 함께 사용하는 것은 허용합니다.

정리가 끝난 인용 ID는 원문 청크의 문서 정보와 페이지에 연결되고, 사용자가 원본을 확인할 수 있는 출처 링크로 구성됩니다. 이 과정에서는 LLM을 다시 호출하지 않습니다.

### 설정값

| profile key                               | 현재 production 값                                                                       | 의미               |
| ------------------------------------- | --------------------------------------------------------------------------- | ---------------- |
| `query.citation_normalization_policy` | `stable_dedup_then_drop_rte_and_noncontext_then_drop_unsupported_claims_v1` | 인용을 검증하고 정리하는 정책 |

## 사용 또는 결과 확인

이 단계는 검색·답변 파이프라인의 마지막에 실행됩니다.

응답에서는 다음을 확인합니다.

| 확인할 것    | 정상                     |
| -------- | ---------------------- |
| 인용 ID    | 모두 원문 청크 ID(`ruf_`)입니다 |
| 출처       | 문서와 원본 페이지가 연결되어 있습니다  |
| 인용 정리 집계 | 네 값이 모두 `0`입니다         |

인용 정리 집계가 `0`이 아니면 LLM 출력에 인용 계약을 벗어난 항목이 있었다는 뜻입니다. 이 경우 [LLM Context 구성](context.md)과 [답변과 출처 표기](structured-answer.md)를 함께 확인합니다.

## 코드 참조

| 확인할 내용   | 파일·심볼                                                                                       |
| -------- | ------------------------------------------------------------------------------------------- |
| 인용 정리    | `backend/struct4search/query/answer/citation_normalizer.py` · `DeterministicCitationNormalizer` |
| 원본 출처 연결 | `backend/struct4search/query/answer/citation_linker.py` · `DefaultCitationLinker`               |
| 출처 연결 계약 | `backend/struct4search/query/contracts.py` · `SourceLinkResolver`                               |
| profile    | `configs/production.yaml` · `query.citation_normalization_policy`                           |
