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
    {
      type: 'category',
      label: '핵심 개념',
      collapsed: false,
      items: ['concepts/data-flow', 'concepts/code-map'],
    },
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
        'reference/api-reference',
        'reference/cli',
        'reference/dependencies',
        'reference/opensearch-schema',
        'reference/storage',
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
        'maintenance/models',
        'maintenance/modules',
      ],
    },
    {
      type: 'category',
      label: '테스트와 평가',
      collapsed: false,
      items: [
        'testing/overview',
        'testing/test-levels',
        'testing/retrieval-qa',
        'testing/regression-gates',
        'testing/eval200',
        'testing/metrics',
      ],
    },
  ],
};

export default sidebars;
