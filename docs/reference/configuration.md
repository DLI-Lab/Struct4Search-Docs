---
sidebar_position: 8
title: 설정과 환경 변수
---

# 설정과 환경 변수

Struct4Search의 실행 설정은 **실행 프로파일**과 **셸 환경변수** 두 곳에서 관리합니다.

| 구분      | 위치               | 역할                     |
| ------- | ---------------- | ---------------------- |
| 실행 프로파일 | `configs/*.yaml` | 파이프라인의 동작 방식과 모델·검색 설정 |
| 셸 환경변수  | 실행 환경            | 기계별 경로와 접속 정보          |

각 컴포넌트 페이지의 `환경변수` 표에 표시된 `parser.*`, `chunking.*`, `query.*` 등의 값은 실제로는 실행 프로파일의 키입니다. 셸에서 `export`하는 환경변수와는 구분합니다.

## 실행 프로파일

| 파일                                    | 역할                   |
| ------------------------------------- | -------------------- |
| `configs/production.yaml`             | CLI가 선택하는 production 통합 profile |
| `configs/base.yaml`                   | production이 상속하는 typed profile |
| `configs/ingest-production.yaml`      | base가 상속하는 ingest pipeline 설정 |
| `configs/services/cold-services.yaml` | 실행할 외부 서비스 정의        |
| `configs/evaluation-release.json`     | 평가셋 릴리스              |
| `configs/machine-paths.yaml`          | 기계별 경로               |

production 상속 순서는 `production.yaml → base.yaml → ingest-production.yaml`입니다. 기계마다 달라지는 경로는 `machine-paths.yaml` 또는 allowlist된 셸 환경변수에서 가져옵니다.

### 문서 인덱싱 프로파일

| 섹션                              | 정하는 것                      | 자세히                                       |
| ------------------------------- | -------------------------- | ----------------------------------------- |
| `parser`                        | 파서 선택과 페이지 판정              | [문서 파싱](../indexing/parsing.md)           |
| `canonical_idr`                 | IDR 구조 버전                  | [문서 파싱](../indexing/parsing.md)           |
| `chunking`                      | 청크 크기와 오버랩                 | [원문 청킹](../indexing/chunking.md)          |
| `ner`                           | NER 모델·라벨·임계값              | [NER](../indexing/ner.md)                 |
| `llm`                           | Metadata·KG·검색표현 생성 모델     | [모델 호출 지도](model-calls.md)                |
| `triple`                        | KG 구축을 위한 청크 묶기와 Triple 추출 | [KG 구축](../indexing/triple-kg.md)         |
| `kg`                            | 지식그래프 구성과 저장               | [저장소와 보존](storage.md)                     |
| `g2`                            | Metadata 사용과 검색표현 생성       | [검색표현 생성](../indexing/retrieval-text.md)  |
| `index`                         | OpenSearch와 임베딩 설정         | [인덱싱](../indexing/opensearch.md)          |
| `concurrency` · `orchestration` | 병렬 처리와 실행 제어               | [파이프라인 실행 및 재처리 방법](../indexing/rerun.md) |

### 검색·답변 프로파일

| 섹션                                    | 정하는 것                       | 자세히                                        |
| ------------------------------------- | --------------------------- | ------------------------------------------ |
| `query.index_name`                    | 검색할 OpenSearch 인덱스 또는 alias | [Hybrid 검색](../query/hybrid-search.md)     |
| `query.native_rrf`                    | 검색 후보 깊이·RRF·최종 근거 수        | [RRF 통합](../query/rrf.md)                  |
| `query.reader`                        | 답변 모델과 생성 설정                | [답변과 출처 표기](../query/structured-answer.md) |
| `query.citation_normalization_policy` | Citation 검증과 정리 방식          | [답변 후처리 및 원본 출처 연결](../query/citations.md) |
| `prompts`                             | 프롬프트 연결 정보                  | [프롬프트와 출력 검증](prompts.md)                  |

## 설정 검증

프로파일은 실제 파이프라인을 실행하기 전에 검사됩니다.

| 상황                                | 결과    |
| --------------------------------- | ----- |
| 선언되지 않은 키                         | 실행 거부 |
| 타입이 맞지 않는 값                       | 실행 거부 |
| 허용되지 않은 고정값                       | 실행 거부 |
| `profile_schema_version` 불일치      | 실행 거부 |
| 프롬프트 정의 불일치                       | 실행 거부 |
| OpenSearch search pipeline 정의 불일치 | 실행 거부 |

잘못된 설정이 조용히 무시된 채 실행되지 않도록 시작 단계에서 확인합니다.

