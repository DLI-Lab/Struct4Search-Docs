---
sidebar_position: 3
title: 파이프라인 구현 변경 및 확장
---

# 파이프라인 구현 변경 및 확장

검색 방식이나 문서 처리 단계를 코드로 바꿀 때 확인할 위치와 순서를 설명합니다. 설정값만 바꾸려는 경우에는 이 페이지가 아니라 [설정 수정](configuration.md)을 따릅니다.

## 먼저 변경 종류를 구분합니다

| 하려는 일 | 변경 범위 | 이 페이지에서 볼 절 |
|---|---|---|
| 검색 깊이, 모델 이름, 청크 크기처럼 이미 있는 값을 바꿈 | 설정 파일만 수정 | [설정 수정](configuration.md) |
| 입력과 결과 형식은 그대로 두고 검색기, Reader, Metadata 생성 코드 등을 바꿈 | 기존 연결 규칙을 지키는 새 동작 코드를 작성 | [검색·답변 구현 교체](#검색답변-구현-교체) 또는 [인덱싱 단계 구현 교체](#인덱싱-단계-구현-교체) |
| 기존에 없던 처리 결과를 만들고 다음 단계로 넘김 | 결과 형식, 실행 순서와 조립 코드를 함께 수정 | [새 인덱싱 단계 추가](#새-인덱싱-단계-추가) |

입력이나 결과의 필드가 달라지면 단순 교체가 아닙니다. 그 결과를 받는 다음 단계까지 함께 바꾸어야 합니다.

## 코드가 연결되는 순서

Struct4Search는 다음 순서로 실행할 코드를 정합니다.

```text
실행 profile
→ composition.py가 profile에 적힌 구현을 선택
→ FrontStageGraph, BackStageGraph 또는 QueryService에 실제 동작 코드를 연결
→ 각 단계가 정해진 입력을 받고 정해진 결과를 반환
```

각 파일의 역할은 다음과 같습니다.

| 역할 | 위치 | 확인할 내용 |
|---|---|---|
| 단계가 받을 입력과 반환할 결과 | `backend/struct4search/ingest/contracts.py`, `backend/struct4search/query/contracts.py` | 데이터 필드와 유효성 검사 |
| 단계가 반드시 제공해야 하는 함수 | `backend/struct4search/ingest/ports.py`, `backend/struct4search/query/contracts.py` | 함수 이름, 인자와 반환 형식 |
| 단계의 실제 동작 | `backend/struct4search/ingest/stages/`, `backend/struct4search/query/` | 파싱, Metadata, 검색, Reader 등의 처리 |
| 인덱싱 실행 순서 | `backend/struct4search/ingest/front.py`, `backend/struct4search/ingest/back.py` | 어느 단계 다음에 실행되는지 |
| 실제 동작 코드 연결 | `backend/struct4search/adapters/orchestration/front_pipeline.py`, `back_pipeline.py`, `backend/struct4search/bootstrap/composition.py` | profile로 선택한 코드를 어느 자리에 넣는지 |

## 검색·답변 구현 교체

검색·답변 파이프라인은 다음 세 부분을 바꾸어 끼울 수 있습니다.

| 부분 | 지켜야 할 함수 | 입력과 결과 |
|---|---|---|
| 질의 Embedding | `EmbeddingPort.embed()` | 질문 문자열 → 숫자 벡터 |
| 검색 | `RetrievalStrategy.retrieve()` | 질문과 질의 벡터 → 검색 후보 목록 |
| 답변 생성 | `Reader.generate()` | 질문과 최종 원문 근거 → 답변 문장과 근거 ID |

아래는 검색 방식을 새로 추가하는 순서입니다.

### 1. 입력과 결과 형식을 먼저 확인합니다

`backend/struct4search/query/contracts.py`의 `RetrievalRequest`, `RetrievalBatch`와 `RetrievalStrategy`를 확인합니다. 새 검색 코드는 이 형식을 그대로 사용해야 합니다.

```python
class MyRetrieval:
    async def retrieve(self, request: RetrievalRequest, /) -> RetrievalBatch:
        # request.query와 request.query_vector로 검색합니다.
        # 결과는 RetrievalHit으로 만든 뒤 RetrievalBatch에 담습니다.
        return RetrievalBatch(hits=())
```

실제 구현은 `backend/struct4search/query/retrieval/` 아래에 둡니다. 검색 결과를 만들 때는 점수, 순위, 원문인지 검색표현인지와 원문 연결 정보를 빠뜨리지 않습니다.

### 2. 조립 함수를 추가합니다

`backend/struct4search/bootstrap/composition.py`에 새 검색기와 필요한 Embedding, Reader를 묶어 `QueryDependencies`를 만드는 함수를 추가합니다. 이 함수는 마지막에 `compose_query()`를 호출해 공통 `QueryService`를 반환해야 합니다.

새 이름을 `DEFAULT_QUERY_STRATEGIES`에 등록합니다. 등록하지 않은 이름이 profile에 들어오면 모델이나 OpenSearch에 연결하기 전에 실행이 거부됩니다.

### 3. 별도 profile에서 선택합니다

처음부터 `configs/production.yaml`을 바꾸지 않습니다. 다음처럼 production 설정을 상속하는 시험용 profile을 만들고 새 검색 방식만 지정합니다.

```yaml
extends: ../production.yaml
profile_id: struct4search-my-retrieval
profile_version: "2026-08-31"
execution:
  mode: experiment
  publish_alias: false
query:
  retrieval_strategy: my_retrieval
  retrieval_strategy_params: {}
```

`configs/experiments/module-swap-stub.yaml`은 Parser, 검색기와 Reader를 외부 서비스 없이 교체하는 실제 예시입니다.

### 4. 같은 공용 진입점으로 확인합니다

API와 evaluator는 모두 `compose_profile_query()`에서 선택한 같은 `QueryService`를 사용합니다. 새 코드만 따로 호출하는 시험으로 끝내지 않고, profile 선택과 공개 API 응답까지 확인합니다.

```bash
python -m pytest -q \
  tests/unit/config/test_profile_query_composition.py \
  tests/unit/query/test_runtime_entrypoints.py
```

테스트에는 다음 경우를 넣습니다.

- 새 profile을 선택하면 새 검색 코드가 사용됩니다.
- 알 수 없는 구현 이름이나 잘못된 옵션은 외부 연결 전에 거부됩니다.
- 검색 코드가 실패한 뒤 다른 profile을 실행해도 이전 상태가 남지 않습니다.
- `POST /v1/responses`의 필드와 Citation 형식은 교체 전과 같습니다.

## 인덱싱 단계 구현 교체

입력과 결과를 유지하면서 한 단계의 내부 처리만 바꾸는 경우에는 실행 순서를 수정할 필요가 없습니다.

예를 들어 Metadata 생성 코드를 교체할 때는 다음 순서로 진행합니다.

1. `backend/struct4search/ingest/ports.py`의 `MetadataPort.extract()`를 확인합니다. 입력은 Canonical IDR와 원문 청크이고 결과는 `StageResult[MetadataOutput]`입니다.
2. `backend/struct4search/ingest/stages/metadata/`에 새 동작 코드를 작성합니다.
3. `backend/struct4search/adapters/orchestration/front_pipeline.py`의 `ProfileFrontStageFactory`에서 `metadata=`에 새 코드를 연결합니다.
4. Metadata 파일과 완료 기록을 기존 `MetadataOutput` 형식으로 반환합니다. 그래야 검색표현 생성과 재실행 판단이 그대로 동작합니다.
5. `tests/unit/ingest/test_front_graph.py`에 정상 결과, 실패 전달과 실행 순서 검사를 추가합니다.

V3, Triple, KG, 검색표현과 인덱싱은 같은 방식으로 `backend/struct4search/adapters/orchestration/back_pipeline.py`의 `ProfileBackStageFactory`에서 연결합니다. 어느 단계가 어떤 입력을 받는지는 `backend/struct4search/ingest/ports.py`의 해당 함수에서 확인합니다.

```bash
python -m pytest -q \
  tests/unit/ingest/test_front_graph.py \
  tests/unit/ingest/test_back_graph.py \
  tests/unit/config
```

## 새 인덱싱 단계 추가

새 결과를 만들어 다음 단계에서 사용해야 한다면 아래 항목을 모두 수정합니다.

### 1. 어느 구간에 들어갈지 정합니다

| 넣을 위치 | 실행 순서를 관리하는 곳 | 현재 단계 |
|---|---|---|
| Parser부터 Metadata까지 | `backend/struct4search/ingest/front.py` · `FrontStageGraph` | 페이지 분기 → 파싱 → Canonical IDR → 원문 청킹·NER → Metadata |
| V3부터 인덱싱까지 | `backend/struct4search/ingest/back.py` · `BackStageGraph` | V3 → Triple 생성·검사 → KG → 검색표현 → 인덱싱 |

새 단계가 사용하는 입력이 이미 만들어진 직후에 배치합니다. 단순히 파일 이름이나 개발 편의에 따라 위치를 정하지 않습니다.

### 2. 결과와 함수 형식을 정의합니다

1. `backend/struct4search/ingest/contracts.py`에 새 단계의 결과 형식을 추가합니다.
2. `backend/struct4search/ingest/ports.py`에 새 단계가 제공할 함수를 추가합니다.
3. `backend/struct4search/ingest/stages/<새_단계>/`에 실제 동작 코드를 작성합니다.

결과 형식에는 다음 단계가 실제로 사용할 값과 실행 결과 파일의 위치가 포함되어야 합니다. 다음 단계가 다시 원본 파일을 읽어 같은 값을 추측하게 만들지 않습니다.

### 3. 실행 순서와 다음 단계 연결을 추가합니다

1. `FrontStageGraph` 또는 `BackStageGraph`에 새 단계를 받는 필드를 추가합니다.
2. `execute_document()`의 정해진 위치에서 새 단계를 호출합니다.
3. `FrontDocumentOutput` 또는 `BackDocumentOutput`에 새 결과를 넣습니다.
4. 새 결과를 사용하는 다음 단계의 입력을 명시적으로 연결합니다.
5. `ProfileFrontStageFactory` 또는 `ProfileBackStageFactory`에서 실제 동작 코드를 해당 필드에 넣습니다.

설정이 필요하면 profile 스키마와 `configs/`의 값을 함께 추가합니다. 코드 안에서 환경변수나 임의의 기본값을 직접 읽지 않습니다.

### 4. 실패와 재실행에 필요한 기록을 추가합니다

단계가 끝나면 결과 파일과 완료 기록을 남겨야 합니다. 그래야 실행이 중단되었을 때 끝난 단계와 다시 실행할 단계를 구분할 수 있습니다.

- 새 결과를 `StageResult`와 단계 완료 기록에 포함합니다.
- 문서 완료 검사에서 새 결과 파일의 존재와 해시를 확인합니다.
- `FINAL_REPORT.json`에서 성공·실패 여부를 확인할 수 있게 합니다.
- 같은 `--output`으로 `--resume`했을 때 완료된 결과를 잘못 다시 사용하지 않는지 검사합니다.

최종 2,567문서 실행에서도 새 단계가 필요하면 `backend/struct4search/orchestration/dag.py`의 `F400_INGESTION_DAG`와 최종 E2E 검사를 함께 수정합니다. 일반 `struct4search-ingest`만 바꾸는 경우에는 이 DAG를 건드리지 않습니다.

### 5. 작은 검사부터 실제 한 문서 실행까지 진행합니다

```bash
python -m pytest -q \
  tests/unit/ingest/test_front_graph.py \
  tests/unit/ingest/test_back_graph.py \
  tests/unit/config

struct4search-smoke-e2e
```

새 단계가 최종 2,567문서 실행에도 들어가면 다음 검사도 실행합니다.

```bash
python -m pytest -q \
  tests/test_parallel_contracts.py \
  tests/unit/e2e/test_final_full_2567_200.py
```

## 완료 기준

다음 항목이 모두 확인되어야 구현 변경이 끝난 것입니다.

- profile 하나만 바꾸어 기존 구현과 새 구현을 선택할 수 있습니다.
- API, evaluator와 E2E가 같은 조립 경로를 사용합니다.
- 잘못된 구현 이름과 옵션은 모델·데이터베이스·OpenSearch 연결 전에 거부됩니다.
- 한 단계의 실패가 다음 단계의 정상 결과처럼 기록되지 않습니다.
- 재실행할 때 완료 기록과 실제 결과 파일이 서로 맞는지 확인합니다.
- 운영 데이터와 분리된 한 문서 E2E에서 인덱싱, 검색, 답변과 Citation까지 완료됩니다.

변경한 단계 이후에 다시 만들어야 할 데이터는 [변경 영향과 재실행 범위](change-map.md)에서 확인합니다.
