---
sidebar_position: 6
title: LLM Context 구성
---

# LLM Context 구성

최종 Top-10 원문 청크를 답변 근거로 구성하고, 검색표현을 통해 검색된 청크에 한해서만 해당 검색표현을 함께 제공합니다.

## 입력과 출력

| 구분 | 내용 |
|---|---|
| 입력 | [Top-10 원문 청크](score-integration.md)와 해당 청크를 찾아낸 검색표현 |
| 출력 | 시스템 프롬프트 + 질의 + 답변 근거 |

모델에는 시스템 프롬프트와 질의·근거를 담은 사용자 메시지를 전달합니다. 아래는 형식을 보여 주는 짧은 예입니다. 실제 시스템 프롬프트 전문은 설정에 등록된 파일을 사용합니다.

```text
system   제공된 원문 근거만 사용하고, 각 답변 문장에 근거 ID를 연결한다.

user     질문: 온열 질환 의심자가 생기면 어떻게 하나요?

         근거 1 [ruf_f0482c0499437992c339593c] document_id=d000734_51f9b5e067 pages=3
         작업 시작 전 건강상태를 확인하고 필요 시 체온을 측정한다.

         근거 2 [ruf_69b7096d428d67de25c37a08] document_id=d001468_7f73511172 pages=1
         의식이 있는 경우 응급조치 후 증상 개선이 없으면 119에 신고한다.

         JSON 형식으로 답하라.
```

## 근거 구성

원문 청크는 다음과 같이 `근거 N` 형식으로 제공됩니다.

```text
근거 1 [ruf_f0482c0499437992c339593c] document_id=d000734_51f9b5e067 pages=3
건강장해 예방
- 작업 시작 전 건강상태를 확인하고 필요 시 휴식시간에 혈압, 체온 등을 측정
- 주기적으로 건강검진을 받고 결과에 따라 필요한 조치를 한다.
```

검색표현을 통해 검색된 청크에는 해당 검색표현을 함께 제공합니다.

```text
근거 3 [ruf_69b7096d428d67de25c37a08] document_id=d001468_7f73511172 pages=1
|ㅇ 의식이 있는 경우 응급조치 후 증상 개선 없을 시 119 신고|□ 적정 □ 개선 필요|

[검색표현 rte_2f257c9f73b098c121fe6e39 · 인용 불가]
온열질환 발생 시 응급조치 후 증상 개선이 없으면 119에 신고해야 한다.
```

검색표현은 관련 원문을 찾는 데 사용하는 보조 정보이므로 **답변의 사실 근거나 Citation으로 사용할 수 없습니다.** 직접 검색된 원문 청크에는 검색표현이 붙지 않습니다.

## 동작 방식

1. Top-10 원문 청크를 검색 순서대로 `근거 N` 형식으로 구성합니다.
2. 검색표현을 통해 검색된 청크에만 해당 검색표현을 덧붙입니다.
3. 시스템 프롬프트와 질의, 구성된 근거를 답변 모델의 입력으로 만듭니다.
4. 전체 입력 길이를 확인해 답변 생성에 사용할 토큰 범위를 정합니다.

질의마다 입력은 독립적으로 구성하며, 이전 대화 이력이나 예시 답변은 포함하지 않습니다.

검색 결과에 사용할 원문 근거가 없으면 답변 모델을 호출하지 않습니다.

## 환경변수

| profile key | 현재 production 값 | 의미 |
|---|---|---|
| `query.reader.generation.`<br />`context_window_tokens` | `16384` | 답변 모델이 한 번에 처리할 수 있는 전체 Context 토큰 수 |
| `query.reader.generation.`<br />`generation_boundary_tokens` | `4` | 입력과 출력 사이에 확보하는 토큰 범위 |
| `query.reader.generation.`<br />`output_token_policy` | `exact_canonical_prompt_`<br />`remainder_no_margin_v1` | 입력에 사용한 토큰을 제외하고 남은 범위를 답변 생성에 사용하는 방식 |

답변에 사용할 수 있는 출력 토큰 수는 고정값이 아니라 전체 Context 길이에 따라 달라집니다.

시스템 프롬프트 전문은 [프롬프트와 출력 검증](../reference/prompts.md)에서 확인할 수 있습니다.

## API 요청에서 이 단계 확인하기

답변 근거 구성은 `POST /v1/responses` 요청 안에서 실행됩니다. 모델에 보낸 전체 메시지는 공개 API 응답에 노출하지 않지만, 실제로 사용한 원문 근거는 응답의 `search_results`에서 확인할 수 있습니다.

| 확인 대상 | 확인 위치·방법 | 정상 | 비정상 |
|---|---|---|---|
| 원문 근거 | `search_results`와 `answer_context.original_block_count`를 확인합니다. | 원문 결과가 최대 10건이고 두 값의 개수가 같습니다. | 개수가 다르거나 `search_results`에 `rte_` ID가 있으면 답변 근거 구성이 잘못된 상태입니다. |
| 검색표현 경로 | 각 결과의 `attributes.winner_retrieval_expression_id`를 확인합니다. | 검색표현을 거쳐 찾은 원문에만 `rte_` ID가 있습니다. 검색표현 자체는 근거 목록에 없습니다. | 검색표현이 원문 대신 최종 근거로 들어가면 인용할 수 없는 자료가 섞인 상태입니다. |
| 근거가 없는 질의 | `insufficient_evidence`, `answer`, `citations`를 확인합니다. | `insufficient_evidence`가 `true`이고 답변은 빈 문자열, 인용은 빈 목록입니다. 이 경우 답변 모델을 호출하지 않습니다. | 근거가 없는데 답변이나 인용이 생기면 근거 제한을 위반한 상태입니다. |
| 원본 연결 | 각 검색 결과의 `grounding`을 확인합니다. | 원문을 연 문서 주소와 페이지 범위가 있습니다. | 원문 ID와 문서·페이지가 연결되지 않으면 응답 생성이 오류로 끝납니다. |

모델에 보내는 메시지의 정확한 순서와 `인용 불가` 표시는 설치할 때 만든 가상환경을 활성화한 뒤 Struct4Search 저장소의 최상위 디렉터리에서 다음 명령으로 확인할 수 있습니다.

```bash
python -m pytest tests/unit/query/test_canonical_query_service.py
```

이 테스트는 준비된 원문 결과를 이용해 답변 근거 문장을 만들며 실제 모델을 호출하지 않습니다. 테스트가 통과하면 원문 순서, 검색표현 표시와 근거 ID 제한이 코드와 일치합니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 근거 구성 | `backend/struct4search/query/answer/`<br />`context_renderer.py` · `render_f400_evidence` |
| 토큰 범위 계산 | `backend/struct4search/query/answer/`<br />`token_budget.py` · `ReaderTokenBudget` |
| 시스템 프롬프트 | `prompts/answer/`<br />`industrial-safety-grounded-claims/v1.txt` |
| 환경변수 | `configs/production.yaml`<br />`query.reader` |
