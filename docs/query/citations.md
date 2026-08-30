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

공개 API 응답에서는 답변 뒤에 인용한 원문 청크 ID가 붙고, `citations`와 `search_results`에서 같은 원문의 출처를 확인할 수 있습니다. 아래는 원문 한 건을 인용한 짧은 응답 예입니다.

```json
{
  "answer": "근로자가 작업중지를 요청하면 즉시 필요한 조치를 해야 합니다. [ruf_3612bfa54e64f90ad761c4c9]",
  "citations": [
    {
      "unit_id": "ruf_3612bfa54e64f90ad761c4c9"
    }
  ],
  "search_results": [
    {
      "unit_id": "ruf_3612bfa54e64f90ad761c4c9",
      "doc_id": "d000786_459d662b8a",
      "grounding": {
        "source_uri": "manifest://d000786_459d662b8a/ruf_3612bfa54e64f90ad761c4c9",
        "source_display_name": "d000786_459d662b8a",
        "block_id": "ruf_3612bfa54e64f90ad761c4c9",
        "page_span": {
          "first": 0,
          "last": 0
        }
      },
      "answer_used": true
    }
  ]
}
```

`citations`에는 답변에 실제로 사용한 원문 청크 ID가 들어갑니다. 같은 ID의 `search_results` 항목에서 문서 주소와 페이지 범위를 찾을 수 있습니다. `page_span`은 0부터 시작하므로 `0`은 원본의 첫 페이지를 뜻합니다.

## 동작 방식

1. LLM이 반환한 `cited_unit_ids`를 정리하고 검증합니다.
2. 유효한 원문 청크를 실제 문서와 원본 페이지에 연결합니다.
3. 답변 문장에 원문 청크 ID를 붙이고 출처 목록을 구성합니다.

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

## API 요청에서 이 단계 확인하기

이 단계는 `POST /v1/responses` 요청의 마지막에 실행됩니다. 공개 응답에는 내부에서 제거한 인용 개수를 따로 싣지 않으므로, 최종 `answer`, `citations`와 `search_results`가 서로 맞는지 확인합니다.

| 확인 대상 | 확인 위치·방법 | 정상 | 비정상 |
|---|---|---|---|
| 인용 ID | `citations[*].unit_id`를 확인합니다. | 모든 ID가 `ruf_`로 시작하고 중복이 없습니다. | `rte_` ID나 같은 ID가 두 번 있으면 인용 정리가 잘못된 상태입니다. |
| 답변과 인용 목록 | `answer`의 대괄호 안 ID와 `citations`를 비교합니다. | 답변에 붙은 ID와 인용 목록이 같습니다. | 어느 한쪽에만 있는 ID가 있으면 최종 응답 계약을 위반한 상태입니다. |
| 원본 문서 연결 | 인용 ID와 같은 `search_results` 항목의 `grounding`을 확인합니다. | `source_uri`, `source_display_name`, `block_id`, `page_span`이 있습니다. | 인용한 원문의 문서 주소나 페이지를 찾을 수 없으면 응답 생성이 오류로 끝나야 합니다. |
| 근거 없는 답변 처리 | `insufficient_evidence`, `answer`, `citations`를 확인합니다. | 유효한 답변 문장이 모두 제거되면 근거 부족으로 표시되고 답변과 인용이 비어 있습니다. | 유효한 인용이 없는 문장이 답변에 남으면 비정상입니다. |

중복 인용 제거, 검색표현 ID 제거와 원본 연결 규칙은 설치할 때 만든 가상환경을 활성화한 뒤 Struct4Search 저장소의 최상위 디렉터리에서 다음 명령으로 확인할 수 있습니다.

```bash
python -m pytest tests/unit/query/test_citation_normalizer.py tests/unit/web/test_legacy_response_transport.py
```

이 테스트는 실제 모델이나 외부 서버를 호출하지 않고 잘못된 인용을 정리한 뒤 공개 API 응답으로 바꾸는 과정을 검사합니다. 실패하면 출력에 표시된 인용 규칙 또는 원본 연결 항목을 확인합니다.

## 코드 참조

| 확인할 내용   | 파일·심볼                                                                                       |
| -------- | ------------------------------------------------------------------------------------------- |
| 인용 정리    | `backend/struct4search/query/answer/citation_normalizer.py` · `DeterministicCitationNormalizer` |
| 원본 출처 연결 | `backend/struct4search/query/answer/citation_linker.py` · `DefaultCitationLinker`               |
| 출처 연결 계약 | `backend/struct4search/query/contracts.py` · `SourceLinkResolver`                               |
| profile    | `configs/production.yaml` · `query.citation_normalization_policy`                           |
