// mermaid 의 sanitizer 는 DOM 을 요구한다. 이 검사는 문법만 보므로 DOM 없이
// 동작하도록 sanitize 를 항등으로 두고 훅 API 만 채운다.
export default {
  sanitize: (value) => value,
  addHook: () => {},
  removeHook: () => {},
  removeAllHooks: () => {},
  setConfig: () => {},
  isSupported: true,
  version: '0.0.0-stub',
};
