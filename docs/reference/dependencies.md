---
sidebar_position: 10
title: 설치 요구사항
---

# 설치 요구사항

CPU-only 개발은 코드 수정, 전체 비GPU 테스트, 저장된 검색 결과를 사용한 답변 API 확인을 대상으로 합니다. GPU 개발은 여기에 실제 Parser·NER·LLM·embedding 모델 실행과 문서 인덱싱을 추가합니다. 두 환경은 설치 범위와 성공 기준이 다릅니다.

## CPU-only 개발환경

### 필요한 소프트웨어

| 소프트웨어 | 버전 | 기능 | 제공 방식 |
|---|---|---|---|
| Linux 또는 macOS | 현재 보안 지원 버전 | backend와 테스트를 실행하는 OS | host OS |
| Git | 저장소에서 별도 pin 없음 | source checkout과 변경 이력 관리 | OS executable |
| CPython | `>=3.12`; production 기준 `3.12.12` | backend, CLI, 테스트 실행 | OS package 또는 Python 배포판 |
| `venv` | Python 3.12와 함께 제공 | 프로젝트별 격리 환경 생성 | Python standard library; Debian/Ubuntu는 `python3.12-venv` |
| `virtualenv` | 버전 pin 없음 | `python3.12-venv`를 설치할 수 없을 때의 대체 환경 | PyPI package |
| pip·setuptools·wheel | CPU package는 `constraints/py312-cpu.txt` 기준 | Python package 설치와 editable build | Python executable/package |
| Struct4Search CPU package | `pyproject.toml` 범위 + `constraints/py312-cpu.txt` 고정 버전 | 설정, query/API, 평가, 비GPU 테스트 | `pip` editable package |
| curl | 저장소에서 버전 pin 없음 | health와 답변 HTTP 요청 확인 | OS executable |
| Node.js | `20+`; 검증 버전 `20.17.0` | React 제품 화면 build와 개발 server | executable binary |
| npm | Node.js와 함께 제공; lockfile 사용 | frontend package 설치 | executable binary |

Node.js와 npm은 backend·CLI만 수정할 때는 필요하지 않습니다. `frontend/chatkit_demo`를 수정하거나 제품 화면 build를 확인할 때 설치합니다.

### 설치

```bash
git clone https://github.com/DLI-Lab/Struct4Search.git
cd Struct4Search
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -c constraints/py312-cpu.txt -e '.[test,api]'
python -m pip check
```

Debian/Ubuntu에서 `ensurepip is not available`로 실패하면 `python3.12-venv`를 설치합니다.

```bash
sudo apt-get update
sudo apt-get install -y python3.12-venv
```

OS package 설치 권한이 없으면 사용자 영역의 `virtualenv`를 사용합니다.

```bash
python3.12 -m pip install --user --break-system-packages virtualenv
python3.12 -m virtualenv .venv
source .venv/bin/activate
```

`--break-system-packages`는 PEP 668로 보호된 Python에서 사용자 영역에 `virtualenv` 하나를 설치하기 위한 fallback입니다. 시스템 site-packages에 프로젝트 의존성을 설치하는 명령이 아닙니다.

### CPU-only에서 할 수 있는 것

| 작업 | 외부 서비스 | 명령 |
|---|---|---|
| package import·전체 비GPU 테스트 | 없음 | `python -m pytest -q` |
| 저장된 검색 결과 평가 | 없음 | `struct4search-evaluate --fixture-results ...` |
| 저장된 검색 결과로 답변 API 확인 | 없음 | `struct4search-api --fixture-results ...` |
| frontend build | 없음 | `npm --prefix frontend/chatkit_demo ci && npm --prefix frontend/chatkit_demo run build` |
| 실제 OpenSearch 검색·모델 답변 | OpenSearch·embedding·reader 필요 | `struct4search-api --profile ...` |
| 실제 문서 인덱싱 | PostgreSQL·OpenSearch·Temporal·GPU 모델 필요 | `struct4search-ingest ...` |

