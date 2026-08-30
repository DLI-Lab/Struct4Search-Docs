---
sidebar_position: 7
title: 검색표현 생성
---

# 검색표현 생성

문서 지식그래프에서 핵심 주제를 중심으로 Triple을 묶고, Metadata로 문맥을 보강해 검색에 사용할 표현을 생성합니다.

## 입력과 출력

| 구분 | 내용 |
|---|---|
| 입력 | [KG 구축](triple-kg.md)의 문서 지식그래프와 [Metadata 생성](metadata.md)의 18종 Metadata |
| 출력 | 검색표현 |

검색표현 하나는 다음과 같은 형태입니다.

`//` 뒤의 내용은 필드 설명이며 실제 JSON 산출물에는 포함되지 않습니다.

```json
{
  "document_id": "d002343_6b6d39ebe6",                    // 이 검색표현이 속한 문서의 ID
  "text": "곡성 공장의 열분해유 제조 공정에서 열분해로 내부 온도가 급격히 상승하였다.", // 검색에 사용할 생성 문장
  "triple_ids": ["kgtr_4404df7b9e441dae2f5f92ef"],        // 문장의 사실 근거가 된 Triple ID 목록
  "source_chunk_ids": ["fc_8b80b90f296ec2c2b407a1d3"],    // Triple의 근거가 있는 원문 청크 ID 목록
  "metadata": [                                             // 문맥 보강에 실제로 사용한 Metadata
    {
      "field": "domain_location",                         // 사용한 Metadata 필드
      "value": "곡성 공장",                                // 문장에 반영한 값
      "applicable_triple_ids": [                            // 이 값이 보강한 Triple ID
        "kgtr_4404df7b9e441dae2f5f92ef"
      ]
    }
  ],
  "document_expression_rank": 1                            // 문서 안에서 검색표현이 생성된 순서
}
```

`source_chunk_ids`에는 검색표현과 연결된 원문 청크가 기록됩니다. 원문 청크와 연결되지 않은 검색표현은 색인하지 않습니다.

## 원문에서 검색표현까지

```text
원문        이 공정에서는 내부 온도가 급격히 상승하였다.
              ↓ Triple 추출
Triple      (공정, 이상상태, 내부 온도 급상승)
              ↓ + 문서 Metadata
Metadata    공정 = 열분해유 제조 공정 · 장비 = 열분해로
            사고유형 = 화재 · 장소 = 곡성 공장
              ↓ LLM 생성
검색표현    곡성 공장의 열분해유 제조 공정에서 열분해로
            내부 온도가 급격히 상승한 화재 사고
```

원문의 `"이 공정"`처럼 해당 청크만으로 의미가 충분하지 않은 경우, 문서 Metadata를 함께 제공해 검색에 필요한 맥락을 보강합니다. 이를 통해 질의와 원문의 표현이 직접 일치하지 않더라도 관련 원문을 찾을 수 있도록 합니다.

## 동작 방식

1. 문서 지식그래프에서 중요도가 높은 핵심 주제를 선정합니다.
2. 같은 주제를 설명하는 Triple을 묶습니다.
3. Triple과 문서 Metadata를 LLM에 제공해 검색표현을 생성합니다.
4. 생성된 검색표현을 근거가 된 원문 청크와 연결합니다.

Metadata는 검색표현의 문맥을 보강하는 데 사용됩니다. 검색표현 자체는 답변의 사실 근거가 아니며, 검색표현이 검색되면 연결된 원문 청크에 검색 점수가 전달됩니다.

최종 답변의 Citation에는 원문 청크만 사용됩니다([검색 결과 점수 통합](../query/score-integration.md)).

## 환경변수

