---
sidebar_position: 5
title: 저장소와 보존
---

# 저장소와 보존

무엇이 어디에 남는지 정리합니다.

## 저장소별 역할

| 저장소 | 담는 것 | 지우면 |
|---|---|---|
| 파일 산출물 | 단계별 중간 결과와 완료 기록 | 재개가 불가능해집니다 |
| PostgreSQL | 문서 지식그래프 | 그래프 조회가 불가능해집니다 |
| OpenSearch | 검색 단위와 벡터 | 검색이 불가능해집니다 |

세 곳이 서로를 복원해 주지 않습니다. 파일 산출물이 있으면 색인은 다시 만들 수 있지만, 파일 산출물이 없으면 문서 파싱부터 다시 해야 합니다.

## 파일 산출물

`--output`으로 지정한 디렉터리 아래에 단계별·문서별로 쌓입니다.

```text
<출력 디렉터리>/
├─ f400/documents/<문서 ID>/       원문 청킹
├─ triples/documents/<문서 ID>/    관계 추출
├─ kg/documents/<문서 ID>/         문서 지식그래프
├─ v3/documents/<문서 ID>/         청크 묶기
├─ metadata/documents/<문서 ID>/   Metadata
└─ g2/documents/<문서 ID>/         검색표현
```

문서 하나가 끝나면 완료 기록이 남고 `run_id`·`document_id`·색인된 검색 단위 수가 들어갑니다. 단계 디렉터리의 존재 여부로 어디까지 됐는지 판정하므로, **기록이 실제보다 나은 상태를 보고하지 않습니다.**

## PostgreSQL

스키마는 `s4s_kg`이고 테이블은 넷입니다.

| 테이블 | 담는 것 |
|---|---|
| `kg_graph_versions` | 그래프 버전 |
| `kg_entities` | 엔티티 |
| `kg_triples` | 관계 |
| `kg_document_heads` | 문서별 현재 그래프 |

접속 정보는 설정에 직접 쓰지 않고 환경변수 이름만 적습니다.

| 설정 | 값 |
|---|---|
| `kg.store.backend` | `postgresql` |
| `kg.store.schema` | `s4s_kg` |
| `kg.store.dsn_env` | `S4S_KG_POSTGRES_DSN` |
| `kg.store.pool_min_size` · `pool_max_size` | 1 · 8 |

## OpenSearch

검색 단위와 벡터가 인덱스 하나에 들어갑니다. 구조는 [OpenSearch 인덱스 구조](opensearch-schema.md)에 있습니다.

별칭으로 검색 대상을 가리키므로, 새 인덱스를 만든 뒤 별칭을 옮기는 방식으로 교체합니다.

## 문서를 다시 처리할 때

| 저장소 | 동작 |
|---|---|
| 파일 산출물 | 해당 문서 디렉터리를 덮어씁니다 |
| PostgreSQL | 해당 문서의 그래프를 새 버전으로 바꿉니다 |
| OpenSearch | 문서와 `unit_kind` 조합의 기존 단위를 지우고 다시 넣습니다 |

세 곳 모두 **문서 단위 교체**입니다. 다른 문서에는 영향을 주지 않습니다.

## 보존

이 파이프라인은 오래된 산출물을 자동으로 지우지 않습니다. 실행 디렉터리와 인덱스는 명시적으로 정리해야 합니다.

인덱스를 지울 때는 [데이터와 인덱스 구조 변경](../maintenance/data-index.md)의 순서를 따릅니다. 별칭이 가리키는 인덱스를 먼저 지우면 되돌아갈 자리가 없어집니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 완료 기록과 부분 완료 판정 | `src/struct4search/ingest/service.py` |
| PostgreSQL 스키마와 테이블 | `src/struct4search/kg_store.py` |
| 색인 교체 | `src/struct4search/index_stage.py` |
| 설정 | `configs/ingest-production.yaml` · `kg` · `index` |
