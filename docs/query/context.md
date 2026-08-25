---
sidebar_position: 6
title: LLM Context 구성
---

# LLM Context 구성

최종 Top-10 원문 청크로 Context를 구성하며, 검색표현을 통해 검색된 청크에 한해서만 그 검색표현을 함께 제공합니다.

## 입력과 출력

| | |
|---|---|
| 입력 | [Top-10 원문 청크](score-integration.md)와 그 청크를 찾아낸 검색표현 |
| 출력 | 시스템 프롬프트 + 질의 + 근거 |

모델에 보내는 메시지는 두 개입니다.

```text
system   시스템 프롬프트
user     질문: {질의}

         근거 1 [ruf_...] document_id=... pages=...
         {원문 청크 본문}

         근거 2 [ruf_...] ...

         JSON 형식으로 답하라.
```

## 근거 한 건의 형식

```text
근거 1 [ruf_f0482c0499437992c339593c] document_id=d000734_51f9b5e067 pages=3
건강장해 예방
- 작업 시작 전 건강상태를 확인하고 필요 시 휴식시간에 혈압, 체온 등을 측정
- 주기적으로 건강검진을 수검하고 ...
```

검색표현을 통해 올라온 청크에는 그 표현이 한 줄 더 붙습니다.

```text
근거 3 [ruf_69b7096d428d67de25c37a08] document_id=d001468_7f73511172 pages=1
|ㅇ 의식이 있는 경우 응급조치 후 증상 개선 없을 시 119 신고|□ 적정 □ 개선 필요|
  [검색표현 rte_2f257c9f73b098c121fe6e39 · 인용 불가] 온열질환 발생 시 응급조치 후 증상 개선이 없으면 119에 신고해야 한다.
```

`· 인용 불가` 표시가 항상 붙습니다. 검색표현은 그 청크가 어떻게 검색됐는지 보여 주는 정보이지 사실의 출처가 아니기 때문입니다. 직접 검색으로 올라온 청크에는 이 줄이 없습니다.

## 동작 방식

1. Top-10 원문 청크를 순위 순서대로 `근거 N` 형식으로 렌더합니다.
2. 검색표현을 통해 올라온 청크에만 그 표현 한 줄을 덧붙입니다.
3. 시스템 프롬프트와 질의, 렌더된 근거를 메시지 두 개로 조립합니다.
4. 프롬프트 토큰 수를 세고 남은 자리를 출력 예산으로 정합니다.

대화 이력이나 예시 응답은 넣지 않습니다. 질의마다 입력이 완전히 독립이어야 두 질의의 결과를 비교할 수 있습니다.

근거가 하나도 없으면 모델을 호출하지 않고 빈 답변으로 넘어갑니다.

### 환경변수

| 환경변수명 | 기본 옵션 | 의미 |
|---|---|---|
| `query.reader.generation.context_window_tokens` | 16384 | 답변 모델이 한 번에 다룰 수 있는 토큰 수 |
| `query.reader.generation.generation_boundary_tokens` | 4 | 프로토콜이 요구하는 여유. 임의로 두는 안전 여백이 아닙니다 |
| `query.reader.generation.output_token_policy` | `exact_canonical_prompt_remainder_no_margin_v1` | 출력 예산을 정하는 방식. 프롬프트가 쓰고 남은 자리를 그대로 씁니다 |

출력 예산은 고정값이 아니라 **컨텍스트 창에서 프롬프트가 쓰고 남은 자리**입니다. 근거가 길면 출력 예산이 줄어듭니다.

시스템 프롬프트 전문은 [프롬프트와 출력 검증](../reference/prompts.md)에 있습니다.

## 사용 또는 결과 확인

검색·답변 경로가 호출합니다. Context에서 볼 것은 세 가지입니다.

| 확인할 것 | 정상 |
|---|---|
| 근거 수 | Top-10 이하이고 순위 순서와 같습니다 |
| 근거 ID | 모두 `ruf_`로 시작합니다 |
| 검색표현 줄 | 있으면 반드시 `· 인용 불가`가 붙어 있습니다 |

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 근거 렌더링과 메시지 조립 | `src/struct4search/query/answer/context_renderer.py` · `render_f400_evidence` |
| 출력 예산 계산 | `src/struct4search/query/answer/token_budget.py` · `ReaderTokenBudget` |
| 시스템 프롬프트 | `prompts/answer/industrial-safety-grounded-claims/v1.txt` |
| 설정값 | `configs/production.yaml` · `query.reader` |
