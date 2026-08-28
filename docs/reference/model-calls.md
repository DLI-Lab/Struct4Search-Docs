---
sidebar_position: 6
title: 모델 사용 위치
---

# 모델 사용 위치

파이프라인과 API가 사용하는 현재 모델과 설정 위치를 정리합니다. 아래 모델 ID는 `configs/production.yaml`을 실행했을 때의 값입니다.

## 현재 production 모델

| 용도 | 현재 모델 |
|---|---|
| 스캔·복합 PDF 파싱 | MinerU2.5-Pro-2605 |
| Entity 추출 | `urchade/gliner_multi-v2.1` |
| Metadata·Triple·동일 Entity 이름 검증·검색표현 생성 | `Qwen/Qwen3-14B` |
| 원문·검색표현·질의 Embedding | `Qwen/Qwen3-Embedding-8B` |
| 답변 생성 | `Qwen/Qwen3-14B` |
| 청킹 토큰 계산 | `nlpai-lab/KURE-v1` tokenizer |

## 단계별 모델 호출

| 단계 | 사용 모델 | 하는 일 | 실행 위치 | 설정 시작점 |
|---|---|---|---|---|
| [문서 파싱](../indexing/parsing.md) | MinerU2.5-Pro-2605 | 스캔·복합 PDF 페이지를 분석 | 별도 GPU service | `parser.*` |
| [NER](../indexing/ner.md) | `urchade/gliner_multi-v2.1` | 원문에서 Entity를 추출 | ingest process | `ner.*` |
| [Metadata 생성](../indexing/metadata.md) | `Qwen/Qwen3-14B` | 문서 Metadata를 생성 | 별도 LLM service | `llm.*`, `g2.metadata_*` |
| [KG 구축](../indexing/triple-kg.md) | `Qwen/Qwen3-14B` | Entity 관계를 Triple로 생성하고 alias를 검증 | 별도 LLM service | `llm.*`, `triple.*` |
| [검색표현 생성](../indexing/retrieval-text.md) | `Qwen/Qwen3-14B` | Metadata와 KG에서 검색용 문장을 생성 | 별도 LLM service | `llm.*`, `g2.*` |
| [인덱싱](../indexing/opensearch.md) | `Qwen/Qwen3-Embedding-8B` | 원문·검색표현을 벡터로 변환 | 별도 embedding service | `index.embedding_*` |
| [질의 처리](../query/request.md) | `Qwen/Qwen3-Embedding-8B` | 사용자 질의를 벡터로 변환 | 별도 embedding service | `index.embedding_*` |
| [답변과 출처 표기](../query/structured-answer.md) | `Qwen/Qwen3-14B` | 검색 근거로 답변과 Citation을 생성 | local LLM service | `query.reader.*` |

디지털 PDF 파싱은 `pymupdf4llm`, 원문 청킹은 KURE tokenizer만 사용합니다. Hybrid 검색, RRF 통합, 검색 결과 후처리와 Citation 정리는 모델을 호출하지 않습니다.

## API별 필요한 모델

아래 표는 API가 요청을 처리하면서 실제로 추론을 요청하는 모델을 기준으로 합니다.

| 프로세스 | API | 필요한 모델 | 비고 |
|---|---|---|---|
| `struct4search-api` | `POST /v1/search` | `Qwen/Qwen3-Embedding-8B` | 색인과 같은 profile의 질의 Embedding·Hybrid/RRF만 실행하고 Reader는 호출하지 않음 |
| `struct4search-api` | `POST /v1/responses`, `POST /v1/response` | `Qwen/Qwen3-Embedding-8B`, `Qwen/Qwen3-14B` | `/v1/response`는 호환 alias. `--fixture-results`이면 모델을 호출하지 않음 |
| Restored snapshot API | `POST /v1/response` | `Qwen/Qwen3-Embedding-8B`, `gpt-5.6-luna` | 기본 `configs/mac-dump-gpt.yaml` 기준. Embedding은 복원한 벡터와 같은 모델을 사용하고 Reader만 hosted GPT를 사용 |
| Full-corpus answer bridge | `POST /v1/response` | `Qwen/Qwen3-Embedding-8B`, `Qwen/Qwen3-14B` | Embedding service가 없으면 BM25로 검색을 계속하지만, 답변 생성에는 Reader가 필요 |
| ChatKit adapter | `POST /chatkit` | 연결된 `/v1/response` API의 Embedding·Reader | ChatKit이 모델을 직접 로드하지 않고 `S4S_RESPONSE_URL`로 질의를 전달 |
| MinerU parsing service | `POST /v1/two-step-extract`, `POST /v1/two-step-extract-batch` | MinerU2.5-Pro-2605 | 요청에 담긴 페이지 이미지를 GPU에서 분석 |

다음 API는 요청을 처리할 때 모델 추론을 하지 않습니다.

- 각 프로세스의 health·metrics API
- `GET /v1/source-pdf`
- 문서 목록·IDR·파이프라인 결과·KG·PDF·페이지·Figure 조회 API
- ChatKit adapter의 출처·문서·대화 조회 API
- Policy review의 `GET /api/decisions`, `POST /api/decisions`

MinerU service의 `/health`와 `/metrics`는 추론을 실행하지는 않지만, 해당 service는 MinerU 모델을 로드한 상태로 시작됩니다. 전체 API 경로는 [API Reference](api-reference.md)에서 확인합니다.

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
