---
sidebar_position: 4
title: 평가 지표
---

# 평가 지표

평가가 끝난 뒤 “필요한 문서를 제대로 찾았는가”와 “답변이 맞는가”를 판단할 때 보는 값을 설명합니다. 검색 지표와 답변 정리 횟수는 `EVALUATION_REPORT.json`, QA 평균과 최종 통과 여부는 `RELEASE_GATE.json`에서 확인합니다.

## 검색 지표

검색 지표는 답변을 만들 때 사용한 최종 Context의 문서 순위를 정답 문서 목록과 비교합니다. 원문 안의 정확한 문장 위치를 채점하는 값은 아닙니다. 기본 `k` 값은 1, 5, 10입니다.

| 지표 | 측정하는 것 |
|---|---|
| `reciprocal_rank` | 첫 번째 정답 문서가 얼마나 앞에 나왔는지 |
| `hit_at_k` | 상위 k개 안에 정답 문서가 하나라도 있는 질문의 비율 |
| `required_recall_at_k` | 답변에 필요한 문서 중 상위 k개 안에서 찾은 비율 |
| `minimal_set_success_at_k` | 답변에 필요한 최소 문서 묶음을 상위 k개 안에서 모두 찾은 질문의 비율 |
| `ndcg_at_k` | 관련도가 높은 정답 문서가 앞에 배치된 정도 |

## QA 점수

생성한 답변을 정답과 비교해 질문마다 0·1·2 중 하나로 채점합니다.

| 점수 | 뜻 |
|---:|---|
| 2 | 필요한 내용을 모두 정확하게 답했고 중대한 오류가 없음 |
| 1 | 일부는 맞지만 중요한 내용이 빠졌거나 중대한 오류가 있음 |
| 0 | 오답이거나 무응답 |

질문별 점수는 `--qa-scores` 파일에 기록합니다. evaluator는 모든 질문에 허용된 점수가 있는지 확인하고 평균을 계산합니다. 평균은 0에서 2 사이의 값이며 `RELEASE_GATE.json`의 `checks` 배열에서 `check`가 `qa_mean_score`인 항목의 `actual` 값으로 확인합니다.

## 답변에서 제거된 항목

답변 모델이 만든 결과에는 같은 출처를 반복하거나, 원문이 아닌 검색용 문장을 출처로 가리키거나, 실제로 제공하지 않은 근거 ID를 적는 경우가 있습니다. Struct4Search는 이런 항목을 답변에서 제거한 뒤 사용자에게 전달합니다.

`EVALUATION_REPORT.json`의 `citation_normalization`은 평가한 모든 질문에서 무엇을 몇 번 제거했는지 보여줍니다. 최종 답변에 남은 인용 수를 뜻하지 않습니다.

| 필드 | 실제로 제거한 것 |
|---|---|
| `duplicate_citations_removed` | 같은 답변 문장에 반복해서 붙은 동일한 원문 ID |
| `retrieval_expression_citations_removed` | 원문이 아니라 검색을 위해 생성한 문장을 가리킨 ID |
| `out_of_context_citations_removed` | 해당 질문의 최종 Context에 들어 있지 않은 원문 ID |
| `unsupported_claims_removed` | 유효한 원문 인용이 하나도 남지 않은 답변 문장 |

모두 `0`이면 제거할 항목이 없었다는 뜻입니다. 값이 `0`보다 크면 최종 답변은 정리되어 정상으로 보이더라도 모델의 원래 출력에는 잘못된 인용이나 근거 없는 문장이 있었습니다. 어떤 질문에서 제거됐는지는 `retrieval_predictions.query_service.jsonl`의 `citation_normalization`에서 확인합니다.

이 횟수 자체는 통과 조건이 아닙니다. 다만 내용이 있는 최종 답변에 원문 인용이 하나도 없으면 통과하지 못합니다. 인용을 정리하는 규칙은 [답변 후처리 및 원본 출처 연결](../query/citations.md)에 있습니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 검색 지표 계산 | `backend/struct4search/evaluation/retrieval.py` · `score_prediction_rows` |
| 통과 판정 | `backend/struct4search/evaluation/gate.py` · `evaluate_release_gate` |
| QA 점수 계약 | `backend/struct4search/evaluation/qa.py` |
| QA 점수 검사와 집계 | `backend/struct4search/evaluation/terra_judgments.py` |
