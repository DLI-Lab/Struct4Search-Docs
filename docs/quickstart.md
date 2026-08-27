---
sidebar_position: 2
title: 설치와 첫 실행
---

# 설치와 첫 실행

CPU-only 환경에서는 외부 모델 없이 설치·테스트·답변 API 계약을 확인합니다. GPU 환경에서는 여기에 모델 service, 실제 문서 인덱싱, 실제 검색과 답변까지 확인합니다. 각 절차는 준비 사항 → 설치 → 실행 → 확인 순서로 구성합니다.

## CPU-only Quickstart

### 준비 사항

- Python 3.12 이상
- Git과 curl
- frontend도 확인할 때만 Node.js 20 이상과 npm

PostgreSQL, OpenSearch, Temporal, NVIDIA GPU와 유료 API key는 필요하지 않습니다.

### 1. 설치

```bash
git clone https://github.com/DLI-Lab/Struct4Search.git
cd Struct4Search
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -c constraints/py312-cpu.txt -e '.[test,api]'
python -m pip check
```

`venv`를 만들 수 없는 서버의 대체 설치 방법은 [설치 요구사항](reference/dependencies.md#cpu-only-개발환경)에 있습니다.

### 2. 전체 비GPU 테스트

```bash
python -m pytest -q
```

실패 없이 종료되면 package import, 설정 조립, pipeline 단위 계약, query와 API 계약을 포함한 비GPU 테스트가 통과한 것입니다.

### 3. 답변 API 실행

저장소의 예제 검색 결과를 사용해 API를 실행합니다. 이 모드는 실제 OpenSearch나 LLM을 호출하지 않습니다.

```bash
struct4search-api \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --host 127.0.0.1 \
  --port 3100
```

`3100` 포트를 이미 사용 중이면 빈 포트 번호로 바꾸고, 아래 `curl` URL에도 같은 번호를 사용합니다.

다른 터미널에서 health와 답변을 요청합니다.

```bash
curl --fail http://127.0.0.1:3100/v1/health

curl --fail \
  --header 'Content-Type: application/json' \
  --data '{"query":"안전모를 착용한다.","query_id":"q001"}' \
  http://127.0.0.1:3100/v1/response
```

다음 세 가지를 확인하면 CPU-only 첫 실행이 완료됩니다.

- health 응답의 `status`가 `ok`
- 답변 응답의 `answer`가 비어 있지 않음
- 답변 응답의 `citations`에 한 개 이상의 근거가 있음

이 검사는 HTTP 요청부터 답변 JSON까지의 경로를 확인합니다. 실제 검색과 모델 생성 여부를 확인하는 검사는 아닙니다. 서버는 실행한 터미널에서 `Ctrl-C`로 종료합니다.

### 4. 선택 사항: 평가와 frontend

저장된 검색 결과로 release gate를 확인합니다.

```bash
struct4search-evaluate \
  --fixture-results tests/fixtures/evaluation_mini/query_results.jsonl \
  --evaluation-config tests/fixtures/evaluation_mini/release.json \
  --gate-config tests/fixtures/evaluation_mini/gate.yaml \
  --baseline-report tests/fixtures/evaluation_mini/baseline_report.json \
  --qa-scores tests/fixtures/evaluation_mini/qa_scores.jsonl \
  --output-root /tmp/struct4search-evaluation
```

성공하면 `/tmp/struct4search-evaluation/RELEASE_GATE.json`의 `status`가 `PASS`입니다.

```bash
npm --prefix frontend/chatkit_demo ci
npm --prefix frontend/chatkit_demo run build
```

frontend를 수정하지 않는 작업에는 Node.js 설치와 build가 필요하지 않습니다.

## GPU Quickstart

### 준비 사항

- Linux, Python 3.12, NVIDIA GPU와 호환 driver
- Docker Engine과 `docker compose`
- PostgreSQL 16, OpenSearch 2.19.1 + Nori, Temporal 1.28.1
- `configs/model-catalog.yaml`에 적힌 model snapshot
- 처리할 문서와 host별 DSN·model path

현재 `configs/services/cold-services.yaml`은 약 96 GiB VRAM GPU 두 장을 사용하는 production 구성을 전제로 합니다. 다른 GPU 구성에서는 service의 GPU 배치와 memory 값을 먼저 조정합니다. 자세한 조건은 [GPU 개발환경](reference/dependencies.md#gpu-개발환경)에 있습니다.

### 1. 설치와 CUDA 확인

```bash
git clone https://github.com/DLI-Lab/Struct4Search.git
cd Struct4Search
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt
python -m pip install -r requirements-gpu.txt
python -m pip check
```

```bash
nvidia-smi
python - <<'PY'
import torch
import vllm

assert torch.cuda.is_available()
x = torch.tensor([1.0, 2.0], device="cuda")
assert float(x.sum().cpu()) == 3.0
print({"torch": torch.__version__, "cuda": torch.version.cuda, "vllm": vllm.__version__})
PY
```

### 2. 서버 설정과 사전 점검

```bash
cp .env.example .env
```

`.env`에 이 host의 DSN, model cache와 service path를 입력합니다. 공개 `struct4search-*` 명령은 `.env`를 자동으로 읽고, 이미 export한 환경변수는 덮어쓰지 않습니다.

```bash
struct4search-env
struct4search-preflight
```

`struct4search-preflight`가 non-zero이면 메시지에 나온 GPU process, port, disk 또는 OpenSearch write block을 해결한 뒤 진행합니다. 점검 실패 상태에서 인덱싱을 시작하지 않습니다.

### 3. 문서 한 건 인덱싱

기존 실행과 겹치지 않는 새 output 경로와 시험용 문서 ID를 사용합니다.

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output /absolute/path/to/new-output \
  --document-id <문서_ID>
```

이 명령은 필요한 local model service와 Temporal workflow를 조립하고 문서 파싱 → 청킹 → NER → Metadata → KG → 검색표현 → OpenSearch 인덱싱을 실행합니다. 완료 기록과 단계별 결과 파일이 새 output 경로에 생성되어야 합니다.

### 4. 실제 검색과 답변 확인

```bash
struct4search-api \
  --profile configs/production.yaml \
  --host 127.0.0.1 \
  --port 3100
```

`3100` 포트를 이미 사용 중이면 빈 포트 번호로 바꾸고, 아래 `curl` URL에도 같은 번호를 사용합니다.

다른 터미널에서 방금 색인한 문서로 답할 수 있는 질문을 보냅니다.

```bash
curl --fail http://127.0.0.1:3100/v1/health

curl --fail \
  --header 'Content-Type: application/json' \
  --data '{"query":"<색인한 문서에서 확인할 질문>","query_id":"gpu-quickstart-001"}' \
  http://127.0.0.1:3100/v1/response
```

`answer`가 비어 있지 않고 `citations`가 방금 색인한 문서의 근거를 가리키면 실제 embedding → OpenSearch 검색 → reader 답변 경로가 정상입니다. 서버는 실행한 터미널에서 `Ctrl-C`로 종료합니다.

## 다음 문서

- 전체 명령과 인자: [CLI Reference](reference/cli.md)
- API 요청과 응답: [API Reference](reference/api-reference.md)
- 단계별 모델·service 위치: [모델 사용 위치](reference/model-calls.md)
- 검색·답변 품질 평가: [검색과 QA 평가 실행](testing/retrieval-qa.md)
