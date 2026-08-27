---
sidebar_position: 2
title: 모델 교체
---

# 모델 교체

모델 ID 하나를 바꾸는 것으로 교체가 끝나지 않습니다. model catalog, 실행 profile, service 정의, host의 snapshot 경로를 함께 맞춘 뒤 영향받는 단계만 다시 실행합니다.

## 교체 대상과 설정 위치

| 모델 | 쓰는 단계 | 주요 설정 위치 |
|---|---|---|
| MinerU | 스캔·복합 페이지 파싱 | `configs/services/cold-services.yaml` · `parser` |
| GLiNER | NER | `configs/model-catalog.yaml` · `configs/production.yaml` · `ner` |
| Ingest LLM | Metadata · Triple/KG · G2 검색표현 | `configs/model-catalog.yaml` · `configs/production.yaml` · `llm`, `triple`, `g2` |
| 임베딩 모델 | 문서·검색표현·질의 임베딩 | `configs/model-catalog.yaml` · `configs/production.yaml` · `index` · `configs/services/cold-services.yaml` |
| Reader LLM | 최종 답변과 출처 표기 | `configs/production.yaml` · `query.reader` |

파이프라인의 단계별 모델과 설정 시작점은 [모델 사용 위치](../reference/model-calls.md)에서 확인합니다.

## 자동으로 바뀌지 않는 값

LLM이나 임베딩 model 이름을 바꿔도 context 길이와 vector 차원은 model metadata에서 자동 계산되지 않습니다.

| 값 | 자동 변경 여부 | 바꾸는 위치와 의미 |
|---|---|---|
| model ID·revision | 자동 아님 | `configs/model-catalog.yaml`. ID와 immutable revision을 함께 지정합니다. |
| host의 model snapshot 경로 | 자동 아님 | `configs/machine-paths.yaml` 또는 허용된 `S4S_*` 환경변수. catalog model과 같은 snapshot을 가리켜야 합니다. |
| `llm.context_tokens` | 자동 아님 | `configs/production.yaml`. 값을 정하면 local Qwen service의 `--max-model-len`에는 자동 전달됩니다. |
| `query.reader.generation.context_window_tokens` | 자동 아님 | `configs/production.yaml`. reader가 prompt와 답변 token budget을 계산할 때 사용합니다. 현재 local reader에서는 `llm.context_tokens`와 같아야 합니다. |
| `query.reader.tokenizer` | 자동 아님 | `configs/production.yaml`. reader model과 같은 tokenizer를 명시합니다. |
| embedding service 입력 길이 | 자동 아님 | `configs/services/cold-services.yaml`의 embedding service `--max-model-len`입니다. 현재 값은 `8192`입니다. |
| `index.dimension` | 자동 아님 | `configs/production.yaml`. embedding 출력 차원과 같아야 하며 변경하면 새 OpenSearch index가 필요합니다. |

질의 embedding adapter에는 별도의 `query_vector context length` 환경변수가 없습니다. 질의 문자열을 `/v1/embeddings`로 보내며, 허용 입력 길이는 embedding service의 `--max-model-len`이 결정합니다. 따라서 embedding model을 교체할 때 service 입력 길이를 수동으로 검토합니다.

## 변경 절차

1. `configs/model-catalog.yaml`에서 model ID와 immutable revision을 변경합니다.
2. `configs/machine-paths.yaml` 또는 `.env`의 허용된 `S4S_*` 값이 같은 snapshot을 가리키도록 합니다.
3. `configs/production.yaml`에서 model name, endpoint, tokenizer, context 길이, 출력 길이와 vector 차원을 검토합니다.
4. local service를 직접 실행한다면 `configs/services/cold-services.yaml`의 model 경로, `--max-model-len`, GPU와 memory 설정을 함께 변경합니다.
5. 아래 재실행 범위에 따라 기존 실행과 분리된 output·index에서 한 문서 E2E를 실행합니다.
6. 검색 또는 답변에 영향을 주는 교체는 QA 평가까지 다시 확인합니다.

profile과 service가 다른 model·context 길이를 가리키면 시작 단계 validation 또는 model endpoint 점검에서 실패해야 합니다. 숫자를 임의로 늘리지 말고 새 모델이 실제로 지원하는 최대 길이와 현재 GPU memory를 기준으로 정합니다.

## 모델별 확인 사항

### MinerU

MinerU 교체는 스캔·복합 페이지의 파싱 결과를 바꿉니다. 이후 Canonical IDR와 인덱싱 결과를 다시 생성합니다. 디지털 PDF의 pdf4LLM 처리에는 MinerU가 사용되지 않습니다.

### GLiNER

model ID와 revision을 함께 관리합니다. 새 모델이 현재 Entity 유형과 출력 형식을 지원하는지 확인한 뒤 NER 이후 결과를 다시 생성합니다.

### Ingest LLM

Metadata, Triple/KG, G2는 구조화된 출력을 사용합니다. model과 context 길이를 바꾼 뒤 각 단계의 prompt와 출력 형식을 따르는지 설정 전달 테스트와 한 문서 실행으로 확인합니다. 어느 역할을 바꿨는지에 따라 해당 단계 이후만 다시 처리합니다.

### 임베딩 모델

문서·검색표현을 색인하는 embedding과 사용자 질의를 변환하는 embedding은 같은 model과 vector 차원을 사용해야 합니다. 입력 길이와 `index.dimension`도 새 모델에 맞춰 수동으로 검토합니다.

model이나 차원이 바뀌면 기존 vector와 호환되지 않습니다. 기존 index를 삭제하지 않고 새 index를 생성해 다시 색인한 뒤 검색 결과를 검증합니다.

### Reader LLM

Reader는 최종 검색 결과로 만든 context를 받아 답변과 citation을 생성합니다. `query.reader.model`, `tokenizer`, `generation.context_window_tokens`, `generation_boundary_tokens`, `output_token_policy`를 함께 검토하고 현재 `claims` 출력 형식과 인용 규칙을 따르는지 확인합니다. Reader만 바꾸는 경우 기존 index는 그대로 사용할 수 있습니다.

## 재실행 범위

| 바꾼 모델 | 다시 도는 단계 | 재색인 |
|---|---|---|
| MinerU | 문서 파싱 이후 | 필요 |
| GLiNER | NER · KG · 검색표현 · 인덱싱 | 필요 |
| Metadata용 Ingest LLM | Metadata · 검색표현 · 인덱싱 | 필요 |
| Triple/KG용 Ingest LLM | Triple/KG · 검색표현 · 인덱싱 | 필요 |
| G2용 Ingest LLM | 검색표현 · 인덱싱 | 필요 |
| 임베딩 모델 또는 차원 | 인덱싱 | 새 index 필요 |
| Reader LLM | 답변 | 없음 |

## 변경 후 확인

먼저 사전조건과 한 문서 production E2E를 확인합니다.

```bash
struct4search-preflight
struct4search-smoke-e2e
```

그다음 [평가 실행과 통과 판정](../testing/retrieval-qa.md)에서 영향받은 평가를 실행합니다. 새 index를 만드는 변경은 기존 index를 바로 삭제하지 않습니다. 새 index의 검색과 답변을 검증한 뒤 production 연결을 전환합니다.
