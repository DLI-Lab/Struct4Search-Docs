---
sidebar_position: 6
title: 모델 호출 지도
---

# 모델 호출 지도

파이프라인에서 호출하는 모델과 모델별 설정을 정리합니다. 표의 현재 값은 `configs/production.yaml`을 상속까지 resolve한 값입니다. 실제 수정은 값의 정본이 있는 파일에서 합니다.

## 모델 호출 목록

| 단계 | 모델 | 실행 위치 | 설정 시작점 |
|---|---|---|---|
| [문서 파싱](../indexing/parsing.md) | MinerU 2.5 Pro 1.2B | 별도 GPU service | `parser.*` |
| [NER](../indexing/ner.md) | GLiNER | ingest process | `ner.*` |
| [Metadata 생성](../indexing/metadata.md) | Qwen | 별도 LLM service | `llm.*`, `g2.metadata_*` |
| [KG 구축](../indexing/triple-kg.md) | Qwen | 별도 LLM service | `llm.*`, `triple.*` |
| [검색표현 생성](../indexing/retrieval-text.md) | Qwen | 별도 LLM service | `llm.*`, `g2.*` |
| [인덱싱](../indexing/opensearch.md) | Qwen3 Embedding | 별도 embedding service | `index.embedding_*` |
| [질의 처리](../query/request.md) | Qwen3 Embedding | 별도 embedding service | `index.embedding_*` |
| [답변과 출처 표기](../query/structured-answer.md) | Qwen 또는 hosted GPT | local/hosted reader | `query.reader.*` |

## 설정 파일의 역할

| 파일 | 소유하는 값 |
|---|---|
| `configs/production.yaml` | query reader와 검색 전략, prompt binding |
| `configs/ingest-production.yaml` | Parser, NER, ingest LLM, Triple, G2, embedding |
| `configs/model-catalog.yaml` | 논리 model ID, immutable revision, hosted provider 정보 |
| `configs/services/cold-services.yaml` | local model process의 실행 명령, GPU, memory와 server context |
| `configs/machine-paths.yaml` | host별 Python·cache·model 경로 |

모델 이름을 바꾸는 것만으로 다른 설정이 자동 변경되지는 않습니다. model ID·revision, tokenizer, context 길이, embedding 차원과 service 실행 인자가 서로 맞아야 profile이 실제로 동작합니다.

## 모델 설정

### MinerU Parser

`parser.*`는 pipeline이 MinerU service를 호출하는 방법을 정의하고, service 파일의 `mineru` block은 GPU process 자체를 정의합니다.

| 설정 | 현재 값 | 설명 |
|---|---:|---|
| `parser.scan` | `mineru` | scan·복합 페이지에 사용할 parser implementation |
| `parser.scan_params` | `sanitize: true`, `drop_boilerplate: false` | MinerU 결과 정리 방식 |
| `parser.mineru_endpoints` | `http://127.0.0.1:8115` | 요청을 보낼 service 주소 목록 |
| `parser.mineru_batch_size` | `4` | 한 HTTP 요청에 묶는 페이지 수 |
| `parser.mineru_requests_per_endpoint` | `4` | endpoint 하나에 동시에 보낼 요청 수 |
| `parser.mineru_render_dpi` | `200` | PDF 페이지를 model 입력 이미지로 렌더링할 DPI |
| `parser.mineru_timeout_seconds` | `1800` | 요청 timeout |
| `parser.image_analysis` | `false` | 별도 image 분석을 사용하지 않는 현재 계약. `true`는 허용되지 않음 |
| `parser.image_chart_descriptions` | `disabled` | chart 설명 생성을 사용하지 않는 현재 계약 |
| service `model_path` | MinerU model snapshot | GPU에 올릴 model 경로 |
| service `processor_path` | MinerU processor snapshot | 입력 전처리기 경로 |
| service `cuda_visible_devices` | `0` | MinerU가 볼 GPU |
| service `batch_size` | `4` | model engine의 batch 크기 |
| service `max_concurrency` | `16` | model engine 동시 요청 상한 |
| service `gpu_memory_utilization` | `0.20` | vLLM이 예약할 GPU memory 비율 |
| service `max_model_len` | `8192` | MinerU request context 상한 |

