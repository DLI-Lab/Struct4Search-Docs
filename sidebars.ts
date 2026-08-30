import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Struct4Search 인수인계 문서의 정보 구조.
 *
 * 대목차 8개와 순서를 이 파일이 단독으로 고정한다. 새 문서는 자동 노출되지
 * 않으므로 소유 대목차를 정한 뒤 이 목록에도 넣는다.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'overview',
    'quickstart',
    'concepts/code-map',
    {
      type: 'category',
      label: '문서 인덱싱 파이프라인',
      collapsed: false,
      items: [
        'indexing/overview',
        'indexing/parsing',
        'indexing/chunking',
        'indexing/ner',
        'indexing/metadata',
        'indexing/triple-kg',
        'indexing/retrieval-text',
        'indexing/opensearch',
        'indexing/rerun',
      ],
    },
    {
      type: 'category',
      label: '검색·답변 파이프라인',
      collapsed: false,
      items: [
        'query/overview',
        'query/request',
        'query/hybrid-search',
        'query/rrf',
        'query/score-integration',
        'query/context',
        'query/structured-answer',
        'query/citations',
      ],
    },
    {
      type: 'category',
      label: '레퍼런스',
      collapsed: false,
      items: [
        'reference/dependencies',
        'reference/cli',
        'reference/api-reference',
        'reference/storage',
        'reference/opensearch-schema',
        'reference/model-calls',
        'reference/prompts',
        'reference/glossary',
      ],
    },
    {
      type: 'category',
      label: '유지보수',
      collapsed: false,
      items: [
        'maintenance/change-map',
        'maintenance/configuration',
        'maintenance/modules',
      ],
    },
    {
      type: 'category',
      label: '테스트와 평가',
      collapsed: false,
      items: [
        'testing/overview',
        'testing/eval200',
        'testing/retrieval-qa',
      ],
    },
  ],
};

export default sidebars;
