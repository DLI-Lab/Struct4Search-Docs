---
sidebar_position: 2
title: 평가셋
---

# 평가셋

검색과 답변 품질을 같은 조건에서 반복해서 비교할 수 있도록 문서와 질문을 고정한 평가 자료를 설명합니다. 100문서 평가셋은 변경 중 빠른 확인에 사용하고, 전체 문서 평가셋은 전체 코퍼스에서 최종 성능을 확인할 때 사용합니다. 평가 자료는 Git 저장소에 포함되지 않으므로 서버의 환경변수로 위치를 지정해야 합니다.

| 평가셋 | 구성 | 사용하는 경우 | 실행 명령 |
|---|---|---|---|
| 100문서 평가셋 | 100문서·100질의 | 코드·모델·설정 변경 뒤 빠른 품질 확인 | `struct4search-final-100-100-e2e` |
| 전체 문서 평가셋 | 2,567문서·200질의 | 전체 코퍼스의 최종 성능과 회귀 확인 | `struct4search-final-full-2567-200-e2e` |

두 명령은 평가 전용 저장소와 검색 자원을 사용하며 현재 운영 검색 경로를 새 결과로 전환하지 않습니다.

## 100문서 평가셋

고정된 문서 100건을 다시 인덱싱하고 100개 질문의 검색 결과와 답변을 평가합니다. 전체 문서 평가는 실행 비용과 시간이 크므로, 파이프라인·모델·검색 설정을 바꾼 뒤 문제가 없는지 먼저 확인하는 데 사용합니다. 검색 대상이 100문서로 제한되므로 최종 성능 판정에는 사용하지 않습니다.

현재 서버에서는 `configs/machine-paths.yaml`에 등록된 경로를 사용합니다. 다른 서버에서는 원본 문서와 평가 자료가 들어 있는 상위 디렉터리를 먼저 지정합니다.

```bash
export S4S_ARTIFACT_TEST_FIXTURE_ROOT=/absolute/path/to/test-fixtures
```

```bash
struct4search-final-100-100-e2e
```

이 디렉터리 아래의 고정 문서와 다음 평가 파일을 사용합니다. 코드에 기록된 SHA-256이나 파일 구성이 다르면 실행을 시작하지 않습니다.

| 파일 | 내용 |
|---|---|
| `release_manifest.jsonl` | 평가 파일과 해시 목록 |
| `documents.jsonl` | 평가할 100문서 목록 |
| `queries.jsonl` | `q001`부터 `q100`까지의 질문 |
| `qrels.jsonl` | 질문별 정답 문서와 관련도 |
| `answers.jsonl` | 정답 답변 |
| `evidence.jsonl` | 답변 근거 위치 |
| `dataset.jsonl` | 질문별 필수 문서와 답변 항목 |
| `multi_hop_dependencies.jsonl` | 여러 문서가 필요한 질문의 문서 관계 |

## 전체 문서 평가셋

전체 2,567문서를 검색 대상으로 사용하고 200개 질문의 검색 결과와 답변을 평가합니다. 실제 전체 코퍼스에서 검색 난이도와 답변 품질을 측정하므로, 변경 전 결과와 비교하거나 배포 전 최종 회귀를 확인할 때 사용합니다.

현재 서버에서는 `configs/machine-paths.yaml`에 등록된 경로를 사용합니다. 다른 서버에서는 전체 평가 자료가 들어 있는 디렉터리를 먼저 지정합니다.

```bash
export S4S_ARTIFACT_EVALUATION_ROOT=/absolute/path/to/full-evaluation-set
```

```bash
struct4search-final-full-2567-200-e2e
```

`configs/evaluation-release.json`에는 다음 파일의 이름과 예상 수량이 정의되어 있습니다.

| 파일 | 내용 |
|---|---|
| `corpus_manifest.jsonl` | 검색 대상 2,567문서 |
| `queries.jsonl` | 200개 질문 |
| `qrels.jsonl` | 질문별 정답 문서와 관련도 |
| `qa_gt.jsonl` | 정답 답변과 근거 |
| `gt_documents.jsonl` | 정답 문서 목록 |
| `dataset.jsonl` | 질문별 필수 문서와 답변 항목 |
| `VALIDATION_REPORT.json` | 평가 자료의 구조 검사 결과 |
| `TERRA_ULTRA_FINAL_AUDIT.json` | 평가 자료의 승인 결과 |

실행 전에 문서 2,567건, 질문 200건, qrels 242건, 정답 문서 166건, 근거 350건과 각 파일의 상태를 검사합니다. 수량이나 필수 파일이 다르면 평가를 시작하지 않습니다.

## 평가 자료를 변경할 때

질문, 정답 문서, 정답 답변 또는 근거를 수정하면 별도의 새 평가셋으로 보관하고 기준 결과(baseline)도 다시 만듭니다. 기존 파일을 덮어쓰면 변경 전후 결과를 같은 조건으로 비교할 수 없습니다.

## 코드 참조

| 확인할 내용 | 파일 |
|---|---|
| 전체 평가셋 파일·수량 정의 | `configs/evaluation-release.json` |
| 전체 평가셋 검사 | `backend/struct4search/evaluation/datasets.py` |
| 100문서 평가셋 검사 | `backend/struct4search/e2e/final_fixture.py` |
| 서버별 평가 자료 경로 | `configs/machine-paths.yaml` |
