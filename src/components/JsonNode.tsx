import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface JsonNodeProps {
  name?: string;
  value: any;
  isLast?: boolean;
  depth?: number;
}

export const JsonNode: React.FC<JsonNodeProps> = ({ name, value, isLast = true, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const renderValue = (val: any) => {
    if (val === null) return <span className="json-null">null</span>;
    if (typeof val === 'boolean') return <span className="json-boolean">{val.toString()}</span>;
    if (typeof val === 'number') return <span className="json-number">{val}</span>;
    if (typeof val === 'string') return <span className="json-string">"{val}"</span>;
    return null;
  };

  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const isEmpty = isObject && Object.keys(value).length === 0;

  if (!isObject) {
    return (
      <div className="json-line">
        {name && <span className="json-key">"{name}":</span>}
        {renderValue(value)}
        {!isLast && <span className="bracket">,</span>}
      </div>
    );
  }

  const keys = Object.keys(value);
  const itemCount = keys.length;
  const startBracket = isArray ? '[' : '{';
  const endBracket = isArray ? ']' : '}';

  if (isEmpty) {
    return (
      <div className="json-line">
        {name && <span className="json-key">"{name}":</span>}
        <span className="bracket">{startBracket}{endBracket}</span>
        {!isLast && <span className="bracket">,</span>}
      </div>
    );
  }

  return (
    <div className={`json-object ${!isExpanded ? 'collapsed' : ''}`}>
      <div className="json-line" onClick={toggleExpand} style={{ cursor: 'pointer' }}>
        <span className="collapser">
          <ChevronDown size={14} />
        </span>
        {name && <span className="json-key">"{name}":</span>}
        <span className="bracket">{startBracket}</span>
        {!isExpanded && (
          <>
            <span className="item-count">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}...
            </span>
            <span className="bracket">{endBracket}</span>
            {!isLast && <span className="bracket">,</span>}
          </>
        )}
      </div>
      
      {isExpanded && (
        <div className="json-content">
          {keys.map((key, index) => (
            <div key={key} className="json-node">
              <JsonNode
                name={isArray ? undefined : key}
                value={value[key]}
                isLast={index === keys.length - 1}
                depth={depth + 1}
              />
            </div>
          ))}
          <div className="json-line">
            <span className="bracket" style={{ marginLeft: '0.3rem' }}>{endBracket}</span>
            {!isLast && <span className="bracket">,</span>}
          </div>
        </div>
      )}
    </div>
  );
};
