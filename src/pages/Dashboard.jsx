import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const NODE_W = 196;
const NODE_H = 86;
const H_GAP = 90;
const V_GAP = 164;
const ROOT_GAP = 180;
const WORLD_W = 3400;
const WORLD_H = 2200;
const MIN_SCALE = 0.52;
const MAX_SCALE = 1.45;
const SNAP_RADIUS = 128;
const DRAG_START_THRESHOLD_PX = 8;
const TOP_OFFSET = 152;

const INITIAL_GRAPH = {
  JP: { id: 'JP', name: 'admin', parentId: null, childrenIds: ['AK', 'SR', 'KP', 'DW'], position: { x: 0, y: 0 }, collapsed: false, role: 'Admin', team: 'Operations', workload: 8, status: 'Organization owner' },
  AK: { id: 'AK', name: 'arun', parentId: 'JP', childrenIds: ['RC', 'TC'], position: { x: 0, y: 0 }, collapsed: false, role: 'Lead', team: 'Engineering', workload: 6, status: 'Managing engineering pod A' },
  SR: { id: 'SR', name: 'kavi', parentId: 'JP', childrenIds: ['MN', 'ED'], position: { x: 0, y: 0 }, collapsed: false, role: 'Lead', team: 'Engineering', workload: 7, status: 'Managing engineering pod B' },
  RC: { id: 'RC', name: 'sara', parentId: 'AK', childrenIds: [], position: { x: 0, y: 0 }, collapsed: false, role: 'Employee', team: 'Engineering', workload: 4, status: 'Task execution' },
  TC: { id: 'TC', name: 'mani', parentId: 'AK', childrenIds: [], position: { x: 0, y: 0 }, collapsed: false, role: 'Employee', team: 'Engineering', workload: 3, status: 'Task execution' },
  MN: { id: 'MN', name: 'ravi', parentId: 'SR', childrenIds: [], position: { x: 0, y: 0 }, collapsed: false, role: 'Employee', team: 'Engineering', workload: 5, status: 'Feature delivery' },
  ED: { id: 'ED', name: 'vijay', parentId: 'SR', childrenIds: [], position: { x: 0, y: 0 }, collapsed: false, role: 'Employee', team: 'Engineering', workload: 4, status: 'Platform support' },
  KP: { id: 'KP', name: 'ajay', parentId: 'JP', childrenIds: [], position: { x: 0, y: 0 }, collapsed: false, role: 'Employee', team: 'Operations', workload: 6, status: 'General support' },
  DW: { id: 'DW', name: 'deepa', parentId: 'JP', childrenIds: [], position: { x: 0, y: 0 }, collapsed: false, role: 'Employee', team: 'Operations', workload: 6, status: 'General support' },
};

const TEAM_PILLS = ['UI/UX', 'Engineering', 'Marketing', 'QA', 'Product', 'Operations'];

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

.org-editor {
  --bg: #fafafa;
  --surface: #ffffff;
  --border: #e4e4e7;
  --text: #18181b;
  --text-2: #71717a;
  --line: color-mix(in srgb, var(--text-2) 30%, transparent);
  --soft: color-mix(in srgb, var(--text-2) 10%, transparent);
  --shadow: 0 14px 32px color-mix(in srgb, var(--text) 11%, transparent);
  --shadow-strong: 0 24px 52px color-mix(in srgb, var(--text) 20%, transparent);

  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font-family: 'Poppins', 'Segoe UI', sans-serif;
  transition: background 220ms ease, color 220ms ease;
}

.org-editor[data-theme='dark'] {
  --bg: #111111;
  --surface: #1c1c1c;
  --border: #333333;
  --text: #ffffff;
  --text-2: #a1a1aa;
  --line: color-mix(in srgb, var(--text-2) 36%, transparent);
  --soft: color-mix(in srgb, var(--text-2) 12%, transparent);
  --shadow: 0 14px 36px color-mix(in srgb, #000000 46%, transparent);
  --shadow-strong: 0 28px 62px color-mix(in srgb, #000000 62%, transparent);
}

.org-shell {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: 70px 1fr;
}

.org-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 86%, transparent);
  backdrop-filter: blur(10px);
}

.org-brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.org-brand-title {
  font-size: 1rem;
  font-weight: 800;
}

.org-brand-sub {
  font-size: 0.8rem;
  color: var(--text-2);
}

.org-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.org-btn,
.org-btn-ghost,
.org-icon-btn {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  border-radius: 999px;
  font: inherit;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}

.org-icon-btn {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  font-size: 1rem;
}

.org-btn,
.org-btn-ghost {
  padding: 8px 13px;
  font-size: 0.8rem;
  font-weight: 700;
}

.org-btn:hover,
.org-btn-ghost:hover,
.org-icon-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.org-main {
  display: grid;
  grid-template-columns: 272px 1fr;
  align-items: stretch;
  gap: 14px;
  padding: 14px;
  min-height: 0;
}

.org-panel {
  margin: 0;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: color-mix(in srgb, var(--surface) 94%, transparent);
  box-shadow: var(--shadow);
  padding: 16px;
  display: grid;
  gap: 14px;
  align-self: stretch;
  min-height: 0;
}

.panel-title {
  font-size: 1rem;
  font-weight: 800;
}

