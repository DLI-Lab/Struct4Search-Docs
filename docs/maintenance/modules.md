---
sidebar_position: 5
title: 파이프라인 구현 교체와 단계 추가
---

# 파이프라인 구현 교체와 단계 추가

이 페이지는 설정값이 아니라 파이프라인 코드의 구성을 바꿀 때 사용합니다. 기존 입력·출력을 그대로 두고 구현만 바꾸는 일과, 새로운 산출물을 만드는 단계를 추가하는 일을 구분합니다.

| 작업 | 해당하는 경우 | 주요 변경 위치 |
|---|---|---|
| 구현 교체 | 기존 입력·출력 계약을 유지하면서 Parser, 검색, Reader 등의 구현을 바꾸는 경우 | 해당 계약과 구현체, `bootstrap/composition.py`, `adapters/orchestration/front_pipeline.py` 또는 `back_pipeline.py` |
| 단계 추가 | 새로운 입력·출력과 산출물을 만드는 처리를 파이프라인에 넣는 경우 | `ingest/contracts.py`, `ingest/ports.py`, `ingest/front.py` 또는 `back.py`, `adapters/orchestration/` |

## 기존 구현을 교체할 때

검색·답변 구현은 `backend/struct4search/query/contracts.py`의 입력·출력 계약을 따릅니다. 예를 들어 질의 Embedding, 검색, Reader는 각각 `EmbeddingPort`, `RetrievalStrategy`, `Reader`를 구현합니다.

1. 기존 계약과 같은 입력·출력을 제공하는 구현체를 만듭니다.
2. `backend/struct4search/bootstrap/composition.py`의 조립 지점에서 새 구현을 선택하도록 연결합니다.
3. 계약 테스트와 API·평가·E2E를 실행해 모든 진입점이 같은 구현을 사용하는지 확인합니다.

입력·출력 형식이 달라지면 구현 교체가 아니라 계약 변경입니다. 해당 결과를 사용하는 후속 단계도 함께 수정합니다.

인덱싱 단계의 구현만 교체하는 경우에는 `backend/struct4search/ingest/ports.py`의 인터페이스와 `backend/struct4search/ingest/contracts.py`의 입력·출력 형식을 유지합니다. Parser부터 Metadata까지의 구현은 `front_pipeline.py`, V3부터 KG·검색 표현·인덱싱까지의 구현은 `back_pipeline.py`에서 교체합니다.

## 인덱싱 단계를 추가할 때

1. `backend/struct4search/ingest/contracts.py`에 단계가 주고받을 데이터와 산출물 형식을 정의합니다.
2. `backend/struct4search/ingest/ports.py`에 단계의 입력·출력 인터페이스를 정의합니다.
3. `backend/struct4search/ingest/stages/`에 단계 구현을 추가합니다.
4. 단계의 위치에 따라 `backend/struct4search/ingest/front.py` 또는 `back.py`에 실행 순서와 입력·출력 연결을 추가합니다.
5. `backend/struct4search/adapters/orchestration/front_pipeline.py` 또는 `back_pipeline.py`에서 단계 구현을 실제 실행 경로에 연결합니다.
6. 설정이 필요하면 설정 Schema와 profile을 추가하고, 새 산출물을 완료 판정과 재개 검증에 포함합니다.
7. 단계 계약 테스트와 한 문서 E2E를 실행합니다.

보존된 전체 코퍼스 실행과 관측 목록에도 새 단계를 적용하려면 `backend/struct4search/orchestration/dag.py`의 `F400_INGESTION_DAG`도 함께 수정합니다.

변경 후 다시 실행할 범위와 새 index 필요 여부는 [변경 영향과 재실행 범위](change-map.md)에서 확인합니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 검색·답변 계약 | `backend/struct4search/query/contracts.py` |
| 인덱싱 데이터 계약 | `backend/struct4search/ingest/contracts.py` |
| 인덱싱 단계 인터페이스 | `backend/struct4search/ingest/ports.py` |
| 검색·답변 구현 조립 | `backend/struct4search/bootstrap/composition.py` |
| Parser→Metadata 실행 순서 | `backend/struct4search/ingest/front.py` · `FrontStageGraph` |
| V3→Triple→KG→검색 표현→인덱싱 실행 순서 | `backend/struct4search/ingest/back.py` · `BackStageGraph` |
| Parser→Metadata 구현 조립 | `backend/struct4search/adapters/orchestration/front_pipeline.py` |
| V3→인덱싱 구현 조립 | `backend/struct4search/adapters/orchestration/back_pipeline.py` |
| 보존된 전체 코퍼스 DAG | `backend/struct4search/orchestration/dag.py` · `F400_INGESTION_DAG` |
