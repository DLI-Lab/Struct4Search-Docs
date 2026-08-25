---
sidebar_position: 2
title: 테스트 범위
---

# 테스트 범위

테스트가 무엇을 고정하는지에 따라 세 층으로 나뉩니다. 어떤 테스트를 돌려야 하는지 정할 때 씁니다.

## 세 층

| 층 | 고정하는 것 | 위치 |
|---|---|---|
| 모듈 계약 | 함수와 정책이 계약대로 동작하는지 | `tests/unit/` |
| 서비스 통합 | 단계가 산출물을 주고받는지, 자원과 서비스 설정이 맞는지 | `tests/` 루트 |
| 회귀 | 정책과 계약이 바뀌지 않았는지 | `tests/regression/` |

`tests/unit/`은 다루는 영역별로 나뉩니다 — `query`, `ingest`, `config`, `evaluation`, `adapters`, `core`, `e2e`, `web`.

## 자주 쓰는 실행

```bash
pytest tests/unit/query          # 검색·답변 경로 계약
pytest tests/unit/ingest         # 인덱싱 단계 조립
pytest tests/unit/config         # 프로파일과 프롬프트 고정
pytest tests/test_config_contracts.py   # 설정값 계약
```

## 무엇을 고쳤을 때 무엇을 돌리는가

| 고친 곳 | 돌릴 테스트 |
|---|---|
| 검색·답변 정책 | `tests/unit/query` |
| 인덱싱 단계 | `tests/unit/ingest`와 해당 단계 테스트 |
| 프로파일·프롬프트 | `tests/unit/config` |
| 설정값 | `tests/test_config_contracts.py` |
| 색인 문서·매핑 | 색인 단계 테스트 |

전부 돌려도 모델 없이 짧게 끝나므로, 무엇을 골라야 할지 애매하면 `pytest`를 그냥 돌립니다.

## 테스트가 잡지 못하는 것

테스트는 **같은 입력에 같은 동작**을 고정합니다. 답변이 더 나은지 나쁜지는 판단하지 않습니다. 그 판단은 평가의 몫입니다([검색과 QA 평가 실행](retrieval-qa.md)).
