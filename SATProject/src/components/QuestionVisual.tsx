import { useMemo } from 'react';
import { cn } from '../lib/utils';

const ALLOWED_ELEMENTS = new Set([
  'svg', 'g', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect',
  'text', 'tspan', 'defs', 'lineargradient', 'radialgradient', 'stop', 'clippath',
  'mask', 'pattern', 'marker', 'use', 'title', 'desc',
]);

const ALLOWED_ATTRIBUTES = new Set([
  'xmlns', 'viewbox', 'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points', 'fill', 'fill-opacity', 'stroke',
  'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray',
  'stroke-dashoffset', 'stroke-opacity', 'opacity', 'transform', 'font-family',
  'font-size', 'font-weight', 'text-anchor', 'dominant-baseline', 'dx', 'dy',
  'offset', 'stop-color', 'stop-opacity', 'gradientunits', 'gradienttransform',
  'href', 'xlink:href', 'clip-path', 'mask', 'marker-start', 'marker-mid',
  'marker-end', 'preserveaspectratio', 'role', 'aria-label', 'aria-labelledby',
  'focusable',
]);

const SAFE_FRAGMENT_REFERENCE = /^#[A-Za-z_][\w:.-]*$/;
const SAFE_URL_REFERENCE = /^url\(\s*#[A-Za-z_][\w:.-]*\s*\)$/i;

interface SanitizedVisual {
  markup: string;
  sourceDescription?: string;
}

const sanitizeQuestionSvg = (rawSvg?: string): SanitizedVisual | null => {
  if (!rawSvg || rawSvg === 'null' || typeof DOMParser === 'undefined') return null;

  const document = new DOMParser().parseFromString(rawSvg, 'image/svg+xml');
  if (document.querySelector('parsererror') || document.documentElement.tagName.toLowerCase() !== 'svg') return null;

  for (const node of Array.from(document.querySelectorAll('*'))) {
    if (!ALLOWED_ELEMENTS.has(node.tagName.toLowerCase())) {
      node.remove();
      continue;
    }

    for (const attribute of Array.from(node.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (!ALLOWED_ATTRIBUTES.has(name)) {
        node.removeAttribute(attribute.name);
        continue;
      }
      if ((name === 'href' || name === 'xlink:href') && !SAFE_FRAGMENT_REFERENCE.test(value)) {
        node.removeAttribute(attribute.name);
        continue;
      }
      if (value.toLowerCase().includes('url(') && !SAFE_URL_REFERENCE.test(value)) {
        node.removeAttribute(attribute.name);
      }
    }
  }

  const sourceDescription = [
    document.querySelector('title')?.textContent?.trim(),
    document.querySelector('desc')?.textContent?.trim(),
  ].filter(Boolean).join('. ') || undefined;
  return {
    markup: new XMLSerializer().serializeToString(document.documentElement),
    sourceDescription,
  };
};

interface QuestionVisualProps {
  svg?: string;
  className?: string;
  label?: string;
}

export default function QuestionVisual({ svg, className, label = 'Question visual' }: QuestionVisualProps) {
  const visual = useMemo(() => sanitizeQuestionSvg(svg), [svg]);
  if (!visual) return null;

  return (
    <div
      aria-label={visual.sourceDescription || label}
      role="img"
      className={cn('question-visual overflow-auto rounded-2xl border border-stone-900/10 bg-white p-4 text-center', className)}
      dangerouslySetInnerHTML={{ __html: visual.markup }}
    />
  );
}
