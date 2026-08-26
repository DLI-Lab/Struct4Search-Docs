---
sidebar_position: 10
title: 설치 요구사항
---

# 설치 요구사항

개발 환경과 production 실행 환경의 요구사항은 다릅니다. 먼저 CPU 개발 환경을 준비하고, 실제 인덱싱이 필요한 경우에만 외부 서비스를 추가합니다.

## CPU 개발 환경

| 항목 | 요구사항 |
|---|---|
| Python | 3.12 이상 |
| 기본 도구 | Git, `venv` 또는 `virtualenv` |
| CPU 테스트·예제 결과 파일 API | `python -m pip install -e '.[test,api]'` |
| 전체 확인 | `python -m pytest -q` |

Debian/Ubuntu에서 `python3.12 -m venv`가 실패하면 `python3.12-venv` OS 패키지를 설치합니다.

## 실제 인덱싱에 추가로 필요한 것

| 항목 | 필요한 작업 |
|---|---|
| PostgreSQL 16 | KG 저장과 PostgreSQL integration |
| OpenSearch 2.19.x + Nori | 색인, Korean analyzer, Native RRF 검색 |
| Temporal | production ingest workflow |
| MinerU·LLM·임베딩 서비스 | 문서 파싱, 지식화, 검색·답변 |
| NVIDIA GPU와 model snapshot | 해당 모델 서비스를 이 서버에서 직접 실행할 때만 필요 |

문서 인덱싱 코드를 설치하려면 `python -m pip install -e '.[ingest]'`를 추가합니다. MinerU·Qwen을 직접 vLLM으로 실행하는 GPU 서버에서만 `requirements-gpu.txt`를 설치합니다.

## 설정 파일과 비밀값

모델·서비스·검색 설정은 `configs/production.yaml`, 서비스 실행 정의는 `configs/services/cold-services.yaml`에 있습니다. 기계별 경로는 `configs/machine-paths.yaml` 또는 허용된 `S4S_*` 환경변수로 지정합니다.

접속 문자열과 API key는 Git에 넣지 않고 환경변수로 전달합니다. 외부 GPT provider를 선택한 profile에서만 `OPENAI_API_KEY`가 필요합니다.

실제 설치 순서는 [설치와 첫 실행](../quickstart.md), 각 extra와 고정 버전은 Struct4Search 저장소의 `pyproject.toml`, `constraints/py312-cpu.txt`, `REQUIREMENTS.md`를 기준으로 합니다.
