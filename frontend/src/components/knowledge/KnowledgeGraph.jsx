import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntity, getFactRelations } from '../../services/knowledgeBase';

const TYPE_COLORS = {
  Cake: 'graph-node--cake',
  Cream: 'graph-node--cream',
  Base: 'graph-node--base',
  Filling: 'graph-node--filling',
  Technique: 'graph-node--technique',
  Problem: 'graph-node--problem',
  Solution: 'graph-node--solution',
  Term: 'graph-node--term',
  Article: 'graph-node--article',
  Flavor: 'graph-node--flavor',
};

function shortName(name, limit = 18) {
  return name.length > limit ? `${name.slice(0, limit - 1)}…` : name;
}

export default function KnowledgeGraph({ entityId, title = 'Связи знаний' }) {
  const navigate = useNavigate();
  const graph = useMemo(() => {
    const center = getEntity(entityId);
    if (!center) return null;
    const preferred = ['hasBase', 'hasCream', 'hasFilling', 'usesTechnique', 'hasFlavor', 'hasTexture', 'hasDecoration', 'relatedTo'];
    const allRelations = getFactRelations(entityId).outgoing
      .map(({ fact, target }) => ({ fact, entity: target }))
      .filter((item) => item.entity && item.entity.id !== entityId);
    const relations = [
      ...allRelations.filter((item) => preferred.includes(item.fact.predicate)),
      ...allRelations.filter((item) => !preferred.includes(item.fact.predicate)),
    ].slice(0, 8);
    if (!relations.length) return { center, nodes: [], edges: [] };

    const width = 780;
    const height = 390;
    const cx = width / 2;
    const cy = height / 2;
    const rx = 265;
    const ry = 145;
    const nodes = relations.map((item, index) => {
      const angle = (Math.PI * 2 * index) / relations.length - Math.PI / 2;
      return {
        ...item.entity,
        x: cx + Math.cos(angle) * rx,
        y: cy + Math.sin(angle) * ry,
      };
    });
    return {
      center,
      nodes,
      edges: relations.map((item, index) => ({
        predicate: item.fact.predicate,
        target: nodes[index],
      })),
      width,
      height,
      cx,
      cy,
    };
  }, [entityId]);

  if (!graph) return null;
  if (!graph.nodes.length) {
    return (
      <div className="knowledge-graph knowledge-graph--empty">
        <p>Пока нет связей для этого материала.</p>
      </div>
    );
  }

  const open = (entity) => {
    if (!entity) return;
    if (entity.url) navigate(entity.url);
    else navigate(`/search?q=${encodeURIComponent(entity.name)}`);
  };

  return (
    <div className="knowledge-graph">
      {title && <h3 className="knowledge-graph__title">{title}</h3>}
      <svg viewBox={`0 0 ${graph.width} ${graph.height}`} role="img" aria-label="Связи материала">
        {graph.edges.map((edge, index) => (
          <g key={`edge-${index}`}>
            <line
              x1={graph.cx}
              y1={graph.cy}
              x2={edge.target.x}
              y2={edge.target.y}
              className="knowledge-graph__edge"
            />
            <title>{edge.predicate}</title>
          </g>
        ))}
        <g
          className={`graph-node ${TYPE_COLORS[graph.center.type] || 'graph-node--term'} graph-node--center`}
          onClick={() => open(graph.center)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => event.key === 'Enter' && open(graph.center)}
        >
          <circle cx={graph.cx} cy={graph.cy} r="52" />
          <text x={graph.cx} y={graph.cy + 4} textAnchor="middle">{shortName(graph.center.name, 14)}</text>
        </g>
        {graph.nodes.map((node) => (
          <g
            key={node.id}
            className={`graph-node ${TYPE_COLORS[node.type] || 'graph-node--term'}`}
            onClick={() => open(node)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => event.key === 'Enter' && open(node)}
          >
            <circle cx={node.x} cy={node.y} r="38" />
            <text x={node.x} y={node.y + 3} textAnchor="middle">{shortName(node.name, 12)}</text>
            <title>{node.name}</title>
          </g>
        ))}
      </svg>
      <p className="knowledge-graph__hint">Нажмите на узел, чтобы перейти к связанному материалу.</p>
    </div>
  );
}
