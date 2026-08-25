---
sidebar_position: 8
title: 인덱싱
---

# 인덱싱

원문 청크와 검색표현을 각각 검색 단위로 만들어, 텍스트와 임베딩 벡터를 함께 하나의 OpenSearch 인덱스에 저장합니다.

## 입력과 출력

| | |
|---|---|
| 입력 | [원문 청킹](chunking.md)의 검색 단위와 [검색표현 생성](retrieval-text.md)의 검색표현 |
| 출력 | OpenSearch 인덱스의 검색 단위 |

색인 문서는 두 종류이고 `unit_kind`로 구분합니다.

```json
{
  "unit_id": "ruf_11175e926dbb1e25f165a932",             // 검색 단위 ID
  "document_id": "d002343_6b6d39ebe6",                   // 문서
  "unit_kind": "source",                                 // 원문 청크
  "presentation": "fixed_400_overlap40",                 // 만들어진 방식
  "text": "개구부 덮개 상부에서 작업 중 떨어짐 ...",        // BM25 검색 대상
  "source_f400_unit_ids": ["ruf_11175e926dbb1e25f165a932"], // 자기 자신
  "page_indices": [2, 3],                                // 원본 페이지
  "triple_ids": []                                       // 원문 청크는 비어 있음
}
```

```json
{
  "unit_id": "rte_2a300459506675e3d86b0dc8",             // 검색표현 ID
  "document_id": "d002343_6b6d39ebe6",                   // 문서
  "unit_kind": "retrieval_expression",                   // 검색표현
  "presentation": "g2_salience_pagerank800_multitriple", // 만들어진 방식
  "text": "곡성 공장의 열분해유 제조 공정에서 ...",         // BM25 검색 대상
  "source_f400_unit_ids": ["ruf_11175e926dbb1e25f165a932"], // 연결된 원문 청크
  "page_indices": [2],                                   // 연결된 청크의 페이지
  "triple_ids": ["kgtr_4404df7b9e441dae2f5f92ef"]        // 근거가 된 관계
}
```

두 문서 모두 `text`와 함께 임베딩 벡터를 갖습니다. `source_f400_unit_ids`가 다른 점입니다 — 원문 청크는 자기 자신을 가리키고, 검색표현은 연결된 원문 청크를 가리킵니다. 이 값이 [검색 결과 점수 통합](../query/score-integration.md)에서 점수를 옮기는 데 쓰입니다.

## 하나의 인덱스에 함께 들어갑니다

```text
OpenSearch 인덱스 1개 = 전체 코퍼스의 검색 공간

├─ 문서 A의 원문 청크 1   {"text", "vector"}
├─ 문서 A의 원문 청크 2   {"text", "vector"}
├─ 문서 A의 검색표현 1    {"text", "vector"}
├─ 문서 A의 검색표현 2    {"text", "vector"}
├─ 문서 B의 원문 청크 1   {"text", "vector"}
└─ ...
```

색인을 나누지 않는 이유는 검색을 두 번 하지 않기 위해서입니다. 질의 하나로 두 종류를 함께 훑고, 어느 쪽이 걸렸는지는 결과의 `unit_kind`로 압니다([Hybrid 검색](../query/hybrid-search.md)).

## 동작 방식

1. 원문 청크와 검색표현을 각각 색인 문서로 만듭니다.
2. 각 문서의 `text`를 임베딩 서버에 보내 벡터를 받습니다.
3. 텍스트와 벡터를 함께 OpenSearch에 씁니다.
4. 같은 문서의 이전 검색 단위가 있으면 교체합니다.

원문 청크와 이어지지 않는 검색표현은 색인하지 않고 실패로 처리합니다.

### 환경변수

| 환경변수명 | 기본 옵션 | 의미 |
|---|---|---|
| `index.opensearch_url` | 서버 주소 | 검색 단위를 저장할 OpenSearch |
| `index.embedding_url` | 서버 주소 | 텍스트를 벡터로 바꿀 임베딩 서버 |
| `index.embedding_model` | `Qwen/Qwen3-Embedding-8B` | 임베딩 모델. 질의 쪽과 같아야 비교가 성립합니다 |
| `index.dimension` | 4096 | 벡터 차원. 바꾸면 기존 벡터와 섞을 수 없습니다 |
| `index.name` | 프로파일이 지정 | 만들 인덱스 이름 |
| `index.alias` | `s4s-current` | 검색이 바라보는 별칭 |
| `index.embedding_batch_size` | 32 | 한 번에 임베딩 서버로 보낼 텍스트 수 |

임베딩 모델이나 차원을 바꾸면 기존 벡터와 섞을 수 없으므로 **인덱스를 새로 만들고 코퍼스 전체를 다시 색인해야 합니다**([실행과 재처리](rerun.md)). 매핑 자체는 [OpenSearch 인덱스 구조](../reference/opensearch-schema.md)에 있습니다.

## 사용 또는 결과 확인

인덱싱 실행기가 호출합니다.

```bash
struct4search-ingest --output <출력 디렉터리> --document-id <문서 ID>
```

인덱스에서 볼 것은 세 가지입니다.

| 확인할 것 | 정상 |
|---|---|
| `unit_kind` 분포 | `source`와 `retrieval_expression`이 모두 있습니다 |
| 문서당 검색 단위 수 | 산출물의 청크·표현 수와 같습니다 |
| 벡터 차원 | `index.dimension`과 같습니다 |

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 색인 문서 조립과 기록 | `src/struct4search/index_stage.py` · `OpenSearchIndexStage` |
| 매핑 | `src/struct4search/index_stage.py` · `OpenSearchIndexStage.mapping` |
| 설정값 | `configs/ingest-production.yaml` · `index` |