.panel-copy {
  font-size: 0.78rem;
  color: var(--text-2);
  line-height: 1.4;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.stat-card {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 8px;
  text-align: center;
}

.stat-card strong {
  display: block;
  font-size: 1.02rem;
}

.stat-card span {
  font-size: 0.66rem;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.pill-wrap {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.team-pill {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 10px 12px;
  font-size: 0.74rem;
  color: var(--text-2);
  background: color-mix(in srgb, var(--surface) 90%, var(--bg));
  text-align: center;
  font-weight: 600;
  cursor: pointer;
  transition: transform 140ms ease, border-color 140ms ease, color 140ms ease, background 140ms ease;
}

.team-pill:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--text) 24%, var(--border));
}

.team-pill.active {
  color: var(--text);
  border-color: color-mix(in srgb, var(--text) 34%, var(--border));
  background: color-mix(in srgb, var(--surface) 68%, var(--soft));
}

.panel-actions {
  display: grid;
  gap: 8px;
}

.panel-actions .org-btn,
.panel-actions .org-btn-ghost {
  border-radius: 12px;
  width: 100%;
  text-align: left;
}

.canvas-wrap {
  position: relative;
  min-width: 0;
  overflow: hidden;
}

.canvas {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  cursor: grab;
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 96%, var(--bg)) 0%, var(--bg) 100%);
}

.canvas:active {
  cursor: grabbing;
}

.world {
  position: absolute;
  left: 0;
  top: 0;
  width: ${WORLD_W}px;
  height: ${WORLD_H}px;
  transform-origin: 0 0;
  will-change: transform;
}

.edge-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.edge {
  fill: none;
  stroke: var(--line);
  stroke-width: 1.8;
  stroke-linecap: round;
}

.edge.active {
  stroke-width: 2.25;
}

.edge.preview {
  stroke: var(--text);
  stroke-width: 2.35;
  stroke-dasharray: 9 8;
  animation: edgeDash 0.95s linear infinite;
}

@keyframes edgeDash {
  to { stroke-dashoffset: -17; }
}

.branch-hit {
  position: absolute;
  border-radius: 16px;
  background: transparent;
  border: 1px dashed transparent;
  transition: border-color 120ms ease, background 120ms ease;
  z-index: 1;
}

.branch-hit.selected {
  border-color: color-mix(in srgb, var(--text-2) 46%, transparent);
  background: color-mix(in srgb, var(--text-2) 8%, transparent);
}

.node {
  position: absolute;
  width: ${NODE_W}px;
  height: ${NODE_H}px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: var(--shadow);
  display: grid;
  grid-template-columns: 64px 1fr;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  transition: transform 170ms ease, box-shadow 170ms ease, border-color 170ms ease, opacity 170ms ease, background 170ms ease, left 320ms cubic-bezier(0.22, 1, 0.36, 1), top 320ms cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 3;
}

.node:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: var(--shadow-strong);
}

.node.selected {
  border-color: color-mix(in srgb, var(--text) 24%, var(--border));
  box-shadow: var(--shadow-strong);
  background: color-mix(in srgb, var(--surface) 90%, var(--soft));
}

.node.dimmed {
  opacity: 0.22;
}

.node.dragging {
  opacity: 0.56;
  transform: translateY(-10px) scale(1.05);
}

.node.drop-target {
  border-color: color-mix(in srgb, var(--text) 55%, var(--border));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--text) 12%, transparent), var(--shadow-strong);
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: radial-gradient(circle at 30% 25%, color-mix(in srgb, var(--text) 10%, var(--surface)), color-mix(in srgb, var(--text-2) 12%, var(--surface)) 70%);
  display: grid;
  place-items: center;
  font-size: 1.1rem;
  font-weight: 800;
}

.avatar-shell {
  position: relative;
  width: 64px;
  height: 64px;
}

.meta {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.meta .name {
  font-size: 0.94rem;
  font-weight: 800;
  line-height: 1.08;
}

.meta .role {
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-2);
  font-weight: 700;
}

.meta .team {
  font-size: 0.72rem;
  color: var(--text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drag-hint {
  position: absolute;
  border: 1px solid color-mix(in srgb, var(--text) 30%, var(--border));
  background: var(--surface);
  color: var(--text);
  border-radius: 999px;
  padding: 7px 10px;
  font-size: 0.74rem;
  font-weight: 700;
  box-shadow: var(--shadow);
  pointer-events: none;
  z-index: 30;
}

.detail-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  width: min(360px, calc(100% - 32px));
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: var(--shadow-strong);
  padding: 14px;
  z-index: 35;
}

.detail-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
}

.detail-name {
  font-size: 1rem;
  font-weight: 800;
}

.detail-sub {
  margin-top: 2px;
  font-size: 0.78rem;
  color: var(--text-2);
}

.detail-pills {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-pill {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 7px 10px;
  font-size: 0.74rem;
  color: var(--text-2);
}

.detail-pill strong {
  color: var(--text);
}

.detail-actions {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-list {
  margin-top: 10px;
  font-size: 0.78rem;
  color: var(--text-2);
}

.zoom-pill {
  position: absolute;
  left: 16px;
  bottom: 16px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-2);
  font-size: 0.76rem;
  padding: 9px 11px;
  box-shadow: var(--shadow);
  z-index: 25;
}

.mini-map {
  position: absolute;
  right: 16px;
  bottom: 16px;
  width: 210px;
  height: 142px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow);
  overflow: hidden;
  z-index: 24;
}

