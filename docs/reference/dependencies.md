---
sidebar_position: 10
title: 외부 의존
---

# 외부 의존

파이프라인을 돌리는 데 필요한 것들입니다.

## 서비스

| 서비스 | 쓰는 단계 | 없으면 |
|---|---|---|
| MinerU | 문서 파싱의 스캔·복합 페이지 | 스캔 페이지가 있는 문서가 실패합니다 |
| Qwen | Metadata 생성 · KG 구축 · 검색표현 생성 · 답변 | 해당 단계가 비어 나옵니다 |
| 임베딩 서버 | 인덱싱 · 질의 처리 | 색인과 검색이 불가능합니다 |
| OpenSearch | 인덱싱 · 검색 | 색인과 검색이 불가능합니다 |
| PostgreSQL | KG 저장 | 그래프를 영속할 수 없습니다 |
| Temporal | 실행 순서와 재개 | 중단된 실행을 이어받을 수 없습니다 |

주소는 실행 프로파일과 `configs/services/cold-services.yaml`에 있습니다.

## 모델

| 모델 | 쓰는 곳 |
|---|---|
| `pymupdf4llm` | 디지털 PDF 파싱 |
| MinerU 2.5 Pro 1.2B | 스캔·복합 페이지 파싱 |
| `urchade/gliner_multi-v2.1` | NER |
| `nlpai-lab/KURE-v1` | 청킹 토큰 계산 |
| Qwen 계열 | Metadata · KG · 검색표현 · 답변 |
| `Qwen/Qwen3-Embedding-8B` | 임베딩 |

NER 모델과 토크나이저는 revision까지 고정합니다. 가중치 위치는 환경변수로 지정합니다([설정과 환경 변수](configuration.md)).

## 파이썬 패키지

| 패키지 | 쓰는 곳 |
|---|---|
| `pydantic` | 설정 스키마 |
| `PyYAML` | 프로파일 로드 |
| `jsonschema` | 출력 Schema 검증 |
| `networkx` | 지식그래프 중요도 계산 |
| `numpy` · `scipy` | 수치 계산 |
| `psycopg` | PostgreSQL |
| `requests` | HTTP 호출 |
| `transformers` | 토크나이저 |

전체 목록과 버전 범위는 `pyproject.toml`에 있습니다. 모델 서버는 별도 환경에서 돌고 이 목록에 들어가지 않습니다.

## 하드웨어

GPU가 필요합니다. 파싱·NER·LLM·임베딩이 모두 GPU를 쓰고, 어느 서비스가 어느 GPU에 올라갈지는 서비스 정의에서 정합니다.

GLiNER는 별도 서비스가 아니라 파이프라인 프로세스 안에서 돌아 GPU 메모리를 직접 잡습니다. 다른 서비스와의 배치를 정할 때 함께 계산해야 합니다.

## 오프라인 가정

모델 가중치와 토크나이저는 미리 받아 둔 스냅샷을 씁니다. 실행 중에 인터넷에서 새로 받지 않습니다.

외부 API를 쓰는 경로는 선택 사항이며, 쓸 때만 `OPENAI_API_KEY`를 환경변수로 넣습니다. 기본 구성은 자체 GPU에서 도는 서버만 부릅니다.
