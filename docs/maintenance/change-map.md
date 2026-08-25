---
sidebar_position: 1
title: 변경 지점 찾기
---

# 변경 지점 찾기

무엇을 바꾸려는지 정하면 어디를 고치고 무엇을 다시 돌려야 하는지 이 표에서 찾습니다.

## 목적별 변경 위치

| 바꾸려는 것 | 위치 | 영향을 받는 단계 | 재처리·재색인 | 확인 |
|---|---|---|---|---|
| 파서·페이지 판정 | `configs/ingest-production.yaml` · `parser` | 문서 파싱부터 전부 | 전체 재처리 · 재색인 | [모델 교체](models.md) |
| 청크 크기·오버랩 | `configs/ingest-production.yaml` · `chunking` | 원문 청킹부터 전부 | 전체 재처리 · 재색인 | [설정 수정](configuration.md) |
| NER 모델·라벨 | `configs/ingest-production.yaml` · `ner` | NER 이후 전부 | 재처리 · 재색인 | [모델 교체](models.md) |
| Metadata 필드 | `src/struct4search/domain/metadata_fields.yaml` | Metadata 생성 이후 | 재처리 · 재색인 | [프롬프트와 규칙 수정](prompts.md) |
| KG 묶기 기준 | `configs/ingest-production.yaml` · `triple` | KG 구축 이후 | 재처리 · 재색인 | [설정 수정](configuration.md) |
| 검색표현 생성 방식 | `configs/ingest-production.yaml` · `g2` | 검색표현 생성 · 인덱싱 | 재처리 · 재색인 | [설정 수정](configuration.md) |
| 임베딩 모델·차원 | `configs/ingest-production.yaml` · `index` | 인덱싱 | 인덱스를 새로 만듦 | [데이터와 인덱스 구조 변경](data-index.md) |
| 색인 매핑 | `src/struct4search/index_stage.py` | 인덱싱 | 인덱스를 새로 만듦 | [데이터와 인덱스 구조 변경](data-index.md) |
| 검색 깊이·후보 수 | `configs/production.yaml` · `query.native_rrf` | 검색 경로 | 없음 | [검색과 Context 수정](search-context.md) |
| 최종 근거 수 | `configs/production.yaml` · `query.native_rrf.final_source_top_k` | Context · 답변 | 없음 | [검색과 Context 수정](search-context.md) |
| 답변 모델 | `configs/production.yaml` · `query.reader` | 답변 | 없음 | [모델 교체](models.md) |
| 프롬프트 문구 | `prompts/` | 해당 단계 | 그 단계부터 재처리 | [프롬프트와 규칙 수정](prompts.md) |
| 단계 추가·교체 | `src/struct4search/ingest/stages/` · `bootstrap/composition.py` | 해당 단계 이후 | 재처리 · 재색인 | [모듈 추가와 교체](modules.md) |

## 재처리 범위가 정해지는 원리

원문 청크의 ID는 본문이 아니라 **위치와 설정 해시**로 만듭니다. 그래서 인덱싱 쪽 설정이 바뀌면 같은 문서라도 검색 단위 ID가 전부 달라지고, 기존 색인과 섞을 수 없습니다.

검색 경로의 값은 색인에 손대지 않으므로 재색인이 필요 없습니다. 대신 결과가 달라지므로 평가를 다시 측정합니다.

## 바꾸기 전에 확인할 것

- 지금 도는 인덱싱 실행이 있는지 확인합니다. 있으면 끝난 뒤에 바꿉니다.
- 되돌릴 방법을 먼저 정합니다. 설정은 값을 되돌리면 되지만, 재색인한 인덱스는 되돌아가지 않습니다.
- 바꾼 뒤 무엇을 다시 재는지 [기준 성능과 회귀 판정](../testing/regression-gates.md)에서 확인합니다.