.mini-top {
  height: 24px;
  border-bottom: 1px solid var(--border);
}

.mini-body {
  position: relative;
  height: calc(100% - 24px);
}

.mini-node {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text) 38%, var(--surface));
}

.mini-viewport {
  position: absolute;
  border: 1px solid color-mix(in srgb, var(--text) 58%, transparent);
  background: color-mix(in srgb, var(--text) 12%, transparent);
  border-radius: 8px;
}

.modal-overlay {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  display: grid;
  place-items: center;
  z-index: 45;
}

.modal-card {
  width: min(460px, calc(100% - 28px));
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: var(--shadow-strong);
  padding: 15px;
}

.modal-title {
  font-size: 1rem;
  font-weight: 800;
}

.modal-sub {
  margin-top: 4px;
  font-size: 0.8rem;
  color: var(--text-2);
}

.modal-grid {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}

.modal-label {
  display: grid;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-2);
}

.modal-input,
.modal-select,
.modal-textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  padding: 9px 11px;
}

.modal-textarea {
  min-height: 86px;
  resize: vertical;
}

.modal-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.toast {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.78rem;
  padding: 9px 13px;
  box-shadow: var(--shadow);
  z-index: 50;
}

@media (max-width: 1100px) {
  .org-main {
    grid-template-columns: 1fr;
  }

  .org-panel {
    position: absolute;
    left: 14px;
    top: 82px;
    width: 236px;
    z-index: 20;
  }
}
`;

const cloneGraph = (graph) => JSON.parse(JSON.stringify(graph));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getChildrenMap = (graph) => {
  const map = new Map();
  Object.values(graph).forEach((node) => {
    if (!map.has(node.parentId)) {
      map.set(node.parentId, []);
    }
    map.get(node.parentId).push(node.id);
  });
  return map;
};

const getDescendants = (childrenMap, nodeId) => {
  const descendants = new Set();
  const stack = [...(childrenMap.get(nodeId) || [])];
  while (stack.length) {
    const id = stack.pop();
    if (descendants.has(id)) {
      continue;
    }
    descendants.add(id);
    stack.push(...(childrenMap.get(id) || []));
  }
  return descendants;
};

const layoutGraph = (graph) => {
  const next = cloneGraph(graph);
  Object.values(next).forEach((node) => {
    node.childrenIds = [];
  });

  Object.values(next).forEach((node) => {
    if (!node.parentId || !next[node.parentId]) {
      node.parentId = null;
      return;
    }
    next[node.parentId].childrenIds.push(node.id);
  });

  const childrenMap = getChildrenMap(next);
  const widthMemo = new Map();

  const measure = (id) => {
    if (widthMemo.has(id)) {
      return widthMemo.get(id);
    }
    const node = next[id];
    const children = node.collapsed ? [] : (childrenMap.get(id) || []);
    if (!children.length) {
      widthMemo.set(id, NODE_W);
      return NODE_W;
    }
    const width = Math.max(
      NODE_W,
      children.reduce((sum, childId, index) => sum + measure(childId) + (index > 0 ? H_GAP : 0), 0),
    );
    widthMemo.set(id, width);
    return width;
  };

  const roots = Object.values(next)
    .filter((node) => !node.parentId)
    .map((node) => node.id)
    .sort();

  const totalWidth = roots.reduce((sum, rootId, index) => sum + measure(rootId) + (index > 0 ? ROOT_GAP : 0), 0);
  let cursorX = Math.max(120, (WORLD_W - totalWidth) / 2);
  const positions = {};

  const place = (id, depth, startX) => {
    const width = measure(id);
    positions[id] = {
      x: startX + (width - NODE_W) / 2,
      y: TOP_OFFSET + depth * V_GAP,
    };
    const children = next[id].collapsed ? [] : (childrenMap.get(id) || []);
    if (!children.length) {
      return;
    }
    let childCursor = startX;
    children.forEach((childId, index) => {
      place(childId, depth + 1, childCursor);
      childCursor += measure(childId) + (index < children.length - 1 ? H_GAP : 0);
    });
  };

  roots.forEach((rootId, index) => {
    place(rootId, 0, cursorX);
    cursorX += measure(rootId) + (index < roots.length - 1 ? ROOT_GAP : 0);
  });

  Object.entries(positions).forEach(([id, position]) => {
    next[id].position = position;
  });

  return next;
};

const screenToWorld = (point, viewport) => ({
  x: (point.x - viewport.x) / viewport.scale,
  y: (point.y - viewport.y) / viewport.scale,
});

const getNodeCenter = (position) => ({ x: position.x + NODE_W / 2, y: position.y + NODE_H / 2 });

const getBezierPath = (from, to) => {
  const startX = from.x + NODE_W / 2;
  const startY = from.y + NODE_H;
  const endX = to.x + NODE_W / 2;
  const endY = to.y;
  const midY = (startY + endY) / 2;
  return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
};

const NodeCard = React.memo(function NodeCard({
  node,
  position,
  selected,
  dimmed,
  dragging,
  dropTarget,
  dragMode,
  collapsed,
  onNodeClick,
  onNodePointerDown,
  onDoubleClick,
}) {
  return (
    <div
      className={`node ${selected ? 'selected' : ''} ${dimmed ? 'dimmed' : ''} ${dragging ? 'dragging' : ''} ${dropTarget ? 'drop-target' : ''} ${dragMode ? 'drag-mode' : ''}`}
      style={{ left: position.x, top: position.y }}
      onClick={(event) => {
        event.stopPropagation();
        onNodeClick(node.id);
      }}
      onPointerDown={(event) => onNodePointerDown(event, node.id)}
      onDoubleClick={(event) => onDoubleClick(event, node.id)}
      draggable={false}
    >
      {collapsed ? <div className="node-pulse" /> : null}
      <div className="avatar-shell">
        <div className="avatar">
          {node.name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
      </div>
      <div className="meta">
        <div className="name">{node.name}</div>
        <div className="role">{node.role}</div>
        <div className="team">{node.team}</div>
      </div>
    </div>
  );
});

const Dashboard = ({ onLogout }) => {
  const token = localStorage.getItem('token');
  const user = useMemo(() => {
    if (!token) {
      return null;
    }
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }, [token]);

  const [theme, setTheme] = useState(() => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'));
  const [graph, setGraph] = useState(() => layoutGraph(INITIAL_GRAPH));
  const [expandedIds, setExpandedIds] = useState(() => new Set(['JP', 'AK', 'SR']));
  const [selectedNodeId, setSelectedNodeId] = useState('JP');
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [viewport, setViewport] = useState({ x: 90, y: 88, scale: 1 });
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [panning, setPanning] = useState(null);
  const [dragBranch, setDragBranch] = useState(null);
  const [dragNode, setDragNode] = useState(null);
  const [assignmentDraft, setAssignmentDraft] = useState(null);
  const [toast, setToast] = useState('');
  const [history, setHistory] = useState({ past: [], future: [] });

  const stageRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useLayoutEffect(() => {
    if (!stageRef.current) {
      return undefined;
    }
    const update = () => {
      const rect = stageRef.current.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  const childrenMap = useMemo(() => getChildrenMap(graph), [graph]);
  const descendantsMap = useMemo(() => {
    const map = new Map();
    Object.keys(graph).forEach((id) => {
      map.set(id, getDescendants(childrenMap, id));
    });
    return map;
  }, [childrenMap, graph]);

  const graphBounds = useMemo(() => {
    const positions = Object.values(graph).map((node) => node.position).filter(Boolean);
    if (!positions.length) {
      return null;
    }
    const minX = Math.min(...positions.map((position) => position.x));
    const minY = Math.min(...positions.map((position) => position.y));
    const maxX = Math.max(...positions.map((position) => position.x + NODE_W));
    const maxY = Math.max(...positions.map((position) => position.y + NODE_H));
    return {
      centerX: minX + (maxX - minX) / 2,
      centerY: minY + (maxY - minY) / 2,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [graph]);

  const selectedNode = selectedNodeId ? graph[selectedNodeId] : null;
  const selectedChildren = useMemo(() => childrenMap.get(selectedNodeId) || [], [childrenMap, selectedNodeId]);
  const selectedAncestor = selectedNode?.parentId ? graph[selectedNode.parentId] : null;

  const focusSet = useMemo(() => {
    if (!selectedNodeId) {
      return null;
    }
    const set = new Set([selectedNodeId, ...(descendantsMap.get(selectedNodeId) || new Set())]);
    let parent = graph[selectedNodeId]?.parentId || null;
    while (parent) {
      set.add(parent);
      parent = graph[parent]?.parentId || null;
    }
    return set;
  }, [descendantsMap, graph, selectedNodeId]);

  const domainSet = useMemo(() => {
    if (!selectedDomain) {
      return null;
    }
    const set = new Set();
    Object.entries(graph).forEach(([id, node]) => {
      if (node.team === selectedDomain) {
        set.add(id);
      }
    });
    return set;
  }, [graph, selectedDomain]);

  const highlightSet = selectedDomain ? domainSet : focusSet;

  const branchIds = useMemo(() => {
    if (!dragBranch) {
      return new Set();
    }
    return new Set([dragBranch.rootId, ...(descendantsMap.get(dragBranch.rootId) || new Set())]);
  }, [descendantsMap, dragBranch]);

  const activeDrag = dragBranch || dragNode;
  const activeDragIds = useMemo(() => {
    if (dragBranch) {
      return new Set([dragBranch.rootId, ...(descendantsMap.get(dragBranch.rootId) || new Set())]);
    }
    if (dragNode) {
      return new Set([dragNode.nodeId]);
    }
    return new Set();
  }, [descendantsMap, dragBranch, dragNode]);

  const renderPositions = useMemo(() => {
    const map = Object.fromEntries(Object.entries(graph).map(([id, node]) => [id, { ...node.position }]));
    if (!activeDrag) {
      return map;
    }

    if (dragBranch) {
      const rootPos = graph[dragBranch.rootId]?.position;
      if (!rootPos) {
        return map;
      }
      const topLeft = {
        x: dragBranch.pointerWorld.x - dragBranch.offsetX,
        y: dragBranch.pointerWorld.y - dragBranch.offsetY,
      };
      const delta = { x: topLeft.x - rootPos.x, y: topLeft.y - rootPos.y };
      branchIds.forEach((id) => {
        const base = graph[id]?.position;
        if (!base) {
          return;
        }
        map[id] = { x: base.x + delta.x, y: base.y + delta.y };
      });
      return map;
    }

    if (dragNode) {
      const base = graph[dragNode.nodeId]?.position;
      if (!base) {
        return map;
      }
      map[dragNode.nodeId] = {
        x: dragNode.pointerWorld.x - dragNode.offsetX,
        y: dragNode.pointerWorld.y - dragNode.offsetY,
      };
    }

    return map;
  }, [activeDrag, branchIds, dragBranch, dragNode, graph]);

  const nearestTargetId = useMemo(() => {
    if (!activeDrag) {
      return null;
    }
    const invalid = new Set(activeDragIds);
    const pointer = dragBranch ? dragBranch.pointerWorld : dragNode.pointerWorld;
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    Object.entries(renderPositions).forEach(([id, pos]) => {
      if (invalid.has(id)) {
        return;
      }
      const topPort = { x: pos.x + NODE_W / 2, y: pos.y };
      const dist = Math.hypot(topPort.x - pointer.x, topPort.y - pointer.y);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearest = id;
      }
    });
    return nearest && nearestDistance <= SNAP_RADIUS ? nearest : null;
  }, [activeDrag, activeDragIds, dragBranch, dragNode, renderPositions]);

  const branchBounds = useMemo(() => {
    const bounds = {};
    Object.keys(graph).forEach((id) => {
      const ids = [id, ...(descendantsMap.get(id) || [])];
      const points = ids.map((nodeId) => renderPositions[nodeId]).filter(Boolean);
      if (!points.length) {
        return;
      }
      const minX = Math.min(...points.map((point) => point.x));
      const maxX = Math.max(...points.map((point) => point.x + NODE_W));
      const minY = Math.min(...points.map((point) => point.y + NODE_H * 0.55));
      const maxY = Math.max(...points.map((point) => point.y + NODE_H));
      bounds[id] = {
        x: minX - 12,
        y: minY,
        width: Math.max(34, maxX - minX + 24),
        height: Math.max(42, maxY - minY + 34),
      };
    });
    return bounds;
  }, [descendantsMap, graph, renderPositions]);

  const graphTransform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`;

  const commitGraph = useCallback((mutate, message) => {
    setGraph((prev) => {
      const before = cloneGraph(prev);
      const draft = cloneGraph(prev);
      mutate(draft);
      const reflowed = layoutGraph(draft);
      setHistory((h) => ({ past: [...h.past, before].slice(-30), future: [] }));
      if (message) {
        setToast(message);
      }
      return reflowed;
    });
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (initializedRef.current || !stageSize.width || !graphBounds) {
      return;
    }
    setViewport({
      x: stageSize.width / 2 - graphBounds.centerX,
      y: Math.max(36, stageSize.height / 2 - graphBounds.centerY),
      scale: 1,
    });
    initializedRef.current = true;
  }, [graphBounds, stageSize.height, stageSize.width]);

  const centerOnNode = useCallback((nodeId) => {
    const pos = renderPositions[nodeId];
    if (!pos || !stageSize.width || !stageSize.height) {
      return;
    }
    const center = getNodeCenter(pos);
    setViewport((prev) => ({
      ...prev,
      x: stageSize.width / 2 - center.x * prev.scale,
      y: Math.max(24, stageSize.height / 2 - center.y * prev.scale),
    }));
  }, [renderPositions, stageSize.height, stageSize.width]);

  useEffect(() => {
    const handleMove = (event) => {
      if (dragBranch && stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const pointerWorld = screenToWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }, viewport);
        const moved = Math.hypot(event.clientX - dragBranch.startClientX, event.clientY - dragBranch.startClientY) > DRAG_START_THRESHOLD_PX;
        setDragBranch((current) => (current ? { ...current, pointerWorld, moved } : current));
      }

      if (dragNode && stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const pointerWorld = screenToWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }, viewport);
        const moved = Math.hypot(event.clientX - dragNode.startClientX, event.clientY - dragNode.startClientY) > DRAG_START_THRESHOLD_PX;
        setDragNode((current) => (current ? { ...current, pointerWorld, moved } : current));
      }

      if (panning) {
        const deltaX = event.clientX - panning.startX;
        const deltaY = event.clientY - panning.startY;
        setViewport({ x: panning.originX + deltaX, y: panning.originY + deltaY, scale: viewport.scale });
      }
    };

    const handleUp = () => {
      if (dragBranch) {
        const moved = dragBranch.moved;
        const sourceId = dragBranch.rootId;
        const targetId = nearestTargetId;
        const originalParent = dragBranch.originalParent;

        setDragBranch(null);

        if (moved && targetId) {
          commitGraph((draft) => {
            draft[sourceId].parentId = targetId;
          }, `Branch moved: ${graph[sourceId]?.name} now reports to ${graph[targetId]?.name}.`);
          setAssignmentDraft({ fromId: sourceId, toId: targetId, taskTitle: '', priority: 'medium', notes: '', originalParent });
          setSelectedNodeId(sourceId);
          setSelectedBranchId(sourceId);
        }
      }

      if (dragNode) {
        const moved = dragNode.moved;
        const sourceId = dragNode.nodeId;
        const targetId = nearestTargetId;
        const originalParent = dragNode.originalParent;

        setDragNode(null);

        if (moved && targetId) {
          commitGraph((draft) => {
            draft[sourceId].parentId = targetId;
          }, `Node moved: ${graph[sourceId]?.name} now reports to ${graph[targetId]?.name}.`);
          setAssignmentDraft({ fromId: sourceId, toId: targetId, taskTitle: '', priority: 'medium', notes: '', originalParent });
          setSelectedNodeId(sourceId);
          setSelectedBranchId(null);
        }
      }

      if (panning) {
        setPanning(null);
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [commitGraph, dragBranch, dragNode, graph, nearestTargetId, panning, viewport.scale]);

  const handleCanvasPointerDown = useCallback((event) => {
    if (event.button !== 0 || event.target !== event.currentTarget || dragBranch || dragNode) {
      return;
    }
    setSelectedNodeId(null);
    setSelectedBranchId(null);
    setPanning({ startX: event.clientX, startY: event.clientY, originX: viewport.x, originY: viewport.y });
  }, [dragBranch, dragNode, viewport.x, viewport.y]);

  const handleBranchPointerDown = useCallback((event, rootId) => {
    if (!stageRef.current || dragNode) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const pos = renderPositions[rootId];
    if (!pos) {
      return;
    }

    const rect = stageRef.current.getBoundingClientRect();
    const pointerWorld = screenToWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }, viewport);

    if (event.currentTarget?.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    setSelectedBranchId(rootId);
    setDragBranch({
      rootId,
      startPointer: pointerWorld,
      startClientX: event.clientX,
      startClientY: event.clientY,
      pointerWorld,
      offsetX: pointerWorld.x - pos.x,
      offsetY: pointerWorld.y - pos.y,
      originalParent: graph[rootId].parentId,
      moved: false,
    });
  }, [dragNode, graph, renderPositions, viewport]);

  const handleNodePointerDown = useCallback((event, nodeId) => {
    if (!stageRef.current || event.button !== 0 || dragBranch) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const pos = renderPositions[nodeId];
    if (!pos) {
      return;
    }

    const rect = stageRef.current.getBoundingClientRect();
    const pointerWorld = screenToWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }, viewport);

    if (event.currentTarget?.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    setSelectedNodeId(nodeId);
    setSelectedBranchId(null);
    setDragNode({
      nodeId,
      startPointer: pointerWorld,
      startClientX: event.clientX,
      startClientY: event.clientY,
      pointerWorld,
      offsetX: pointerWorld.x - pos.x,
      offsetY: pointerWorld.y - pos.y,
      originalParent: graph[nodeId].parentId,
      moved: false,
    });
  }, [dragBranch, graph, renderPositions, viewport]);

  const handleNodeClick = useCallback((nodeId) => {
    setSelectedNodeId(nodeId);
    setSelectedBranchId(null);
  }, []);

  const handleNodeDoubleClick = useCallback((event, nodeId) => {
    event.preventDefault();
    event.stopPropagation();
    commitGraph((draft) => {
      draft[nodeId].collapsed = !draft[nodeId].collapsed;
    });
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, [commitGraph]);

  const handleWheel = useCallback((event) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    const nextScale = clamp(viewport.scale * (1 + delta), MIN_SCALE, MAX_SCALE);
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const worldPoint = screenToWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }, viewport);
    const x = event.clientX - rect.left - worldPoint.x * nextScale;
    const y = event.clientY - rect.top - worldPoint.y * nextScale;
    setViewport({ x, y, scale: nextScale });
  }, [viewport]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.past.length) {
        return h;
      }
      const restored = h.past[h.past.length - 1];
      const nextPast = h.past.slice(0, -1);
      setGraph(restored);
      return { past: nextPast, future: [cloneGraph(graph), ...h.future].slice(0, 30) };
    });
  }, [graph]);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (!h.future.length) {
        return h;
      }
      const restored = h.future[0];
      setGraph(restored);
      return { past: [...h.past, cloneGraph(graph)].slice(-30), future: h.future.slice(1) };
    });
  }, [graph]);

  const saveAssignment = useCallback(() => {
    if (!assignmentDraft) {
      return;
    }
    commitGraph((draft) => {
      draft[assignmentDraft.fromId].parentId = assignmentDraft.toId;
    }, `Connected ${graph[assignmentDraft.fromId]?.name} to ${graph[assignmentDraft.toId]?.name}.`);
    setAssignmentDraft(null);
    setSelectedNodeId(assignmentDraft.fromId);
  }, [assignmentDraft, commitGraph, graph]);

  const cancelAssignment = useCallback(() => {
    if (assignmentDraft?.originalParent !== undefined) {
      commitGraph((draft) => {
        draft[assignmentDraft.fromId].parentId = assignmentDraft.originalParent;
      });
    }
    setAssignmentDraft(null);
  }, [assignmentDraft, commitGraph]);

  const toggleCollapse = useCallback((nodeId) => {
    commitGraph((draft) => {
      draft[nodeId].collapsed = !draft[nodeId].collapsed;
    });
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, [commitGraph]);

  const collapseAll = useCallback(() => {
    commitGraph((draft) => {
      Object.values(draft).forEach((node) => {
        if (node.id !== 'JP') {
          node.collapsed = true;
        }
      });
    }, 'Collapsed all branches.');
    setExpandedIds(new Set(['JP']));
  }, [commitGraph]);

  const expandTopTeams = useCallback(() => {
    commitGraph((draft) => {
      ['JP', 'AK', 'SR'].forEach((id) => {
        if (draft[id]) {
          draft[id].collapsed = false;
        }
      });
    }, 'Focused top team branches.');
    setExpandedIds(new Set(['JP', 'AK', 'SR']));
  }, [commitGraph]);

  const miniScale = Math.min(210 / WORLD_W, 142 / WORLD_H);
  const miniViewport = {
    x: -viewport.x / viewport.scale * miniScale,
    y: -viewport.y / viewport.scale * miniScale,
    width: stageSize.width ? (stageSize.width / viewport.scale) * miniScale : 0,
    height: stageSize.height ? (stageSize.height / viewport.scale) * miniScale : 0,
  };

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">You are not logged in</h2>
        <p className="text-gray-500 mb-6">Please sign in to access your dashboard.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-gray-900 text-white font-semibold rounded-xl">
          Go to Login
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Session</h2>
        <p className="text-gray-500 mb-6">Your session has expired or is invalid. Please sign in again.</p>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            window.location.reload();
          }}
          className="px-6 py-2 bg-gray-900 text-white font-semibold rounded-xl"
        >
          Sign In Again
        </button>
      </div>
    );
  }

  const visibleIds = Object.keys(graph);

  return (
    <div className="org-editor" data-theme={theme}>
      <style>{STYLES}</style>

      <div className="org-shell">
        <header className="org-topbar">
          <div className="org-brand">
            <div className="org-brand-title">Pegboard</div>
            <div className="org-brand-sub">Organization Flow Editor</div>
          </div>
          <div className="org-actions">
            <button type="button" className="org-icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? '☀' : '☾'}
            </button>
            <button type="button" className="org-btn-ghost" onClick={undo} disabled={!history.past.length}>Undo</button>
            <button type="button" className="org-btn-ghost" onClick={redo} disabled={!history.future.length}>Redo</button>
            <button
              type="button"
              className="org-btn-ghost"
              onClick={() => {
                localStorage.removeItem('token');
                if (onLogout) {
                  onLogout();
                } else {
                  window.location.reload();
                }
              }}
            >
              Sign Out
            </button>
          </div>
        </header>

        <div className="org-main">
          <aside className="org-panel">
            <div>
              <div className="panel-title">Organization Flow</div>
              <p className="panel-copy">Click node cards for profile details. Use branch areas to drag complete subtrees and reconnect with ports.</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card"><strong>{visibleIds.length}</strong><span>Members</span></div>
              <div className="stat-card"><strong>{visibleIds.filter((id) => graph[id].parentId).length}</strong><span>Connected</span></div>
              <div className="stat-card"><strong>{TEAM_PILLS.length}</strong><span>Teams</span></div>
            </div>

            <div className="pill-wrap">
              {TEAM_PILLS.map((team) => (
                <button
                  key={team}
                  type="button"
                  className={`team-pill ${selectedDomain === team ? 'active' : ''}`}
                  onClick={() => setSelectedDomain((prev) => (prev === team ? null : team))}
                >
                  {team}
                </button>
              ))}
            </div>

            <div className="panel-actions">
              <button type="button" className="org-btn" onClick={() => centerOnNode('JP')}>See My Node</button>
              <button type="button" className="org-btn-ghost" onClick={collapseAll}>Collapse All</button>
              <button type="button" className="org-btn-ghost" onClick={expandTopTeams}>Focus Team</button>
            </div>
          </aside>

          <section className="canvas-wrap">
            <div ref={stageRef} className="canvas" onPointerDown={handleCanvasPointerDown} onWheel={handleWheel}>
              <div className="world" style={{ transform: graphTransform }}>
                <svg className="edge-layer" width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}>
                  {Object.values(graph).map((node) => {
                    if (!node.parentId) {
                      return null;
                    }
                    if (dragBranch && node.id === dragBranch.rootId) {
                      return null;
                    }
                    if (dragNode && node.id === dragNode.nodeId) {
                      return null;
                    }
                    const from = renderPositions[node.parentId];
                    const to = renderPositions[node.id];
                    if (!from || !to) {
                      return null;
                    }
                    const active = !highlightSet || (highlightSet.has(node.parentId) || highlightSet.has(node.id));
                    return <path key={`${node.parentId}-${node.id}`} d={getBezierPath(from, to)} className={`edge ${active ? 'active' : ''}`} />;
                  })}

                  {activeDrag ? (() => {
                    const sourceId = dragBranch ? dragBranch.rootId : dragNode.nodeId;
                    const sourcePos = renderPositions[sourceId];
                    if (!sourcePos) {
                      return null;
                    }
                    const source = getNodeCenter(sourcePos);
                    const target = nearestTargetId && renderPositions[nearestTargetId]
                      ? { x: renderPositions[nearestTargetId].x + NODE_W / 2, y: renderPositions[nearestTargetId].y }
                      : (dragBranch ? dragBranch.pointerWorld : dragNode.pointerWorld);
                    const midY = (source.y + target.y) / 2;
                    return (
                      <path
                        className="edge preview"
                        d={`M ${source.x} ${source.y + NODE_H / 2} C ${source.x} ${midY}, ${target.x} ${midY}, ${target.x} ${target.y}`}
                      />
                    );
                  })() : null}
                </svg>

                {Object.entries(branchBounds).map(([id, bounds]) => (
                  <div
                    key={`branch-${id}`}
                    className={`branch-hit ${selectedBranchId === id ? 'selected' : ''}`}
                    style={{ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height, pointerEvents: dragNode ? 'none' : 'auto' }}
                    onPointerDown={(event) => handleBranchPointerDown(event, id)}
                  />
                ))}

                {visibleIds.map((id) => {
                  const node = graph[id];
                  const position = renderPositions[id];
                  if (!position) {
                    return null;
                  }
                  const selected = selectedNodeId === id;
                  const dimmed = highlightSet ? !highlightSet.has(id) : false;
                  const dragging = activeDrag ? activeDragIds.has(id) : false;
                  const dropTarget = activeDrag && nearestTargetId === id;
                  const collapsed = !expandedIds.has(id) && (childrenMap.get(id) || []).length > 0;
                  return (
                    <NodeCard
                      key={id}
                      node={node}
                      position={position}
                      selected={selected}
                      dimmed={dimmed}
                      dragging={dragging}
                      dropTarget={Boolean(dropTarget)}
                      dragMode={Boolean(activeDrag)}
                      collapsed={collapsed}
                      onNodeClick={handleNodeClick}
                      onNodePointerDown={handleNodePointerDown}
                      onDoubleClick={handleNodeDoubleClick}
                    />
                  );
                })}

                {activeDrag && nearestTargetId ? (
                  <div className="drag-hint" style={{ left: renderPositions[nearestTargetId].x + NODE_W / 2 - 52, top: renderPositions[nearestTargetId].y - 24 }}>
                    Attach here
                  </div>
                ) : null}
              </div>

              {selectedNode ? (
                <aside className="detail-panel" onPointerDown={(event) => event.stopPropagation()}>
                  <div className="detail-head">
                    <div>
                      <div className="detail-name">{selectedNode.name}</div>
                      <div className="detail-sub">{selectedNode.status}</div>
                    </div>
                    <button type="button" className="org-icon-btn" onClick={() => setSelectedNodeId(null)} aria-label="Close profile panel">×</button>
                  </div>

                  <div className="detail-pills">
                    <span className="detail-pill">Role <strong>{selectedNode.role}</strong></span>
                    <span className="detail-pill">Team <strong>{selectedNode.team}</strong></span>
                    <span className="detail-pill">Reports to <strong>{selectedAncestor?.name || 'No manager'}</strong></span>
                    <span className="detail-pill">Workload <strong>{selectedNode.workload}/10</strong></span>
                  </div>

                  <div className="detail-actions">
                    <button type="button" className="org-btn-ghost" onClick={() => centerOnNode(selectedNodeId)}>Focus Node</button>
                    <button type="button" className="org-btn-ghost" onClick={() => toggleCollapse(selectedNodeId)}>{expandedIds.has(selectedNodeId) ? 'Collapse Subtree' : 'Expand Subtree'}</button>
                  </div>

                  {selectedChildren.length ? (
                    <div className="detail-list">
                      Direct reports: <strong>{selectedChildren.map((id) => graph[id]?.name).filter(Boolean).join(', ')}</strong>
                    </div>
                  ) : null}
                </aside>
              ) : null}

              <div className="zoom-pill">Wheel to zoom. Drag node cards for individual moves. Drag branch areas for subtree moves. Others stay static.</div>

              <div className="mini-map" onPointerDown={(event) => event.stopPropagation()}>
                <div className="mini-top" />
                <div className="mini-body">
                  {Object.entries(renderPositions).map(([id, pos]) => (
                    <span key={id} className="mini-node" style={{ left: (pos.x / WORLD_W) * 210, top: (pos.y / WORLD_H) * 118 }} />
                  ))}
                  <div
                    className="mini-viewport"
                    style={{
                      left: (miniViewport.x / WORLD_W) * 210,
                      top: (miniViewport.y / WORLD_H) * 118,
                      width: Math.max(16, (miniViewport.width / WORLD_W) * 210),
                      height: Math.max(16, (miniViewport.height / WORLD_H) * 118),
                    }}
                  />
                </div>
              </div>

              {assignmentDraft ? (
                <div className="modal-overlay" onPointerDown={(event) => event.stopPropagation()}>
                  <section className="modal-card">
                    <div className="modal-title">Assign New Task</div>
                    <div className="modal-sub">Connected {graph[assignmentDraft.fromId]?.name} under {graph[assignmentDraft.toId]?.name}.</div>

                    <div className="modal-grid">
                      <label className="modal-label">
                        Task title
                        <input
                          className="modal-input"
                          value={assignmentDraft.taskTitle}
                          onChange={(event) => setAssignmentDraft((prev) => (prev ? { ...prev, taskTitle: event.target.value } : prev))}
                        />
                      </label>
                      <label className="modal-label">
                        Priority
                        <select
                          className="modal-select"
                          value={assignmentDraft.priority}
                          onChange={(event) => setAssignmentDraft((prev) => (prev ? { ...prev, priority: event.target.value } : prev))}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </label>
                      <label className="modal-label">
                        Notes
                        <textarea
                          className="modal-textarea"
                          value={assignmentDraft.notes}
                          onChange={(event) => setAssignmentDraft((prev) => (prev ? { ...prev, notes: event.target.value } : prev))}
                        />
                      </label>
                    </div>

                    <div className="modal-actions">
                      <button type="button" className="org-btn-ghost" onClick={cancelAssignment}>Cancel</button>
                      <button type="button" className="org-btn" onClick={saveAssignment}>Save & Connect</button>
                    </div>
                  </section>
                </div>
              ) : null}

              {toast ? <div className="toast">{toast}</div> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
