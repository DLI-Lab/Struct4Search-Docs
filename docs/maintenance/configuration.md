---
sidebar_position: 2
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
| profile의 OpenSearch search pipeline ID나 template hash 불일치 | 검색 조립 거부 |
| OpenSearch에 설치된 search pipeline의 누락·변경 | 첫 검색 직전에 거부 |

잘못된 설정이 그대로 실행되지 않도록 시작 단계에서 확인합니다.

수정한 최상위 profile이 외부 서비스를 시작하기 전에 정상적으로 조립되는지 확인합니다.

```bash
python - <<'PY'
from pathlib import Path
from struct4search.config.profiles import load_resolved_profile

profile = load_resolved_profile(Path("configs/production.yaml"))
print(profile.profile_id, profile.snapshot.sha256)
PY
python -m pytest -q tests/unit/config
```

새 실행 profile을 만들 때는 `production.yaml`을 복사해 값을 중복하지 않고 `extends: production.yaml`로 상속한 뒤 바꿀 값만 적습니다. 상속받지 않은 필수 설정이 빠지면 조립 단계에서 실행이 거부됩니다.

## 계산되는 값

설정 파일에 직접 적지 않고 다른 설정으로부터 계산되는 값도 있습니다.

예를 들어 답변 출력 예산은 Context Window에서 채팅 template이 적용된 전체 프롬프트의 토큰 수와 `generation_boundary_tokens`를 뺀 값입니다. 전체 프롬프트에는 시스템 프롬프트, 질의와 근거가 포함됩니다.

계산 결과인 `max_output_tokens`는 직접 설정하지 않습니다. 출력 예산을 바꾸려면 profile의 `context_window_tokens`, `generation_boundary_tokens`, `output_token_policy`를 확인합니다.

## 새 설정 키를 추가할 때

1. 설정 스키마에 새 키와 타입을 정의합니다.
2. 필요한 경우 허용 범위와 기본값을 정합니다.
3. 사용할 프로파일에 값을 추가합니다.
4. 해당 설정을 사용하는 구현과 연결합니다.

설정 스키마에 정의되지 않은 키는 실행 시 거부됩니다.

## 변경 후 확인

설정을 변경한 뒤에는 어떤 단계가 영향을 받는지 먼저 확인합니다.

- 문서 인덱싱 설정을 변경했다면 [변경 영향과 재실행 범위](change-map.md)에서 재처리와 재색인 범위를 확인합니다.
- 검색 후보 수나 Context 관련 값을 변경했다면 [검색·답변 파이프라인](../query/overview.md)에서 앞뒤 단계와의 관계를 확인합니다.
- 검색이나 답변 결과에 영향을 주는 변경은 [테스트와 평가](../testing/overview.md)에서 필요한 평가 범위를 확인합니다.
