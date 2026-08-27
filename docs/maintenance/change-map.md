---
sidebar_position: 1
title: 변경 지점 찾기
---

# 변경 지점 찾기

바꾸려는 항목에 따라 수정 위치와 다시 실행해야 하는 범위를 확인합니다.

## 목적별 변경 위치

| 바꾸려는 것 | 위치 | 영향을 받는 단계 | 재처리·재색인 | 자세히 보기 |
|---|---|---|---|---|
| 파서·페이지 판정 | `configs/production.yaml`<br>`parser` | 문서 파싱 이후 | 재처리 · 재색인 | [설정 수정](configuration.md) |
| 청크 크기·오버랩 | `configs/production.yaml`<br>`chunking` | 원문 청킹 이후 | 재처리 · 재색인 | [설정 수정](configuration.md) |
| NER 모델·라벨 | `configs/production.yaml`<br>`ner` | NER 이후 | 재처리 · 재색인 | [모델 교체](models.md) |
| Metadata 필드 | `backend/struct4search/domain/`<br>`metadata_fields.yaml` | Metadata 생성 이후 | 재처리 · 재색인 | [프롬프트와 규칙 수정](prompts.md) |
| KG 묶기 기준 | `configs/production.yaml`<br>`triple` | KG 구축 이후 | 재처리 · 재색인 | [설정 수정](configuration.md) |
| 검색표현 생성 방식 | `configs/production.yaml`<br>`g2` | 검색표현 생성 이후 | 재처리 · 재색인 | [설정 수정](configuration.md) |
| 임베딩 모델·차원 | `configs/production.yaml`<br>`index` | 인덱싱 | 새 인덱스 필요 | [데이터와 인덱스 구조 변경](data-index.md) |
| OpenSearch 매핑 | `backend/struct4search/`<br>`index_stage.py` | 인덱싱 | 새 인덱스 필요 | [데이터와 인덱스 구조 변경](data-index.md) |
| 검색 깊이·후보 수 | `configs/production.yaml`<br>`query.native_rrf` | 검색·답변 | 없음 | [검색과 Context 수정](search-context.md) |
| 최종 근거 수 | `configs/production.yaml`<br>`query.native_rrf.`<br>`final_source_top_k` | Context · 답변 | 없음 | [검색과 Context 수정](search-context.md) |
| 답변 모델 | `configs/production.yaml`<br>`query.reader` | 답변 | 없음 | [모델 교체](models.md) |
| Metadata·Triple·검색표현 프롬프트 | `prompts/` | 해당 생성 단계 이후 | 재처리 · 재색인 | [프롬프트와 규칙 수정](prompts.md) |
| 답변 프롬프트 | `prompts/answer/` | 답변 | 없음 | [프롬프트와 규칙 수정](prompts.md) |
| 단계 추가·교체 | `backend/struct4search/ingest/stages/`<br>`bootstrap/composition.py` | 해당 단계 이후 | 변경 범위에 따라 결정 | [모듈 추가와 교체](modules.md) |

## 재처리 범위

문서 인덱싱 단계에서 생성되는 데이터가 바뀌면 그 결과를 사용하는 후속 단계도 다시 처리해야 합니다.

예를 들어 원문 청크, Metadata, KG 또는 검색표현이 달라지면 OpenSearch에 저장되는 검색 단위도 달라지므로 재색인이 필요합니다.

반대로 검색 깊이, 최종 근거 수, 답변 모델처럼 검색·답변 단계에서만 사용하는 값을 변경하는 경우에는 기존 인덱스를 그대로 사용할 수 있습니다. 다만 검색이나 답변 결과는 달라질 수 있으므로 관련 평가는 다시 확인합니다.

## 변경 전에 확인할 것

- 현재 실행 중인 인덱싱 작업이 있는지 확인합니다.
- 변경 전 설정과 인덱스를 되돌릴 수 있도록 남겨 둡니다.
- 위 표에서 필요한 재처리·재색인 범위를 확인합니다.
- 검색이나 답변 결과에 영향을 주는 변경은 [기준 성능과 회귀 판정](../testing/regression-gates.md)에 따라 다시 평가합니다.
