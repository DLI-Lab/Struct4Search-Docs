---
sidebar_position: 4
title: 평가 지표
---

# 평가 지표

`struct4search-evaluate`를 실행한 뒤 검색 점수와 답변 정리 횟수는 `EVALUATION_REPORT.json`, QA 평균과 통과 여부는 `RELEASE_GATE.json`에서 확인합니다. 검색은 최종 Context의 문서 순위로 평가하고, QA는 질의마다 0·1·2 중 하나로 채점합니다. 실행 명령은 [평가 실행과 통과 판정](retrieval-qa.md)에 있습니다.

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

답변은 정답과 필수 답변 항목을 기준으로 0·1·2 중 하나로 채점합니다.

| 점수 | 뜻 |
|---:|---|
| 2 | 필요한 내용을 모두 정확하게 답했고 중대한 오류가 없음 |
| 1 | 일부는 맞지만 중요한 내용이 빠졌거나 중대한 오류가 있음 |
| 0 | 오답이거나 무응답 |

`--qa-scores`에는 질의마다 이 점수를 하나씩 기록합니다. evaluator는 점수를 새로 만들지 않고, 누락된 질의와 허용하지 않는 값이 없는지 확인한 뒤 0–2 범위의 평균을 계산합니다.

## 답변에서 제거된 항목

답변 모델이 만든 결과에는 중복되거나 원문을 가리키지 않는 인용이 섞일 수 있습니다. Struct4Search는 응답을 내보내기 전에 이런 항목을 제거합니다. `EVALUATION_REPORT.json`의 `citation_normalization`은 평가한 모든 질의에서 각 항목을 몇 번 제거했는지 합산한 값이며, 최종 답변에 남은 인용 수가 아닙니다.

| 필드 | 실제로 제거한 것 |
|---|---|
| `duplicate_citations_removed` | 같은 답변 문장에 반복해서 붙은 동일한 원문 ID |
| `retrieval_expression_citations_removed` | 원문 청크가 아니라 검색을 위해 생성한 문장을 가리킨 ID |
| `out_of_context_citations_removed` | 해당 질의의 최종 Context에 들어 있지 않은 원문 ID |
| `unsupported_claims_removed` | 유효한 원문 인용이 하나도 남지 않은 답변 문장 |

모두 `0`이면 제거할 항목이 없었다는 뜻입니다. 값이 `0`보다 크면 최종 답변은 정리되어 정상으로 보일 수 있지만, 모델의 원래 출력에는 잘못된 인용이나 근거 없는 문장이 있었다는 뜻입니다. 어떤 질의에서 제거됐는지는 `retrieval_predictions.query_service.jsonl`의 같은 필드를 확인합니다. 이 횟수만으로 평가가 실패하지는 않지만, 내용이 있는 최종 답변에 원문 인용이 하나도 없으면 통과하지 못합니다. 인용을 정리하는 규칙은 [답변 후처리 및 원본 출처 연결](../query/citations.md)에 있습니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 검색 지표 계산 | `backend/struct4search/evaluation/retrieval.py` · `score_prediction_rows` |
| 통과 판정 | `backend/struct4search/evaluation/gate.py` · `evaluate_release_gate` |
| QA 점수 계약 | `backend/struct4search/evaluation/qa.py` |
| QA 점수 검사와 집계 | `backend/struct4search/evaluation/terra_judgments.py` |
