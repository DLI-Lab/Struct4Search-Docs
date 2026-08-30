---
sidebar_position: 3
title: 파이프라인 구현 변경 및 확장
---

# 파이프라인 구현 변경 및 확장

이 페이지는 파싱, Metadata 생성, 검색 또는 답변 생성처럼 파이프라인에서 실제로 실행되는 Python 코드를 바꿀 때 사용합니다.

모델 이름, 서비스 주소, 검색 결과 개수처럼 이미 준비된 값만 바꾸려면 코드를 수정하지 않고 [설정 수정](configuration.md)을 따릅니다.

이 페이지를 읽고 나면 바꾸려는 기능이 설정 수정으로 끝나는지, Python 코드를 바꿔야 하는지와 수정할 파일·테스트를 찾을 수 있습니다.

## 먼저 무엇을 바꾸려는지 구분합니다

| 하려는 작업 | 수정할 것 | 예 |
|---|---|---|
| 기존 설정값 변경 | profile 또는 `.env` | Reader 모델을 Qwen에서 다른 모델로 변경 |
| 기존 처리 코드 교체 | 해당 기능의 코드와 그 코드를 연결하는 파일 | OpenSearch 검색기를 다른 검색기로 교체 |
| 새 처리 단계 추가 | 입력·결과 형식, 실행 순서, 실제 코드와 연결 파일 | Metadata 다음에 문서 요약 단계를 추가 |

입력과 결과의 형태가 그대로라면 기존 처리 코드를 교체하는 작업입니다. 새 결과를 만들거나 다음 단계가 받는 값이 달라진다면 파이프라인에 새 단계를 추가하는 작업입니다.

## 코드를 바꿀 때 확인하는 네 곳

파이프라인의 각 기능은 다음 네 부분으로 나뉩니다.

| 확인할 것 | 의미 | 파일 |
|---|---|---|
| 입력과 결과 | 이 기능이 무엇을 받고 무엇을 돌려주는지 정의합니다 | `backend/struct4search/ingest/contracts.py`, `backend/struct4search/query/contracts.py` |
| 지켜야 할 함수 | 교체할 코드가 반드시 제공해야 하는 함수입니다 | `backend/struct4search/ingest/ports.py`, `backend/struct4search/query/contracts.py` |
| 실제 처리 코드 | 파싱, 검색과 답변 생성 같은 실제 작업을 합니다 | `backend/struct4search/ingest/stages/`, `backend/struct4search/query/` |
| 연결하는 코드 | 어느 구현을 사용할지 정하고 실행 순서에 넣습니다 | `backend/struct4search/adapters/orchestration/`, `backend/struct4search/bootstrap/composition.py` |

예를 들어 Metadata 생성 코드를 바꾼다면 `MetadataPort.extract()`가 요구하는 입력과 결과는 유지하고, 새 구현을 `ProfileFrontStageFactory`의 `metadata=` 자리에 연결합니다.

코드에 나오는 이름은 다음 뜻입니다.

| 이름 | 뜻 |
|---|---|
| `Contract` | 단계 사이에 주고받는 데이터의 필드와 형식 |
| `Port` | 교체할 코드가 지켜야 하는 Python 함수 모양. 서버의 포트 번호가 아닙니다. |
| `Factory` | 실행할 실제 클래스를 만들어 파이프라인의 해당 자리에 넣는 코드 |
| `Composition` | Embedding, 검색기와 Reader를 묶어 하나의 `QueryService`를 만드는 코드 |
| `profile` | 실행할 구현 이름과 설정값을 고르는 YAML 파일 |

## 현재 설정만으로 교체할 수 있는 부분

모든 단계가 profile의 이름만 바꿔서 교체되는 것은 아닙니다. 현재 코드에서 바로 선택할 수 있는 범위는 다음과 같습니다.

| 부분 | profile에서 선택하는 값 | 실제로 선택하는 곳 |
|---|---|---|
| 디지털 문서 파서 | `parser.digital` | `CanonicalIdrAdapter` |
| 스캔 문서 파서 | `parser.scan` | `CanonicalIdrAdapter` |
| 검색·답변 실행 묶음 | `query.retrieval_strategy` | `compose_profile_query()` |
| 검색·답변 묶음이 허용하는 Reader | `query.reader.implementation` | 선택된 검색·답변 조립 함수 |