디지털 PDF는 `parser.digital: pymupdf4llm` 경로를 사용하므로 MinerU를 호출하지 않을 수 있습니다. `parser.mineru_batch_size`와 service `batch_size`는 같은 의미의 중복값이 아니라 client batch와 server batch입니다.

### GLiNER NER

| 설정 | 현재 값 | 설명 |
|---|---:|---|
| `ner.model` | `urchade/gliner_multi-v2.1` | model catalog에서 revision을 찾는 논리 model ID |
| model catalog `revision` | `443d26d654e0324125a96bebd8e796c14ff2efe6` | 사용할 immutable snapshot |
| `ner.device` | `cuda:0` | model을 올릴 device |
| `ner.batch_size` | `32` | 한 번에 추론할 text 수 |
| `ner.workers` | `1` | NER worker 수 |
| `ner.threshold` | `0.1` | Entity 후보를 채택할 score 하한 |
| `ner.window_words` | `384` | 긴 text를 나눌 window 크기 |
| `ner.window_overlap_words` | `64` | 인접 window가 겹치는 단어 수. `window_words`보다 작아야 함 |
| `ner.labels` | 8개 domain label | 추출할 Entity 유형 목록 |
| `ner.multi_label` | `true` | 한 span에 복수 label을 허용하는 고정 계약 |
| `ner.release_cache_after_document` | `true` | 문서 처리 뒤 사용하지 않는 GPU cache 반환 |
| `ner.strip_trailing_particles` | `true` | Entity 뒤의 한국어 조사를 제거 |
| `ner.stem_evidence_scope` | `document` | 조사 제거 전 원형을 확인할 범위 |

`include_all_nonempty_elements: true`는 recall-first 후보 생성 계약이므로 끌 수 없습니다.

### Ingest Qwen: Metadata·Triple·검색표현

세 단계는 `llm.*`의 같은 model deployment를 공유합니다. stage별 출력 한도와 request 구성만 다릅니다.

| 공통 설정 | 현재 값 | 설명 |
|---|---:|---|
| `llm.model` | `Qwen/Qwen3-14B` | ingest LLM의 model ID |
| model catalog `revision` | `40c069824f4251a91eefaf281ebe4c544efd3e18` | local Qwen snapshot |
| `llm.endpoints` | `8130/v1`, `8131/v1` | 요청을 분산할 OpenAI-compatible endpoint |
| `llm.context_tokens` | `16384` | service의 `--max-model-len`과 stage 입력 예산의 기준 |
| `llm.triple_max_output_tokens` | `4096` | Triple 응답 최대 token |
| `llm.g2_max_output_tokens` | `4096` | 검색표현 응답 최대 token |
| `llm.metadata_max_output_tokens` | `1024` | Metadata 응답 최대 token |
| `llm.context_margin_tokens` | `128` | protocol·오차를 위해 입력 예산에서 남기는 token |
| `llm.max_triples` | `32` | 한 응답에서 허용하는 Triple 수 |
| `llm.max_endpoints` | `64` | 구조화 출력에서 허용하는 endpoint 수 |
| `llm.max_new_entities` | `32` | 새 Entity 수 상한 |
| `llm.max_concurrent_sequences` | `192` | endpoint별 client 동시 요청 gate |
| `llm.speculative_decoding` | n-gram 설정 | local vLLM server에 전달할 speculative decoding 설정. `null`이면 사용하지 않음 |

stage 입력 예산은 코드가 `context_tokens - stage_max_output_tokens - context_margin_tokens`로 계산합니다. model 이름에서 context 길이를 추론하는 방식은 아닙니다.

