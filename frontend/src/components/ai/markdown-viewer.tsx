import React from 'react';

interface MarkdownViewerProps {
  content: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (key: number) => {
    if (tableHeaders.length > 0 || tableRows.length > 0) {
      elements.push(
        <div key={`table-${key}`} className="my-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            {tableHeaders.length > 0 && (
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                <tr>
                  {tableHeaders.map((th, i) => (
                    <th key={i} className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-700">
                      {parseInline(th)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 text-slate-600 dark:text-slate-300 text-xs">
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    inTable = false;
    tableHeaders = [];
    tableRows = [];
  };

  const parseInline = (text: string): React.ReactNode => {
    // Process bold **text**, code `code`, and plain text
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-slate-900 dark:text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-xs">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Check if it's separator row like |:---|:---|
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        // separator row, skip
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2 flex items-center gap-1.5">
          {parseInline(trimmed.slice(4))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2">
          {parseInline(trimmed.slice(3))}
        </h3>
      );
      continue;
    }

    // List items
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
      const itemText = trimmed.slice(2);
      elements.push(
        <li key={i} className="text-xs text-slate-700 dark:text-slate-300 ml-4 list-disc leading-relaxed my-0.5">
          {parseInline(itemText)}
        </li>
      );
      continue;
    }

    // Numbered list
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      elements.push(
        <div key={i} className="text-xs text-slate-700 dark:text-slate-300 ml-2 my-0.5 flex items-start gap-1.5">
          <span className="font-semibold text-slate-500">{numberedMatch[1]}.</span>
          <span>{parseInline(numberedMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Empty lines
    if (!trimmed) {
      continue;
    }

    // Paragraph
    elements.push(
      <p key={i} className="text-xs text-slate-700 dark:text-slate-300 my-1 leading-relaxed">
        {parseInline(trimmed)}
      </p>
    );
  }

  if (inTable) {
    flushTable(lines.length);
  }

  return <div className="space-y-1">{elements}</div>;
};
