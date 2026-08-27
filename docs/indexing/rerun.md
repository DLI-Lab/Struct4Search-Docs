---
sidebar_position: 9
title: 문서 인덱싱 실행과 상태 확인
---

# 문서 인덱싱 실행과 상태 확인

이 페이지에서는 실제 문서를 인덱싱하고, 실행 완료 여부를 확인하며, 중단되거나 실패한 작업을 다시 실행하는 방법을 설명합니다.

샘플 문서로 전체 시스템을 처음 실행하려면 먼저 [설치와 첫 실행](../quickstart.md)을 진행합니다. 파싱, 청킹, NER, KG 구축 등 각 단계의 동작을 이해하려면 [문서 인덱싱 파이프라인](overview.md)을 참고합니다.

## 문서 한 건 실행하기

전체 문서를 실행하기 전에 문서 한 건으로 파이프라인과 외부 서비스가 정상적으로 동작하는지 확인하는 것을 권장합니다.

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output <출력_디렉터리> \
  --document-id d002343_6b6d39ebe6
````

| 인자              | 설명                                                  |
| --------------- | --------------------------------------------------- |
| `--output`      | 단계별 산출물과 완료 기록을 저장할 디렉터리. 필수                        |
| `--config`      | 인덱싱 설정이 정의된 실행 프로파일                                 |
| `--services`    | 파서, NER, LLM 등 실행에 필요한 서비스 정의                       |
| `--document-id` | 처리할 문서 ID. 여러 번 지정할 수 있음                            |
| `--stack`       | 로컬 실행용 통합 설정. `--config`, `--services`와 함께 사용할 수 없음 |

실행기는 설정에 정의된 서비스를 확인한 뒤 해당 문서의 인덱싱 파이프라인을 실행합니다. 필요한 서비스와 주소는 [외부 의존](../reference/dependencies.md)에서 확인합니다.

## 실행 결과 확인하기

실행 후에는 다음 두 가지를 확인합니다.

1. 문서의 완료 기록이 생성되었는지
2. 완료 기록에 색인된 검색 단위 수가 기록되었는지

완료 기록에는 다음 정보가 포함됩니다.

* `run_id`
* `document_id`
* 색인된 검색 단위 수
* 완료된 단계
* 실패하거나 남아 있는 단계

완료 기록이 있으면 해당 문서의 인덱싱이 끝난 것입니다. 완료 기록이 없으면 실행 로그에서 마지막으로 완료된 단계를 확인하고, 해당 단계의 서비스와 산출물을 점검합니다.

> 이 문서에는 완료 기록의 **실제 파일 경로 또는 확인 명령**을 반드시 명시해야 합니다. 현재 경로를 밝히지 않고 “완료 기록을 확인한다”고만 쓰면 신규 개발자가 실제로 상태를 확인할 수 없습니다.

단계별 산출물의 경로와 데이터 형식은 [인덱싱 산출물](../reference/indexing-artifacts.md)에서 확인합니다.

## 여러 문서 실행하기

여러 문서를 처리하려면 `--document-id`를 반복해서 지정합니다.

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output <출력_디렉터리> \
  --document-id <문서_ID_1> \
  --document-id <문서_ID_2>
```

프로파일에 포함된 전체 문서를 처리하려면 `--document-id`를 생략합니다.

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output <출력_디렉터리>
```

전체 문서를 실행하기 전에는 문서 한 건으로 다음 항목을 먼저 확인합니다.

* 파서, NER, LLM, OpenSearch 서비스가 정상적으로 연결되는지
* 단계별 산출물이 생성되는지
* 최종 검색 단위가 OpenSearch에 저장되는지
* 완료 기록이 생성되는지

## 중단된 실행 이어서 시작하기

실행 프로세스가 종료되어도 이미 생성된 단계별 산출물은 출력 디렉터리에 남습니다.