#### Triple 요청 설정

| 설정 | 현재 값 | 설명 |
|---|---:|---|
| `triple.strategy` | `v3_near_entity_chunks` | Entity 주변 근거를 구성하는 implementation |
| `triple.near_max_gap` | `3` | 인접 근거로 볼 최대 간격 |
| `triple.structural_override_max_gap` | `5` | 구조상 연결된 근거에 허용할 최대 간격 |
| `triple.target_batching` | `same_document_context_preferred_token_budget` | 같은 문서의 target을 token 예산 안에서 묶는 방식 |
| `triple.targets_per_request_max` | `8` | 요청 하나에 넣는 target 상한 |
| `triple.preferred_input_tokens` | `8000` | batch를 나눌 선호 입력 크기 |
| `triple.transport_max_chunks` | `60` | 전송 가능한 chunk 수 상한 |
| `triple.transport_max_characters` | `12000` | 전송 가능한 문자 수 상한 |
| `triple.soft_triples_per_target` | `4` | target별 권장 Triple 수. decoding 상한은 아님 |
| `triple.thinking` | `false` | thinking을 끄는 고정 계약 |
| `triple.temperature` | `0` | deterministic generation 고정값 |
| `triple.chunk_window` | `8` | compact request가 실제로 보는 chunk window |
| `triple.chunk_window_overlap` | `3` | 인접 window의 중복 chunk 수 |
| `triple.max_hints` | `96` | request에 포함할 Entity hint 상한 |
| `triple.workers` | `48` | 문서 내 Triple 작업 worker 수 |

#### Metadata·G2 요청 설정

| 설정 | 현재 값 | 설명 |
|---|---:|---|
| `g2.selector` | `weighted_undirected_pagerank` | 검색표현 후보의 Triple 중요도 계산 방식 |
| `g2.triple_token_budget` | `6000` | 검색표현 요청 하나에 넣는 Triple text 예산 |
| `g2.minimum_distinct_triples_per_expression` | `1` | 검색표현 하나가 포함해야 하는 서로 다른 Triple 최소 수 |
| `g2.grouping_policy` | `networkx_salience_topic_proximity_other_fallback` | Triple을 검색표현 단위로 묶는 정책 |
| `g2.metadata_context_policy` | `document_deduplicated_unbounded` | Metadata context를 중복 제거해 구성하는 정책 |
| `g2.metadata_priority` | Metadata 18종 순서 | context에서 Metadata를 배치하는 우선순위 |
| `g2.metadata_extraction` | `qwen_domain_schema` | Qwen으로 Metadata 18종을 생성 |
| `g2.metadata_chunks_per_request` | `20` | Metadata 요청 하나에 넣는 chunk 수 |
| `g2.workers` | `96` | 문서별 G2 작업 worker 수 |

### Qwen3 Embedding

인덱싱할 원문·검색표현과 사용자 질의는 같은 model·dimension을 사용합니다.

| 설정 | 현재 값 | 설명 |
|---|---:|---|
| `index.embedding_model` | `Qwen/Qwen3-Embedding-8B` | embedding model ID |
| model catalog `revision` | `1d8ad4ca9b3dd8059ad90a75d4983776a23d44af` | immutable model snapshot |
| `index.embedding_url` | `http://127.0.0.1:8243` | OpenAI-compatible embedding endpoint |
| `index.dimension` | `4096` | 반환 vector 길이와 OpenSearch mapping 차원 |
| `index.embedding_batch_size` | `32` | 인덱싱 요청 하나에 묶는 text 수 |
| `index.workers` | `8` | 인덱싱 worker 수 |
| embedding service `--max-model-len` | `8192` | query와 index text의 server 입력 token 상한 |
| embedding service `--max-num-seqs` | `64` | server가 동시에 처리할 sequence 상한 |
| embedding service `--gpu-memory-utilization` | `0.20` | embedding vLLM의 GPU memory 비율 |