## 설정으로 바꿀 수 없는 값

일부 값은 현재 파이프라인의 계약으로 고정되어 있어 프로파일 값만 수정해서는 변경할 수 없습니다.

| 값                       |                  현재 값 |
| ----------------------- | --------------------: |
| 청크 크기                   |                   400 |
| 청크 오버랩                  |                    40 |
| 청킹 방식                   | `fixed_400_overlap40` |
| BM25 후보 깊이              |                    50 |
| Dense 후보 깊이             |                    50 |
| Hybrid pagination depth |                    50 |
| RRF 후보 수                |                    30 |
| RRF 상수                  |                    60 |
| 최종 원문 근거 수              |                    10 |

이 값을 변경하려면 관련 코드와 설정 계약을 함께 수정해야 합니다.

## 계산되는 값

일부 값은 설정 파일에 직접 저장하지 않고 다른 입력에서 계산합니다.

| 값        | 계산 기준                                 |
| -------- | ------------------------------------- |
| 답변 출력 예산 | Context Window에서 프롬프트와 근거가 사용하고 남은 범위 |
| 청크 ID    | 문서 위치와 청킹 설정                          |
| 워크플로 ID  | 프로파일·출력 경로·대상 문서                      |

계산되는 값을 별도의 설정값으로 중복 관리하지 않습니다.

## 셸 환경변수

셸 환경변수는 기계마다 달라지는 경로와 접속 정보를 지정할 때 사용합니다. `machine-paths.yaml`의 값을 환경에 맞게 덮어써야 하는 경우 파일 자체를 수정하는 대신 환경변수를 사용할 수 있습니다.

| 환경변수명                                                          | 기본값                  | 의미                             |
| -------------------------------------------------------------- | -------------------- | ------------------------------ |
| `S4S_PYTHON_INTERPRETER`                                       | `machine-paths.yaml` | 관리 서비스를 실행할 Python interpreter |
| `S4S_VLLM_SITE_PACKAGES`                                       | `machine-paths.yaml` | vLLM 실행 환경의 site-packages      |
| `S4S_EXTRA_SITE_PACKAGES`                                      | `machine-paths.yaml` | 파이프라인에서 추가로 사용할 site-packages  |
| `S4S_VLLM_BIN`                                                 | `machine-paths.yaml` | vLLM 실행 파일 경로                  |
| `S4S_MINERU_RUNTIME_DEPS`                                      | `machine-paths.yaml` | MinerU 실행 의존성 경로               |
| `S4S_MINERU_MODEL_ROOT`                                        | `machine-paths.yaml` | MinerU 모델 위치                   |
| `S4S_HUGGINGFACE_CACHE`                                        | `machine-paths.yaml` | 모델 snapshot cache              |
| `S4S_OPENSEARCH_HOME` · `S4S_OPENSEARCH_CONFIG`                | `machine-paths.yaml` | OpenSearch 설치 경로와 설정           |
| `S4S_ARTIFACT_PRODUCTION_ROOT`                                 | `machine-paths.yaml` | 문서 인덱싱 산출물 위치                  |
| `S4S_ARTIFACT_EVALUATION_ROOT`                                 | `machine-paths.yaml` | 평가 자산 위치                       |
| `S4S_ARTIFACT_TEST_FIXTURE_ROOT` · `S4S_ARTIFACT_CONTROL_ROOT` | `machine-paths.yaml` | 테스트 fixture와 통제 산출물 위치         |
| `S4S_KG_POSTGRES_DSN`                                          | 없음                   | PostgreSQL 접속 문자열              |
| `S4S_REPOSITORY_ROOT`                                          | 설치 위치에서 유도           | 설정과 산출물을 사용하는 저장소              |
| `OPENAI_API_KEY`                                               | 없음                   | 외부 API를 사용하는 경우의 API key       |
| `CUDA_VISIBLE_DEVICES`                                         | 없음                   | 서비스에서 사용할 GPU                  |

접속 문자열이나 API key와 같은 민감정보는 실행 프로파일에 직접 기록하지 않고 환경변수로 전달합니다.

현재 환경에서 실제로 해석된 경로와 값을 확인하려면 다음 명령을 사용합니다.

```bash
struct4search-env
```

현재 셸에 적용할 `export` 문 형태로 확인하려면 `--shell`을 붙입니다.

```bash
struct4search-env --shell
```

## 설정을 변경할 때

설정 변경 절차는 [설정 수정](../maintenance/configuration.md)에서 설명합니다. 변경으로 인해 어떤 단계를 다시 처리해야 하는지는 [변경 지점 찾기](../maintenance/change-map.md)에서 확인합니다.
