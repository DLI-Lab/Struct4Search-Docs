---
sidebar_position: 4
title: OpenSearch 인덱스 구조
---

# OpenSearch 인덱스 구조

원문 청크와 검색표현을 함께 저장하는 OpenSearch 인덱스의 주요 설정과 필드 구조를 정리합니다.

## 인덱스 설정

| 설정 | 값 | 의미 |
|---|---|---|
| `index.knn` | `true` | 벡터 검색 사용 |
| `number_of_shards` | 1 | 샤드 수 |
| `number_of_replicas` | 0 | 복제본 없음 |
| `refresh_interval` | `-1` | 대량 색인 중 자동 refresh 비활성화 |

## 텍스트 분석기

BM25 검색에 사용하는 `text` 필드는 한국어 분석기 `korean_nori`를 사용합니다.

```json
{
  "korean_nori": {
    "type": "custom",
    "tokenizer": "nori_tokenizer",
    "filter": [
      "lowercase",
      "nori_part_of_speech"
    ]
  }
}
```

한국어 텍스트를 형태소 단위로 분석해 BM25 검색에 사용합니다.

## 필드 매핑

인덱스는 `dynamic: strict`로 구성되어 있어 매핑에 정의되지 않은 필드는 색인할 수 없습니다.

| 필드 | 타입 | 내용 |
|---|---|---|
| `unit_id` | `keyword` | 검색 단위 ID |
| `document_id` | `keyword` | 소속 문서 |
| `unit_kind` | `keyword` | 원문 청크 또는 검색표현 |
| `presentation` | `keyword` | 검색 단위 생성 방식 |
| `source_f400_unit_ids` | `keyword` | 연결된 원문 검색 단위 |
| `source_f400_chunk_ids` | `keyword` | 연결된 원문 청크 |
| `page_indices` | `integer` | 원본 페이지 |
| `triple_ids` | `keyword` | 검색표현의 근거 Triple |
| `text` | `text` | BM25 검색 대상 텍스트 |
| `vector` | `knn_vector` | Dense 검색 대상 임베딩 |

원문 청크와 검색표현은 같은 필드 구조를 사용하며 `unit_kind`로 구분합니다. 자세한 차이는 [인덱싱](../indexing/opensearch.md)에서 설명합니다.

## 벡터 필드

Dense 검색에 사용하는 `vector`는 4,096차원 임베딩입니다.

```json
{
  "type": "knn_vector",
  "dimension": 4096,
  "method": {
    "name": "hnsw",
    "engine": "lucene",
    "space_type": "cosinesimil",
    "parameters": {
      "ef_construction": 128,
      "m": 16
    }
  }
}
```

벡터 차원은 `index.dimension`과 같아야 하며, 검색에서는 코사인 유사도를 사용합니다.

## 검색 결과에서 벡터 제외

```json
{
  "_source": {
    "excludes": ["vector"]
  }
}
```

임베딩 벡터는 Dense 검색에는 필요하지만 검색 결과를 사용하는 애플리케이션에서는 직접 읽지 않습니다. 따라서 검색 응답의 `_source`에서는 `vector`를 제외합니다.

## 인덱스 메타데이터

인덱스에는 생성 시점의 주요 실행 정보를 `_meta`에 기록합니다.

| 키 | 내용 |
|---|---|
| `cold_run_id` | 인덱스를 생성한 실행 |
| `retrieval_contract` | 검색 단위 구성 방식 |
| `document_update_contract` | 문서 재색인 방식 |

이를 통해 현재 인덱스가 어떤 실행과 검색 계약으로 만들어졌는지 확인할 수 있습니다.

## 문서를 다시 색인할 때

같은 문서를 다시 인덱싱하면 해당 문서의 기존 검색 단위를 제거하고 새로 생성된 원문 청크와 검색표현으로 교체합니다.

이전 실행에서 생성된 검색 단위가 남아 새 결과와 함께 검색되는 것을 막기 위한 방식입니다.

## 새 인덱스가 필요한 변경

다음과 같이 기존 검색 데이터와 호환되지 않는 변경은 새 인덱스를 만든 뒤 다시 색인합니다.

| 변경 | 이유 |
|---|---|
| 벡터 차원 | 기존 임베딩과 호환되지 않음 |
| 임베딩 모델 | 임베딩 공간이 달라짐 |
| 필드 타입 | 기존 매핑과 호환되지 않음 |
| 텍스트 분석기 | 색인되는 토큰 구조가 달라짐 |
| 검색 단위 구조 | 기존 색인 문서와 구조가 달라짐 |

새 인덱스로 전환하는 방법은 [데이터와 인덱스 구조 변경](../maintenance/data-index.md)에서 설명합니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 인덱스 매핑 | `backend/struct4search/index_stage.py` · `index_mapping_template` |
| 인덱스 이름과 벡터 차원 | `configs/production.yaml` · `index` |
