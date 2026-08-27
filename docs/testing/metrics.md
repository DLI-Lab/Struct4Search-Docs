---
sidebar_position: 4
title: 평가 지표
---

# 평가 지표

검색 지표는 QueryService가 답변에 전달한 최종 Context의 **문서 ID 순위**를 정답 문서 목록(qrels)과 비교해 계산합니다. 청크나 원문 근거 구간의 겹침을 채점하는 지표가 아닙니다. 실행 방법과 결과 파일은 [평가 실행과 통과 판정](retrieval-qa.md)에 있습니다.

## 검색 지표

기본 `k` 값은 1, 5, 10입니다.

| 지표 | 측정하는 것 |
|---|---|
| `reciprocal_rank` | 첫 정답 문서가 나타난 순위의 역수 |
| `hit_at_k` | 상위 k에 관련 문서가 하나라도 있는 비율 |
| `required_recall_at_k` | 필요한 문서 중 상위 k에서 찾은 비율 |
| `minimal_set_success_at_k` | 답변에 충분한 최소 문서 집합을 상위 k에서 모두 찾은 비율 |
| `ndcg_at_k` | 관련도가 높은 문서가 앞에 배치된 정도 |

`hit_at_k`는 정답 문서 하나만 찾아도 성공하지만, `minimal_set_success_at_k`는 평가셋에 정의된 충분한 문서 집합을 모두 찾아야 성공합니다. 두 값의 차이가 크면 답변에 필요한 문서 중 일부만 검색되고 있는지 확인합니다.

## QA 점수

답변 평가는 정답과 필수 답변 항목을 기준으로 외부 평가자가 수행합니다. 현재 평가자 계약의 원점수는 0–4입니다.

| 원점수 | 뜻 |
|---:|---|
| 4 | 모든 필수 내용이 정확하고 중대한 오류가 없음 |
| 3 | 대체로 정확하나 경미한 누락이나 부정확성이 있음 |
| 2 | 핵심 내용의 일부만 충족함 |
| 1 | 최소한의 관련 내용만 있고 중대한 누락이나 오류가 있음 |
| 0 | 오답이거나 무응답 |

통과 판정에 전달하는 `--qa-scores`의 `score`는 원점수를 4로 나눈 0–1 값입니다. evaluator는 답변을 직접 채점하지 않고 전달받은 점수의 누락, 범위, 평균만 검사합니다.

## 인용 집계

`EVALUATION_REPORT.json`의 `citation_normalization`은 답변 후처리에서 제거된 항목을 합산합니다.

| 항목 | 제거된 내용 |
|---|---|
| `duplicate_citations_removed` | 한 답변 항목에서 반복된 같은 인용 |
| `retrieval_expression_citations_removed` | 원문 대신 검색표현을 가리킨 인용 |
| `out_of_context_citations_removed` | 최종 Context에 없는 ID를 가리킨 인용 |
| `unsupported_claims_removed` | 원문 근거가 없는 claim |

값이 0이 아니면 프롬프트, Context 구성 또는 인용 후처리를 확인합니다. 이 집계 자체가 현재 통과 기준의 실패 조건은 아니며, 내용이 있는 답변에 최종 Context의 원문 인용이 하나도 없으면 실패로 판정합니다.

## 결과 해석

| 결과 | 먼저 확인할 부분 |
|---|---|
| 검색 지표가 낮음 | 인덱싱 결과와 검색 단계 |
| 검색 지표는 유지되지만 QA가 낮음 | Context 구성과 답변 생성 |
| `hit_at_k`는 높지만 `minimal_set_success_at_k`가 낮음 | 여러 문서가 필요한 질의의 후보 수와 최종 Context |
| 인용 제거 집계가 증가함 | 답변 프롬프트와 인용 후처리 |

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 검색 지표 계산 | `backend/struct4search/evaluation/retrieval.py` · `score_prediction_rows` |
| 통과 판정 | `backend/struct4search/evaluation/gate.py` · `evaluate_release_gate` |
| QA 원점수 계약 | `backend/struct4search/evaluation/qa.py` |
| QA 점수 정규화 | `backend/struct4search/evaluation/terra_judgments.py` |
