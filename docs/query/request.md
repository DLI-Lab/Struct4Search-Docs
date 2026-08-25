---
sidebar_position: 2
title: 질의 처리
---

# 질의 처리

BM25 검색에는 질의 원문을 그대로 쓰고, Dense 검색을 위해 질의 임베딩 벡터를 만듭니다.

## 입력과 출력

| | |
|---|---|
| 입력 | 사용자 질의 |
| 출력 | `query text`와 `query embedding` |

```json
{
  "query_text": "온열 질환 의심자가 생기면 어떻게 하나요?", // BM25 검색에 그대로 사용
  "query_vector": [0.0142, -0.0317, "... 4096차원 ..."]   // Dense 검색에 사용
}
```

두 값 모두 저장하지 않습니다. 질의 하나가 처리되는 동안만 존재합니다.

## 동작 방식

1. 질의 원문을 손대지 않고 BM25 검색용으로 그대로 둡니다.
2. 같은 질의를 임베딩 서버에 보내 벡터를 받습니다.

**질의를 다시 쓰지 않습니다.** 검색에 쓴 문장과 답변이 답한 질문이 달라지면 검색 지표와 QA 지표를 같은 질의에 귀속시킬 수 없기 때문입니다. 질의 표현과 문서 표현의 간극은 질의 쪽이 아니라 문서 쪽에서 [검색표현](../indexing/retrieval-text.md)으로 메웁니다.

벡터가 비었거나 숫자가 아니면 그 질의는 실패합니다. 부분 결과로 진행하지 않습니다.

### 환경변수

| 환경변수명 | 기본 옵션 | 의미 |
|---|---|---|
| `index.embedding_url` | 서버 주소 | 질의를 벡터로 바꿀 임베딩 서버 |
| `index.embedding_model` | `Qwen/Qwen3-Embedding-8B` | 임베딩 모델. 색인 때와 같아야 합니다 |
| `index.dimension` | 4096 | 벡터 차원. 인덱스 매핑과 다르면 검색 요청이 거부됩니다 |

색인할 때와 **같은 모델과 차원**을 씁니다. 다르면 질의 벡터와 색인 벡터를 비교할 수 없습니다. 모델을 바꾸면 코퍼스 전체를 다시 색인해야 합니다([인덱싱](../indexing/opensearch.md)).

## 사용 또는 결과 확인

질의 처리는 단독 실행 명령이 없습니다. 검색·답변 경로가 호출합니다.

| 확인할 것 | 정상 |
|---|---|
| `query_text` | 사용자가 보낸 문장과 같습니다 |
| 벡터 차원 | `index.dimension`과 같습니다 |

차원이 다르면 다음 단계의 검색 요청이 거부됩니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 호출 순서 | `src/struct4search/query/service.py` · `DefaultQueryService.execute` |
| 임베딩 호출 | `src/struct4search/adapters/search/opensearch/embedding.py` · `UrllibOpenAICompatibleEmbeddingPort` |
| 설정 주입 | `src/struct4search/bootstrap/composition.py` |
