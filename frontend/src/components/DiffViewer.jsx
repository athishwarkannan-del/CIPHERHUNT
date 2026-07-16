import React from 'react';

const DiffViewer = ({ oldText = '', newText = '', type = 'html' }) => {
  if (!oldText) {
    return (
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 text-center text-cyber-muted font-mono text-sm">
        No baseline data available for comparison. This is the first scan.
      </div>
    );
  }

  // Handle title differences
  if (type === 'title') {
    const isDifferent = oldText !== newText;
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4">
          <p className="text-[10px] uppercase font-mono tracking-wider text-red-400 mb-1">Baseline Title</p>
          <p className="font-mono text-sm font-semibold text-red-200">{oldText}</p>
        </div>
        <div className={`rounded-xl p-4 border ${isDifferent ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-cyber-card border-cyber-border'}`}>
          <p className="text-[10px] uppercase font-mono tracking-wider text-cyber-muted mb-1">Current Scan Title</p>
          <p className={`font-mono text-sm font-semibold ${isDifferent ? 'text-emerald-200 font-bold' : 'text-white'}`}>
            {newText}
          </p>
        </div>
      </div>
    );
  }

  // For HTML, let's compare line-by-line (limit to 300 lines to avoid UI lag)
  const oldLines = oldText.split('\n').slice(0, 300);
  const newLines = newText.split('\n').slice(0, 300);
  const maxLines = Math.max(oldLines.length, newLines.length);

  const diffResult = [];
  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === newLine) {
      diffResult.push({
        type: 'equal',
        oldLine: oldLine || '',
        newLine: newLine || '',
        lineNum: i + 1
      });
    } else {
      diffResult.push({
        type: 'diff',
        oldLine: oldLine || '',
        newLine: newLine || '',
        lineNum: i + 1
      });
    }
  }

  return (
    <div className="flex flex-col border border-cyber-border rounded-xl overflow-hidden bg-cyber-card">
      <div className="bg-cyber-border/30 px-4 py-3 border-b border-cyber-border flex justify-between items-center">
        <span className="text-xs font-mono uppercase tracking-wider text-cyber-muted">HTML Comparison (First 300 Lines)</span>
        <div className="flex gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="w-2.5 h-2.5 bg-red-950/40 border border-red-500/40 rounded-sm"></span>
            Removed / Baseline
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-sm"></span>
            Added / Current
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-cyber-border h-[400px] overflow-auto text-xs font-mono">
        {/* Left Side: Baseline HTML */}
        <div className="bg-[#05060a] p-4 overflow-x-auto select-text">
          {diffResult.map((row, idx) => (
            <div
              key={`old-${idx}`}
              className={`flex gap-3 leading-6 min-w-max px-2 ${
                row.type === 'diff' ? 'bg-red-950/30 text-red-300 border-l-2 border-red-500' : 'text-cyber-muted/70'
              }`}
            >
              <span className="w-6 select-none opacity-30 text-right">{row.lineNum}</span>
              <pre className="whitespace-pre">{row.oldLine}</pre>
            </div>
          ))}
        </div>

        {/* Right Side: Current HTML */}
        <div className="bg-[#05060a] p-4 overflow-x-auto select-text">
          {diffResult.map((row, idx) => (
            <div
              key={`new-${idx}`}
              className={`flex gap-3 leading-6 min-w-max px-2 ${
                row.type === 'diff' ? 'bg-emerald-950/30 text-emerald-300 border-l-2 border-emerald-500 font-medium' : 'text-cyber-text'
              }`}
            >
              <span className="w-6 select-none opacity-30 text-right">{row.lineNum}</span>
              <pre className="whitespace-pre">{row.newLine}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;