CPU-only 설치의 완료 조건은 `pip check`, 전체 비GPU 테스트, 예제 검색 결과를 사용한 API의 `answer`·`citations`, frontend를 다루는 경우 `npm run build`까지 모두 성공하는 것입니다. 실행 명령은 [CPU-only Quickstart](../quickstart.md#cpu-only-quickstart)에 있습니다.

## GPU 개발환경

### 필요한 소프트웨어와 모델 파일

| 소프트웨어 | 버전 | 기능 | 제공 방식 |
|---|---|---|---|
| Linux | vLLM이 지원하는 64-bit Linux | GPU 모델 service와 pipeline 실행 | host OS |
| CPython | `3.12` | backend와 vLLM을 같은 interpreter 계열에서 실행 | OS package 또는 Python 배포판 |
| NVIDIA GPU | vLLM 기준 compute capability `7.5+`; 현재 production service 파일은 GPU `0`, `1` 두 장을 전제 | MinerU, GLiNER, Qwen, embedding 실행 | physical device |
| NVIDIA driver | 설치되는 Python CUDA runtime과 호환되는 버전; 저장소에서 driver를 pin하지 않음 | GPU device를 CUDA runtime에 제공 | OS kernel module/executable |
| CUDA runtime | fresh 검증에서 `torch 2.11.0+cu130`이 제공한 CUDA `13.0` | PyTorch·vLLM kernel 실행 | PyPI wheel의 shared library |
| CUDA Toolkit | 일반 wheel 설치에는 별도 설치 불필요 | vLLM·PyTorch를 source build할 때만 compiler 제공 | 선택 OS package |
| vLLM | `0.25.1` | Qwen reader/ingest LLM과 Qwen embedding의 OpenAI-compatible service | `requirements-gpu.txt`의 PyPI wheel |
| mineru-vl-utils | `1.0.5` | MinerU 2.5 model input·output 처리 | `requirements-gpu.txt`의 PyPI package |
| GLiNER | `0.2.27` | NER model 실행 | `requirements.txt`의 PyPI package |
| PostgreSQL | `16` | 문서 catalog, Metadata와 KG 저장 | Docker image 또는 host service |
| OpenSearch | `2.19.1` + `analysis-nori` | BM25·vector 검색과 Native RRF | package resource의 Dockerfile로 만든 image |
| Temporal Server | `1.28.1` | durable ingest workflow | `deploy/temporal-compose.yaml` Docker image |
| Temporal UI | `2.43.3` | workflow 상태 확인 | `deploy/temporal-compose.yaml` Docker image |
| Docker Engine·Compose plugin | 저장소에서 version pin 없음; `docker compose` 명령 필요 | PostgreSQL·Temporal과 격리 service 실행 | executable binary/plugin |
| Model snapshots | `configs/model-catalog.yaml`의 ID와 revision | offline·immutable model loading | host filesystem artifact |

[vLLM 0.25.1 GPU 설치 문서](https://docs.vllm.ai/en/v0.25.1/getting_started/installation/gpu/)는 Linux, Python 3.10–3.13과 NVIDIA compute capability 7.5 이상을 요구합니다. Struct4Search는 이 범위 중 Python 3.12를 사용합니다.

현재 `configs/services/cold-services.yaml`의 memory budget과 동시성은 약 96 GiB NVIDIA GPU 두 장을 사용한 production 구성에 맞춰져 있습니다. GPU 개수나 VRAM이 다르면 `CUDA_VISIBLE_DEVICES`, memory utilization, KV cache와 동시성을 그대로 사용하지 않습니다.

`nvidia-container-toolkit`은 현재 정본 service 파일처럼 vLLM을 host process로 실행할 때는 필수가 아닙니다. GPU model service를 Docker container로 바꿀 때만 [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)을 추가합니다.

### Python 패키지 설치

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

`requirements.txt`는 backend, parser, NER, API, Temporal과 테스트 package를 설치합니다. `requirements-gpu.txt`는 NVIDIA/Linux에서만 vLLM과 MinerU overlay를 추가합니다. macOS나 CPU-only host에는 `requirements-gpu.txt`를 설치하지 않습니다.

### GPU 패키지와 장치 확인

```bash
nvidia-smi
python - <<'PY'
import torch
import vllm
import mineru_vl_utils

assert torch.cuda.is_available()
assert torch.cuda.device_count() >= 2
x = torch.tensor([1.0, 2.0], device="cuda")
assert float(x.sum().cpu()) == 3.0
print({
    "torch": torch.__version__,
    "cuda_runtime": torch.version.cuda,
    "vllm": vllm.__version__,
    "gpus": [torch.cuda.get_device_name(i) for i in range(torch.cuda.device_count())],
})
PY
```

이 검사는 package import뿐 아니라 실제 CUDA tensor 연산까지 확인합니다. model snapshot을 읽거나 model service를 시작하지는 않습니다.

## 모델 snapshot과 서버 경로

논리 model ID와 immutable revision은 `configs/model-catalog.yaml`에 있습니다.

| 역할 | Model ID | Revision |
|---|---|---|
| Ingest LLM·local reader | `Qwen/Qwen3-14B` | `40c069824f4251a91eefaf281ebe4c544efd3e18` |
| Embedding | `Qwen/Qwen3-Embedding-8B` | `1d8ad4ca9b3dd8059ad90a75d4983776a23d44af` |
| NER | `urchade/gliner_multi-v2.1` | `443d26d654e0324125a96bebd8e796c14ff2efe6` |
| Parser | MinerU2.5-Pro model·processor | `configs/services/cold-services.yaml`의 snapshot 경로 |

model ID만 바꾸면 snapshot이 자동으로 다운로드되는 구조가 아닙니다. `configs/machine-paths.yaml` 또는 허용된 `S4S_*` 환경변수로 해당 host의 cache와 model 경로를 지정해야 합니다.

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

```bash
cp .env.example .env
# .env에 이 host의 DSN, model cache와 service 경로 입력
struct4search-env
struct4search-preflight
```

`.env`는 `KEY=value`만 사용합니다. 비밀값은 Git에 commit하지 않습니다. 공개 `struct4search-*` 명령만 `.env`를 자동으로 읽으며, 일반 Python import는 읽지 않습니다.

`.env` 파일은 다음 순서로 선택합니다.

1. `S4S_ENV_FILE`로 지정한 파일
2. `S4S_REPOSITORY_ROOT/.env`
3. 소스 저장소 루트의 `.env`

셸에 이미 설정된 환경변수는 `.env` 값으로 덮어쓰지 않습니다.

## 외부 service가 필요한 시점

| Service | 필요할 때 | 필요하지 않을 때 |
|---|---|---|
| PostgreSQL 16 | 문서 catalog·Metadata·KG 저장, PostgreSQL integration | CPU 단위 테스트, 예제 검색 결과 평가·API |
| OpenSearch 2.19.1 + Nori | 실제 인덱싱과 production query | 예제 검색 결과 평가·API |
| Temporal 1.28.1 | durable `struct4search-ingest` | query, 평가, 예제 검색 결과 API |
| MinerU·GLiNER·Qwen·embedding | 실제 문서 인덱싱과 production 답변 | 예제 검색 결과 평가·API |

GPU 설치가 끝났다는 것과 production 실행 준비가 끝났다는 것은 다릅니다. 다음 명령이 `0`으로 끝나야 실제 인덱싱을 시작할 수 있습니다.

```bash
python -m pip check
python -m pytest -q
struct4search-env
struct4search-preflight
```

`struct4search-preflight`는 GPU process, 포트, 디스크 또는 OpenSearch write block이 안전하지 않으면 의도적으로 non-zero를 반환합니다. 이 경우 설치를 다시 하는 것이 아니라 출력에 명시된 host·service 조건을 해결합니다.

환경별 첫 답변까지의 순서는 [설치와 첫 실행](../quickstart.md), 단계별 모델과 설정 위치는 [모델 사용 위치](model-calls.md)에서 확인합니다.
