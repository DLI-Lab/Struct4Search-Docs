---
sidebar_position: 8
title: 인덱싱
---

# 인덱싱

원문 청크와 검색표현을 각각 검색 단위로 구성하고, 텍스트와 임베딩 벡터를 함께 OpenSearch에 저장합니다.

## 입력과 출력

| | |
|---|---|
| 입력 | [원문 청킹](chunking.md)의 원문 청크와 [검색표현 생성](retrieval-text.md)의 검색표현 |
| 출력 | OpenSearch에 저장된 검색 단위 |

색인 문서는 `unit_kind`에 따라 원문 청크와 검색표현으로 구분됩니다.

`//` 뒤의 내용은 필드 설명이며 실제 JSON 산출물에는 포함되지 않습니다.

### 원문 청크

```json
{
  "unit_id": "ruf_11175e926dbb1e25f165a932",               // 검색 단위의 고유 ID
  "document_id": "d002343_6b6d39ebe6",                     // 검색 단위가 나온 문서의 ID
  "unit_kind": "source",                                   // 원문 청크임을 나타내는 종류
  "presentation": "fixed_400_overlap40",                   // 원문 청크를 만든 방식
  "text": "개구부 덮개 상부에서 작업 중 떨어짐 ...",          // 검색 대상이 되는 원문
  "source_f400_unit_ids": ["ruf_11175e926dbb1e25f165a932"], // 연결된 원문 검색 단위 ID
  "page_indices": [2, 3],                                   // 원문이 포함된 페이지 순서. 0부터 시작
  "triple_ids": []                                          // 원문 청크에는 연결하지 않는 Triple ID 목록
}
```

### 검색표현

```json
{
  "unit_id": "rte_2a300459506675e3d86b0dc8",               // 검색표현의 고유 ID
  "document_id": "d002343_6b6d39ebe6",                     // 검색표현이 속한 문서의 ID
  "unit_kind": "retrieval_expression",                     // 검색표현임을 나타내는 종류
  "presentation": "g2_salience_pagerank800_multitriple",   // 검색표현을 만든 방식
  "text": "곡성 공장의 열분해유 제조 공정에서 ...",          // 검색 대상이 되는 생성 문장
  "source_f400_unit_ids": ["ruf_11175e926dbb1e25f165a932"], // 검색표현과 연결된 원문 검색 단위 ID
  "page_indices": [2],                                      // 연결된 원문이 포함된 페이지 순서. 0부터 시작
  "triple_ids": ["kgtr_4404df7b9e441dae2f5f92ef"]          // 검색표현의 사실 근거가 된 Triple ID 목록
}
```

두 검색 단위 모두 `text`와 임베딩 벡터를 가집니다. 원문 청크는 자기 자신을, 검색표현은 자신과 연결된 원문 청크를 `source_f400_unit_ids`에 기록합니다. 이 연결은 이후 [검색 결과 점수 통합](../query/score-integration.md)에서 검색표현을 원문 청크로 연결할 때 사용됩니다.

## OpenSearch 저장 구조

원문 청크와 검색표현은 하나의 OpenSearch 인덱스에 함께 저장됩니다.

```text
OpenSearch 인덱스

├─ 문서 A의 원문 청크 1
├─ 문서 A의 원문 청크 2
├─ 문서 A의 검색표현 1
├─ 문서 A의 검색표현 2
├─ 문서 B의 원문 청크 1
└─ ...
```

검색할 때도 두 종류의 검색 단위를 함께 대상으로 사용하며, 결과의 `unit_kind`로 원문 청크와 검색표현을 구분합니다([Hybrid 검색](../query/hybrid-search.md)).

## 동작 방식

1. 원문 청크와 검색표현을 각각 색인 문서로 구성합니다.
2. 각 검색 단위의 `text`에 대한 임베딩 벡터를 생성합니다.
3. 텍스트와 벡터를 함께 OpenSearch에 저장합니다.
4. 같은 문서를 다시 인덱싱하면 해당 문서의 기존 검색 단위를 새 결과로 교체합니다.

원문 청크와 연결되지 않은 검색표현은 색인하지 않습니다.

## 현재 production 설정

| profile key                           | 현재 production 값                      | 의미                    |
| ---------------------------- | ------------------------- | --------------------- |
| `index.opensearch_url`       | 서버 주소                     | 검색 단위를 저장할 OpenSearch |
| `index.embedding_url`        | 서버 주소                     | 임베딩 서버                |
| `index.embedding_model`      | `Qwen/Qwen3-Embedding-8B` | 색인과 질의에 사용하는 임베딩 모델   |
| `index.dimension`            | 4096                      | 임베딩 벡터 차원             |
| `index.name`                 | 프로파일에서 지정                 | 생성할 인덱스               |
| `index.alias`                | `s4s-current`             | 검증이 끝난 인덱스를 검색 API에 연결하는 고정 이름 |
| `index.embedding_batch_size` | 32                        | 한 번에 임베딩할 검색 단위 수     |

임베딩 모델이나 벡터 차원을 변경하면 기존 벡터와 호환되지 않으므로 새로운 인덱스를 만들고 다시 색인해야 합니다([실행과 재처리](rerun.md)).

OpenSearch의 전체 매핑과 검색 설정은 [OpenSearch 인덱스 구조](../reference/opensearch-schema.md)에서 확인할 수 있습니다.

## 사용 또는 결과 확인

인덱싱은 문서 인덱싱 파이프라인에서 실행됩니다.

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output <출력_디렉터리> \
  --document-id <문서_ID>
```

인덱싱이 끝나면 원문 청크와 검색표현이 각각 검색 단위로 저장되었는지 확인합니다.

| 확인할 것       | 정상                                          |
| ----------- | ------------------------------------------- |
| `unit_kind` | `source`와 `retrieval_expression`이 저장되어 있습니다 |
| 검색 단위 수     | 생성된 원문 청크와 검색표현 수와 일치합니다                    |
| 벡터 차원       | `index.dimension`과 일치합니다                    |

## 코드 참조

| 확인할 내용        | 파일·심볼                                                               |
| ------------- | ------------------------------------------------------------------- |
| 인덱싱 구현        | `backend/struct4search/ingest/stages/indexing/stage.py` · `OpenSearchIndexStage` |
| OpenSearch 매핑 | `backend/struct4search/ingest/stages/indexing/stage.py` · `index_mapping_template` |
| 설정            | `configs/ingest-production.yaml` · `index`                          |
