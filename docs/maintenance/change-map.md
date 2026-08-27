---
sidebar_position: 1
title: 변경 영향과 재실행 범위
---

# 변경 영향과 재실행 범위

설정·모델·프롬프트·색인 구조를 바꾸기 전에 수정할 파일과 다시 실행할 범위를 확인합니다. 아래 표에서 변경 항목을 찾은 뒤, 마지막 열의 문서에서 수정 방법을 확인합니다.

| 바꾸는 항목 | 수정할 곳 | 다시 실행할 범위 | OpenSearch 처리 | 자세한 설명 |
|---|---|---|---|---|
| Parser·페이지 판정 | `configs/ingest-production.yaml` · `parser` | 문서 파싱부터 전체 인덱싱 | 기존 검색 데이터 갱신 | [설정 수정](configuration.md) |
| 청크 크기·오버랩·tokenizer | `configs/ingest-production.yaml` · `chunking` | 원문 청킹 → Metadata·KG → 검색표현·인덱싱 | 기존 검색 데이터 갱신 | [설정 수정](configuration.md) |
| NER 모델·라벨 | `configs/ingest-production.yaml` · `ner`<br />`configs/model-catalog.yaml` | NER → Metadata·KG → 검색표현 → 인덱싱 | 기존 검색 데이터 갱신 | [모델 교체](models.md) |
| Metadata 필드 | `backend/struct4search/domain/metadata_fields.yaml` | Metadata 생성 → 검색표현 → 인덱싱 | 기존 검색 데이터 갱신 | [프롬프트와 출력 검증](../reference/prompts.md) |
| KG 입력 묶기·Triple 생성 설정 | `configs/ingest-production.yaml` · `triple` | KG 구축 → 검색표현 → 인덱싱 | 기존 검색 데이터 갱신 | [설정 수정](configuration.md) |
| 검색표현 생성 설정 | `configs/ingest-production.yaml` · `g2` | 검색표현 생성 → 인덱싱 | 기존 검색 데이터 갱신 | [설정 수정](configuration.md) |
| Embedding 모델·벡터 차원 | `configs/ingest-production.yaml` · `index`<br />`configs/model-catalog.yaml` | 인덱싱 | 새 index 생성 | [OpenSearch 인덱스 구조](../reference/opensearch-schema.md#새-인덱스가-필요한-변경) |
| OpenSearch 매핑 | `backend/struct4search/ingest/stages/indexing/stage.py` | 인덱싱 | 새 index 생성 | [OpenSearch 인덱스 구조](../reference/opensearch-schema.md#새-인덱스가-필요한-변경) |
| 검색 깊이·후보 수 | `configs/production.yaml` · `query.native_rrf` | 검색·답변 평가 | 변경 없음 | [검색·답변 파이프라인](../query/overview.md) |
| 최종 근거 수 | `configs/production.yaml` · `query.native_rrf.final_source_top_k` | 답변 평가 | 변경 없음 | [검색 결과 점수 통합](../query/score-integration.md) |
| 답변 모델 | `configs/production.yaml` · `query.reader` | 답변 평가 | 변경 없음 | [모델 교체](models.md) |
| Metadata·Triple·검색표현 프롬프트 | `prompts/` | 해당 생성 단계 이후 | 기존 검색 데이터 갱신 | [프롬프트와 출력 검증](../reference/prompts.md) |
| 답변 프롬프트 | `prompts/answer/` | 답변 평가 | 변경 없음 | [프롬프트와 출력 검증](../reference/prompts.md) |
| 파이프라인 단계 추가·교체 | `backend/struct4search/ingest/stages/`<br />`backend/struct4search/bootstrap/composition.py` | 변경한 단계 이후 | 변경 내용에 따라 판단 | [파이프라인 구현 교체와 단계 추가](modules.md) |

`기존 검색 데이터 갱신`은 영향받는 문서를 다시 처리해 해당 문서의 검색 데이터를 교체한다는 뜻입니다. `새 index 생성`은 기존 데이터와 섞지 않고 새 index에 다시 색인한다는 뜻입니다.

검색이나 답변 결과에 영향을 주는 변경은 [평가 실행과 통과 판정](../testing/retrieval-qa.md)에 따라 다시 평가합니다.
