---
sidebar_position: 5
title: 저장소와 보존
---

# 저장소와 보존

문서 인덱싱 과정에서 생성되는 데이터가 어디에 저장되고, 다시 처리할 때 어떻게 갱신되는지 정리합니다.

## 저장소별 역할

| 저장소 | 저장하는 것 |
|---|---|
| 파일 산출물 | 단계별 중간 결과와 문서 처리 상태 |
| PostgreSQL | 문서 단위 지식그래프 |
| OpenSearch | 검색에 사용하는 원문 청크·검색표현과 임베딩 벡터 |

각 저장소는 역할이 다릅니다. 파일 산출물은 파이프라인 재개와 재처리에 사용하고, PostgreSQL은 KG를 보관하며, OpenSearch는 실제 검색 데이터를 제공합니다.

## 파일 산출물

`struct4search-ingest`의 `--output`으로 지정한 디렉터리 아래에 단계별·문서별 산출물이 저장됩니다.

```text
<출력 디렉터리>/
├─ f400/documents/<문서 ID>/       원문 청킹
├─ triples/documents/<문서 ID>/    Triple 추출
├─ kg/documents/<문서 ID>/         문서 지식그래프
├─ v3/documents/<문서 ID>/         KG 구축을 위한 청크 묶음
├─ metadata/documents/<문서 ID>/   Metadata
└─ g2/documents/<문서 ID>/         검색표현
````

문서 처리가 끝나면 완료 기록이 남습니다. 이 산출물을 기준으로 어느 단계까지 처리되었는지 확인하고, 중단된 실행을 이어받습니다.

재개와 단계별 재처리 방법은 [파이프라인 실행 및 재처리 방법](../indexing/rerun.md)에서 설명합니다.

## PostgreSQL

문서 단위 지식그래프는 PostgreSQL에 저장됩니다.

| 테이블                 | 저장하는 것       |
| ------------------- | ------------ |
| `kg_graph_versions` | 지식그래프 버전     |
| `kg_entities`       | Entity       |
| `kg_triples`        | Triple       |
| `kg_document_heads` | 문서별 현재 지식그래프 |

기본 Schema는 `s4s_kg`입니다.

| 설정                 | 값                     |
| ------------------ | --------------------- |
| `kg.store.backend` | `postgresql`          |
| `kg.store.schema`  | `s4s_kg`              |
| `kg.store.dsn_env` | `S4S_KG_POSTGRES_DSN` |

PostgreSQL 접속 문자열은 실행 프로파일에 직접 기록하지 않고 `S4S_KG_POSTGRES_DSN` 환경변수로 전달합니다.

## OpenSearch

OpenSearch에는 검색에 사용하는 두 종류의 검색 단위가 저장됩니다.

* 원문 청크
* 검색표현

두 검색 단위 모두 텍스트와 임베딩 벡터를 가지며 하나의 인덱스에 함께 저장됩니다. 자세한 필드와 매핑은 [OpenSearch 인덱스 구조](opensearch-schema.md)에서 확인할 수 있습니다.

검색에서는 인덱스 이름 대신 alias를 사용할 수 있으므로, 새로운 인덱스를 만든 뒤 검증이 끝나면 alias를 새 인덱스로 전환할 수 있습니다.

## 문서를 다시 처리할 때

특정 문서를 다시 처리하면 해당 문서에 속한 결과만 갱신됩니다.

| 저장소        | 동작                                |
| ---------- | --------------------------------- |
| 파일 산출물     | 해당 문서의 단계별 산출물을 새 결과로 갱신          |
| PostgreSQL | 해당 문서의 지식그래프를 새 버전으로 저장           |
| OpenSearch | 해당 문서의 기존 검색 단위를 제거하고 새 검색 단위로 교체 |

다른 문서의 결과는 그대로 유지됩니다.

## 보존과 정리

이전 실행의 산출물과 인덱스는 자동으로 모두 삭제되지 않으므로 필요한 시점에 명시적으로 정리합니다.

새 인덱스로 전환할 때는 기존 인덱스를 바로 삭제하지 않습니다. 새 인덱스에서 검색·QA 검증을 마친 뒤 alias를 전환하고, 문제가 없음을 확인한 후 이전 인덱스를 정리합니다.

자세한 절차는 [데이터와 인덱스 구조 변경](../maintenance/data-index.md)에서 설명합니다.

## 코드 참조

| 확인할 내용           | 파일·심볼                                             |
| ---------------- | ------------------------------------------------- |
| 문서 처리 상태와 완료 기록  | `src/struct4search/ingest/service.py`             |
| PostgreSQL KG 저장 | `src/struct4search/kg_store.py`                   |
| OpenSearch 색인 갱신 | `src/struct4search/index_stage.py`                |
| 저장소 설정           | `configs/ingest-production.yaml` · `kg` · `index` |

