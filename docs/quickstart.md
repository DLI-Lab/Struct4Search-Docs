---
sidebar_position: 2
title: 설치와 첫 실행
---

# 설치와 첫 실행

문서 한 건을 처리하고 질의 하나를 실행해 답변과 출처를 확인하기까지의 최소 경로입니다.

## 실행 전 준비

정본 저장소에서 패키지를 설치하면 실행 명령이 함께 깔립니다.

```bash
pip install -e .
```

| 명령 | 하는 일 |
|---|---|
| `struct4search-env` | 실행에 쓰이는 경로와 환경 값 출력 |
| `struct4search-preflight` | 호스트 사전 점검 |
| `struct4search-smoke-e2e` | 고정 문서 한 건으로 전체 경로 검증 |
| `struct4search-ingest` | 문서 인덱싱 |
| `struct4search-evaluate` | 검색·QA 평가 |

## 설정 확인

```bash
struct4search-env
```

경로와 환경 값이 출력됩니다. 셸에 그대로 넣으려면 `--shell`을 붙입니다.

인덱싱은 `configs/ingest-production.yaml`, 검색·답변은 `configs/production.yaml`을 기본 프로파일로 씁니다. 다른 프로파일을 쓰려면 실행할 때 `--config`로 지정합니다.

## 필요한 서비스 확인

```bash
struct4search-preflight
```

호스트가 조건을 만족하지 못하면 **여기서 멈춥니다.** 서비스를 다 띄우고 나서 실패하는 것보다 먼저 드러나는 편이 낫습니다.

인덱싱 실행기가 띄우는 서비스는 다음과 같습니다.

| 서비스 | 쓰는 곳 |
|---|---|
| MinerU | 스캔·복합 페이지 파싱 |
| Qwen | Metadata 생성 · KG 구축 · 검색표현 생성 · 답변 |
| 임베딩 서버 | 색인 벡터와 질의 벡터 |
| OpenSearch | 검색 단위 색인과 검색 |

주소는 프로파일과 `configs/services/cold-services.yaml`에 있습니다.

## 샘플 문서 처리

먼저 고정된 문서 하나로 전체 경로가 도는지 확인합니다.

```bash
struct4search-smoke-e2e
```

인덱싱부터 답변까지 한 번 통과시키되 **별칭을 바꾸거나 서비스를 재시작하지 않습니다.** 기존 인덱스에 영향이 없습니다.

```json
{"status": "...", "run_id": "...", "receipt_path": "..."}
```

여기가 통과하면 서비스 연결과 파이프라인 계약이 모두 살아 있다는 뜻입니다.

이제 내 문서를 넣습니다.

```bash
struct4search-ingest --output <출력 디렉터리> --document-id <문서 ID>
```

성공하면 문서별 완료 기록과 색인된 검색 단위 수가 남습니다.

## 질의 실행

```bash
struct4search-evaluate --run-root <출력 디렉터리> --output-root <결과 디렉터리>
```

평가 실행기가 [검색·답변 파이프라인](query/overview.md)을 그대로 태웁니다. API 서버를 띄웠다면 `POST /v1/response`로도 같은 경로를 부를 수 있습니다([API Reference](reference/api-reference.md)).

## 답변과 출처 확인

결과 디렉터리에서 `qa_answers.jsonl`을 봅니다.

| 확인할 것 | 정상 |
|---|---|
| 답변 문장 | 근거로 확인되는 내용만 있습니다 |
| 인용 ID | 모두 `ruf_`로 시작합니다 |
| 출처 | 문서 ID와 원본 페이지가 붙어 있습니다 |
| 인용 정리 집계 | 네 값이 모두 0입니다 |

마지막 줄이 0이 아니면 답변은 나왔지만 모델이 인용 계약을 어겼고 후처리가 그것을 지웠다는 뜻입니다([답변 후처리 및 원본 출처 연결](query/citations.md)).

## 자주 막히는 지점

| 증상 | 확인할 곳 |
|---|---|
| 사전 점검에서 멈춤 | 출력에 나온 조건 |
| 워크플로가 이미 돈다며 거부 | 거부 메시지의 워크플로 ID |
| 스캔 문서 파싱 실패 | MinerU 서비스 |
| Metadata·KG·검색표현이 비어 있음 | Qwen 서버 |
| 색인 실패 | OpenSearch 주소와 인덱스 |
| 검색 결과가 0건 | 색인이 끝났는지, 인덱스 이름이 맞는지 |

## 여러 문서로 확장하기

`--document-id` 없이 실행하면 코퍼스 전체를 처리합니다.

```bash
struct4search-ingest --output <출력 디렉터리>
```

문서가 많아지면 실행 시간이 길어지고 중간에 끊길 수 있습니다. 같은 인자로 다시 실행하면 이어받습니다. 재개와 재처리 범위는 [실행과 재처리](indexing/rerun.md)에 있습니다.
