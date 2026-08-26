---
sidebar_position: 8
title: 설정과 실행 환경
---

# 설정과 실행 환경

실행 동작은 YAML profile이 정하고, 서버마다 달라지는 경로·접속 정보는 `S4S_*` 환경변수로 지정합니다.

## 먼저 볼 파일

| 파일 | 용도 |
|---|---|
| `configs/production.yaml` | `struct4search-ingest`, `struct4search-evaluate`, `struct4search-api`에 전달하는 production profile |
| `configs/base.yaml` | 공통 typed profile. `ingest-production.yaml`을 상속 |
| `configs/ingest-production.yaml` | 인덱싱 정책의 원본 값. 단독 실행 profile이 아님 |
| `configs/services/cold-services.yaml` | production ingest가 관리하는 외부 서비스 |
| `configs/services/local-stack.yaml` | `--stack`으로 선택하는 local stack |
| `configs/machine-paths.yaml` | 기계별 경로의 기본값 |
| `configs/model-catalog.yaml` | 모델 ID와 revision |

실행 명령에는 `configs/production.yaml`을 사용합니다. `configs/ingest-production.yaml`을 `--config`로 직접 전달하면 profile 검증에서 거부됩니다.

## profile에서 정하는 값

| 영역 | 정하는 것 |
|---|---|
| `parser` · `chunking` · `ner` | 문서 파싱, 청킹, NER |
| `llm` · `triple` · `kg` · `g2` | Metadata, KG, 검색표현 생성 |
| `index` | OpenSearch와 임베딩 |
| `query.native_rrf` | BM25·Dense 후보 수, RRF, 최종 근거 수 |
| `query.reader` | 답변 model, endpoint, tokenizer, generation 설정 |
| `prompts` | 단계별 prompt ID·version·hash |

profile은 상속을 모두 적용한 뒤 검사합니다. 필수 key 누락, 타입 오류, 알 수 없는 구현 이름, prompt 또는 Native RRF 정의 불일치는 실행 전에 거부됩니다.

## 기계별 설정

기계마다 다른 경로는 `machine-paths.yaml`을 수정하기보다 같은 이름의 환경변수로 덮어씁니다.

| 환경변수 | 용도 |
|---|---|
| `S4S_PYTHON_INTERPRETER` | 관리 서비스용 Python |
| `S4S_VLLM_SITE_PACKAGES` · `S4S_EXTRA_SITE_PACKAGES` · `S4S_VLLM_BIN` | vLLM과 추가 Python 경로 |
| `S4S_MINERU_RUNTIME_DEPS` · `S4S_MINERU_MODEL_ROOT` | MinerU 실행 의존성과 모델 위치 |
| `S4S_HUGGINGFACE_CACHE` | model snapshot cache |
| `S4S_OPENSEARCH_HOME` · `S4S_OPENSEARCH_CONFIG` | host-managed OpenSearch 경로 |
| `S4S_ARTIFACT_PRODUCTION_ROOT` · `S4S_ARTIFACT_EVALUATION_ROOT` · `S4S_ARTIFACT_TEST_FIXTURE_ROOT` · `S4S_ARTIFACT_CONTROL_ROOT` | artifact 경로 |
| `S4S_KG_DSN` · `S4S_DOCUMENT_DSN` | KG와 document metadata PostgreSQL 연결 |
| `S4S_REPOSITORY_ROOT` | wheel 설치 후 checkout을 찾을 때 사용할 저장소 경로 |
| `OPENAI_API_KEY` | OpenAI provider를 선택한 profile에서만 사용 |

현재 해석된 값을 확인합니다.

```bash
struct4search-env
struct4search-env --shell
```

`--shell`은 export 문을 출력할 뿐 현재 셸을 변경하지 않습니다. 적용이 필요하면 호출한 셸에서 `eval "$(struct4search-env --shell)"`을 실행합니다.

설정 변경 뒤의 재처리 범위는 [변경 지점 찾기](../maintenance/change-map.md), 실제 명령은 [실행 명령](cli.md)에서 확인합니다.
