---
sidebar_position: 2
title: 질의 처리
---

# 질의 처리

사용자 질의 원문을 BM25 검색에 그대로 사용하고, Dense 검색에 사용할 질의 임베딩 벡터를 생성합니다.

## 입력과 출력

| | |
|---|---|
| 입력 | 사용자 질의 |
| 출력 | `query text`와 `query embedding` |

```json
{
  "query_text": "온열 질환 의심자가 생기면 어떻게 하나요?",
  "query_vector": [0.0142, -0.0317, "... 4096차원 ..."]
}
```

`query_text`는 BM25 검색에, `query_vector`는 Dense 검색에 사용합니다. 두 값은 질의를 처리하는 동안만 사용하며 별도로 저장하지 않습니다.

## 동작 방식

1. 사용자 질의를 BM25 검색용 `query text`로 그대로 사용합니다.
2. 같은 질의를 임베딩 서버에 보내 Dense 검색용 `query embedding`을 생성합니다.

질의를 별도로 재작성하거나 확장하지 않습니다. 질의와 문서 사이의 표현 차이는 문서 인덱싱 단계에서 생성한 [검색표현](../indexing/retrieval-text.md)을 통해 보완합니다.

질의 임베딩을 생성하지 못하면 검색을 진행하지 않습니다.

### 설정값

| profile key | 현재 production 값 | 의미 |
|---|---|---|
| `index.embedding_url` | 서버 주소 | 질의를 벡터로 변환할 임베딩 서버 |
| `index.embedding_model` | `Qwen/Qwen3-Embedding-8B` | 색인과 질의에 사용하는 임베딩 모델 |
| `index.dimension` | 4096 | 임베딩 벡터 차원 |

질의와 색인에는 같은 임베딩 모델과 벡터 차원을 사용합니다. 임베딩 모델이나 차원을 변경하면 기존 색인과 호환되지 않으므로 코퍼스를 다시 색인해야 합니다([인덱싱](../indexing/opensearch.md)).

## 사용 또는 결과 확인

질의 처리는 검색·답변 파이프라인에서 자동으로 실행됩니다.

| 확인할 것 | 정상 |
|---|---|
| `query_text` | 사용자가 입력한 질의와 같습니다 |
| `query_vector` | 정상적으로 생성되어 있습니다 |
| 벡터 차원 | `index.dimension`과 같습니다 |

생성된 질의 원문과 임베딩 벡터는 다음 단계인 [Hybrid 검색](hybrid-search.md)에 전달됩니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 질의 처리 | `backend/struct4search/query/service.py` · `DefaultQueryService.execute` |
| 임베딩 생성 | `backend/struct4search/adapters/search/opensearch/embedding.py` · `UrllibOpenAICompatibleEmbeddingPort` |
| 설정 주입 | `backend/struct4search/bootstrap/composition.py` |