NER, Metadata, Triple, KG와 검색표현 구현은 현재 `ProfileFrontStageFactory` 또는 `ProfileBackStageFactory`에 직접 연결되어 있습니다. 이 기능을 교체하려면 profile만 바꾸는 것이 아니라 해당 Factory의 연결 코드도 수정해야 합니다.

## 실제로 들어 있는 교체 예제

`configs/experiments/module-swap-stub.yaml`은 외부 모델과 OpenSearch 없이 파서, 검색기와 Reader를 시험용 코드로 바꾸는 예제입니다.

```yaml
extends: ../production.yaml
profile_id: struct4search-module-swap-stub
execution:
  mode: experiment
  publish_alias: false

parser:
  digital: deterministic_stub
  digital_params:
    text: Struct4Search deterministic parser stub
  scan: deterministic_stub
  scan_params:
    text: Struct4Search deterministic parser stub

query:
  retrieval_strategy: deterministic_stub
  retrieval_strategy_params: {}
  reader:
    implementation: deterministic_stub
    implementation_params:
      claim_text: Struct4Search deterministic reader stub
```

이 profile을 읽으면 다음 일이 일어납니다.

1. 운영 설정은 그대로 두고 시험용 profile만 선택합니다.
2. `parser.digital`과 `parser.scan`의 이름으로 등록된 시험용 파서를 찾습니다.
3. `query.retrieval_strategy`가 `deterministic_stub`이므로 시험용 검색기와 Reader를 묶은 `compose_deterministic_query()`를 사용합니다.
4. API와 evaluator도 이 profile에서 만든 같은 `QueryService`를 사용합니다.
5. `publish_alias: false`이므로 운영 검색용 이름을 변경하지 않습니다.

다음 테스트는 이 교체가 실제로 선택되는지, 실패 후 다시 실행해도 이전 상태가 남지 않는지와 API 응답 형식이 유지되는지를 확인합니다.

```bash
python -m pytest -q \
  tests/unit/config/test_profiles_and_prompts.py \
  tests/unit/query/test_runtime_entrypoints.py
```

## 검색·답변 코드를 교체하는 방법

현재 검색·답변 코드는 다음 순서로 실행됩니다.

```text
질문
→ 질문 Embedding 생성
→ OpenSearch 검색
→ 답변에 사용할 원문 선택
→ Reader가 답변과 Citation 생성
→ Citation 정리
```

새 검색 방식을 추가할 때는 다음 순서로 작업합니다.

### 1. 입력과 결과 형식을 확인합니다

`backend/struct4search/query/contracts.py`에서 교체할 부분의 함수를 확인합니다.

| 교체할 부분 | 지켜야 할 함수 | 입력과 결과 |
|---|---|---|
| 질문 Embedding | `EmbeddingPort.embed()` | 질문 문자열을 받아 숫자 벡터를 반환 |
| 검색 | `RetrievalStrategy.retrieve()` | 질문과 질문 벡터를 받아 검색 결과를 반환 |
| 답변 생성 | `Reader.generate()` | 질문과 선택된 원문을 받아 답변 문장과 원문 ID를 반환 |

새 코드가 이 입력과 결과를 그대로 사용하면 `QueryService`와 API 응답 형식은 바꾸지 않아도 됩니다.

### 2. 실제 코드를 작성합니다

- 검색 코드는 `backend/struct4search/query/retrieval/`에 둡니다.
- 답변 생성 코드는 `backend/struct4search/query/answer/`에 둡니다.
- 검색 결과에는 점수, 순위, 원문 ID와 검색표현에서 원문으로 이어지는 정보를 빠뜨리지 않습니다.
- Reader 결과에는 답변 문장과 그 문장이 사용한 원문 ID를 넣습니다.

### 3. 새 조립 함수를 등록합니다

