---
sidebar_position: 3
title: 데이터 구조와 ID 체계
---

# 데이터 구조와 ID 체계

Struct4Search에서 주요 데이터와 ID가 무엇을 가리키고, 서로 어떻게 연결되는지 정리합니다.

## ID 체계

| 접두사 | 의미 | 만들어지는 단계 | 주로 쓰이는 곳 |
|---|---|---|---|
| `d…` | 문서 | 문서 등록 | 모든 산출물의 소속 문서 |
| `#p…#b…#e…` | 페이지 · 블록 · 요소 | [문서 파싱](../indexing/parsing.md) | 원문 위치 |
| `fc_` | 원문 청크 | [원문 청킹](../indexing/chunking.md) | 원문 위치와 후속 단계 연결 |
| `ruf_` | 원문 검색 단위(unit_id) | 원문 청킹 | 색인 · 검색 · **답변 Citation** |
| `e_` | Entity | [NER](../indexing/ner.md) | KG 구축 |
| `kgtr_` | Triple | [KG 구축](../indexing/triple-kg.md) | 검색표현 생성 |
| `rte_` | 검색표현 | [검색표현 생성](../indexing/retrieval-text.md) | 색인 · 검색, **Citation 불가** |

```text
문서       d002343_6b6d39ebe6
  └─ 요소     d002343_6b6d39ebe6#p2#b7#e0
      └─ 원문 청크  fc_11175e926dbb1e25f165a932
          └─ 검색 단위  ruf_11175e926dbb1e25f165a932
              ├─ Triple     kgtr_4404df7b9e441dae2f5f92ef
              └─ 검색표현   rte_2a300459506675e3d86b0dc8
```

`fc_`와 `ruf_`는 같은 원문 청크를 서로 다른 단계에서 가리키는 ID이며 1:1로 연결됩니다. 검색과 답변에서는 `ruf_`를 사용하며, 최종 Citation에도 `ruf_`만 기록됩니다.

## 검색 단위

OpenSearch에 저장되는 검색 단위는 두 종류입니다.

| `unit_kind` | ID | 내용 | Citation |
|---|---|---|---|
| `source` | `ruf_*` | 원문 청크 | 가능 |
| `retrieval_expression` | `rte_*` | 검색표현 | 불가 |

두 종류 모두 검색에 사용할 `text`와 임베딩 `vector`를 가지며, 같은 OpenSearch 인덱스에 저장됩니다.

주요 필드는 다음과 같습니다.

| 필드 | 의미 |
|---|---|
| `unit_id` | 검색 단위 ID |
| `document_id` | 소속 문서 |
| `unit_kind` | 원문 청크 또는 검색표현 |
| `text` | BM25 검색에 사용하는 텍스트 |
| `vector` | Dense 검색에 사용하는 임베딩 |
| `source_f400_unit_ids` | 연결된 원문 검색 단위 |
| `page_indices` | 원본 페이지 |

원문 청크의 `source_f400_unit_ids`는 자기 자신을 가리키고, 검색표현은 자신과 연결된 원문 청크를 가리킵니다. 이 연결은 [검색 결과 점수 통합](../query/score-integration.md)에서 검색표현을 원문 청크로 변환할 때 사용됩니다.

## 주요 데이터

### 원문 청크

[원문 청킹](../indexing/chunking.md)에서 생성되는 검색의 기본 원문 단위입니다. 원문 텍스트와 원본 문서·페이지 위치를 함께 가지고 있으며, OpenSearch에 들어갈 때 `ruf_` 검색 단위로 구성됩니다.

### Metadata

[Metadata 생성](../indexing/metadata.md)에서 문서별로 생성하는 도메인 정보입니다. `domain_*` 18종 필드로 구성되며, 이후 검색표현에 문맥을 보강하는 데 사용됩니다.

### Triple과 지식그래프

[KG 구축](../indexing/triple-kg.md)에서 Entity 사이의 관계를 `(주체, 관계, 대상)` 형태의 Triple로 추출합니다. 각 Triple은 `kgtr_` ID와 원문 근거를 가지며, 같은 문서의 Triple을 모아 문서 단위 지식그래프를 구성합니다.

### 검색표현

[검색표현 생성](../indexing/retrieval-text.md)에서 Metadata와 지식그래프를 바탕으로 생성하는 검색용 문장입니다.

검색표현은 하나 이상의 원문 청크와 연결되며, 검색 결과에는 사용되지만 답변의 사실 근거나 Citation으로는 사용할 수 없습니다.

### 답변과 Citation

답변 모델은 claim과 그 claim을 뒷받침하는 원문 검색 단위 ID를 함께 반환합니다.

```json
{
  "claims": [
    {
      "text": "온열질환 발생 시 필요한 응급조치를 실시해야 합니다.",
      "cited_unit_ids": [
        "ruf_3612bfa54e64f90ad761c4c9"
      ]
    }
  ]
}
```

`cited_unit_ids`에는 `ruf_` 원문 청크만 들어갈 수 있습니다. 이후 [답변 후처리 및 원본 출처 연결](../query/citations.md)에서 이 ID를 실제 문서와 원본 페이지에 연결합니다.

```text
claim
  → ruf_ 원문 청크
  → document_id
  → 원본 페이지
  → 사용자에게 표시되는 Citation
```
