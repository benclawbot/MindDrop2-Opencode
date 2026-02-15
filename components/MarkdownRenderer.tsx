
import React from 'react';
import { CheckIcon } from './Icons';

interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isUser = false, className = "" }) => {
  if (!content) return null;

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className={`font-bold ${isUser ? 'text-white' : 'text-stone-900 dark:text-white'}`}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderTable = (rows: string[], key: string) => {
    const contentRows = rows.filter(r => !r.trim().match(/^\|?\s*[-:]+[-|\s:]*\|?$/));
    if (contentRows.length === 0) return null;

    const parseRow = (r: string) => r.split('|').map(c => c.trim()).filter((c, i, arr) => !(i === 0 && c === '') && !(i === arr.length - 1 && c === ''));
    const firstRow = contentRows[0];
    if (!firstRow) return null;
    const headers = parseRow(firstRow);
    const bodyRows = contentRows.slice(1).map(parseRow);

    return (
      <div key={key} className="my-4 overflow-x-auto rounded-xl border border-stone-200 dark:border-white/10 shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-stone-50 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300 font-semibold uppercase text-xs">
            <tr>{headers.map((h, i) => <th key={i} className="px-4 py-2 border-b border-stone-200 dark:border-white/10">{parseInline(h)}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-white/5 bg-white dark:bg-transparent">
            {bodyRows.map((row, rI) => (
              <tr key={rI}>{row.map((cell, cI) => <td key={cI} className="px-4 py-2 text-stone-600 dark:text-stone-400 whitespace-pre-wrap">{parseInline(cell)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Code Blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        nodes.push(<pre key={`code-${i}`} className="my-3 p-4 bg-stone-900 text-stone-100 rounded-xl overflow-x-auto text-xs font-mono shadow-sm"><code>{codeBlockContent.join('\n')}</code></pre>);
        codeBlockContent = []; inCodeBlock = false;
      } else { inCodeBlock = true; }
      return;
    }
    if (inCodeBlock) { codeBlockContent.push(line); return; }

    // Tables
    if (trimmed.startsWith('|')) {
      if (!inTable) inTable = true;
      tableRows.push(trimmed);
      return;
    } else if (inTable) {
      nodes.push(renderTable(tableRows, `table-${i}`));
      tableRows = []; inTable = false;
    }

    // Headers
    const hMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
    if (hMatch && hMatch[1] && hMatch[2]) {
      const level = hMatch[1].length;
      const hClasses = [
        "text-2xl font-extrabold mt-6 mb-3 border-b border-stone-100 dark:border-white/5 pb-2",
        "text-xl font-bold mt-5 mb-2",
        "text-lg font-bold mt-4 mb-1 uppercase tracking-wide opacity-80",
      ];
      nodes.push(React.createElement(`h${level}`, { key: i, className: `${hClasses[level - 1] || "font-bold text-base"} ${isUser ? 'text-white' : 'text-stone-900 dark:text-white'}` }, parseInline(hMatch[2])));
      return;
    }

    // Lists & Checklists
    const checklistMatch = trimmed.match(/^[-*]\s+\[([ x])\]\s+(.*)/);
    if (checklistMatch && checklistMatch[1] && checklistMatch[2]) {
      const isChecked = checklistMatch[1].toLowerCase() === 'x';
      nodes.push(
        <div key={i} className="flex items-start gap-3 my-2 pl-1">
          <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-stone-300 dark:border-white/20 bg-transparent'}`}>
            {isChecked && <CheckIcon className="w-3 h-3 stroke-[3px]" />}
          </div>
          <span className={`text-sm ${isChecked ? 'text-stone-400 line-through' : ''}`}>{parseInline(checklistMatch[2])}</span>
        </div>
      );
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      nodes.push(<div key={i} className="flex items-start gap-3 my-1.5 pl-3"><div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${isUser ? 'bg-white/60' : 'bg-indigo-500/50'}`} /><span className="text-sm leading-relaxed">{parseInline(trimmed.slice(2))}</span></div>);
      return;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch && numMatch[1] && numMatch[2]) {
      nodes.push(<div key={i} className="flex items-start gap-3 my-1.5"><span className="text-sm font-bold opacity-30 min-w-[1.2rem]">{numMatch[1]}.</span><span className="text-sm leading-relaxed">{parseInline(numMatch[2])}</span></div>);
      return;
    }

    if (!trimmed) { nodes.push(<div key={i} className="h-3" />); return; }
    nodes.push(<p key={i} className="mb-2 text-sm leading-relaxed opacity-90">{parseInline(trimmed)}</p>);
  });

  if (inTable) nodes.push(renderTable(tableRows, 'table-end'));
  if (inCodeBlock) nodes.push(<pre key="code-end" className="my-3 p-4 bg-stone-900 text-stone-100 rounded-xl overflow-x-auto text-xs font-mono"><code>{codeBlockContent.join('\n')}</code></pre>);

  return <div className={`prose dark:prose-invert max-w-none ${className}`}>{nodes}</div>;
};
