---
sidebar_position: 9
title: 파이프라인 실행 및 재처리 방법
---

# 파이프라인 실행 및 재처리 방법

문서 인덱싱 파이프라인을 실행하고, 중단된 실행을 이어받고, 바뀐 부분만 다시 처리하는 방법입니다.

## 실행

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output /absolute/path/to/new-isolated-output
```

| 인자              | 설명                                                 |
| --------------- | -------------------------------------------------- |
| `--output`      | 산출물이 쌓일 디렉터리. 필수                                   |
| `--config`      | 실행 프로파일. 필수이며 기본값 없음                            |
| `--services`    | 서비스 정의. 필수이며 기본값 없음                              |
| `--document-id` | 처리할 문서. 여러 번 줄 수 있고, 생략하면 코퍼스 전체                   |

문서 한 건만 돌리려면 이렇게 씁니다.

```bash
struct4search-ingest \
  --config configs/production.yaml \
  --services configs/services/cold-services.yaml \
  --output /absolute/path/to/new-isolated-output \
  --document-id d002343_6b6d39ebe6
```

실행기는 필요한 모델·검색 서비스를 함께 띄우고 파이프라인 일곱 단계를 순서대로 돌립니다. 서비스 목록과 주소는 [API Reference](../reference/api-reference.md)에 있습니다.

## 산출물 구조

단계마다 문서별 디렉터리를 만듭니다.

```text
<출력 디렉터리>/
├─ f400/documents/<문서 ID>/receipt.json      원문 청킹
├─ triples/documents/<문서 ID>/receipt.json   KG 구축의 관계 추출
├─ kg/documents/<문서 ID>/                    문서 지식그래프
├─ v3/documents/<문서 ID>/                    청크 묶기
├─ metadata/documents/<문서 ID>/              Metadata 생성
└─ g2/documents/<문서 ID>/receipt.json        검색표현 생성
```

문서 하나가 끝나면 완료 기록이 남고, 여기에 `run_id`·`document_id`·색인된 검색 단위 수가 들어갑니다.

## 재개

실행 프로세스가 죽어도 워크플로는 살아 있습니다. 같은 인자로 다시 실행하면 **이어받습니다.**

워크플로 ID는 프로파일·출력 경로·문서 목록의 해시입니다. 그래서 같은 인자로 다시 부르면 원래 실행에 붙고, 인자가 다른 워크플로가 이미 돌고 있으면 실행을 **거부합니다.** 같은 GPU를 두 실행이 나눠 쓰는 상황을 미리 막기 위해서입니다.

거부 메시지에 돌고 있는 워크플로 ID가 나옵니다. 그 실행을 끝내야 할 상황이면 먼저 종료한 뒤 다시 시작합니다.

## 진행 상황과 실패 확인

| 확인할 것     | 보는 곳                      |
| --------- | ------------------------- |
| 문서별 완료 여부 | 문서 완료 기록의 존재              |
| 어디까지 됐는지  | 위 산출물 구조에서 문서 디렉터리가 있는 단계 |
| 부분 완료     | 완료 기록의 남은 단계와 빠진 단계 목록    |

부분 완료 문서는 **어느 단계가 빠졌는지가 문서별로 남습니다.** 산출물이 실제로 있는지로 판정하므로 기록이 실제보다 나은 상태를 보고하지 않습니다.

## 재처리 범위

무엇을 바꿨는지에 따라 다시 도는 범위가 달라집니다.

| 바꾼 것             | 다시 도는 단계                    | 재색인        |
| ---------------- | --------------------------- | ---------- |
| 파서·페이지 판정        | 문서 파싱부터 전부                  | 필요         |
| 청킹 크기·오버랩·토크나이저  | 원문 청킹부터 전부                  | 필요         |
| NER 모델·라벨        | NER · KG 구축 · 검색표현 생성 · 인덱싱 | 필요         |
| Metadata 프롬프트·필드 | Metadata 생성 · 검색표현 생성 · 인덱싱 | 필요         |
| KG 묶기 기준         | KG 구축 · 검색표현 생성 · 인덱싱       | 필요         |
| 검색표현 생성 방식       | 검색표현 생성 · 인덱싱               | 필요         |
| 임베딩 모델·차원        | 인덱싱                         | 인덱스를 새로 만듦 |
| 색인 매핑            | 인덱싱                         | 인덱스를 새로 만듦 |

앞의 여섯 줄이 재색인을 요구하는 이유는 [원문 청킹](chunking.md)의 청크 ID가 설정 해시를 포함하기 때문입니다. 설정이 바뀌면 같은 문서라도 검색 단위 ID가 달라져 기존 색인과 섞을 수 없습니다.

특정 문서만 다시 처리하려면 `--document-id`로 그 문서를 지정합니다. 해당 문서의 이전 검색 단위는 색인 단계에서 교체됩니다.

## 자주 막히는 지점

| 증상                      | 확인할 곳                    |
| ----------------------- | ------------------------ |
| 워크플로가 이미 돈다며 거부         | 거부 메시지의 워크플로 ID          |
| 스캔 문서에서 파싱 실패           | MinerU 서비스가 떠 있는지        |
| Metadata·KG·검색표현이 비어 있음 | 답변 모델 서버가 떠 있는지          |
| 색인 단계 실패                | OpenSearch 주소와 인덱스 존재 여부 |

서비스 주소는 프로파일과 서비스 정의 파일에 있습니다.

## 코드 참조

| 확인할 내용          | 파일·심볼                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------- |
| 실행 진입점          | `src/struct4search/entrypoints/cli/ingest.py` · `main`                                       |
| 재개와 중복 실행 거부    | `src/struct4search/entrypoints/cli/ingest.py` · `refuse_if_another_run_is_live`              |
| 완료 기록과 부분 완료 판정 | `src/struct4search/ingest/service.py` · `persist_document_complete` · `partial_stage_detail` |
| 실행 프로파일         | `configs/production.yaml` · `configs/ingest-production.yaml`                                 |
| 서비스 정의          | `configs/services/cold-services.yaml`                                                        |
