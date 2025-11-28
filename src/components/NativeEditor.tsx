import { useRef, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Replace,
  ChevronDown,
  ChevronUp,
  Check,
  Baseline,
  Highlighter,
  Ban,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  IndentDecrease,
  IndentIncrease,
  Minus,
  ArrowUpDown
} from "lucide-react";

const COLOR_PALETTE = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff",
  "#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
  "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc",
  "#dd7e6b", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#9fc5e8", "#b4a7d6", "#d5a6bd",
  "#cc4125", "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#3c78d8", "#3d85c6", "#674ea7", "#a64d79",
  "#85200c", "#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#1155cc", "#0b5394", "#351c75", "#741b47",
  "#5b0f00", "#660000", "#783f04", "#7f6000", "#274e13", "#0c343d", "#1c4587", "#073763", "#20124d", "#4c1130"
];

export const NativeEditor = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [currentFont, setCurrentFont] = useState("Arial");
  const [currentSize, setCurrentSize] = useState("3");
  const [currentBlock, setCurrentBlock] = useState("P");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [textColor, setTextColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState("#ffff00");
  const [currentHiliteColor, setCurrentHiliteColor] = useState("transparent");
  const [recentColors, setRecentColors] = useState<string[]>([]);
  
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matchCount, setMatchCount] = useState({ current: 0, total: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.custom-dropdown')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
      // Preferir spans/styles ao invés de tags antigas
      document.execCommand('styleWithCSS', false, 'true');
    }
  }, []);

  const savedSelection = useRef<Range | null>(null);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        savedSelection.current = range.cloneRange();
      }
    }
  };

  const restoreSelection = () => {
    if (savedSelection.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection.current);
      }
    }
  };

  const addToRecent = (color: string) => {
    setRecentColors(prev => {
      const newColors = [color, ...prev.filter(c => c !== color)].slice(0, 10);
      return newColors;
    });
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
  };

  const areColorsEqual = (color1: string, color2: string) => {
    const normalize = (c: string) => {
      if (!c) return '';
      if (c.startsWith('#')) {
        const rgb = hexToRgb(c);
        return rgb ? rgb.replace(/\s/g, '') : c;
      }
      return c.replace(/\s/g, '').replace(/rgba\((\d+),(\d+),(\d+),1\)/, 'rgb($1,$2,$3)');
    };
    return normalize(color1) === normalize(color2);
  };

  const applyLineHeight = (value: string) => {
    restoreSelection();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer.parentElement;
      const block = element?.closest('p, h1, h2, h3, h4, h5, h6, div, li, blockquote, pre');
      if (block) {
        (block as HTMLElement).style.lineHeight = value;
      }
    }
  };

  const checkFormats = () => {
    saveSelection();

    const formats: Record<string, boolean> = {
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
      justifyFull: document.queryCommandState("justifyFull"),
    };

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const parent = selection.getRangeAt(0).commonAncestorContainer.parentElement;
      if (parent) {
        const nodeName = parent.nodeName;
        formats["BLOCKQUOTE"] = nodeName === "BLOCKQUOTE";
        formats["PRE"] = nodeName === "PRE";
      }
    }

    setActiveFormats(formats);

    // Font
    const fontName = document.queryCommandValue("fontName");
    if (fontName) setCurrentFont(fontName.replace(/['"]/g, ""));
    const fontSize = document.queryCommandValue("fontSize");
    if (fontSize) setCurrentSize(fontSize);

    // highlight
    let hColor = document.queryCommandValue("hiliteColor");
    if (!hColor || hColor === "transparent" || hColor === "rgba(0, 0, 0, 0)") {
      hColor = document.queryCommandValue("backColor");
    }
    setCurrentHiliteColor(hColor || "transparent");

    if (fontSize === "6") setCurrentBlock("H1");
    else if (fontSize === "5") setCurrentBlock("H2");
    else if (fontSize === "4") setCurrentBlock("H3");
    else setCurrentBlock("P");
  };

  // encontra ancestor com background visível (possível highlight)
  const findHighlightAncestor = (node: Node | null) => {
    let el = node && node.nodeType === 3 ? node.parentElement : (node as Element | null);
    while (el && el !== editorRef.current && el.nodeType === 1) {
      const comp = window.getComputedStyle(el as Element);
      const bg = comp.backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return el as HTMLElement;
      }
      el = el.parentElement;
    }
    return null;
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    const selection = window.getSelection();
    const isSelectionInEditor = selection && selection.rangeCount > 0 &&
      editorRef.current && editorRef.current.contains(selection.getRangeAt(0).commonAncestorContainer);

    if (!isSelectionInEditor) {
      restoreSelection();
    }

    if (command === "foreColor" || command === "hiliteColor") {
      document.execCommand('styleWithCSS', false, 'true');
    }

    if (command === "foreColor" || command === "hiliteColor") {
      let currentColor = document.queryCommandValue(command);
      if (command === "hiliteColor" && (!currentColor || currentColor === "transparent" || currentColor === "rgba(0, 0, 0, 0)")) {
        currentColor = document.queryCommandValue("backColor");
      }

      const targetRgb = value ? hexToRgb(value) : null;
      const normalizeColor = (color: string) => {
        if (!color) return '';
        return color.replace(/\s/g, '').replace(/rgba\((\d+),(\d+),(\d+),1\)/, 'rgb($1,$2,$3)');
      };

      const current = normalizeColor(currentColor);
      const target = targetRgb ? normalizeColor(targetRgb) : '';
      const isTransparent = current === 'rgba(0,0,0,0)' || current === 'transparent';

      // determinamos se a ação será uma limpeza (desativar highlight)
      let clearing = false;
      if (value === 'transparent') {
        clearing = true;
      } else if (command === "hiliteColor" && current === target && !isTransparent) {
        // usuário clicou na mesma cor -> toggling off (internamente usaremos 'transparent')
        clearing = true;
      }

      // execute comando (se for toggling off, passamos 'transparent' para garantir remoção)
      if (clearing && command === "hiliteColor") {
        document.execCommand(command, false, "transparent");
      } else {
        document.execCommand(command, false, value);
      }

      // ---- apenas se realmente desativamos o highlight: limpamos o pending highlight ----
      if (command === 'hiliteColor' && clearing) {
        const selAfter = window.getSelection();
        if (selAfter && selAfter.rangeCount > 0 && selAfter.getRangeAt(0).collapsed) {
          const range = selAfter.getRangeAt(0);
          const caretNode = range.startContainer;

          const highlightAncestor = findHighlightAncestor(caretNode);
          if (highlightAncestor) {
            // inserir marcador ZWS fora do elemento marcado, logo após o ancestor
            const zws = document.createTextNode('\u200B');
            if (highlightAncestor.parentNode) {
              highlightAncestor.parentNode.insertBefore(zws, highlightAncestor.nextSibling);
              const newRange = document.createRange();
              newRange.setStartAfter(zws);
              newRange.collapse(true);
              selAfter.removeAllRanges();
              selAfter.addRange(newRange);

              // limpa formatos pendentes
              document.execCommand('removeFormat');

              // remove marcador
              zws.parentNode?.removeChild(zws);

              // restaurar caret
              try {
                const finalRange = document.createRange();
                const curSel = window.getSelection();
                if (curSel && curSel.rangeCount > 0) {
                  const currentRange = curSel.getRangeAt(0);
                  finalRange.setStart(currentRange.startContainer, currentRange.startOffset);
                } else {
                  finalRange.setStartAfter(highlightAncestor);
                }
                finalRange.collapse(true);
                selAfter.removeAllRanges();
                selAfter.addRange(finalRange);
              } catch (e) {
                editorRef.current?.focus();
              }
            }
          } else {
            // técnica padrão: inserir zws no caret, removeFormat, remover zws
            const zws = document.createTextNode('\u200B');
            range.insertNode(zws);
            const newRange = document.createRange();
            newRange.setStartAfter(zws);
            newRange.collapse(true);
            selAfter.removeAllRanges();
            selAfter.addRange(newRange);

            document.execCommand('removeFormat');

            zws.parentNode?.removeChild(zws);

            try {
              const finalRange = document.createRange();
              const curSel = window.getSelection();
              if (curSel && curSel.rangeCount > 0) {
                const currentRange = curSel.getRangeAt(0);
                finalRange.setStart(currentRange.startContainer, currentRange.startOffset);
              }
              finalRange.collapse(true);
              selAfter.removeAllRanges();
              selAfter.addRange(finalRange);
            } catch (e) {
              editorRef.current?.focus();
            }
          }
        }
      }
      // ---- fim limpeza ----
    } else {
      if (command !== "foreColor" && command !== "hiliteColor") {
         document.execCommand('styleWithCSS', false, 'false');
      }
      document.execCommand(command, false, value);
    }

    setTimeout(checkFormats, 0);
  };

  const handleBlockChange = (value: string) => {
    if (value === "H1") execCommand("fontSize", "6");
    else if (value === "H2") execCommand("fontSize", "5");
    else if (value === "H3") execCommand("fontSize", "4");
    else if (value === "P") execCommand("fontSize", "3");
    else execCommand("formatBlock", value);
    setCurrentBlock(value);
  };

  const handleFontChange = (value: string) => {
    execCommand("fontName", value);
    setCurrentFont(value);
  };

  const handleSizeChange = (value: string) => {
    execCommand("fontSize", value);
    setCurrentSize(value);
  };

  // Find and Replace (mantive igual)
  const clearHighlights = () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    const cleaned = content.replace(/<span class="find-highlight(?:-active)?">([^<]*)<\/span>/g, '$1');
    if (cleaned !== content) {
      editorRef.current.innerHTML = cleaned;
    }
  };

  const performSearch = () => {
    if (!editorRef.current || !searchText) {
      clearHighlights();
      setMatchCount({ current: 0, total: 0 });
      return;
    }

    clearHighlights();
    
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, flags);
    
    const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT, null);
    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    let total = 0;
    for (let i = textNodes.length - 1; i >= 0; i--) {
      const textNode = textNodes[i];
      const text = textNode.nodeValue || "";
      let match;
      const matches = [];
      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        matches.push({ index: match.index, length: match[0].length, text: match[0] });
      }

      for (let j = matches.length - 1; j >= 0; j--) {
        const m = matches[j];
        const range = document.createRange();
        range.setStart(textNode, m.index);
        range.setEnd(textNode, m.index + m.length);
        
        const span = document.createElement('span');
        span.className = 'find-highlight';
        span.textContent = m.text;
        
        range.deleteContents();
        range.insertNode(span);
        total++;
      }
    }

    setMatchCount({ current: total > 0 ? 1 : 0, total });
    if (total > 0) {
      highlightCurrent(0);
    }
  };

  const highlightCurrent = (index: number) => {
    const highlights = editorRef.current?.querySelectorAll('.find-highlight');
    if (!highlights) return;
    highlights.forEach(el => el.classList.remove('find-highlight-active'));
    if (highlights[index]) {
      highlights[index].classList.add('find-highlight-active');
      highlights[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
      setMatchCount(prev => ({ ...prev, current: index + 1 }));
    }
  };

  const nextMatch = () => {
    if (matchCount.total === 0) return;
    const next = matchCount.current >= matchCount.total ? 0 : matchCount.current;
    highlightCurrent(next);
  };

  const prevMatch = () => {
    if (matchCount.total === 0) return;
    const prev = matchCount.current <= 1 ? matchCount.total - 1 : matchCount.current - 2;
    highlightCurrent(prev);
  };

  const replaceCurrent = () => {
    const active = editorRef.current?.querySelector('.find-highlight-active');
    if (active) {
      const textNode = document.createTextNode(replaceText);
      active.parentNode?.replaceChild(textNode, active);
      performSearch();
    }
  };

  const replaceAll = () => {
    if (!editorRef.current || !searchText) return;
    const highlights = editorRef.current.querySelectorAll('.find-highlight, .find-highlight-active');
    highlights.forEach(span => {
      const textNode = document.createTextNode(replaceText);
      span.parentNode?.replaceChild(textNode, span);
    });
    setMatchCount({ current: 0, total: 0 });
  };

  useEffect(() => {
    if (showFindReplace) performSearch();
    else clearHighlights();
  }, [showFindReplace, searchText, caseSensitive]);

  const isActive = (command: string) =>
    activeFormats[command] ? "active" : "";

  return (
    <div
      className="native-editor-container"
      style={{
        border: "1px solid var(--border-color)",
        borderRadius: "0.5rem",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--bg-secondary)",
        position: 'relative'
      }}
    >
      <div
        className="toolbar"
        style={{
          padding: "0.5rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          alignItems: "center",
          backgroundColor: "var(--bg-primary)",
        }}
      >
        <button className="toolbar-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand("undo")} title="Undo">
          <Undo2 size={18} />
        </button>
        <button className="toolbar-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand("redo")} title="Redo">
          <Redo2 size={18} />
        </button>

        <div className="divider" style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }} />

        {/* Font Family Dropdown */}
        <div className="custom-dropdown" style={{ position: 'relative' }}>
          <button
            className="toolbar-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (openDropdown !== 'font') saveSelection();
              setOpenDropdown(openDropdown === 'font' ? null : 'font');
            }}
            title="Font Family"
            style={{ gap: '0.5rem', minWidth: '100px', justifyContent: 'space-between' }}
          >
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>
              {currentFont}
            </span>
            <ChevronDown size={14} />
          </button>
          {openDropdown === 'font' && (
            <div className="dropdown-menu" style={{ width: '200px', maxHeight: '300px' }}>
              {["Arial", "Arial Black", "Comic Sans MS", "Courier New", "Georgia", "Impact", "Lucida Console", "Tahoma", "Times New Roman", "Verdana", "Inter", "serif", "monospace", "cursive"].map((font) => (
                <div
                  key={font}
                  className={`dropdown-item ${currentFont === font ? 'selected' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    handleFontChange(font);
                    setOpenDropdown(null);
                  }}
                  style={{ fontFamily: font }}
                >
                  {currentFont === font && <Check size={14} style={{ position: 'absolute', left: '0.5rem' }} />}
                  <span style={{ marginLeft: '1.5rem' }}>{font}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Heading Dropdown */}
        <div className="custom-dropdown" style={{ position: 'relative' }}>
          <button
            className="toolbar-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (openDropdown !== 'heading') saveSelection();
              setOpenDropdown(openDropdown === 'heading' ? null : 'heading');
            }}
            title="Heading Level"
            style={{ gap: '0.5rem', minWidth: '120px', justifyContent: 'space-between' }}
          >
            <span>
              {currentBlock === 'P' ? 'Parágrafo' : 
               currentBlock === 'H1' ? 'Cabeçalho 1' : 
               currentBlock === 'H2' ? 'Cabeçalho 2' : 
               currentBlock === 'H3' ? 'Cabeçalho 3' : 
               currentBlock === 'BLOCKQUOTE' ? 'Citação' : 
               currentBlock === 'PRE' ? 'Código' : currentBlock}
            </span>
            <ChevronDown size={14} />
          </button>
          {openDropdown === 'heading' && (
            <div className="dropdown-menu" style={{ width: '260px' }}>
              {[
                { value: "P", label: "Parágrafo", shortcut: "Alt Ctrl 0", style: { fontSize: "0.875rem", fontWeight: 400 } },
                { value: "H1", label: "Cabeçalho 1", shortcut: "Alt Ctrl 1", style: { fontSize: "1.5rem", fontWeight: 700 } },
                { value: "H2", label: "Cabeçalho 2", shortcut: "Alt Ctrl 2", style: { fontSize: "1.25rem", fontWeight: 700 } },
                { value: "H3", label: "Cabeçalho 3", shortcut: "Alt Ctrl 3", style: { fontSize: "1.1rem", fontWeight: 700 } },
                { value: "BLOCKQUOTE", label: "Citação", shortcut: "", style: { fontSize: "0.875rem", fontStyle: "italic", color: "var(--text-secondary)" } },
                { value: "PRE", label: "Código", shortcut: "", style: { fontSize: "0.875rem", fontFamily: "monospace" } },
              ].map((item) => (
                <div
                  key={item.value}
                  className={`dropdown-item ${currentBlock === item.value ? 'selected' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    handleBlockChange(item.value);
                    setOpenDropdown(null);
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {currentBlock === item.value && <Check size={14} style={{ position: 'absolute', left: '0.5rem' }} />}
                    <span style={{ marginLeft: '1.5rem', ...item.style }}>{item.label}</span>
                  </div>
                  {item.shortcut && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.shortcut}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Font Size Dropdown */}
        <div className="custom-dropdown" style={{ position: 'relative' }}>
          <button
            className="toolbar-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (openDropdown !== 'size') saveSelection();
              setOpenDropdown(openDropdown === 'size' ? null : 'size');
            }}
            title="Font Size"
            style={{ gap: '0.5rem', minWidth: '60px', justifyContent: 'space-between' }}
          >
            <span>
              {currentSize === '1' ? '10px' :
               currentSize === '2' ? '13px' :
               currentSize === '3' ? '16px' :
               currentSize === '4' ? '18px' :
               currentSize === '5' ? '24px' :
               currentSize === '6' ? '32px' :
               currentSize === '7' ? '48px' : '16px'}
            </span>
            <ChevronDown size={14} />
          </button>
          {openDropdown === 'size' && (
            <div className="dropdown-menu" style={{ width: '100px', maxHeight: '300px' }}>
              {[
                { value: "1", label: "10px" },
                { value: "2", label: "13px" },
                { value: "3", label: "16px" },
                { value: "4", label: "18px" },
                { value: "5", label: "24px" },
                { value: "6", label: "32px" },
                { value: "7", label: "48px" },
              ].map((item) => (
                <div
                  key={item.value}
                  className={`dropdown-item ${currentSize === item.value ? 'selected' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    handleSizeChange(item.value);
                    setOpenDropdown(null);
                  }}
                >
                  {currentSize === item.value && <Check size={14} style={{ position: 'absolute', left: '0.5rem' }} />}
                  <span style={{ marginLeft: '1.5rem' }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="divider" style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }} />

        <button className={`toolbar-btn ${isActive("bold")}`} onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand("bold")} title="Bold">
          <Bold size={18} />
        </button>
        <button className={`toolbar-btn ${isActive("italic")}`} onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand("italic")} title="Italic">
          <Italic size={18} />
        </button>
        <button className={`toolbar-btn ${isActive("strikeThrough")}`} onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand("strikeThrough")} title="Strike">
          <Strikethrough size={18} />
        </button>
        <button className={`toolbar-btn ${isActive("PRE")}`} onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand("formatBlock", "PRE")} title="Code Block">
          <Code size={18} />
        </button>
        
        <div className="divider" style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }} />
        
        <button className={`toolbar-btn ${isActive("insertUnorderedList")}`} onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand("insertUnorderedList")} title="Bullet List">
          <List size={18} />
        </button>
        <button className={`toolbar-btn ${isActive("insertOrderedList")}`} onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand("insertOrderedList")} title="Ordered List">
          <ListOrdered size={18} />
        </button>
        <button className={`toolbar-btn ${isActive("BLOCKQUOTE")}`} onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand("formatBlock", "BLOCKQUOTE")} title="Quote">
          <Quote size={18} />
        </button>

        <div className="divider" style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }} />

        {/* Text Color Split Button */}
        <div className="custom-dropdown" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            className="toolbar-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCommand("foreColor", textColor)}
            title="Text Color"
            style={{ padding: '0.25rem', borderRadius: '0.25rem 0 0 0.25rem', borderRight: '1px solid transparent' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Baseline size={16} />
              <div style={{ width: '100%', height: '3px', backgroundColor: textColor, marginTop: '1px' }} />
            </div>
          </button>
          <button
            className="toolbar-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (openDropdown !== 'textColor') saveSelection();
              setOpenDropdown(openDropdown === 'textColor' ? null : 'textColor');
            }}
            title="Text Color Options"
            style={{ padding: '0.25rem 0.1rem', borderRadius: '0 0.25rem 0.25rem 0', marginLeft: '-1px' }}
          >
            <ChevronDown size={12} />
          </button>
          
          {openDropdown === 'textColor' && (
            <div className="dropdown-menu color-picker-dropdown" style={{ width: '242px', padding: '10px' }}>
              <div 
                className="dropdown-item" 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { execCommand("foreColor", "#000000"); setTextColor("#000000"); setOpenDropdown(null); }}
                style={{ padding: '5px', marginBottom: '5px' }}
              >
                <Ban size={16} style={{ marginRight: '8px' }} />
                <span>Padrão</span>
              </div>
              
              <div className="color-grid">
                {COLOR_PALETTE.map((color) => (
                  <div
                    key={color}
                    className="color-option"
                    style={{ backgroundColor: color }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      execCommand("foreColor", color);
                      setTextColor(color);
                      addToRecent(color);
                      setOpenDropdown(null);
                    }}
                    title={color}
                  />
                ))}
              </div>

              {recentColors.length > 0 && (
                <>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, margin: '8px 0 4px', color: 'var(--text-secondary)' }}>Usado recentemente</div>
                  <div className="color-grid">
                    {recentColors.map((color) => (
                      <div
                        key={color}
                        className="color-option"
                        style={{ backgroundColor: color }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          execCommand("foreColor", color);
                          setTextColor(color);
                          setOpenDropdown(null);
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </>
              )}

              <div 
                className="dropdown-item" 
                style={{ padding: '5px', marginTop: '5px' }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'color';
                  input.onchange = (e) => {
                    const color = (e.target as HTMLInputElement).value;
                    execCommand("foreColor", color);
                    setTextColor(color);
                    addToRecent(color);
                    setOpenDropdown(null);
                  };
                  input.click();
                }}
              >
                <Plus size={16} style={{ marginRight: '8px' }} />
                <span>Mais cores...</span>
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color Split Button */}
        <div className="custom-dropdown" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            className="toolbar-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const newValue = areColorsEqual(currentHiliteColor, highlightColor) ? "transparent" : highlightColor;
              execCommand("hiliteColor", newValue);
            }}
            title="Highlight Color"
            style={{ padding: '0.25rem', borderRadius: '0.25rem 0 0 0.25rem', borderRight: '1px solid transparent' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Highlighter size={16} />
              <div style={{ width: '100%', height: '3px', backgroundColor: highlightColor, marginTop: '1px' }} />
            </div>
          </button>
          <button
            className="toolbar-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (openDropdown !== 'highlightColor') saveSelection();
              setOpenDropdown(openDropdown === 'highlightColor' ? null : 'highlightColor');
            }}
            title="Highlight Color Options"
            style={{ padding: '0.25rem 0.1rem', borderRadius: '0 0.25rem 0.25rem 0', marginLeft: '-1px' }}
          >
            <ChevronDown size={12} />
          </button>
          
          {openDropdown === 'highlightColor' && (
            <div className="dropdown-menu color-picker-dropdown" style={{ width: '242px', padding: '10px' }}>
               <div 
                className="dropdown-item" 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { execCommand("hiliteColor", "transparent"); setHighlightColor("transparent"); setOpenDropdown(null); }}
                style={{ padding: '5px', marginBottom: '5px' }}
              >
                <Ban size={16} style={{ marginRight: '8px' }} />
                <span>Sem preenchimento</span>
              </div>
              
              <div className="color-grid">
                {COLOR_PALETTE.map((color) => (
                  <div
                    key={color}
                    className="color-option"
                    style={{ backgroundColor: color }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      execCommand("hiliteColor", color);
                      setHighlightColor(color);
                      addToRecent(color);
                      setOpenDropdown(null);
                    }}
                    title={color}
                  />
                ))}
              </div>

              {recentColors.length > 0 && (
                <>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, margin: '8px 0 4px', color: 'var(--text-secondary)' }}>Usado recentemente</div>
                  <div className="color-grid">
                    {recentColors.map((color) => (
                      <div
                        key={color}
                        className="color-option"
                        style={{ backgroundColor: color }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          execCommand("hiliteColor", color);
                          setHighlightColor(color);
                          setOpenDropdown(null);
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </>
              )}

              <div 
                className="dropdown-item" 
                style={{ padding: '5px', marginTop: '5px' }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'color';
                  input.onchange = (e) => {
                    const color = (e.target as HTMLInputElement).value;
                    execCommand("hiliteColor", color);
                    setHighlightColor(color);
                    addToRecent(color);
                    setOpenDropdown(null);
                  };
                  input.click();
                }}
              >
                <Plus size={16} style={{ marginRight: '8px' }} />
                <span>Mais cores...</span>
              </div>
            </div>
          )}
        </div>

        <div className="divider" style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }} />

        {/* Alignment Dropdown */}
        <div className="custom-dropdown" style={{ position: 'relative' }}>
          <button
            className="toolbar-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (openDropdown !== 'alignment') saveSelection();
              setOpenDropdown(openDropdown === 'alignment' ? null : 'alignment');
            }}
            title="Alinhamento"
            style={{ gap: '0.25rem' }}
          >
            {activeFormats.justifyCenter ? <AlignCenter size={18} /> : 
             activeFormats.justifyRight ? <AlignRight size={18} /> : 
             activeFormats.justifyFull ? <AlignJustify size={18} /> : 
             <AlignLeft size={18} />}
            <ChevronDown size={12} />
          </button>
          {openDropdown === 'alignment' && (
            <div className="dropdown-menu" style={{ width: '160px' }}>
              {[
                { icon: AlignLeft, label: "Esquerda", command: "justifyLeft", shortcut: "Ctrl Shift L" },
                { icon: AlignCenter, label: "Centro", command: "justifyCenter", shortcut: "Ctrl Shift E" },
                { icon: AlignRight, label: "Direita", command: "justifyRight", shortcut: "Ctrl Shift R" },
                { icon: AlignJustify, label: "Justificado", command: "justifyFull", shortcut: "Ctrl Shift J" },
              ].map((item) => (
                <div
                  key={item.command}
                  className={`dropdown-item ${activeFormats[item.command] ? 'selected' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    execCommand(item.command);
                    setOpenDropdown(null);
                  }}
                  style={{ justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </div>
                  {activeFormats[item.command] && <Check size={14} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Line Height Dropdown */}
        <div className="custom-dropdown" style={{ position: 'relative' }}>
          <button
            className="toolbar-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (openDropdown !== 'lineHeight') saveSelection();
              setOpenDropdown(openDropdown === 'lineHeight' ? null : 'lineHeight');
            }}
            title="Altura da linha"
            style={{ gap: '0.25rem' }}
          >
            <ArrowUpDown size={18} />
            <ChevronDown size={12} />
          </button>
          {openDropdown === 'lineHeight' && (
            <div className="dropdown-menu" style={{ width: '100px' }}>
              {["1", "1.15", "1.5", "2", "2.5", "3"].map((value) => (
                <div
                  key={value}
                  className="dropdown-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    applyLineHeight(value);
                    setOpenDropdown(null);
                  }}
                >
                  <span style={{ marginLeft: '1.5rem' }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="divider" style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }} />

        {/* Indent Buttons */}
        <button
          className="toolbar-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCommand("outdent")}
          title="Diminuir recuo"
        >
          <IndentDecrease size={18} />
        </button>
        <button
          className="toolbar-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCommand("indent")}
          title="Aumentar recuo"
        >
          <IndentIncrease size={18} />
        </button>

        <div className="divider" style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }} />

        {/* Horizontal Rule */}
        <button
          className="toolbar-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCommand("insertHorizontalRule")}
          title="Inserir linha horizontal"
        >
          <Minus size={18} />
        </button>

        <div className="divider" style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }} />

        <button
          className={`toolbar-btn ${showFindReplace ? 'active' : ''}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowFindReplace(!showFindReplace)}
          title="Find and Replace"
        >
          <Replace size={18} />
        </button>
      </div>

      {showFindReplace && (
        <div className="find-replace-modal" style={{
          position: 'absolute',
          top: '50px',
          right: '20px',
          width: '320px',
          backgroundColor: 'white',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          borderRadius: '0.5rem',
          padding: '1rem',
          zIndex: 50,
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Pesquisar</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{matchCount.current}/{matchCount.total}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Text"
              style={{
                flex: 1,
                padding: '0.25rem 0.5rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.25rem',
                fontSize: '0.875rem'
              }}
            />
            <button onClick={prevMatch} style={{ padding: '0.25rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', background: '#f1f5f9', cursor: 'pointer' }}>
              <ChevronUp size={16} />
            </button>
            <button onClick={nextMatch} style={{ padding: '0.25rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', background: '#f1f5f9', cursor: 'pointer' }}>
              <ChevronDown size={16} />
            </button>
          </div>

          <div style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Substituir</div>
          <div style={{ marginBottom: '0.75rem' }}>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Text"
              style={{
                width: '100%',
                padding: '0.25rem 0.5rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.25rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              id="caseSensitive"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
            />
            <label htmlFor="caseSensitive" style={{ fontSize: '0.875rem', color: '#475569' }}>Sensível a maiúsculas e minúsculas</label>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={replaceCurrent}
              style={{
                flex: 1,
                padding: '0.5rem',
                backgroundColor: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Substituir
            </button>
            <button
              onClick={replaceAll}
              style={{
                flex: 1,
                padding: '0.5rem',
                backgroundColor: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Substituir tudo
            </button>
          </div>
        </div>
      )}

      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        suppressContentEditableWarning
        onKeyUp={checkFormats}
        onMouseUp={checkFormats}
        onBlur={saveSelection}
        style={{
          flex: 1,
          padding: "1rem",
          outline: "none",
          overflowY: "auto",
          color: "var(--text-primary)",
          fontFamily: "inherit",
          lineHeight: "1.6",
        }}
      />

      <style>{`
        .toolbar-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 0.25rem;
          border-radius: 0.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .toolbar-btn:hover {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
        }
        .toolbar-btn.active {
          background-color: var(--accent-color);
          color: white;
        }
        .editor-content p { margin-bottom: 0.75em; }
        .editor-content h1, .editor-content h2 { margin-top: 1em; margin-bottom: 0.5em; font-weight: 600; }
        .editor-content h1 { font-size: 1.5em; }
        .editor-content h2 { font-size: 1.25em; }
        .editor-content ul, .editor-content ol { margin-left: 1.5em; margin-bottom: 0.75em; }
        .editor-content blockquote { 
          border-left: 3px solid var(--accent-color); 
          margin-left: 0; 
          padding-left: 1rem; 
          color: var(--text-secondary);
          font-style: italic;
        }
        .editor-content pre {
          background-color: #1e293b;
          color: #e2e8f0;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-family: monospace;
          margin-bottom: 0.75em;
        }
        .toolbar-select {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          padding: 0.25rem;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.875rem;
          outline: none;
          height: 28px;
        }
        .toolbar-select:hover {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
        }
        .toolbar-select:focus {
          border-color: var(--accent-color);
        }
        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          background-color: white;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          padding: 0.5rem 0;
          z-index: 50;
          overflow-y: auto;
          margin-top: 0.25rem;
        }
        .dropdown-item {
          padding: 0.5rem 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          position: relative;
          font-size: 0.875rem;
          color: var(--text-primary);
        }
        .dropdown-item:hover {
          background-color: var(--bg-secondary);
        }
        .dropdown-item.selected {
          background-color: var(--bg-secondary);
        }
        .find-highlight {
          background-color: #fef08a; /* yellow-200 */
        }
        .find-highlight-active {
          background-color: #facc15; /* yellow-400 */
        }
        .color-grid {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 4px;
        }
        .color-option {
          width: 18px;
          height: 18px;
          border-radius: 2px;
          cursor: pointer;
          border: 1px solid rgba(0,0,0,0.1);
        }
        .color-option:hover {
          transform: scale(1.2);
          border-color: var(--text-primary);
          z-index: 1;
        }
      `}</style>
    </div>
  );
};
