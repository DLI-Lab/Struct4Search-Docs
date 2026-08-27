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

모델에는 시스템 프롬프트와 질의·근거를 담은 사용자 메시지를 전달합니다.

```text
system   시스템 프롬프트

user     질문: {질의}

         근거 1 [ruf_...] document_id=... pages=...
         {원문 청크 본문}

         근거 2 [ruf_...] ...

         JSON 형식으로 답하라.
```

## 근거 구성

원문 청크는 다음과 같이 `근거 N` 형식으로 제공됩니다.

```text
근거 1 [ruf_f0482c0499437992c339593c] document_id=d000734_51f9b5e067 pages=3
건강장해 예방
- 작업 시작 전 건강상태를 확인하고 필요 시 휴식시간에 혈압, 체온 등을 측정
- 주기적으로 건강검진을 수검하고 ...
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

| 환경변수 | 기본값 | 의미 |
|---|---|---|
| `query.reader.generation.`<br>`context_window_tokens` | `16384` | 답변 모델이 한 번에 처리할 수 있는 전체 Context 토큰 수 |
| `query.reader.generation.`<br>`generation_boundary_tokens` | `4` | 입력과 출력 사이에 확보하는 토큰 범위 |
| `query.reader.generation.`<br>`output_token_policy` | `exact_canonical_prompt_`<br>`remainder_no_margin_v1` | 입력에 사용한 토큰을 제외하고 남은 범위를 답변 생성에 사용하는 방식 |

답변에 사용할 수 있는 출력 토큰 수는 고정값이 아니라 전체 Context 길이에 따라 달라집니다.

시스템 프롬프트 전문은 [프롬프트와 출력 검증](../reference/prompts.md)에서 확인할 수 있습니다.

## 실행 및 결과 확인

LLM Context 구성은 검색·답변 파이프라인에서 자동으로 실행됩니다.

구성된 Context에서는 다음을 확인합니다.

| 확인할 것 | 정상 |
|---|---|
| 원문 근거 | 최대 10개이며 검색 결과의 순서를 따릅니다 |
| 근거 ID | 모두 원문 청크 ID(`ruf_`)입니다 |
| 검색표현 | 검색표현을 통해 검색된 청크에만 포함됩니다 |
| 인용 표시 | 검색표현에는 `인용 불가`가 표시됩니다 |

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 근거 구성 | `backend/struct4search/query/answer/`<br>`context_renderer.py` · `render_f400_evidence` |
| 토큰 범위 계산 | `backend/struct4search/query/answer/`<br>`token_budget.py` · `ReaderTokenBudget` |
| 시스템 프롬프트 | `prompts/answer/`<br>`industrial-safety-grounded-claims/v1.txt` |
| 환경변수 | `configs/production.yaml`<br>`query.reader` |