| profile key | 현재 production 값 | 의미 |
|---|---|---|
| `g2.selector` | `weighted_undirected_`<br />`pagerank` | 지식그래프에서 검색표현 생성에 사용할 핵심 주제를 선정하는 방식 |
| `g2.grouping_policy` | `networkx_salience_`<br />`topic_proximity_`<br />`other_fallback` | 같은 주제를 설명하는 Triple을 어떤 기준으로 묶을지 결정하는 방식 |
| `g2.triple_token_budget` | `6000` | 한 번의 검색표현 생성 요청에 포함할 Triple의 최대 토큰 수 |
| `g2.minimum_distinct_triples_per_expression` | `1` | 검색표현 하나를 생성하기 위해 필요한 최소 Triple 수 |
| `g2.metadata_priority` | 정의 파일<br />기준 | 검색표현의 문맥을 보강할 때 우선적으로 사용할 Metadata의 순서 |

검색표현 생성 방식이나 Triple 묶음 기준을 변경하면 생성 결과가 달라지므로, 검색표현 생성 이후 단계를 다시 처리해야 합니다([파이프라인 실행 및 재처리 방법](rerun.md)).

## 이 단계의 결과 확인

검색표현 생성만 따로 실행하는 공개 명령은 없습니다. [문서 인덱싱 실행과 상태 확인](rerun.md)의 `struct4search-ingest` 명령을 실행하면 KG와 Metadata를 입력으로 자동 수행됩니다. 아래 경로의 `<출력_디렉터리>`와 `<문서_ID>`는 해당 명령에 지정한 값을 뜻합니다.

| 확인 대상 | 확인 위치·방법 | 정상 | 비정상 |
|---|---|---|---|
| 생성 완료 | `<출력_디렉터리>/g2/documents/<문서_ID>/receipt.json` | `status`가 `complete`이고 `expressions_path`가 아래 결과 파일을 가리킵니다. | 완료 기록이 없으면 Triple 묶음 구성, 모델 호출 또는 근거 연결 중에 멈춘 상태입니다. |
| 검색표현 | 같은 디렉터리의 `retrieval_texts_final.jsonl` | 각 문장에 하나 이상의 `triple_ids`와 실제 원문을 가리키는 `source_chunk_ids`가 있습니다. 대상 Triple이 없는 문서는 파일이 비어 있어도 정상입니다. | Triple ID나 원문 청크 ID가 실제 결과와 연결되지 않으면 색인할 수 없습니다. |
| Triple 포함 범위 | `receipt.json`의 `expression_triple_coverage`와 `uncovered_grouped_triples` | 묶어서 생성하기로 한 Triple이 검색표현에 반영되고 누락 수가 기록됩니다. | 묶음에 넣은 Triple이 이유 없이 빠졌다면 모델 응답과 `calls.jsonl`을 확인해야 합니다. |
| 모델 호출 기록 | 같은 디렉터리의 `calls.jsonl` | 요청마다 성공한 응답이 기록됩니다. 요청할 Triple이 없으면 파일이 비어 있어도 정상입니다. | 반복 응답이나 형식 오류로 격리된 요청이 있으면 `receipt.json`의 `quarantined_requests`에서 확인됩니다. |

검색표현이 0건인 것만으로 실패라고 판단하지 않습니다. 먼저 [KG 구축](triple-kg.md)의 Triple이 0건인지 확인합니다. Triple이 있는데 완료 기록이 없다면 `<출력_디렉터리>/documents/<문서_ID>/failure.json`과 같은 디렉터리의 `calls.jsonl`을 함께 확인합니다.

## 코드 참조

| 확인할 내용 | 파일·심볼 |
|---|---|
| 검색표현 생성 | `backend/struct4search/ingest/stages/retrieval_expression/core.py` |
| 중요도와 Triple 묶기 | `backend/struct4search/ingest/stages/retrieval_expression/topology.py` · `weighted_undirected_pagerank` |
| 프롬프트 | `prompts/retrieval_expression/g2-system/v1.txt` · `prompts/retrieval_expression/g2-user/v1.txt` |
| 설정 | `configs/ingest-production.yaml` · `g2` |