`query_vector`를 만드는 client에는 별도 context-length 환경변수가 없습니다. client는 질의 text를 `/embeddings`에 보내고, 입력 상한은 `configs/services/cold-services.yaml`의 embedding service `--max-model-len`이 결정합니다.

### 답변 Reader: local Qwen 또는 hosted GPT

| 설정 | 현재 production 값 | 설명 |
|---|---:|---|
| `query.reader.implementation` | `openai_compatible` | reader adapter implementation |
| `query.reader.implementation_params` | `{}` | 선택한 implementation에 전달할 추가 인자 |
| `query.reader.model` | `Qwen/Qwen3-14B` | request의 model 이름 |
| `query.reader.endpoint` | `http://127.0.0.1:8130/v1` | HTTP/HTTPS endpoint root |
| `query.reader.tokenizer` | `Qwen/Qwen3-14B` | prompt token 수를 계산할 tokenizer |
| `query.reader.generation.temperature` | `0` | sampling temperature 고정값 |
| `query.reader.generation.top_p` | `1` | nucleus sampling 고정값 |
| `query.reader.generation.seed` | `0` | 재현용 seed 고정값 |
| `query.reader.generation.enable_thinking` | `false` | thinking을 끄는 고정 계약 |
| `query.reader.generation.output_token_policy` | `exact_canonical_prompt_remainder_no_margin_v1` | rendered prompt 뒤 남은 context를 output 상한으로 쓰는 정책 |
| `query.reader.generation.context_window_tokens` | `16384` | reader request 전체 context 상한 |
| `query.reader.generation.generation_boundary_tokens` | `4` | server protocol 경계에 예약하는 token |
| `query.reader.generation.timeout_seconds` | `600` | reader 요청 timeout |
| `query.reader.generation.schema_retry_attempts` | `5` | 구조화 출력이 잘못됐을 때 총 시도 횟수 |
| `query.reader.generation.schema_retry_initial_seconds` | `1` | 첫 retry 대기 |
| `query.reader.generation.schema_retry_max_seconds` | `8` | retry 대기 상한 |

Hosted GPT를 선택할 때는 `configs/model-catalog.yaml`의 model record도 사용합니다.

| Catalog 설정 | 역할 |
|---|---|
| `provider` | hosted request adapter 선택 |
| `endpoint` | provider API root |
| `credential_env` | API key를 읽을 환경변수 이름 |
| `tokenizer` | local snapshot이 없을 때 token 수를 계산할 encoding |
| `reasoning_effort` | provider에 전달할 reasoning 설정 |

profile의 `query.reader.model`, `endpoint`, `tokenizer`는 catalog 값으로 자동 덮어쓰지 않습니다. catalog는 선택한 조합을 검증하고 receipt에 provenance를 남깁니다.

## 모델을 호출하지 않는 단계

| 단계 | 처리 방식 |
|---|---|
| [원문 청킹](../indexing/chunking.md) | tokenizer offset으로 원문을 분할합니다. |
| [Hybrid 검색](../query/hybrid-search.md)·[RRF 통합](../query/rrf.md) | OpenSearch가 처리합니다. |
| [검색 결과 점수 통합](../query/score-integration.md) | deterministic 정책으로 계산합니다. |
| [답변 후처리](../query/citations.md) | Citation을 검증하고 정리합니다. |

Metadata, Triple, 검색표현과 답변은 각각 정해진 schema를 통과해야 합니다. 답변 Citation에는 이번 질의에서 선택된 원문 단위만 사용할 수 있고 검색표현 자체는 Citation이 될 수 없습니다. Prompt와 출력 schema는 [프롬프트와 출력 검증](prompts.md), 모델을 바꿀 때 함께 수정할 값은 [모델 교체](../maintenance/models.md)에서 확인합니다.
