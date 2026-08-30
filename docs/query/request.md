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

아래 벡터는 구조를 보여 주기 위해 앞의 세 값만 사용한 짧은 예입니다. 실제 벡터는 4,096개의 숫자로 구성됩니다.

```json
{
  "query_text": "온열 질환 의심자가 생기면 어떻게 하나요?", // 사용자가 입력한 원문 질의
  "query_vector": [0.0142, -0.0317, 0.0089]                 // Dense 검색에 사용하는 질의 벡터의 앞 세 값
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

## API 요청에서 이 단계 확인하기

질의 처리는 별도 API가 아니라 `POST /v1/search`와 `POST /v1/responses` 요청의 첫 단계로 실행됩니다. 요청 방법은 [API Reference](../reference/api-reference.md)에서 확인합니다. 공개 응답에는 질의 벡터를 그대로 넣지 않으므로, 응답에서 4,096개 숫자를 찾는 방식으로 확인하지 않습니다.

| 확인 대상 | 확인 위치·방법 | 정상 | 비정상 |
|---|---|---|---|
| 질의 입력 | 두 API 중 하나에 `query`를 담아 요청합니다. | 공백이 아닌 질의가 접수되어 검색 단계로 넘어갑니다. | `query`가 없거나 빈 문자열이면 HTTP 422로 요청이 거부됩니다. |
| 질의 임베딩 | 같은 API 요청의 HTTP 상태와 오류 메시지를 확인합니다. | 임베딩이 생성되고 검색까지 끝나 HTTP 200 응답을 받습니다. | 임베딩 서버에 연결할 수 없거나 빈 벡터를 반환하면 검색을 진행하지 않고 오류 응답을 반환합니다. |
| 최종 검색 결과 | `POST /v1/search` 응답의 `search_results`를 확인합니다. | 목록이 반환됩니다. 관련 원문이 없으면 빈 목록이어도 정상입니다. | 응답 형식이 아니거나 서버 오류가 반환되면 임베딩 서버와 OpenSearch 연결을 확인합니다. |

질의 원문과 임베딩 벡터는 요청을 처리하는 동안에만 사용되고 API 응답이나 실행 디렉터리에 저장되지 않습니다. 벡터가 검색 요청까지 그대로 전달되는 내부 규칙은 설치할 때 만든 가상환경을 활성화한 뒤 Struct4Search 저장소의 최상위 디렉터리에서 다음 명령으로 확인할 수 있습니다.

```bash
python -m pytest tests/unit/query/test_canonical_query_service.py
```

이 테스트는 실제 모델 서버나 OpenSearch에 접속하지 않고 준비된 입력으로 질의 임베딩 생성과 검색 요청 전달을 검사합니다. 모든 테스트가 통과하면 내부 연결이 정상이고, 실패하면 출력에 표시된 테스트 이름과 코드 위치를 확인합니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 질의 처리 | `backend/struct4search/query/service.py` · `DefaultQueryService.execute` |
| 임베딩 생성 | `backend/struct4search/adapters/search/opensearch/embedding.py` · `UrllibOpenAICompatibleEmbeddingPort` |
| 설정 주입 | `backend/struct4search/bootstrap/composition.py` |