중단되기 전과 동일한 설정, 출력 디렉터리와 문서 목록으로 명령을 다시 실행하면 완료된 단계는 재사용하고, 끝나지 않은 단계부터 이어서 처리합니다.

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output <기존_출력_디렉터리>
```

따라서 단순히 실행이 중단된 경우에는 기존 산출물을 삭제하거나 새로운 출력 디렉터리를 만들지 않습니다.

다른 인덱싱 작업이 같은 실행 자원을 사용하고 있으면 중복 실행을 방지하기 위해 새 실행이 거부될 수 있습니다. 이 경우 오류 메시지에 표시된 실행 ID를 확인하고, 기존 작업이 실제로 실행 중인지 먼저 확인합니다.

> 워크플로 ID가 어떤 해시로 만들어지는지는 실행 절차에 필요하지 않으므로 본문에서는 설명하지 않습니다. 세부 동작은 하단의 관련 코드에서 확인할 수 있습니다.

## 실패한 문서 다시 실행하기

일부 문서만 실패한 경우에는 전체 문서를 다시 실행하지 않고, 실패한 문서 ID만 지정합니다.

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output <기존_출력_디렉터리> \
  --document-id <실패한_문서_ID>
```

기존 실행이 종료된 상태에서 실행해야 합니다. 이미 정상적으로 생성된 단계별 산출물은 재사용하고, 완료되지 않은 단계부터 다시 시도합니다.

여러 문서가 실패했다면 `--document-id`를 반복해서 지정할 수 있습니다.

## 모델이나 설정을 변경한 경우

실행 중단과 설정 변경은 다르게 처리해야 합니다.

중단된 작업은 기존 산출물을 그대로 사용해 이어서 실행할 수 있지만, 다음 항목을 변경한 경우에는 기존 산출물이나 인덱스가 새 설정과 호환되지 않을 수 있습니다.

* 파서 또는 페이지 판정 방식
* 청킹 크기, 오버랩 또는 토크나이저
* NER 모델 또는 라벨
* Metadata 프롬프트 또는 출력 필드
* KG 구성 방식
* 검색표현 생성 방식
* 임베딩 모델 또는 벡터 차원
* OpenSearch 인덱스 매핑

이 경우 같은 명령을 바로 다시 실행하지 말고, [변경 항목별 재생성 범위](../maintenance/change-map.md)에서 다음 사항을 먼저 확인합니다.

* 어느 단계부터 다시 생성해야 하는지
* 기존 출력 디렉터리를 재사용할 수 있는지
* 새 OpenSearch 인덱스가 필요한지
* 기존 문서의 검색 단위를 교체해야 하는지

특히 임베딩 모델, 벡터 차원 또는 인덱스 매핑을 변경한 경우에는 기존 인덱스에 섞지 않고 새 인덱스를 생성해야 합니다.

## 문제 해결

문제가 발생하면 실행 로그에서 마지막으로 성공한 단계를 먼저 확인한 뒤, 해당 단계가 사용하는 서비스를 점검합니다.

| 증상                             | 먼저 확인할 것                     |
| ------------------------------ | ---------------------------- |
| 다른 실행이 진행 중이라는 메시지와 함께 시작되지 않음 | 오류 메시지에 표시된 실행 ID와 기존 프로세스   |
| 스캔 문서의 파싱 단계에서 실패함             | MinerU 서비스 상태와 주소            |
| Metadata, KG 또는 검색표현이 생성되지 않음  | LLM 서비스 상태, 모델 설정과 인증 정보     |
| NER 단계에서 실패함                   | NER 서비스 상태와 모델 로드 여부         |
| 인덱싱 단계에서 실패함                   | OpenSearch 주소, 인덱스 존재 여부와 매핑 |
| 실행은 끝났지만 완료 기록이 없음             | 마지막 단계의 오류와 누락된 산출물          |
| 일부 문서만 반복해서 실패함                | 해당 문서의 마지막 성공 단계와 입력 파일      |

서비스 주소와 실행 조건은 [외부 의존](../reference/dependencies.md)에서 확인합니다.

## 관련 코드

| 확인할 내용                 | 파일·심볼                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------- |
| 실행 진입점                 | `backend/struct4search/entrypoints/cli/ingest.py` · `main`                          |
| 중단된 실행 이어가기 및 중복 실행 방지 | `backend/struct4search/entrypoints/cli/ingest.py` · `refuse_if_another_run_is_live` |
| 문서 완료 기록               | `backend/struct4search/ingest/service.py` · `persist_document_complete`             |
| 미완료 단계 판정              | `backend/struct4search/ingest/service.py` · `partial_stage_detail`                  |
| 실행 프로파일                | `configs/production.yaml`                                                           |
| 서비스 정의                 | `configs/services/cold-services.yaml`                                               |
