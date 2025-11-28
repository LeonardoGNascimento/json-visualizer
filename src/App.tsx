import { useState, useEffect } from 'react';
import { JsonNode } from './components/JsonNode';
import { Code2, AlertCircle, Copy, Trash2, Wand2 } from 'lucide-react';
import JSON5 from 'json5';

function App() {
  const [input, setInput] = useState('');
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!input.trim()) {
      setParsedJson(null);
      setError(null);
      return;
    }

    try {
      const parsed = JSON5.parse(input);
      setParsedJson(parsed);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setParsedJson(null);
    }
  }, [input]);

  const handleFormat = () => {
    if (parsedJson) {
      setInput(JSON.stringify(parsedJson, null, 2));
    }
  };

  const handleClear = () => {
    setInput('');
    setParsedJson(null);
    setError(null);
  };

  const handleCopy = () => {
    if (input) {
      navigator.clipboard.writeText(input);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">JSON & JS Object Visualizer</h1>
        <p className="subtitle">Beautiful, interactive viewer for JSON and JavaScript objects</p>
      </header>

      <main className="main-content">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Code2 size={20} className="text-primary" />
              <span>Input</span>
            </div>
            <div className="actions" style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn" onClick={handleFormat} title="Format">
                <Wand2 size={16} />
                Format
              </button>
              <button className="btn" onClick={handleCopy} title="Copy">
                <Copy size={16} />
              </button>
              <button className="btn" onClick={handleClear} title="Clear">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="editor-container">
            <textarea
              className="json-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your JSON or JS object here..."
              spellCheck={false}
            />
          </div>
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>Invalid Input: {error}</span>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Code2 size={20} className="text-accent" style={{ color: 'var(--accent-color)' }} />
              <span>Visualizer</span>
            </div>
          </div>
          <div className="viewer-container">
            {parsedJson ? (
              <div style={{ padding: '1rem' }}>
                <JsonNode value={parsedJson} />
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%', 
                color: '#64748b' 
              }}>
                <Code2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>Waiting for valid JSON...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
