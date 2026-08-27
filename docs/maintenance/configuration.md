---
sidebar_position: 4
title: 설정 수정
---

# 설정 수정

실행 profile을 바꿀 때 확인할 순서입니다. 실행 명령에는 항상 최상위 profile을 전달합니다.

## 실행 프로파일

| 파일 | 역할 |
|---|---|
| `configs/production.yaml` | production 실행 명령에 전달하는 최상위 profile |
| `configs/base.yaml` | 공통 typed profile |
| `configs/ingest-production.yaml` | 인덱싱 정책의 원본 값 |

`production.yaml`은 `base.yaml`을, `base.yaml`은 `ingest-production.yaml`을 상속합니다. 따라서 `ingest-production.yaml`은 직접 실행하지 않습니다. 서비스 정의는 `configs/services/cold-services.yaml`, 기계별 경로는 `configs/machine-paths.yaml`에서 확인합니다.

## 설정 검증

프로파일은 실행 전에 스키마와 계약을 검사합니다.

| 상황 | 결과 |
|---|---|
| 선언되지 않은 키 | 실행 거부 |
| 타입이 맞지 않는 값 | 실행 거부 |
| 허용되지 않은 고정값 | 실행 거부 |
| 프로파일 스키마 버전 불일치 | 실행 거부 |
| 프롬프트 정의 불일치 | 실행 거부 |
| OpenSearch search pipeline 정의 불일치 | 실행 거부 |

잘못된 설정이 그대로 실행되지 않도록 시작 단계에서 확인합니다.

## 계산되는 값

설정 파일에 직접 적지 않고 다른 설정으로부터 계산되는 값도 있습니다.

예를 들어 답변 출력 예산은 Context Window에서 시스템 프롬프트, 질의와 근거가 사용한 토큰을 제외한 범위에서 결정됩니다.

이처럼 코드에서 계산되는 값은 별도의 설정 항목으로 추가하지 않습니다.

## 새 설정 키를 추가할 때

1. 설정 스키마에 새 키와 타입을 정의합니다.
2. 필요한 경우 허용 범위와 기본값을 정합니다.
3. 사용할 프로파일에 값을 추가합니다.
4. 해당 설정을 사용하는 구현과 연결합니다.

설정 스키마에 정의되지 않은 키는 실행 시 거부됩니다.

## 변경 후 확인

설정을 변경한 뒤에는 어떤 단계가 영향을 받는지 먼저 확인합니다.

- 문서 인덱싱 설정을 변경했다면 [변경 영향과 재실행 범위](change-map.md)에서 재처리와 재색인 범위를 확인합니다.
- 검색 후보 수나 Context 관련 값을 변경했다면 [검색과 Context 수정](search-context.md)에서 함께 영향을 받는 값을 확인합니다.
- 검색이나 답변 결과에 영향을 주는 변경은 [테스트와 평가](../testing/overview.md)에서 필요한 평가 범위를 확인합니다.
