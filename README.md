# Struct4Search documentation

Struct4Search의 공개 Docusaurus 문서 사이트입니다.

- Site: https://dli-lab.github.io/Struct4Search-Docs/docs/overview
- Repository: https://github.com/DLI-Lab/Struct4Search-Docs

## 로컬 실행

Node.js 20 이상이 필요합니다.

```bash
npm ci
npm run start
```

정적 결과 검증은 다음 명령으로 실행합니다.

```bash
npm run verify
```

## 문서 구조

```text
docs/
├── overview.md
├── quickstart.md
├── concepts/
├── indexing/
├── query/
├── reference/
├── maintenance/
└── testing/
```

사이드바 순서는 `sidebars.ts`에서 관리합니다.

## 배포

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 문서를 검증하고 GitHub Pages에 배포합니다. 저장소의 **Settings → Pages → Source**는 `GitHub Actions`로 설정해야 합니다.