`backend/struct4search/bootstrap/composition.py`에서 새 검색·답변 코드를 묶는 함수를 만들고 `DEFAULT_QUERY_STRATEGIES`에 이름을 등록합니다.

예를 들어 `my_retrieval`이라는 이름으로 등록했다면 시험용 profile에서 다음처럼 선택합니다.

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

등록하지 않은 이름을 적으면 모델이나 OpenSearch에 연결하기 전에 실행이 중단됩니다.

### 4. API까지 확인합니다

새 검색기 함수만 직접 호출하고 끝내지 않습니다. `compose_profile_query()`가 새 구현을 선택하는지와 `POST /v1/responses`가 기존과 같은 형식의 답변과 Citation을 반환하는지 확인합니다.

## 인덱싱 단계의 코드를 교체하는 방법

인덱싱은 두 구간으로 나뉩니다.

| 구간 | 실행 순서 | 연결하는 파일 |
|---|---|---|
| 앞 구간 | 페이지 분기 → 파싱 → IDR → 원문 청킹·NER → Metadata | `backend/struct4search/adapters/orchestration/front_pipeline.py` |
| 뒤 구간 | V3 → Triple 생성·검사 → KG → 검색표현 → OpenSearch 저장 | `backend/struct4search/adapters/orchestration/back_pipeline.py` |

예를 들어 Metadata 생성 코드를 교체하는 순서는 다음과 같습니다.

1. `backend/struct4search/ingest/ports.py`에서 `MetadataPort.extract()`의 입력과 결과를 확인합니다.
2. `backend/struct4search/ingest/stages/metadata/`에 새 구현을 작성합니다.
3. 새 구현도 기존과 같은 `StageResult[MetadataOutput]`을 반환하게 합니다.
4. `ProfileFrontStageFactory`의 `metadata=`에 새 구현을 연결합니다.
5. `tests/unit/ingest/test_front_graph.py`에서 실행 순서, 정상 결과와 실패 전달을 확인합니다.

결과 형태가 같으면 Metadata를 사용하는 검색표현 생성 코드는 수정하지 않습니다. 결과에 새 필드를 추가하고 다른 단계가 그 값을 사용한다면 아래의 새 단계 추가 절차를 따릅니다.

## 새 인덱싱 단계를 추가하는 방법

예를 들어 Metadata 뒤에 `문서 요약` 단계를 추가한다면 다음 파일을 순서대로 수정합니다.

1. `ingest/contracts.py`에 문서 요약 결과의 필드를 정의합니다.
2. `ingest/ports.py`에 요약 단계가 제공할 함수를 정의합니다.
3. `ingest/stages/document_summary/`에 실제 요약 코드를 작성합니다.
4. `FrontStageGraph`에서 Metadata 다음에 요약 함수를 호출합니다.
5. `FrontDocumentOutput`에 요약 결과를 넣고, 이 결과를 사용하는 다음 단계에 전달합니다.
6. `ProfileFrontStageFactory`에서 실제 요약 구현을 연결합니다.
7. 결과 파일과 완료 기록을 남겨 중단 후 재실행할 때 완료 여부를 확인할 수 있게 합니다.
8. 앞 구간 단위 테스트와 문서 한 건 E2E를 실행합니다.

최종 2,567문서 실행에서도 새 단계가 필요하다면 `backend/struct4search/orchestration/dag.py`의 `F400_INGESTION_DAG`와 전체 E2E 검사도 함께 수정합니다.

## 변경 후 확인 순서

```bash
python -m pytest -q \
  tests/unit/config/test_profiles_and_prompts.py \
  tests/unit/ingest/test_front_graph.py \
  tests/unit/ingest/test_back_graph.py \
  tests/unit/query/test_runtime_entrypoints.py

struct4search-smoke-e2e
```

먼저 설정과 실행 순서 테스트에서 잘못 연결된 부분을 찾고, 마지막에 운영 데이터와 분리된 문서 한 건 E2E로 인덱싱, 검색, 답변과 Citation까지 확인합니다.

변경한 단계 이후에 다시 만들어야 하는 데이터는 [변경 영향과 재실행 범위](change-map.md)에서 확인합니다.
