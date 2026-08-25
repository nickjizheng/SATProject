import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  text: string;
  className?: string;
}

interface MathToken {
  displayMode: boolean;
  formula: string;
}

const TOKEN_PATTERN = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\r\n]+?\$|\\\([\s\S]+?\\\)|\*[^*\r\n]+?\*)/g;

const parseMathToken = (token: string): MathToken | null => {
  if (token.startsWith('$$') && token.endsWith('$$')) {
    return { displayMode: true, formula: token.slice(2, -2).trim() };
  }
  if (token.startsWith('\\[') && token.endsWith('\\]')) {
    return { displayMode: true, formula: token.slice(2, -2).trim() };
  }
  if (token.startsWith('$') && token.endsWith('$')) {
    return { displayMode: false, formula: token.slice(1, -1).trim() };
  }
  if (token.startsWith('\\(') && token.endsWith('\\)')) {
    return { displayMode: false, formula: token.slice(2, -2).trim() };
  }
  if (token.startsWith('*') && token.endsWith('*')) {
    return { displayMode: false, formula: token.slice(1, -1).trim() };
  }
  return null;
};

/**
 * Renders the small LaTeX dialect used by the question data without ever
 * inserting source text as HTML. Plain text becomes text nodes and KaTeX runs
 * with trust disabled, so imported material cannot inject executable markup.
 */
export default function MathRenderer({ text, className = '' }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const fragment = document.createDocumentFragment();
    let cursor = 0;

    for (const match of text.matchAll(new RegExp(TOKEN_PATTERN.source, 'g'))) {
      const index = match.index ?? cursor;
      if (index > cursor) fragment.append(document.createTextNode(text.slice(cursor, index)));

      const sourceToken = match[0];
      const token = parseMathToken(sourceToken);
      if (!token || !token.formula) {
        fragment.append(document.createTextNode(sourceToken));
      } else {
        const node = document.createElement(token.displayMode ? 'div' : 'span');
        node.className = token.displayMode ? 'math-block' : 'math-inline';
        try {
          katex.render(token.formula, node, {
            displayMode: token.displayMode,
            throwOnError: false,
            strict: false,
            trust: false,
            output: 'htmlAndMathml',
          });
        } catch {
          node.textContent = sourceToken;
        }
        fragment.append(node);
      }
      cursor = index + sourceToken.length;
    }

    if (cursor < text.length) fragment.append(document.createTextNode(text.slice(cursor)));
    container.replaceChildren(fragment);
  }, [text]);

  if (!text) return null;

  return (
    <div
      ref={containerRef}
      className={`math-renderer ${className}`.trim()}
      style={{ lineHeight: '1.6' }}
    />
  );
}
