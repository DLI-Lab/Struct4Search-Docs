---
sidebar_position: 6
title: 모델 사용 위치
---

# 모델 사용 위치

파이프라인의 어느 단계가 모델을 호출하는지와 해당 설정을 어디서 찾을지 정리합니다. 설정값 전체를 나열하지 않고 파일과 profile key의 시작점만 보여줍니다.

## 단계별 모델 호출

| 단계 | 사용 모델 | 하는 일 | 실행 위치 | 설정 시작점 |
|---|---|---|---|---|
| [문서 파싱](../indexing/parsing.md) | MinerU | 스캔·복합 PDF 페이지를 분석 | 별도 GPU service | `parser.*` |
| [NER](../indexing/ner.md) | GLiNER | 원문에서 Entity를 추출 | ingest process | `ner.*` |
| [Metadata 생성](../indexing/metadata.md) | Ingest LLM | 문서 Metadata를 생성 | 별도 LLM service | `llm.*`, `g2.metadata_*` |
| [KG 구축](../indexing/triple-kg.md) | Ingest LLM | Entity 관계를 Triple로 생성 | 별도 LLM service | `llm.*`, `triple.*` |
| [검색표현 생성](../indexing/retrieval-text.md) | Ingest LLM | Metadata와 KG에서 검색용 문장을 생성 | 별도 LLM service | `llm.*`, `g2.*` |
| [인덱싱](../indexing/opensearch.md) | Embedding 모델 | 원문·검색표현을 벡터로 변환 | 별도 embedding service | `index.embedding_*` |
| [질의 처리](../query/request.md) | Embedding 모델 | 사용자 질의를 벡터로 변환 | 별도 embedding service | `index.embedding_*` |
| [답변과 출처 표기](../query/structured-answer.md) | Reader LLM | 검색 근거로 답변과 Citation을 생성 | local 또는 hosted service | `query.reader.*` |

원문 청킹, Hybrid 검색, RRF 통합, 검색 결과 점수 통합, Citation 후처리는 모델을 호출하지 않습니다.

## 설정 파일

| 파일 | 확인할 내용 |
|---|---|
| `configs/production.yaml` | 답변 Reader의 구현, 모델, endpoint, tokenizer와 생성 설정 |
| `configs/ingest-production.yaml` | Parser, NER, Ingest LLM, Triple, 검색표현, Embedding 설정 |
| `configs/model-catalog.yaml` | 모델 ID와 immutable revision, provider·tokenizer 정보 |
| `configs/services/cold-services.yaml` | local 모델 service의 실행 명령, 포트, GPU, context 설정 |
| `configs/machine-paths.yaml` | host별 Python, model cache와 snapshot 경로 |

`configs/production.yaml`은 `base.yaml`을 거쳐 `ingest-production.yaml`을 상속합니다. 실행할 때는 `production.yaml`을 사용하고, 값을 바꿀 때는 위 표의 정본 파일을 수정합니다.

모델을 교체할 때 함께 바꿔야 할 값과 재실행 범위는 [모델 교체](../maintenance/models.md), service 실행 요건은 [외부 의존](dependencies.md)에서 확인합니다.
