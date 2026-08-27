---
sidebar_position: 2
title: 평가셋과 릴리스
---

# 평가셋과 릴리스

고정 100문서·100질의는 `struct4search-final-100-100-e2e`, 전체 2,567문서·200질의는 `struct4search-final-full-2567-200-e2e`로 실행합니다. 실행 전에 100/100 자료는 `S4S_ARTIFACT_TEST_FIXTURE_ROOT`, 2567/200 자료는 `S4S_ARTIFACT_EVALUATION_ROOT`로 지정합니다. 평가 자료는 Git 저장소에 포함되지 않습니다.

| 평가셋 | 규모 | 실행 명령 | 용도 |
|---|---:|---|---|
| 100/100 | 100문서·100질의 | `struct4search-final-100-100-e2e` | 전체 경로를 비교적 작은 고정 코퍼스로 확인 |
| 2567/200 | 2,567문서·200질의 | `struct4search-final-full-2567-200-e2e` | 전체 코퍼스의 최종 회귀 확인 |

두 명령은 별도의 실행 자원을 만들며 현재 운영 검색 경로를 새 결과로 전환하지 않습니다. 문서 한 건으로 서비스 연결만 확인하려면 `struct4search-smoke-e2e`를 사용합니다.

## 100/100 릴리스

`struct4search-final-100-100-e2e`는 `S4S_ARTIFACT_TEST_FIXTURE_ROOT` 아래의 고정 문서와 평가 자료를 사용합니다. 코드에 기록된 SHA-256과 파일 구성이 다르면 실행을 시작하지 않습니다.

| 파일 | 내용 |
|---|---|
| `release_manifest.jsonl` | 릴리스 파일과 해시 |
| `documents.jsonl` | 평가 문서 목록 |
| `queries.jsonl` | `q001`부터 `q100`까지의 질의 |
| `qrels.jsonl` | 질의별 정답 문서와 관련도 |
| `answers.jsonl` | 정답 답변 |
| `evidence.jsonl` | 답변 근거 위치 |
| `dataset.jsonl` | 질의별 필수 문서와 답변 항목을 묶은 평가 자료 |
| `multi_hop_dependencies.jsonl` | 여러 문서가 필요한 질의의 의존 관계 |

## 2567/200 릴리스

`configs/evaluation-release.json`이 릴리스의 파일명과 예상 행 수를 선언합니다. 실제 경로는 `S4S_ARTIFACT_EVALUATION_ROOT`로 지정합니다.

| 파일 | 내용 |
|---|---|
| `corpus_manifest.jsonl` | 검색 대상 2,567문서 |
| `queries.jsonl` | 200개 질의 |
| `qrels.jsonl` | 질의별 정답 문서와 관련도 |
| `qa_gt.jsonl` | 정답 답변 |
| `gt_documents.jsonl` | 정답 문서 |
| `dataset.jsonl` | 질의별 필수 문서와 답변 항목을 묶은 평가 자료 |
| `VALIDATION_REPORT.json` | 평가 자료의 구조 검사 결과 |
| `TERRA_ULTRA_FINAL_AUDIT.json` | 평가 릴리스 승인 결과 |

릴리스 계약은 문서 2,567건, 질의 200건, qrels 242건, 정답 문서 166건, 근거 350건을 확인합니다. 선언한 파일이나 행 수가 다르면 평가가 거부됩니다.

## 수정 규칙

질의, 정답, qrels 또는 근거를 수정하면 새 릴리스로 만들고 기준 보고서도 다시 생성합니다. 같은 릴리스의 파일을 덮어쓰면 이전 결과와 같은 조건으로 비교할 수 없습니다.

## 코드 참조

| 확인할 내용 | 파일 |
|---|---|
| 2567/200 릴리스 선언 | `configs/evaluation-release.json` |
| 릴리스 해석과 행 수 검사 | `backend/struct4search/evaluation/datasets.py` |
| 100/100 고정 자산 검사 | `backend/struct4search/e2e/final_fixture.py` |
| 서버별 평가 자료 경로 | `configs/machine-paths.yaml` |
