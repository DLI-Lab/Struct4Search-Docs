---
sidebar_position: 3
title: 데이터 구조와 ID 체계
---

# 데이터 구조와 ID 체계

문서에서 반복해서 나오는 ID와 데이터가 각각 무엇을 가리키는지 정리합니다.

## ID 체계

| 접두사 | 가리키는 것 | 만들어지는 단계 | 주로 쓰이는 곳 |
|---|---|---|---|
| `d…` | 문서 | 문서 등록 | 모든 산출물의 소속 |
| `#p0` `#p0#b3` `#p0#b3#e0` | 페이지 · 블록 · 요소 | [문서 파싱](../indexing/parsing.md) | 원문 위치 |
| `fc_` | 원문 청크 | [원문 청킹](../indexing/chunking.md) | 관계의 근거, 검색표현 링크 |
| `ruf_` | 검색 단위(원문) | 원문 청킹 | 색인, **답변 인용** |
| `e_` | 엔티티 | [NER](../indexing/ner.md) | KG 구축 |
| `kgtr_` | Triple | [KG 구축](../indexing/triple-kg.md) | 검색표현의 근거 |
| `rte_` | 검색표현 | [검색표현 생성](../indexing/retrieval-text.md) | 색인. **인용 불가** |

```text
문서       d002343_6b6d39ebe6
요소       d002343_6b6d39ebe6#p2#b7#e0
원문 청크  fc_11175e926dbb1e25f165a932
검색 단위  ruf_11175e926dbb1e25f165a932   ← 접두사 뒤 24자가 같음
엔티티     e_fc7faadc51995f862469
Triple     kgtr_4404df7b9e441dae2f5f92ef
검색표현   rte_2a300459506675e3d86b0dc8
```

요소 ID는 `#`로 계층을 담고 있어 ID만 보고 상위를 알 수 있습니다. `fc_`와 `ruf_`는 같은 청크의 두 이름이고 1:1입니다.

## 검색 단위

색인에 들어가는 문서입니다. 두 종류가 같은 형태를 쓰고 `unit_kind`로 구분합니다.

| 필드 | 의미 |
|---|---|
| `unit_id` | `ruf_` 또는 `rte_` |
| `document_id` | 소속 문서 |
| `unit_kind` | `source` 또는 `retrieval_expression` |
| `presentation` | 만들어진 방식 |
| `text` | BM25 검색 대상 본문 |
| `vector` | Dense 검색 대상 벡터 |
| `source_f400_unit_ids` | 원문 청크는 자기 자신, 검색표현은 연결된 청크 |
| `source_f400_chunk_ids` | 위에 대응하는 `fc_` |
| `page_indices` | 원본 페이지 목록. 0부터 |
| `triple_ids` | 검색표현의 근거 관계. 원문 청크는 빈 배열 |

## 원문 청크

색인 이전의 산출물입니다. 검색 단위보다 필드가 많습니다.

| 필드 | 의미 |
|---|---|
| `chunk_id` · `unit_id` | `fc_` · `ruf_` |
| `text` · `index_text` | 본문 |
| `token_count` | 토큰 수 |
| `source_block_ids` · `source_element_ids` | 원문 블록·요소 |
| `source_spans` | 원문 문자 범위와 청크 문자 범위의 짝 |
| `page_indices` | 원본 페이지 |
| `heading_contexts` | 상위 제목 경로 |

`source_spans`가 청크 안의 위치를 원문 위치로 되돌리는 재료입니다.

## Metadata

문서 하나당 한 행이고 저장 키는 `domain_` 접두사를 붙인 18종입니다. 모든 값이 배열이며 없으면 빈 배열입니다. 필드 목록은 [Metadata 생성](../indexing/metadata.md)에 있습니다.

## Triple과 문서 지식그래프

| 필드 | 의미 |
|---|---|
| `triple_id` | `kgtr_` |
| `document_id` | 소속 문서 |
| `head_id` · `relation` · `tail_id` | 주체 · 관계 · 대상 |
| `evidence_spans` | 근거가 되는 청크의 구간 |

문서 지식그래프는 `document_id`·`nodes`·`edges`를 가진 문서 단위 한 건입니다.

## 검색표현

| 필드 | 의미 |
|---|---|
| `document_id` | 소속 문서 |
| `text` | 생성된 검색용 문장 |
| `triple_ids` | 근거가 된 관계 |
| `source_chunk_ids` | 원문으로 돌아가는 링크 |
| `metadata` | 문맥 보강에 쓴 값 |
| `document_expression_rank` | 문서 안에서의 순번 |

`source_chunk_ids`가 비면 색인되지 않습니다.

## 답변

| 필드 | 의미 |
|---|---|
| `claims[].text` | 주장 문장 |
| `claims[].cited_unit_ids` | 그 문장을 뒷받침하는 `ruf_` |
| `answer_text` | claim 문장을 이은 답변 |
| `cited_unit_ids` | claim 인용을 중복 없이 모은 목록 |
| `citation_normalization` | 정리 집계 네 값 |

출처 링크는 `unit_id`·`href`·`document_id`·`page_number` 네 값입니다. `page_number`는 1부터 셉니다.
