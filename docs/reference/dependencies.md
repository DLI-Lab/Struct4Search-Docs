---
sidebar_position: 10
title: 외부 의존
---

# 외부 의존

Struct4Search를 실행하는 데 필요한 외부 서비스, 모델과 주요 패키지를 정리합니다.

## 기본 개발 환경

| 항목 | 요구사항 |
|---|---|
| Python | 3.12 이상, 검증 기준 CPython 3.12 |
| 가상환경 | `venv` 또는 `virtualenv` |
| 패키지 설치 | `python -m pip install -r requirements.txt` |
| Git | 저장소 clone과 commit 식별 |
| Node.js | Docs를 빌드할 때만 20 이상 |

Debian/Ubuntu에서 `python3.12 -m venv`가 `ensurepip is not available`로 실패하면 `python3.12-venv` OS 패키지를 설치합니다. OS 패키지 설치 권한이 없으면 사용자 영역에 `virtualenv`를 설치해 가상환경을 만들 수 있습니다.

`requirements.txt`는 CPU test와 API extra를 constraints와 함께 설치합니다. production ingest는 `.[ingest]`, MinerU vLLM service는 `.[mineru-service]`를 별도 환경에 설치합니다. `.[all]`은 GPU용 vLLM을 포함하므로 CPU 검증 환경에 설치하지 않습니다.

## 서비스

| 서비스 | 쓰는 단계 | 사용할 수 없으면 |
|---|---|---|
| MinerU | 문서 파싱의 스캔·복합 페이지 | 해당 페이지를 파싱할 수 없습니다 |
| Qwen | Metadata 생성 · KG 구축 · 검색표현 생성 · 답변 | 해당 단계를 실행할 수 없습니다 |
| 임베딩 서버 | 인덱싱 · 질의 처리 | 벡터 생성과 Dense 검색을 할 수 없습니다 |
| OpenSearch | 인덱싱 · Hybrid 검색 · RRF 통합 | 색인과 검색을 할 수 없습니다 |
| PostgreSQL | KG 저장 | 지식그래프를 저장할 수 없습니다 |
| Temporal | 파이프라인 실행과 재개 | 워크플로 실행과 재개를 사용할 수 없습니다 |

서비스 주소와 실행 방법은 실행 프로파일과 `configs/services/cold-services.yaml`에서 관리합니다.

## 모델

| 모델 | 쓰는 단계 |
|---|---|
| MinerU 2.5 Pro 1.2B | 스캔·복합 페이지 파싱 |
| `urchade/gliner_multi-v2.1` | NER |
| `nlpai-lab/KURE-v1` | 원문 청킹의 토큰 계산 |
| Qwen 계열 | Metadata 생성 · KG 구축 · 검색표현 생성 · 답변 |
| `Qwen/Qwen3-Embedding-8B` | 원문·검색표현·질의 임베딩 |

모델과 토크나이저는 지정된 버전을 사용하며, 모델 파일과 캐시 위치는 실행 환경에서 설정합니다([설정과 환경 변수](configuration.md)).

## 주요 Python 패키지

| 패키지 | 쓰는 곳 |
|---|---|
| `pymupdf4llm` | 디지털 PDF 파싱 |
| `pydantic` | 설정과 데이터 Schema |
| `PyYAML` | 실행 프로파일 로드 |
| `jsonschema` | 구조화된 출력 검증 |
| `networkx` | 지식그래프 처리와 중요도 계산 |
| `numpy` · `scipy` | 수치 계산 |
| `psycopg` | PostgreSQL 연결 |
| `requests` | HTTP 호출 |
| `transformers` | 모델·토크나이저 연동 |

전체 패키지 역할과 버전 범위는 `pyproject.toml`, CPU 고정 버전은 `constraints/py312-cpu.txt`에서 확인합니다. MinerU, Qwen과 임베딩 서버처럼 별도 프로세스로 실행되는 서비스의 환경은 별도로 관리합니다.

## 하드웨어

문서 파싱, NER, LLM 처리와 임베딩 생성에는 GPU를 사용합니다. 각 서비스가 사용할 GPU와 실행 방식은 `configs/services/cold-services.yaml`에서 정의합니다.

GLiNER는 별도 서버가 아니라 파이프라인 프로세스 안에서 실행되므로 다른 GPU 서비스와 함께 사용할 때 메모리 사용량을 고려해야 합니다.

## 오프라인 실행

기본 구성에서는 필요한 모델과 토크나이저를 미리 준비한 상태에서 실행하며, 파이프라인 실행 중에 인터넷에서 새로 내려받지 않습니다.

외부 API를 사용하는 구성은 선택 사항입니다. 필요한 경우에만 `OPENAI_API_KEY`와 같은 인증 정보를 환경변수로 전달합니다. 기본 구성은 자체 환경에서 실행되는 모델 서버를 사용합니다.
