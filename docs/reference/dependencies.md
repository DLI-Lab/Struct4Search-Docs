---
sidebar_position: 1
title: 설치 요구사항
---

# 설치 요구사항

Struct4Search를 실행하기 전에 무엇을 준비해야 하는지 정리합니다. 먼저 아래 표에서 작업에 맞는 환경을 고른 뒤, 해당 절의 준비물과 설치 명령만 따르면 됩니다. 여기서 CPU-only는 NVIDIA GPU 없이 CPU만 사용하는 환경을 뜻합니다. 설치를 마친 뒤 첫 답변까지 확인하는 절차는 [설치와 첫 실행](../quickstart.md)에 있습니다.

## 어떤 환경을 준비해야 하나요?

| 하려는 작업 | 준비할 환경 |
|---|---|
| 코드 수정, 설정 확인, GPU가 필요 없는 테스트, 저장된 예제로 API 확인 | [CPU-only 개발환경](#cpu-only-개발환경) |
| React 화면 수정과 빌드 | CPU 환경 + Node.js |
| 실제 PDF 인덱싱, OpenSearch 검색, 로컬 모델 답변 생성 | [GPU 개발환경](#gpu-개발환경) |

CPU 환경에서는 PostgreSQL, OpenSearch, Temporal, NVIDIA GPU와 유료 API 키가 필요하지 않습니다. 실제 문서를 처리하고 로컬 모델로 답변을 생성하려면 GPU 환경과 외부 서비스를 모두 준비해야 합니다.

## CPU-only 개발환경

### 준비할 것

| 준비물 | 기준 | 필요한 이유 |
|---|---|---|
| Linux 또는 macOS | 현재 보안 지원 버전 | 백엔드와 테스트를 실행합니다. |
| Python | 3.12 이상 | 백엔드, 명령줄 도구와 테스트를 실행합니다. 현재 운영 환경의 기준 버전은 CPython 3.12.12입니다. |
| Git | 별도 고정 버전 없음 | 저장소를 내려받습니다. |
| curl | 별도 고정 버전 없음 | 실행한 API에 요청을 보내 확인합니다. |
| Node.js와 npm | Node.js 20 이상 | `frontend/chatkit_demo`를 수정하거나 빌드할 때만 필요합니다. |

Python 백엔드와 명령줄 도구만 다룬다면 Node.js와 npm은 설치하지 않아도 됩니다.

### 설치하기

다음 명령을 터미널에서 순서대로 실행합니다.

```bash
git clone https://github.com/DLI-Lab/Struct4Search.git
cd Struct4Search
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -c constraints/py312-cpu.txt -e '.[test,api]'
python -m pip check
```

`pip check`가 오류 없이 끝나면 필요한 Python 패키지가 서로 맞는 버전으로 설치된 것입니다. 이어서 비GPU 테스트를 실행합니다.

```bash
python -m pytest -q
```

실패한 테스트 없이 종료되면 CPU 환경 준비가 끝난 것입니다. 저장된 예제로 답변 API까지 확인하려면 [CPU-only Quickstart](../quickstart.md#cpu-only-quickstart)를 이어서 진행합니다.

### Python 가상환경을 만들 수 없을 때

Debian 또는 Ubuntu에서 `ensurepip is not available` 오류가 나오면 Python 가상환경 패키지를 설치한 뒤 다시 시도합니다.

```bash
sudo apt-get update
sudo apt-get install -y python3.12-venv
python3.12 -m venv .venv
```

서버에 프로그램을 설치할 권한이 없다면 사용자 영역에 `virtualenv`를 설치할 수 있습니다.

```bash
python3.12 -m pip install --user --break-system-packages virtualenv
python3.12 -m virtualenv .venv
source .venv/bin/activate
```

`--break-system-packages`는 프로젝트 패키지 전체가 아니라 가상환경을 만드는 `virtualenv`만 사용자 영역에 설치하기 위한 옵션입니다.

## GPU 개발환경

GPU 환경은 실제 PDF를 파싱하고, 검색용 데이터를 만들고, 로컬 모델로 검색과 답변을 실행할 때 필요합니다. Python 패키지만 설치해서는 실행할 수 없으며 GPU, 데이터 저장소, 작업 관리 서버와 모델 파일을 함께 준비해야 합니다.

### 1. 서버에 준비할 것

| 준비물 | 기준 | 필요한 이유 |
|---|---|---|
| Linux | vLLM이 지원하는 64비트 Linux | 로컬 GPU 모델을 실행합니다. macOS에서는 GPU 실행을 지원하지 않습니다. |
| Python | 3.12 | 백엔드와 GPU 모델 서비스를 같은 Python 환경에서 실행합니다. |
| NVIDIA GPU | Compute Capability 7.5 이상 | MinerU, Qwen 답변 모델과 임베딩 모델을 실행합니다. |
| NVIDIA 드라이버 | 설치되는 PyTorch와 호환되는 버전 | Python에서 GPU를 사용할 수 있게 합니다. 저장소가 드라이버 버전을 고정하지는 않습니다. |
| Docker Engine과 Docker Compose | `docker compose` 명령 사용 가능 | PostgreSQL, Temporal과 개발용 OpenSearch를 실행합니다. |
| 디스크 여유 공간 | 루트 파일시스템에 160 GB 이상 | 원문, 중간 결과와 검색 인덱스를 저장합니다. 이보다 적으면 실행 전 점검이 실패합니다. |
| Git과 curl | 별도 고정 버전 없음 | 저장소를 받고 서비스 상태를 확인합니다. |

CUDA Toolkit은 PyTorch나 vLLM을 직접 빌드할 때만 필요합니다. 이 문서의 방식처럼 미리 빌드된 Python 패키지를 설치할 때는 별도로 설치하지 않습니다. `nvidia-container-toolkit`도 현재 구성처럼 모델을 호스트에서 실행할 때는 필요하지 않습니다.

현재 `configs/services/cold-services.yaml`은 약 96 GiB 메모리를 가진 NVIDIA GPU 두 장에 맞춘 운영 설정입니다. GPU 수나 메모리가 다르면 모델의 GPU 배치와 메모리 사용량을 조정해야 하므로, 해당 설정을 그대로 실행할 수 없습니다.

### 2. Python 패키지 설치하기

다음 명령은 공통 백엔드 패키지를 먼저 설치하고, 이어서 NVIDIA GPU에서만 사용하는 vLLM과 MinerU 패키지를 추가합니다.

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

`requirements-gpu.txt`는 Linux NVIDIA GPU 서버에서만 설치합니다. CPU 서버나 macOS에는 설치하지 않습니다.

설치 후 다음 명령으로 GPU 드라이버와 Python의 CUDA 실행을 확인합니다.

```bash
nvidia-smi
python - <<'PY'
import torch
import vllm
import mineru_vl_utils

assert torch.cuda.is_available()
x = torch.tensor([1.0, 2.0], device="cuda")
assert float(x.sum().cpu()) == 3.0
print({
    "torch": torch.__version__,
    "cuda": torch.version.cuda,
    "vllm": vllm.__version__,
    "gpu": torch.cuda.get_device_name(0),
})
PY
```

오류 없이 GPU 이름과 버전 정보가 출력되면 Python에서 GPU를 사용할 수 있습니다. 이 확인은 모델 파일을 불러오거나 모델 서버를 시작하지는 않습니다.

### 3. 데이터 저장소와 작업 관리 서버 준비하기

| 서비스 | 기준 | 하는 일 | 준비 방법 |
|---|---|---|---|
| PostgreSQL | 16 | 지식그래프와 문서 목록을 저장합니다. Temporal도 별도 PostgreSQL 데이터베이스를 사용합니다. | 지식그래프용 DB와 Temporal용 DB는 저장소의 Docker Compose가 실행합니다. 문서 목록 기능을 사용할 때는 `S4S_DOCUMENT_DSN`이 가리키는 DB도 준비합니다. |
| OpenSearch | 2.19.1 + 한국어 형태소 분석기 Nori | 원문, 검색표현과 임베딩을 저장하고 검색합니다. | 기존 서버를 연결하거나 저장소의 Dockerfile로 개발용 컨테이너를 만듭니다. |
| Temporal Server | 1.28.1 | 여러 인덱싱 단계를 순서대로 실행하고 중단된 작업을 다시 이어갑니다. | `deploy/temporal-compose.yaml`이 실행합니다. |
| Temporal UI | 2.43.3 | 실행 중인 인덱싱 작업의 상태를 웹에서 확인합니다. | `deploy/temporal-compose.yaml`이 실행합니다. 기본 주소는 `http://127.0.0.1:18080`입니다. |

PostgreSQL과 Temporal은 `struct4search-ingest`를 실행할 때 자동으로 Docker Compose를 시작합니다. 미리 상태를 확인하려면 다음 명령으로 직접 시작할 수 있습니다.

```bash
docker compose -f deploy/temporal-compose.yaml up -d
docker compose -f deploy/temporal-compose.yaml ps
```

기본 설정에서는 지식그래프용 PostgreSQL이 `127.0.0.1:55435`, Temporal이 `127.0.0.1:7233`에서 실행됩니다.

개발용 OpenSearch가 없다면 다음 명령으로 Nori 분석기가 포함된 이미지를 만들고 실행합니다. `19470`은 현재 실행 프로파일이 사용하는 로컬 OpenSearch 포트입니다.

```bash
docker build \
  -t struct4search/opensearch-nori:2.19.1 \
  -f backend/struct4search/resources/opensearch/Dockerfile.nori-2.19.1 \
  .

docker run -d --name s4s-opensearch \
  --ulimit nofile=65536:65536 \
  -e discovery.type=single-node \
  -e DISABLE_INSTALL_DEMO_CONFIG=true \
  -e DISABLE_SECURITY_PLUGIN=true \
  -e "OPENSEARCH_JAVA_OPTS=-Xms1g -Xmx1g" \
  -p 127.0.0.1:19470:9200 \
  struct4search/opensearch-nori:2.19.1

curl --fail http://127.0.0.1:19470/_cluster/health
```

마지막 `curl` 명령에서 OpenSearch 상태가 JSON으로 반환되면 연결할 수 있는 상태입니다.

### 4. 모델 파일 준비하기

실제 파이프라인에서는 다음 모델을 사용합니다.

| 모델 | 하는 일 | 실행 방식 |
|---|---|---|
| MinerU2.5-Pro-2605 | 스캔 또는 이미지 중심 PDF를 파싱합니다. | 인덱싱 과정에서 관리되는 모델 서비스 |
| `urchade/gliner_multi-v2.1` | 문서에서 개체명을 찾습니다. | 인덱싱 프로세스가 직접 불러옵니다. |
| `Qwen/Qwen3-14B` | 메타데이터, 지식그래프, 검색표현과 답변을 생성합니다. | 관리되는 vLLM 서비스 |
| `Qwen/Qwen3-Embedding-8B` | 문서와 질의를 검색용 벡터로 변환합니다. | 관리되는 vLLM 서비스 |

모델은 실행할 때 자동으로 내려받지 않습니다. `configs/model-catalog.yaml`에 적힌 모델 버전과 같은 파일을 서버에 준비하고, 다음 단계의 `.env`에서 모델 캐시와 MinerU 모델 위치를 지정합니다. 모델별 설정 위치는 [모델 사용 위치](model-calls.md), 실행 profile을 수정하는 방법은 [설정 수정](../maintenance/configuration.md)에서 확인합니다.

### 5. 서버별 경로와 접속 정보 입력하기

저장소의 예시 파일을 복사합니다.

```bash
cp .env.example .env
```

`.env`에서 실제 실행에 필요한 항목만 입력합니다.

| 입력할 값 | 언제 필요한가 |
|---|---|
| `S4S_KG_DSN` | 지식그래프를 PostgreSQL에 저장할 때 필요합니다. Docker Compose 기본값을 사용하면 `postgresql://s4s:s4s@127.0.0.1:55435/s4s`입니다. |
| `S4S_DOCUMENT_DSN` | 문서 목록 API와 `--stack` 실행을 사용할 때 필요합니다. |
| `S4S_HUGGINGFACE_CACHE` | Qwen과 GLiNER 모델 파일이 있는 캐시 위치를 지정합니다. |
| `S4S_MINERU_MODEL_ROOT` | MinerU 모델 파일이 있는 디렉터리를 지정합니다. |
| `S4S_PYTHON_INTERPRETER`, `S4S_VLLM_BIN` | 관리되는 모델 서비스를 실행할 Python과 vLLM 실행 파일을 기본값과 다르게 사용할 때 지정합니다. |
| `S4S_OPENSEARCH_HOME`, `S4S_OPENSEARCH_CONFIG` | Docker가 아닌 호스트 설치 OpenSearch를 관리할 때만 지정합니다. |
| `OPENAI_API_KEY` 또는 `S4S_LLM_API_KEY` | 로컬 Qwen 대신 유료 외부 모델을 선택한 프로파일에서만 필요합니다. |

`.env`에는 `KEY=value` 형식만 사용하고 비밀번호와 API 키를 Git에 올리지 않습니다. 공개 `struct4search-*` 명령은 저장소 루트의 `.env`를 자동으로 읽으며, 셸에 이미 설정된 값은 덮어쓰지 않습니다. 사용할 수 있는 전체 항목은 `.env.example`에 있으며, 실행 프로파일을 바꾸는 방법은 [설정 수정](../maintenance/configuration.md)에서 확인합니다.

### 6. 실행 준비 확인하기

```bash
python -m pip check
struct4search-env
struct4search-preflight
struct4search-bootstrap --profile configs/e2e-smoke.yaml
```

각 명령은 다음을 확인합니다.

| 명령 | 정상일 때 확인할 내용 |
|---|---|
| `python -m pip check` | Python 패키지 충돌 없이 종료됩니다. |
| `struct4search-env` | 이번 실행에서 사용할 Python 경로와 추가 패키지 경로가 출력됩니다. |
| `struct4search-preflight` | 마지막 줄에 `[preflight] PASS`가 출력됩니다. GPU, 포트, 디스크와 OpenSearch 상태에 문제가 있으면 해당 항목을 고친 뒤 다시 실행합니다. |
| `struct4search-bootstrap --profile configs/e2e-smoke.yaml` | OpenSearch 검색 규칙의 이름과 해시가 JSON으로 출력됩니다. 규칙이 없으면 생성하고, 이미 있으면 현재 설정과 같은지 확인합니다. 문서나 검색 인덱스는 변경하지 않습니다. |

네 명령이 모두 성공하면 실제 문서 한 건을 처리할 준비가 끝난 것입니다. 다음 단계는 [GPU Quickstart](../quickstart.md#gpu-quickstart)에서 이어서 진행합니다.

## 설치 파일은 이렇게 사용합니다

| 파일 | 용도 | 직접 사용할 때 |
|---|---|---|
| `pyproject.toml` | Python 버전, 패키지 정보와 의존성 범위를 정의합니다. | 보통 직접 실행하지 않습니다. 패키지 구성을 바꿀 때 수정합니다. |
| `constraints/py312-cpu.txt` | CPU 환경에서 검증된 패키지 버전을 고정합니다. | CPU 설치 명령의 `-c` 옵션으로 사용합니다. |
| `requirements.txt` | 실제 파이프라인에 필요한 공통 백엔드, 파서, NER, API, Temporal과 테스트 패키지를 설치합니다. | GPU 환경 설치의 첫 번째 요구사항 파일입니다. |
| `requirements-gpu.txt` | vLLM과 MinerU의 GPU 실행 패키지를 추가합니다. | `requirements.txt` 설치 후 Linux NVIDIA GPU 서버에서만 사용합니다. |
| `.env.example` | 데이터베이스 접속 정보와 서버별 모델 경로의 입력 형식입니다. | `.env`로 복사한 뒤 이 서버에 필요한 값만 채웁니다. |
