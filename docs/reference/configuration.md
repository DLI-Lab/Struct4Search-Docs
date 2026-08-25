---
sidebar_position: 8
title: 설정과 환경 변수
---

# 설정과 환경 변수

값이 어디에 있는지 정리합니다. 두 층으로 나뉩니다.

| 층 | 어디에 | 무엇을 정하는가 |
|---|---|---|
| 실행 프로파일 | `configs/*.yaml` | 파이프라인 동작 |
| 셸 환경변수 | 실행 환경 | 기계별 경로와 접속 정보 |

컴포넌트 페이지의 `환경변수` 표에 든 값은 **실행 프로파일의 키**입니다. 셸에서 `export` 하는 값이 아니라 YAML에 적는 값입니다.

## 실행 프로파일

| 파일 | 담당 |
|---|---|
| `configs/ingest-production.yaml` | 문서 인덱싱 파이프라인 |
| `configs/production.yaml` | 검색·답변 파이프라인 |
| `configs/base.yaml` | 두 프로파일이 이어받는 공통 값 |
| `configs/services/cold-services.yaml` | 띄울 서비스 정의 |
| `configs/evaluation-release.json` | 평가셋 릴리스 |
| `configs/machine-paths.yaml` | 기계별 경로 |

프로파일은 `extends`로 다른 파일을 이어받고, 경로 값은 `machine-paths.yaml`에서 채워집니다.

### 인덱싱 프로파일 섹션

| 섹션 | 정하는 것 | 자세히 |
|---|---|---|
| `parser` | 파서 선택과 페이지 판정 기준 | [문서 파싱](../indexing/parsing.md) |
| `canonical_idr` | 파싱 결과 구조 버전 | 문서 파싱 |
| `chunking` | 청크 크기와 오버랩, 토크나이저 | [원문 청킹](../indexing/chunking.md) |
| `ner` | 모델·라벨·임계값 | [NER](../indexing/ner.md) |
| `llm` | 모델 서버와 토큰 예산 | [모델 호출 지도](model-calls.md) |
| `triple` | 청크 묶기와 관계 추출 | [KG 구축](../indexing/triple-kg.md) |
| `kg` | 그래프 범위와 저장소 | [저장소와 보존](storage.md) |
| `g2` | Metadata 문맥과 검색표현 생성 | [검색표현 생성](../indexing/retrieval-text.md) |
| `index` | 색인 대상과 임베딩 | [인덱싱](../indexing/opensearch.md) |
| `concurrency` · `orchestration` | 동시성과 실행 순서 | [실행과 재처리](../indexing/rerun.md) |

### 검색·답변 프로파일 섹션

| 섹션 | 정하는 것 | 자세히 |
|---|---|---|
| `query.index_name` | 검색할 인덱스 또는 별칭 | [Hybrid 검색](../query/hybrid-search.md) |
| `query.native_rrf` | 채널 깊이·후보 수·RRF 상수·최종 근거 수 | [RRF 통합](../query/rrf.md) |
| `query.reader` | 답변 모델과 생성 설정 | [답변과 출처 표기](../query/structured-answer.md) |
| `query.citation_normalization_policy` | 인용 정리 순서 | [답변 후처리](../query/citations.md) |
| `prompts` | 프롬프트 바인딩 | [프롬프트와 출력 검증](prompts.md) |

## 로드가 거부하는 것

| 상황 | 결과 |
|---|---|
| 선언되지 않은 키 | 거부 |
| 타입이 맞지 않는 값 | 거부 |
| 고정 리터럴과 다른 값 | 거부 |
| `profile_schema_version` 불일치 | 거부 |
| 프롬프트 해시 불일치 | 거부 |
| 검색 파이프라인 해시 불일치 | 거부 |

오타가 조용히 무시되지 않습니다.

## 설정으로 바꿀 수 없는 값

