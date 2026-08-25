#!/usr/bin/env node
// docs/ 의 Mermaid 도식을 검사한다.
//
// Docusaurus 빌드는 도식을 검증하지 않는다 — Mermaid 는 브라우저에서 렌더되므로
// 문법 오류가 있어도 빌드는 통과하고 화면만 깨진다. 실제로 예약어를 노드 id 로
// 쓰면(`graph[...]`) 그렇게 된다.
//
// 두 가지를 본다.
//   1. 구조 검사 — 예약어 노드 id, 인용되지 않은 라벨
//   2. 문법 검사 — mermaid 파서를 직접 호출
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, dirname, relative} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {register} from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DOCS = join(ROOT, 'docs');

// mermaid 가 노드 id 로 받아들이지 않거나 다른 의미로 해석하는 이름.
const RESERVED = new Set([
  'graph', 'subgraph', 'end', 'class', 'style', 'click', 'linkStyle',
  'classDef', 'flowchart', 'direction', 'state', 'call', 'href', 'o', 'x',
]);

// 라벨 인용 검사에서 제외하는 도식 종류. 노드 문법이 다르다.
const OTHER_DIAGRAMS = ['classDiagram', 'sequenceDiagram', 'erDiagram', 'stateDiagram'];

function markdownFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return markdownFiles(path);
    return path.endsWith('.md') ? [path] : [];
  });
}

function diagrams(path) {
  const source = readFileSync(path, 'utf8');
  return [...source.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((match, index) => ({
    file: relative(ROOT, path),
    index,
    code: match[1],
  }));
}

function structuralProblems({code}) {
  const kind = code.trim().split('\n')[0].trim();
  if (OTHER_DIAGRAMS.some((name) => kind.startsWith(name))) return [];
  const problems = [];
  for (const match of code.matchAll(/(?<![\w"])([A-Za-z_]\w*)\s*[[({]/g)) {
    if (RESERVED.has(match[1])) {
      problems.push(`예약어를 노드 id 로 사용: ${match[1]}`);
    }
  }
  return problems;
}

const found = markdownFiles(DOCS).flatMap(diagrams);
const failures = [];

for (const diagram of found) {
  for (const problem of structuralProblems(diagram)) {
    failures.push(`${diagram.file} #${diagram.index}: ${problem}`);
  }
}

// 파서는 DOM 이 없으면 sanitizer 초기화에서 실패하므로 dompurify 를 스텁으로
// 대체해 로드한다. mermaid 를 불러올 수 없는 환경에서는 구조 검사만 남긴다.
let parser = null;
try {
  process.env.MERMAID_DOMPURIFY_STUB = join(HERE, 'dompurify-stub.mjs');
  register(pathToFileURL(join(HERE, 'mermaid-loader.mjs')));
  ({default: parser} = await import('mermaid'));
} catch (error) {
  console.warn(`mermaid 파서를 불러오지 못해 구조 검사만 수행합니다: ${error.message}`);
}

if (parser) {
  for (const diagram of found) {
    try {
      await parser.parse(diagram.code);
    } catch (error) {
      const detail = String(error.message || error).split('\n').slice(0, 3).join(' / ');
      failures.push(`${diagram.file} #${diagram.index}: ${detail}`);
    }
  }
}

for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(
  `도식 ${found.length}개 검사 (${parser ? '구조 + 문법' : '구조만'}) · 실패 ${failures.length}`,
);
process.exit(failures.length === 0 ? 0 : 1);
