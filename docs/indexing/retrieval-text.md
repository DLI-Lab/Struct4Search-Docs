---
sidebar_position: 7
title: 검색표현 생성
---

# 검색표현 생성

문서의 지식그래프에서 핵심 주제 중심으로 Triple을 묶고, Metadata로 문맥을 보강해 LLM으로 검색표현을 만듭니다.

## 입력과 출력

| | |
|---|---|
| 입력 | [KG 구축](triple-kg.md)의 문서 지식그래프와 [Metadata 생성](metadata.md)의 18종 값 |
| 출력 | 검색표현 |

검색표현 하나는 이런 형태입니다.

```json
{
  "document_id": "d002343_6b6d39ebe6",                  // 문서
  "text": "곡성 공장의 열분해유 제조 공정에서 ...",        // 생성된 검색용 문장
  "triple_ids": ["kgtr_4404df7b9e441dae2f5f92ef"],      // 근거가 된 관계
  "source_chunk_ids": ["fc_8b80b90f296ec2c2b407a1d3"],  // 원문으로 돌아가는 링크
  "metadata": ["... 일부 생략 ..."],                     // 문맥 보강에 쓴 Metadata
  "document_expression_rank": 1                          // 문서 안에서의 순번
}
```

`source_chunk_ids`가 원문 링크입니다. 이 값이 비면 색인되지 않습니다.

## 원문에서 검색표현까지

```text
원문        이 공정에서는 내부 온도가 급격히 상승하였다.
              ↓ Triple 추출
Triple      (공정, 이상상태, 내부 온도 급상승)
              ↓ + 문서 Metadata
Metadata    공정 = 열분해유 제조 공정 · 장비 = 열분해로
            사고유형 = 화재 · 장소 = 곡성 공장
              ↓ LLM 생성
검색표현    곡성 공장의 열분해유 제조 공정에서 열분해로
            내부 온도가 급격히 상승한 화재 사고
```

원문의 "이 공정"이 무엇인지는 문서의 다른 곳에 적혀 있습니다. Metadata가 그것을 문장 안으로 되돌려 놓기 때문에, 원문에 없던 어휘인 "곡성 공장 화재"로도 이 원문에 도달합니다.

## 동작 방식

1. 문서 지식그래프에서 중요도를 계산해 핵심 주제를 고릅니다.
2. 같은 주제를 설명하는 Triple을 한 묶음으로 만듭니다.
3. 묶음에 문서 Metadata를 붙여 LLM에 보냅니다.
4. 생성된 문장의 근거를 원문 청크와 대조하고 링크를 붙입니다.

Metadata는 문맥을 보강하는 재료이지 새 사실의 출처가 아닙니다. 문장의 사실 근거는 Triple입니다.

원문 청크와 이어지지 않는 표현은 [인덱싱](opensearch.md)에서 제외됩니다. 검색되어도 근거를 제시할 수 없기 때문입니다.

검색표현은 **답변에서 인용할 수 없습니다.** 생성된 문장이라 사실의 출처가 아니며, 검색에 걸리면 자기 점수를 연결된 원문 청크로 넘깁니다([검색 결과 점수 통합](../query/score-integration.md)).

### 환경변수

| 환경변수명 | 기본 옵션 | 의미 |
|---|---|---|
| `g2.selector` | `weighted_undirected_pagerank` | 지식그래프에서 핵심 주제를 고르는 방식 |
| `g2.grouping_policy` | `networkx_salience_topic_proximity_other_fallback` | 같은 주제의 관계를 묶는 규칙 |
| `g2.triple_token_budget` | 6000 | 한 번에 모델에 보낼 관계의 토큰 상한 |
| `g2.minimum_distinct_triples_per_expression` | 1 | 검색표현 하나가 근거로 삼아야 할 최소 관계 수 |
| `g2.metadata_priority` | 정의 파일과 동일 | 문맥 보강에 쓸 필드 우선순위 |

묶는 방식이나 중요도 계산을 바꾸면 표현이 통째로 달라지므로 **검색표현 생성부터 인덱싱까지 다시 처리해야 합니다**([실행과 재처리](rerun.md)).

## 사용 또는 결과 확인

인덱싱 실행기가 호출합니다.

```bash
struct4search-ingest --output <출력 디렉터리> --document-id <문서 ID>
```

문서별 산출물에서 볼 것은 세 가지입니다.

| 확인할 것 | 정상 |
|---|---|
| 표현 수 | 0이면 [KG 구축](triple-kg.md) 결과부터 확인합니다 |
| `triple_ids` | 비어 있지 않습니다 |
| `source_chunk_ids` | 비어 있지 않습니다 |

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 생성과 원문 대조 | `src/struct4search/ingest/stages/retrieval_expression_core.py` |
| 중요도와 묶는 방식 | `src/struct4search/ingest/stages/retrieval_expression_topology.py` · `weighted_undirected_pagerank` |
| 프롬프트 | `prompts/retrieval_expression/g2-system/v1.txt` · `g2-user/v1.txt` |
| 설정값 | `configs/ingest-production.yaml` · `g2` |
