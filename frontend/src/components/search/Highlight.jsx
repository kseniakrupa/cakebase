import { Fragment } from 'react';
import { highlightParts } from '../../utils/highlight';

export default function Highlight({ text = '', query = '', extraWords = [], as: Tag = 'span', className = '' }) {
  const parts = highlightParts(text, query, extraWords);
  return (
    <Tag className={className}>
      {parts.map((part, index) =>
        part.match ? (
          <mark key={index} className="highlight">
            {part.text}
          </mark>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        ),
      )}
    </Tag>
  );
}
