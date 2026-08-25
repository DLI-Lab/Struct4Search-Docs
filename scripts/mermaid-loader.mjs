import {pathToFileURL} from 'node:url';

const STUB = pathToFileURL(process.env.MERMAID_DOMPURIFY_STUB).href;

export function resolve(specifier, context, next) {
  if (specifier === 'dompurify' || specifier.endsWith('/dompurify')) {
    return {url: STUB, shortCircuit: true};
  }
  return next(specifier, context);
}
