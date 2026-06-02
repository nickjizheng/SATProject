import React, { useEffect, useRef } from 'react';

interface MathRendererProps {
  text: string;
  className?: string;
}

/**
 * 数学公式渲染组件
 * 支持LaTeX格式的数学公式渲染
 */
const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !text) return;

    // 加载KaTeX CSS（如果尚未加载）
    if (!document.querySelector('link[href*="katex"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
      document.head.appendChild(link);
    }

    // 加载KaTeX JS（如果尚未加载）
    if (!(window as any).katex) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';
      script.onload = () => {
        renderMath();
      };
      document.head.appendChild(script);
    } else {
      renderMath();
    }

    function renderMath() {
      if (!containerRef.current) return;

      const container = containerRef.current;
      
      // 匹配各种LaTeX格式
      const patterns = [
        // 块级公式：$$...$$
        { regex: /\$\$([^$]+)\$\$/g, displayMode: true },
        // 块级公式：\[...\]
        { regex: /\\\[([^\]]+)\\\]/g, displayMode: true },
        // 内联公式：$...$
        { regex: /\$([^$]+)\$/g, displayMode: false },
        // 内联公式：\(...\)
        { regex: /\\\(([^)]+)\\\)/g, displayMode: false }
      ];

      // 处理 *...* 格式的数学变量和函数
      const mathVariableRegex = /\*([^*]+)\*/g;

      let result = text;

      // 按顺序处理各种格式
      patterns.forEach(({ regex, displayMode }) => {
        result = result.replace(regex, (_, formula) => {
          try {
            if ((window as any).katex) {
              const rendered = (window as any).katex.renderToString(formula.trim(), {
                displayMode,
                throwOnError: false,
                strict: false
              });
              
              if (displayMode) {
                return `<div class="math-block" style="text-align: center; margin: 16px 0;">${rendered}</div>`;
              } else {
                return `<span class="math-inline">${rendered}</span>`;
              }
            }
            
            // 降级处理：如果KaTeX未加载，显示原始公式
            if (displayMode) {
              return `<div class="math-block" style="background: #f5f5f5; padding: 8px; border-radius: 4px; font-family: monospace; text-align: center; margin: 16px 0;">$$${formula.trim()}$$</div>`;
            } else {
              return `<span class="math-inline" style="background: #f0f0f0; padding: 2px 4px; border-radius: 2px; font-family: monospace;">$${formula.trim()}$</span>`;
            }
          } catch (error) {
            console.warn('LaTeX渲染错误:', error, '公式:', formula);
            if (displayMode) {
              return `<div class="math-block" style="background: #fff2f0; padding: 8px; border-radius: 4px; font-family: monospace; border: 1px solid #ffccc7; text-align: center; margin: 16px 0;">$$${formula.trim()}$$</div>`;
            } else {
              return `<span class="math-inline" style="background: #fff2f0; padding: 2px 4px; border-radius: 2px; font-family: monospace; border: 1px solid #ffccc7;">$${formula.trim()}$</span>`;
            }
          }
        });
      });

      // 处理 *...* 格式的数学变量和函数
      result = result.replace(mathVariableRegex, (_, variable) => {
        try {
          if ((window as any).katex) {
            // 将变量转换为LaTeX格式并渲染
            const latexVariable = variable.trim();
            const rendered = (window as any).katex.renderToString(latexVariable, {
              displayMode: false,
              throwOnError: false,
              strict: false
            });
            return `<span class="math-inline">${rendered}</span>`;
          }
          
          // 降级处理：如果KaTeX未加载，显示为斜体
          return `<em style="font-style: italic; color: #1890ff;">${variable.trim()}</em>`;
        } catch (error) {
          console.warn('数学变量渲染错误:', error, '变量:', variable);
          return `<em style="font-style: italic; color: #1890ff;">${variable.trim()}</em>`;
        }
      });

      container.innerHTML = result;
    }
  }, [text]);

  if (!text) return null;

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{
        lineHeight: '1.6'
      }}
    />
  );
};

export default MathRenderer;