| 값 | 고정 위치 |
|---|---|
| `chunking.max_tokens` 400 · `overlap_tokens` 40 · `strategy` | 설정 스키마의 리터럴 |
| 채널 깊이 50 · 통합 후보 30 · RRF 상수 60 · pagination 50 | 검색 어댑터 |
| 최종 근거 상한 10 | 검색 정책 상수 |

## 계산되는 값

일부 값은 다른 값에서 나옵니다. 프로파일에 적혀 있지 않습니다.

| 값 | 어디서 나오는가 |
|---|---|
| 답변 출력 예산 | 컨텍스트 창에서 프롬프트가 쓰고 남은 자리 |
| 청크 ID | 위치와 설정 해시 |
| 워크플로 ID | 프로파일·출력 경로·문서 목록의 해시 |

계산되는 값을 손으로 적으면 두 값이 어긋나는 순간이 옵니다.

## 셸 환경변수

기계마다 다른 경로와 접속 정보입니다. `machine-paths.yaml`의 각 항목은 아래 환경변수로 덮어쓸 수 있습니다. 다른 기계나 컨테이너에서는 파일을 고치는 대신 환경변수를 씁니다.

| 환경변수명 | 기본 옵션 | 의미 |
|---|---|---|
| `S4S_PYTHON_INTERPRETER` | `machine-paths.yaml` | 관리 서비스를 띄울 파이썬 인터프리터 |
| `S4S_VLLM_SITE_PACKAGES` | `machine-paths.yaml` | vLLM 환경. 서비스 `PYTHONPATH` 맨 앞에 옵니다 |
| `S4S_EXTRA_SITE_PACKAGES` | `machine-paths.yaml` | 파이프라인 환경. 뒤에 붙습니다 |
| `S4S_VLLM_BIN` | `machine-paths.yaml` | 서비스 자식 프로세스의 `PATH` 앞에 붙습니다 |
| `S4S_MINERU_RUNTIME_DEPS` | `machine-paths.yaml` | MinerU 전용 의존성 경로 |
| `S4S_MINERU_MODEL_ROOT` | `machine-paths.yaml` | MinerU 모델 가중치 위치 |
| `S4S_HUGGINGFACE_CACHE` | `machine-paths.yaml` | 모델 스냅샷 캐시 |
| `S4S_OPENSEARCH_HOME` · `S4S_OPENSEARCH_CONFIG` | `machine-paths.yaml` | OpenSearch 설치 위치와 설정 |
| `S4S_ARTIFACT_PRODUCTION_ROOT` | `machine-paths.yaml` | 운영 산출물 루트 |
| `S4S_ARTIFACT_EVALUATION_ROOT` | `machine-paths.yaml` | 평가셋 릴리스 위치 |
| `S4S_ARTIFACT_TEST_FIXTURE_ROOT` · `S4S_ARTIFACT_CONTROL_ROOT` | `machine-paths.yaml` | fixture와 통제 산출물 루트 |
| `S4S_KG_POSTGRES_DSN` | 없음 | PostgreSQL 접속 문자열. 설정에는 이름만 적습니다 |
| `S4S_REPOSITORY_ROOT` | 설치 위치에서 유도 | 설정과 산출물을 소유하는 체크아웃 |
| `OPENAI_API_KEY` | 없음 | 외부 API를 쓸 때만 |
| `CUDA_VISIBLE_DEVICES` | 없음 | 서비스가 쓸 GPU 지정 |

접속 문자열과 키는 **설정 파일에 값으로 적지 않고 환경변수 이름만 적습니다.**

저장소 위치에서 유도할 수 있는 경로는 `machine-paths.yaml`에 적지 않습니다. 유도되는 값을 적어 두면 두 값이 어긋납니다.

```bash
struct4search-env            # 지금 해석된 경로와 값 확인
struct4search-env --shell    # 셸에 넣을 export 문 출력
```

## 설정을 바꿀 때

[설정 수정](../maintenance/configuration.md)에 절차가 있습니다. 재처리 범위는 [변경 지점 찾기](../maintenance/change-map.md)에서 확인합니다.
