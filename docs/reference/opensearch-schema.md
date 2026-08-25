---
sidebar_position: 4
title: OpenSearch 인덱스 구조
---

# OpenSearch 인덱스 구조

원문 청크와 검색표현이 함께 들어가는 인덱스 하나의 설정과 매핑입니다.

## 인덱스 설정

| 설정 | 값 | 의미 |
|---|---|---|
| `index.knn` | `true` | 벡터 검색 사용 |
| `number_of_shards` | 1 | 샤드 하나 |
| `number_of_replicas` | 0 | 복제본 없음 |
| `refresh_interval` | `-1` | 자동 새로고침 끔. 대량 색인 중 갱신 비용을 없앱니다 |

## 분석기

```json
{
  "korean_nori": {
    "type": "custom",
    "tokenizer": "nori_tokenizer",           // 한국어 형태소 분석
    "filter": ["lowercase", "nori_part_of_speech"]  // 소문자화, 품사 필터
  }
}
```

`text` 필드가 이 분석기를 씁니다. 한국어 조사와 어미를 분리해야 BM25가 어휘를 맞출 수 있습니다.

## 매핑

`dynamic`은 `strict`입니다. **선언되지 않은 필드를 넣으면 색인이 거부됩니다.**

| 필드 | 타입 |
|---|---|
| `unit_id` | `keyword` |
| `document_id` | `keyword` |
| `unit_kind` | `keyword` |
| `presentation` | `keyword` |
| `source_f400_unit_ids` | `keyword` |
| `source_f400_chunk_ids` | `keyword` |
| `page_indices` | `integer` |
| `triple_ids` | `keyword` |
| `text` | `text`, 분석기 `korean_nori` |
| `vector` | `knn_vector` |

### 벡터 필드

```json
{
  "type": "knn_vector",
  "dimension": 4096,              // index.dimension 과 같아야 함
  "method": {
    "name": "hnsw",               // 근사 최근접 이웃 알고리즘
    "engine": "lucene",
    "space_type": "cosinesimil",  // 코사인 유사도
    "parameters": {"ef_construction": 128, "m": 16}
  }
}
```

### `_source` 제외

```json
{"_source": {"excludes": ["vector"]}}
```

검색 결과에 벡터를 실어 보내지 않습니다. 4,096차원 배열을 매 결과마다 전송하면 응답이 크게 무거워집니다. 벡터는 검색에만 쓰이고 애플리케이션이 읽을 일이 없습니다.

### `_meta`

| 키 | 내용 |
|---|---|
| `cold_run_id` | 이 인덱스를 만든 실행 |
| `retrieval_contract` | 검색 단위 구성 방식 |
| `document_update_contract` | 문서 재색인 방식 |

어느 실행이 만든 인덱스인지 인덱스 자체가 기록합니다.

## 문서를 다시 색인할 때

`document_update_contract`가 말하는 대로, **문서와 `unit_kind` 조합의 기존 단위를 먼저 지우고** 새로 넣습니다. 부분 갱신이 아니라 교체입니다.

같은 문서를 다시 처리했을 때 이전 청크가 남아 검색에 걸리는 상황을 막기 위한 것입니다.

## 인덱스를 새로 만들어야 하는 변경

| 바꾼 것 | 이유 |
|---|---|
| 벡터 차원 | 기존 벡터와 비교 불가 |
| 임베딩 모델 | 벡터 공간이 달라짐 |
| 필드 타입 | OpenSearch가 타입 변경을 허용하지 않음 |
| 분석기 | 색인된 토큰이 달라짐 |
| 새 필드 추가 | 기존 문서에 값이 비어 있음 |

절차는 [데이터와 인덱스 구조 변경](../maintenance/data-index.md)에 있습니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 매핑 정의 | `src/struct4search/index_stage.py` · `index_mapping_template` |
| 인덱스 이름과 차원 | `configs/ingest-production.yaml` · `index` |
