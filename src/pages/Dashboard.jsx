import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const NODE_W = 120;

const NODE_H = 64;
const H_GAP = 60;
const V_GAP = 120;
const ROOT_GAP = 180;
const WORLD_W = 3400;
const WORLD_H = 2200;

const MIN_SCALE = 0.52;
const MAX_SCALE = 1.45;
const SNAP_RADIUS = 128;
const DRAG_START_THRESHOLD_PX = 8;
const TOP_OFFSET = 152;

const INITIAL_GRAPH = {
  JP: { id: 'JP', name: 'admin', parentId: null, childrenIds: ['AK', 'SR', 'KP', 'DW'], position: { x: 0, y: 0 }, collapsed: false, role: 'Admin', team: 'Operations', workload: 8, status: 'Organization owner', presence: 'available', skills: ['Strategy', 'Logistics', 'Leadership'], tasks: [{ id: 1, title: 'Strategic Planning', status: 'In Progress', start: 10, duration: 60, progress: 45 }, { id: 2, title: 'Budget Approval', status: 'To Do', start: 40, duration: 30, progress: 0 }] },
  AK: { id: 'AK', name: 'arun', parentId: 'JP', childrenIds: ['RC', 'TC'], position: { x: 0, y: 0 }, collapsed: false, role: 'Lead', team: 'Engineering', workload: 6, status: 'Managing engineering pod A', presence: 'away', skills: ['Architecture', 'Backend', 'Go'], tasks: [{ id: 3, title: 'Microservices Mesh', status: 'In Progress', start: 20, duration: 70, progress: 30 }, { id: 4, title: 'Onboarding docs', status: 'Done', start: 0, duration: 40, progress: 100 }] },
  SR: { id: 'SR', name: 'kavi', parentId: 'JP', childrenIds: ['MN', 'ED'], position: { x: 0, y: 0 }, collapsed: false, role: 'Lead', team: 'Engineering', workload: 7, status: 'Managing engineering pod B', presence: 'offline', skills: ['React', 'UI/UX', 'Figma'], tasks: [{ id: 5, title: 'Frontend Refactor', status: 'Pending', start: 50, duration: 40, progress: 10 }] },
  RC: { id: 'RC', name: 'sara', parentId: 'AK', childrenIds: [], position: { x: 0, y: 0 }, collapsed: false, role: 'Employee', team: 'Engineering', workload: 4, status: 'Task execution', presence: 'available', skills: ['CSS', 'Unit Testing', 'Tailwind'], tasks: [{ id: 6, title: 'Component Library', status: 'To Do', start: 30, duration: 50, progress: 0 }] },
  TC: { id: 'TC', name: 'mani', parentId: 'AK', childrenIds: [], position: { x: 0, y: 0 }, collapsed: false, role: 'Employee', team: 'Engineering', workload: 3, status: 'Task execution', presence: 'available', skills: ['Automation', 'PostgreSQL', 'Python'], tasks: [{ id: 7, title: 'Unit Tests', status: 'Done', start: 0, duration: 100, progress: 100 }] },
  MN: { id: 'MN', name: 'ravi', parentId: 'SR', childrenIds: [], position: { x: 0, y: 0 }, collapsed: false, role: 'Employee', team: 'Engineering', workload: 5, status: 'Feature delivery', presence: 'away', skills: ['REST APIs', 'Spring Boot', 'Java'], tasks: [{ id: 8, title: 'API Integration', status: 'In Progress', start: 15, duration: 65, progress: 20 }] },
  ED: { id: 'ED', name: 'vijay', parentId: 'SR', childrenIds: [], position: { x: 0, y: 0 }, collapsed: false, role: 'Employee', team: 'Engineering', workload: 4, status: 'Platform support', presence: 'available', skills: ['Cloud Infrastructure', 'AWS', 'Docker'], tasks: [{ id: 9, title: 'Logging System', status: 'Pending', start: 60, duration: 30, progress: 5 }] },
  KP: { id: 'KP', name: 'ajay', parentId: 'JP', childrenIds: [], position: { x: 0, y: 0 }, collapsed: false, role: 'Employee', team: 'Operations', workload: 6, status: 'General support', presence: 'available', skills: ['Finance', 'Procurement', 'Excel'], tasks: [{ id: 10, title: 'Asset Audit', status: 'Done', start: 0, duration: 90, progress: 100 }] },
  DW: { id: 'DW', name: 'deepa', parentId: 'JP', childrenIds: [], position: { x: 0, y: 0 }, collapsed: false, role: 'Employee', team: 'Operations', workload: 6, status: 'General support', presence: 'offline', skills: ['HR', 'Event Planning', 'Compliance'], tasks: [{ id: 11, title: 'Logistics Sync', status: 'To Do', start: 70, duration: 25, progress: 0 }] },
};

const TEAM_PILLS = ['UI/UX', 'Engineering', 'Marketing', 'QA', 'Product', 'Operations'];

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.org-editor {
  --bg: #ffffff;
  --surface: #f8f9fb;
  --border: #eeeeee;
  --text: #111111;
  --text-2: #666666;
  --accent: #4a7c7c;
  --line: #e2e8f0;
  --soft: #f1f5f9;
  --shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  --shadow-strong: 0 4px 20px rgba(0, 0, 0, 0.06);

  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', -apple-system, sans-serif;
  transition: background 200ms ease, color: 200ms ease;
}

.org-editor[data-theme='dark'] {
  --bg: #09090b;
  --surface: #18181b;
  --border: #27272a;
  --text: #fafafa;
  --text-2: #a1a1aa;
  --accent: #5e9292;
  --line: #27272a;
  --soft: #18181b;
  --shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  --shadow-strong: 0 8px 32px rgba(0, 0, 0, 0.6);
}

.department-cluster {
  position: absolute;
  background: color-mix(in srgb, var(--accent) 4%, transparent);
  border: 1px dashed color-mix(in srgb, var(--accent) 15%, transparent);
  border-radius: 24px;
  pointer-events: none;
  transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.cluster-label {
  position: absolute;
  top: -28px;
  left: 20px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
  opacity: 0.5;
}

.skill-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: color-mix(in srgb, var(--accent) 8%, var(--soft));
  border: 1px solid color-mix(in srgb, var(--accent) 15%, transparent);
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--accent);
  margin-right: 6px;
  margin-bottom: 6px;
  transition: all 150ms ease;
}

.skill-tag:hover {
  background: color-mix(in srgb, var(--accent) 12%, var(--soft));
  transform: translateY(-1px);
}


.search-container {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 100;
  width: 280px;
}

.search-input-wrapper {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  padding: 0 12px;
  transition: all 200ms ease;
}

.search-input-wrapper:focus-within {
  border-color: var(--accent);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.search-icon {
  width: 16px;
  height: 16px;
  color: var(--text-2);
  margin-right: 8px;
}

.search-input {
  width: 100%;
  height: 40px;
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: 0.85rem;
  color: var(--text);
  outline: none;
}

.search-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  max-height: 240px;
  overflow-y: auto;
  padding: 6px;
}

.search-result-item {
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: background 150ms ease;
}

.search-result-item:hover {
  background: var(--soft);
}

.search-result-item .meta {
  font-size: 0.65rem;
  color: var(--text-2);
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
  position: relative;
  z-index: 1000;
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
  gap: 12px;
}

.notif-bell {
  position: relative;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  cursor: pointer;
  transition: background 150ms ease;
  color: var(--text-2);
}

.notif-bell:hover {
  background: var(--soft);
  color: var(--text);
}

.notif-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  background: #ef4444;
  border-radius: 50%;
  border: 1px solid var(--bg);
}

.comment-section {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.comment-thread {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  display: grid;
  place-items: center;
  font-size: 0.6rem;
  font-weight: 700;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.comment-author {
  font-size: 0.75rem;
  font-weight: 600;
}

.comment-time {
  font-size: 0.65rem;
  color: var(--text-2);
}

.comment-text {
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--text);
}

.comment-input-wrap {
  margin-top: 20px;
  display: flex;
  gap: 8px;
}

.comment-input {
  flex: 1;
  background: var(--soft);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.75rem;
  color: var(--text);
  outline: none;
}

.org-btn,
.org-btn-ghost,
.org-icon-btn {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  border-radius: 6px;
  font: inherit;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease;
}

.org-icon-btn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
}

.org-btn,
.org-btn-ghost {
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.org-btn:hover,
.org-btn-ghost:hover,
.org-icon-btn:hover {
  border-color: var(--text-2);
  background: var(--soft);
}

.org-main {
  display: flex;
  flex-direction: column;
  padding: 14px;
  min-height: 0;
}

.toolbar {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  z-index: 40;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: none;
  background: transparent;
  color: var(--text-2);
  border-radius: 8px;
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease;
}

.toolbar-btn:hover {
  background: color-mix(in srgb, var(--text) 8%, transparent);
  color: var(--text);
}

.toolbar-btn svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.canvas-wrap {
  position: relative;
  min-width: 0;
  overflow: hidden;
  flex: 1;
}

.canvas {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  cursor: grab;
  background: var(--bg);
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
  stroke-width: 1.2;
  stroke-linecap: round;
  transition: opacity 250ms ease, d 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.edge-pulse {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-dasharray: 2 48;
  animation: flowPulse 4s linear infinite;
  opacity: 0.3;
  pointer-events: none;
}

@keyframes flowPulse {
  from { stroke-dashoffset: 50; }
  to { stroke-dashoffset: 0; }
}

.edge.preview {
  stroke: var(--text);
  stroke-width: 1.5;
  stroke-dasharray: 6 6;
  animation: edgeDash 0.8s linear infinite;
}

@keyframes edgeDash {
  to { stroke-dashoffset: -12; }
}

.branch-hit {
  position: absolute;
  border-radius: 16px;
  background: transparent;
  border: 1px dashed transparent;
  transition: border-color 120ms ease, background 120ms ease;
  z-index: 1;
}

.node {
  position: absolute;
  width: ${NODE_W}px;
  height: ${NODE_H}px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  box-shadow: var(--shadow);
  display: grid;
  grid-template-columns: 34px 1fr;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  transition: border-color 170ms ease, box-shadow 170ms ease, opacity 170ms ease, left 320ms cubic-bezier(0.22, 1, 0.36, 1), top 320ms cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 3;
  cursor: pointer;
}

.node::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: border-color 300ms ease, box-shadow 300ms ease;
  pointer-events: none;
  z-index: -1;
}

/* Health Rings mapping */
.node.health-low::after { border-color: #22c55e44; }
.node.health-medium::after { border-color: #f59e0b44; }
.node.health-high::after { border-color: #ef444444; }

.node:active {
  cursor: move;
}

.node:hover {
  border-color: var(--text-2);
  box-shadow: var(--shadow-strong);
}

.node.selected {
  border-color: var(--accent);
  border-width: 2px;
}

.node.dragging {
  opacity: 0.6;
}

.node.drop-target {
  border-color: var(--accent);
  background: var(--soft);
}

.node-port {
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 2px;
  left: 50%;
  transform: translateX(-50%);
  cursor: crosshair;
  z-index: 10;
  transition: transform 150ms ease, background 150ms ease, border-color 150ms ease;
}

.node-port:hover {
  transform: translateX(-50%) scale(1.3);
  background: var(--text);
  border-color: var(--text);
}

.node-port.top {
  top: -7px;
}

.node-port.bottom {
  bottom: -7px;
}

.node:hover {
  border-color: var(--text-2);
}

.node.selected {
  border-color: var(--accent);
}

.node.dimmed {
  opacity: 0.15;
}

.node.hidden {
  opacity: 0 !important;
  pointer-events: none;
}

.avatar {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--soft);
  color: var(--text-2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  border: 1px solid var(--border);
  z-index: 2;
}

.avatar-shell {
  position: relative;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
}

.avatar-halo {
  position: absolute;
  inset: -1px;
  border-radius: 50%;
  border: 1.5px solid transparent;
  transition: border-color 400ms ease, box-shadow 400ms ease;
  z-index: 1;
}

.avatar-halo.available {
  border-color: #22c55e66;
  box-shadow: 0 0 10px #22c55e33;
}
.avatar-halo.away {
  border-color: #f59e0b66;
  box-shadow: 0 0 10px #f59e0b33;
}
.avatar-halo.offline {
  border-color: #ef444466;
  box-shadow: 0 0 10px #ef444433;
}

.avatar-halo::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1px solid inherit;
  opacity: 0.3;
  animation: haloPulse 2.5s ease-out infinite;
}

@keyframes haloPulse {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(1.3); opacity: 0; }
}

.collapse-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--accent);
  color: #ffffff;
  font-size: 0.55rem;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 3px;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.meta .name {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta .role {
  font-size: 0.58rem;
  color: var(--text-2);
}

.meta .team {
  display: none;
}

.drag-hint {
  position: absolute;
  border: 1px solid var(--accent);
  background: var(--surface);
  color: var(--accent);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.65rem;
  font-weight: 600;
  pointer-events: none;
  z-index: 30;
}

.detail-panel {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 340px;
  max-height: calc(100% - 24px);
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  padding: 20px;
  z-index: 35;
  box-shadow: var(--shadow);
}

.task-list {
  margin-top: 24px;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.task-item:last-child {
  border-bottom: none;
}

.task-info {
  display: grid;
  gap: 2px;
}

.task-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text);
}

.task-status-pill {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--soft);
  color: var(--text-2);
  text-transform: uppercase;
  border: none;
  cursor: default;
}

.task-status-pill.editable {
  cursor: pointer;
  background: color-mix(in srgb, var(--accent) 12%, var(--surface));
  color: var(--accent);
  transition: background 150ms ease;
}

.task-status-pill.editable:hover {
  background: color-mix(in srgb, var(--accent) 20%, var(--surface));
}

.status-select {
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  outline: none;
}

.gantt-mini-wrap {
  margin-top: 8px;
  width: 100%;
}

.gantt-track {
  height: 4px;
  background: var(--soft);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.gantt-bar {
  position: absolute;
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  opacity: 0.3;
}

.gantt-progress {
  position: absolute;
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
}

.gantt-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 0.6rem;
  color: var(--text-2);
}

.capacity-bin {
  margin-top: 20px;
}

.capacity-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  margin-bottom: 6px;
  color: var(--text-2);
}

.capacity-track {
  height: 6px;
  background: var(--soft);
  border-radius: 999px;
  overflow: hidden;
}

.capacity-fill {
  height: 100%;
  background: var(--accent);
  transition: width 400ms ease;
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
.detail-pill {
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.65rem;
  color: var(--text-2);
}

.detail-pill strong {
  color: var(--text);
  font-weight: 500;
}

.detail-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
}

.detail-list {
  margin-top: 12px;
  font-size: 0.7rem;
  color: var(--text-2);
}

.mini-map {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 180px;
  height: 120px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  overflow: hidden;
  z-index: 24;
}

.mini-top {
  height: 20px;
  border-bottom: 1px solid var(--border);
  background: var(--soft);
}

.mini-body {
  position: relative;
  height: 100px;
}

.mini-node {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 1px;
  background: color-mix(in srgb, var(--text) 20%, var(--surface));
}

.mini-viewport {
  position: absolute;
  border: 1px solid var(--text-2);
  background: color-mix(in srgb, var(--text) 5%, transparent);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-card {
  width: 440px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  animation: modalScaleUp 240ms cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: auto;
}

@keyframes modalScaleUp {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.modal-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text);
}

.modal-sub {
  font-size: 0.85rem;
  color: var(--text-2);
  margin-bottom: 24px;
}

.modal-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.modal-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-2);
}

.modal-input,
.modal-select,
.modal-textarea {
  width: 100%;
  background: var(--soft);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  font-family: inherit;
  font-size: 0.85rem;
  color: var(--text);
  outline: none;
  transition: border-color 200ms ease;
  box-sizing: border-box;
}

.modal-input:focus,
.modal-select:focus,
.modal-textarea:focus {
  border-color: var(--accent);
}

.modal-textarea {
  height: 90px;
  resize: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.toast {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 8px 16px;
  z-index: 50;
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

  const place = (id, depth, startX, hiddenByParentId = null) => {
    if (hiddenByParentId) {
      if (positions[hiddenByParentId]) {
        positions[id] = { ...positions[hiddenByParentId] };
      } else {
        positions[id] = { x: startX, y: TOP_OFFSET + depth * V_GAP };
      }
      next[id].hidden = true;
      const actualChildren = childrenMap.get(id) || [];
      actualChildren.forEach((childId) => {
        place(childId, depth + 1, 0, hiddenByParentId);
      });
      return;
    }

    const width = measure(id);
    positions[id] = {
      x: startX + (width - NODE_W) / 2,
      y: TOP_OFFSET + depth * V_GAP,
    };
    next[id].hidden = false;

    const actualChildren = childrenMap.get(id) || [];
    if (next[id].collapsed) {
      next[id].hiddenCount = getDescendants(childrenMap, id).size;
      actualChildren.forEach((childId) => {
        place(childId, depth + 1, 0, id);
      });
    } else {
      next[id].hiddenCount = 0;
      let childCursor = startX;
      actualChildren.forEach((childId, index) => {
        place(childId, depth + 1, childCursor);
        childCursor += measure(childId) + (index < actualChildren.length - 1 ? H_GAP : 0);
      });
    }
  };

  roots.forEach((rootId, index) => {
    place(rootId, 0, cursorX);
    cursorX += measure(rootId) + (index < roots.length - 1 ? ROOT_GAP : 0);
  });

  Object.entries(positions).forEach(([id, position]) => {
    if (!next[id].manualPosition) {
      next[id].position = position;
    }
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
  onPortPointerDown,
  onNodePointerDown,
  onDoubleClick,
}) {
    const healthClass = node.workload <= 4 ? 'health-low' : node.workload <= 7 ? 'health-medium' : 'health-high';

    return (
      <div
        className={`node ${selected ? 'selected' : ''} ${dimmed ? 'dimmed' : ''} ${node.hidden ? 'hidden' : ''} ${dropTarget ? 'drop-target' : ''} ${dragMode ? 'drag-mode' : ''} ${dragging ? 'dragging' : ''} ${healthClass}`}
        style={{ left: position.x, top: position.y }}
      onClick={(event) => {
        event.stopPropagation();
        onNodeClick(node.id);
      }}
      onPointerDown={(event) => onNodePointerDown(event, node.id)}
      onDoubleClick={(event) => onDoubleClick(event, node.id)}
      draggable={false}
    >
      <div className="node-port top" onPointerDown={(event) => onPortPointerDown(event, node.id, 'top')} />
      <div className="node-port bottom" onPointerDown={(event) => onPortPointerDown(event, node.id, 'bottom')} />
      {collapsed ? <div className="node-pulse" /> : null}
      <div className="avatar-shell">
        <div className={`avatar-halo ${node.presence || 'offline'}`} />
        <div className="avatar">
          {node.name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        {collapsed && node.hiddenCount > 0 && (
          <div className="collapse-indicator">+{node.hiddenCount}</div>
        )}
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
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [viewport, setViewport] = useState({ x: 90, y: 88, scale: 1 });
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [panning, setPanning] = useState(null);
  const [dragConnection, setDragConnection] = useState(null);
  const [dragNode, setDragNode] = useState(null);
  const [pendingAssignment, setPendingAssignment] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ name: '', priority: 'Normal' });
  const [toast, setToast] = useState('');
  const [history, setHistory] = useState({ past: [], future: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeComment, setActiveComment] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const centerOnNode = useCallback((nodeId) => {
    const pos = graph[nodeId]?.position;
    if (!pos || !stageRef.current) return;
    
    const rect = stageRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const nextScale = 1;
    const x = centerX - pos.x * nextScale - (NODE_W / 2) * nextScale;
    const y = centerY - pos.y * nextScale - (NODE_H / 2) * nextScale;

    setViewport({ x, y, scale: nextScale });
    setSelectedNodeId(nodeId);
    setSearchQuery('');
  }, [graph]);

  const updateTaskStatus = (nodeId, taskId, newStatus) => {
    setGraph((prev) => {
      const next = { ...prev };
      const node = { ...next[nodeId] };
      node.tasks = node.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
      next[nodeId] = node;
      return next;
    });
    setToast(`Task status updated to ${newStatus}`);
    
    // Auto-log status change to comments
    addComment(nodeId, `Updated task to ${newStatus}`);
    
    setTimeout(() => setToast(''), 3000);
  };

  const addComment = (nodeId, text) => {
    if (!text.trim()) return;
    setGraph(prev => {
      const next = { ...prev };
      const node = { ...next[nodeId] };
      if (!node.comments) node.comments = [];
      node.comments = [
        {
          id: Date.now(),
          author: user?.name || 'Admin',
          text: text,
          time: 'Just now',
          avatar: (user?.name || 'A')[0].toUpperCase()
        },
        ...node.comments
      ];
      next[nodeId] = node;
      return next;
    });
    setActiveComment('');
  };

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

  const renderPositions = useMemo(() => {
    const map = Object.fromEntries(Object.entries(graph).map(([id, node]) => [id, { ...node.position }]));
    if (dragNode) {
      const base = graph[dragNode.nodeId]?.position;
      if (base) {
        map[dragNode.nodeId] = {
          x: dragNode.pointerWorld.x - dragNode.offsetX,
          y: dragNode.pointerWorld.y - dragNode.offsetY,
        };
      }
    }
    return map;
  }, [dragNode, graph]);

  const nearestTargetId = useMemo(() => {
    if (!dragConnection) {
      return null;
    }
    const pointer = dragConnection.pointerWorld;
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    Object.entries(renderPositions).forEach(([id, pos]) => {
      if (id === dragConnection.nodeId) {
        return;
      }
      
      let targetPort;
      if (dragConnection.port === 'bottom') {
        targetPort = { x: pos.x + NODE_W / 2, y: pos.y };
      } else {
        targetPort = { x: pos.x + NODE_W / 2, y: pos.y + NODE_H };
      }

      const dist = Math.hypot(targetPort.x - pointer.x, targetPort.y - pointer.y);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearest = id;
      }
    });
    return nearest && nearestDistance <= SNAP_RADIUS ? nearest : null;
  }, [dragConnection, renderPositions]);

  const graphTransform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`;

  const commitGraph = useCallback((mutate, message, shouldLayout = true) => {
    setGraph((prev) => {
      const before = cloneGraph(prev);
      const draft = cloneGraph(prev);
      mutate(draft);
      const result = shouldLayout ? layoutGraph(draft) : draft;
      setHistory((h) => ({ past: [...h.past, before].slice(-30), future: [] }));
      if (message) {
        setToast(message);
      }
      return result;
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


  useEffect(() => {
    const handleMove = (event) => {
      if (dragConnection && stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const pointerWorld = screenToWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }, viewport);
        setDragConnection((current) => (current ? { ...current, pointerWorld } : current));
      }

      if (dragNode && stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const pointerWorld = screenToWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }, viewport);
        const moved = Math.hypot(event.clientX - dragNode.startClientX, event.clientY - dragNode.startClientY) > 3;
        setDragNode((current) => (current ? { ...current, pointerWorld, moved } : current));
      }

      if (panning) {
        const deltaX = event.clientX - panning.startX;
        const deltaY = event.clientY - panning.startY;
        setViewport({ x: panning.originX + deltaX, y: panning.originY + deltaY, scale: viewport.scale });
      }
    };

    const handleUp = () => {
      if (dragNode) {
        const moved = dragNode.moved;
        const sourceId = dragNode.nodeId;
        setDragNode(null);
        if (moved) {
          const newPos = {
            x: dragNode.pointerWorld.x - dragNode.offsetX,
            y: dragNode.pointerWorld.y - dragNode.offsetY,
          };
          commitGraph((draft) => {
            if (draft[sourceId]) {
              draft[sourceId].position = newPos;
              draft[sourceId].manualPosition = true;
            }
          }, null, false);
        }
      }

      if (dragConnection) {
        const sourceId = dragConnection.nodeId;
        const targetId = nearestTargetId;
        const port = dragConnection.port;
        const originalParent = dragConnection.originalParent;

        setDragConnection(null);

        if (targetId) {
          // Prevent cycle checks and direct parent reassignment
          let newChild = targetId;
          let newParent = sourceId;

          if (port === 'top') {
            newChild = sourceId;
            newParent = targetId;
          }

          setPendingAssignment({ 
            fromId: newChild, 
            toId: newParent 
          });
          setIsTaskModalOpen(true);
          setTaskForm({ name: '', priority: 'Normal' });
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
  }, [commitGraph, dragConnection, dragNode, graph, nearestTargetId, panning, viewport]);

  const handleCanvasPointerDown = useCallback((event) => {
    if (event.button !== 0 || dragConnection || dragNode) {
      return;
    }
    setSelectedNodeId(null);
    setSelectedBranchId(null);
    setPanning({ startX: event.clientX, startY: event.clientY, originX: viewport.x, originY: viewport.y });
  }, [dragConnection, dragNode, viewport]);

  const handlePortPointerDown = useCallback((event, nodeId, port) => {
    if (!stageRef.current || event.button !== 0) {
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

    setDragConnection({
      nodeId,
      port,
      startPointer: pointerWorld,
      pointerWorld,
      originalParent: graph[nodeId].parentId,
    });
  }, [graph, renderPositions, viewport]);

  const handleNodePointerDown = useCallback((event, nodeId) => {
    if (!stageRef.current || event.button !== 0 || dragConnection) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const pos = renderPositions[nodeId];
    if (!pos) return;
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
      moved: false,
    });
  }, [dragConnection, renderPositions, viewport]);

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
    if (!pendingAssignment) return;
    
    commitGraph((draft) => {
      const { fromId, toId } = pendingAssignment;
      if (draft[fromId]) {
        draft[fromId].parentId = toId;
        if (!draft[fromId].tasks) draft[fromId].tasks = [];
        
        draft[fromId].tasks.push({
          id: Date.now(),
          title: taskForm.name || 'New Mission',
          status: 'To Do',
          priority: taskForm.priority,
          start: 20,
          duration: 30,
          progress: 0
        });
      }
    }, `Assigned ${taskForm.name} to ${graph[pendingAssignment.fromId]?.name}`);
    
    setPendingAssignment(null);
    setIsTaskModalOpen(false);
    setSelectedNodeId(pendingAssignment.fromId);
  }, [pendingAssignment, taskForm, commitGraph, graph]);

  const cancelAssignment = useCallback(() => {
    setPendingAssignment(null);
    setIsTaskModalOpen(false);
  }, []);

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

  const clusters = useMemo(() => {
    const teamMap = {};
    Object.keys(graph).forEach(id => {
      const node = graph[id];
      const pos = renderPositions[id];
      if (!pos || node.hidden) return;
      
      const team = node.team || 'General';
      if (!teamMap[team]) {
        teamMap[team] = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity, count: 0 };
      }
      const t = teamMap[team];
      t.minX = Math.min(t.minX, pos.x);
      t.minY = Math.min(t.minY, pos.y);
      t.maxX = Math.max(t.maxX, pos.x + NODE_W);
      t.maxY = Math.max(t.maxY, pos.y + NODE_H);
      t.count++;
    });

    return Object.entries(teamMap)
      .filter(([_, t]) => t.count > 1) 
      .map(([team, t]) => ({
        team,
        x: t.minX - 40,
        y: t.minY - 40,
        w: (t.maxX - t.minX) + 80,
        h: (t.maxY - t.minY) + 80
      }));
  }, [graph, renderPositions, expandedIds]);


  return (
    <div className="org-editor" data-theme={theme} style={{ position: 'relative' }}>
      <style>{STYLES}</style>

      {isTaskModalOpen && pendingAssignment ? (
        <div 
          className="modal-overlay" 
          onPointerDown={(event) => event.stopPropagation()} 
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.2)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
          }}
        >
          <section
            className="modal-card"
            style={{
              width: 420,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              pointerEvents: 'auto',
              animation: 'modalScaleUp 240ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8, color: 'var(--text)' }}>
              New Task Assignment
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 24 }}>
              Establishing link: <b>{graph[pendingAssignment.fromId]?.name}</b> → <b>{graph[pendingAssignment.toId]?.name}</b>
            </div>

            
            {(taskForm.name.length > 2 && graph[pendingAssignment.toId]?.skills) && (
              <div style={{ marginTop: -8, marginBottom: 12 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Potential Expertise Match:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {graph[pendingAssignment.toId].skills.map(skill => {
                    const isMatch = taskForm.name.toLowerCase().includes(skill.toLowerCase());
                    return (
                      <span key={skill} className="skill-tag" style={{ 
                        opacity: isMatch ? 1 : 0.4, 
                        borderColor: isMatch ? 'var(--accent)' : 'var(--border)',
                        background: isMatch ? 'color-mix(in srgb, var(--accent) 15%, var(--soft))' : 'var(--soft)'
                      }}>
                        {skill} {isMatch && '✓'}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
<div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                Task Name
                <input
                  style={{
                    width: '100%',
                    background: 'var(--soft)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Task description..."
                  value={taskForm.name}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, name: e.target.value }))}
                  autoFocus
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)' }}>
                Priority
                <select
                  style={{
                    width: '100%',
                    background: 'var(--soft)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                type="button" 
                className="org-btn-ghost" 
                onClick={cancelAssignment}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="org-btn" 
                onClick={saveAssignment}
                style={{ padding: '8px 20px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, background: 'var(--accent)', color: 'white', border: 'none' }}
              >
                Save Assignment
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <div className="org-shell">
        <header className="org-topbar">
          <div className="org-brand">
            <div className="org-brand-title">Pegboard</div>
            <div className="org-brand-sub">Organization Flow Editor</div>
          </div>
          <div className="org-actions">
            <div className="notif-bell" onClick={() => setNotifOpen(!notifOpen)} style={{ cursor: 'pointer', position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <div className="notif-dot" />
              {notifOpen && (
                <div className="notif-dropdown" style={{ 
                  position: 'absolute', top: '100%', right: 0, width: 220, 
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: 12, boxShadow: 'var(--shadow-strong)',
                  zIndex: 1000, marginTop: 12
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: 8 }}>Recent Activity</div>
                  {history.past.slice(-3).reverse().map((h, i) => (
                    <div key={i} style={{ fontSize: '0.65rem', padding: '6px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', color: 'var(--text-2)' }}>
                      {h.message || 'System update'}
                    </div>
                  ))}
                  {history.past.length === 0 && <div style={{ fontSize: '0.65rem', color: 'var(--text-2)' }}>No new alerts</div>}
                </div>
              )}
            </div>
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
          <section className="canvas-wrap">
            <div className="search-container">
              <div className="search-input-wrapper">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search team members..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {searchQuery.length >= 1 && (
                <div className="search-results">
                  {Object.values(graph)
                    .filter(node => 
                      node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      node.team.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(node => (
                      <div 
                        key={node.id} 
                        className="search-result-item"
                        onClick={() => centerOnNode(node.id)}
                      >
                        <div style={{ fontWeight: 600 }}>{node.name}</div>
                        <div className="meta">{node.team} • {node.role}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div ref={stageRef} className="canvas" onPointerDown={handleCanvasPointerDown} onWheel={handleWheel}>
              <div className="world" style={{ transform: graphTransform }}>
                {clusters.map((c) => (
                  <div 
                    key={c.team} 
                    className="department-cluster" 
                    style={{ left: c.x, top: c.y, width: c.w, height: c.h }}
                  >
                    <div className="cluster-label">{c.team} Department</div>
                  </div>
                ))}

                <svg className="edge-layer" width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}>
                  {Object.values(graph).map((node) => {
                    if (!node.parentId) {
                      return null;
                    }
                    const from = renderPositions[node.parentId];
                    const to = renderPositions[node.id];
                    if (!from || !to) {
                      return null;
                    }
                    const active = !highlightSet || (highlightSet.has(node.parentId) || highlightSet.has(node.id));
                    const isHiddenEdge = node.hidden || graph[node.parentId]?.hidden;
                    const pathData = getBezierPath(from, to);
                    return (
                      <React.Fragment key={`${node.parentId}-${node.id}`}>
                        <path
                          d={pathData}
                          className="edge"
                          style={{ opacity: isHiddenEdge ? 0 : active ? 1 : 0.2 }}
                        />
                        {!isHiddenEdge && active && (
                          <path
                            d={pathData}
                            className="edge-pulse"
                          />
                        )}
                      </React.Fragment>
                    );
                  })}

                  {dragConnection ? (() => {
                    const sourceId = dragConnection.nodeId;
                    const sourcePos = renderPositions[sourceId];
                    if (!sourcePos) {
                      return null;
                    }
                    
                    let sourceX = sourcePos.x + NODE_W / 2;
                    let sourceY = dragConnection.port === 'top' ? sourcePos.y : sourcePos.y + NODE_H;
                    let targetX = dragConnection.pointerWorld.x;
                    let targetY = dragConnection.pointerWorld.y;

                    if (nearestTargetId && renderPositions[nearestTargetId]) {
                      const pos = renderPositions[nearestTargetId];
                      targetX = pos.x + NODE_W / 2;
                      targetY = dragConnection.port === 'bottom' ? pos.y : pos.y + NODE_H;
                    }
                    
                    const midY = (sourceY + targetY) / 2;
                    return (
                      <path
                        className="edge preview"
                        d={`M ${sourceX} ${sourceY} C ${sourceX} ${midY}, ${targetX} ${midY}, ${targetX} ${targetY}`}
                      />
                    );
                  })() : null}
                </svg>

                {visibleIds.map((id) => {
                  const node = graph[id];
                  const position = renderPositions[id];
                  if (!position) {
                    return null;
                  }
                  const selected = selectedNodeId === id;
                  const dimmed = highlightSet ? !highlightSet.has(id) : false;
                  const dropTarget = dragConnection && nearestTargetId === id;
                  const collapsed = !expandedIds.has(id) && (childrenMap.get(id) || []).length > 0;
                  const dragging = dragNode && dragNode.nodeId === id;
                  return (
                    <NodeCard
                      key={id}
                      node={node}
                      position={position}
                      selected={selected}
                      dimmed={dimmed}
                      dragging={dragging}
                      dropTarget={Boolean(dropTarget)}
                      dragMode={Boolean(dragConnection)}
                      collapsed={collapsed}
                      onNodeClick={handleNodeClick}
                      onPortPointerDown={handlePortPointerDown}
                      onNodePointerDown={handleNodePointerDown}
                      onDoubleClick={handleNodeDoubleClick}
                    />
                  );
                })}

                {dragConnection && nearestTargetId ? (
                  <div className="drag-hint" style={{ left: renderPositions[nearestTargetId].x + NODE_W / 2 - 52, top: renderPositions[nearestTargetId].y - 24 }}>
                    Attach here
                  </div>
                ) : null}
              </div>

              {selectedNodeId && selectedNode ? (
                <aside 
                  className="detail-panel" 
                  onPointerDown={(event) => event.stopPropagation()}
                  onWheel={(event) => event.stopPropagation()}
                >
                  <div className="detail-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div className="detail-name" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>{selectedNode.name}</div>
                    <button 
                      type="button" 
                      className="org-icon-btn" 
                      onClick={() => setSelectedNodeId(null)} 
                      style={{ width: 28, height: 28, fontSize: '1.2rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -2 }}
                    >
                      ×
                    </button>
                  </div>
                  <div className="detail-sub">{selectedNode.status}</div>

                  <div className="capacity-bin">
                    <div className="capacity-label">
                      <span>Workload Capacity</span>
                      <span>{selectedNode.workload * 10}%</span>
                    </div>
                    <div className="capacity-track">
                      <div className="capacity-fill" style={{ width: `${selectedNode.workload * 10}%` }} />
                    </div>
                  </div>

                  <div className="detail-pills">
                    <span className="detail-pill">Role <strong>{selectedNode.role}</strong></span>
                    <span className="detail-pill">Team <strong>{selectedNode.team}</strong></span>
                    <span className="detail-pill">Reports to <strong>{selectedAncestor?.name || 'No manager'}</strong></span>
                  </div>

                  <div className="task-list">
                    <div className="detail-sub" style={{ marginBottom: 12, fontWeight: 700, color: 'var(--text)' }}>
                      Current Tasks ({selectedNode.tasks?.length || 0})
                    </div>
                    {selectedNode.tasks && selectedNode.tasks.length > 0 ? (
                      selectedNode.tasks.map((task) => {
                        const userRole = user?.role || 'Admin';
                        const isAuthorized = userRole === 'Admin' || userRole === 'Lead';

                        return (
                          <React.Fragment key={task.id}>
                            <div className="task-item" style={{ marginBottom: 4 }}>
                              <div className="task-info">
                                <div className="task-title" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{task.title}</div>
                              </div>
                              <div className={`task-status-pill ${isAuthorized ? 'editable' : ''}`}>
                                {isAuthorized ? (
                                  <select 
                                    className="status-select"
                                    value={task.status}
                                    onChange={(e) => updateTaskStatus(selectedNodeId, task.id, e.target.value)}
                                  >
                                    <option value="To Do">To Do</option>
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Done">Done</option>
                                  </select>
                                ) : (
                                  task.status
                                )}
                              </div>
                            </div>
                            <div className="gantt-mini-wrap" style={{ marginBottom: 16 }}>
                              <div className="gantt-track">
                                <div className="gantt-bar" style={{ left: `${task.start}%`, width: `${task.duration}%` }} />
                                <div className="gantt-progress" style={{ left: `${task.start}%`, width: `${(task.duration * (task.progress || 0)) / 100}%` }} />
                              </div>
                              <div className="gantt-meta">
                                <span>Schedule</span>
                                <span>{task.progress || 0}%</span>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <div className="detail-sub" style={{ fontSize: '0.7rem', fontStyle: 'italic', opacity: 0.6 }}>No active tasks assigned.</div>
                    )}
                  </div>

                  <div className="detail-actions" style={{ marginTop: 24 }}>
                    <button type="button" className="org-btn-ghost" onClick={() => centerOnNode(selectedNodeId)}>Focus Node</button>
                    <button type="button" className="org-btn-ghost" onClick={() => toggleCollapse(selectedNodeId)}>{expandedIds.has(selectedNodeId) ? 'Collapse Subtree' : 'Expand Subtree'}</button>
                  </div>
                  <div className="comment-section">
                    <div className="detail-sub" style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Activity Feed</div>
                    <div className="comment-thread">
                      {selectedNode.comments && selectedNode.comments.length > 0 ? (
                        selectedNode.comments.map(c => (
                          <div className="comment-item" key={c.id}>
                            <div className="comment-avatar">{c.avatar}</div>
                            <div className="comment-content">
                              <div className="comment-header">
                                <span className="comment-author">{c.author}</span>
                                <span className="comment-time">{c.time}</span>
                              </div>
                              <p className="comment-text">{c.text}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="comment-item">
                          <div className="comment-avatar">SYS</div>
                          <div className="comment-content">
                            <div className="comment-header">
                              <span className="comment-author">System Bot</span>
                              <span className="comment-time">Now</span>
                            </div>
                            <p className="comment-text">Waiting for activity on this node.</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="comment-input-wrap">
                      <input 
                        className="comment-input" 
                        placeholder="Type a message..." 
                        value={activeComment}
                        onChange={(e) => setActiveComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addComment(selectedNodeId, activeComment)}
                      />
                      <button 
                        className="org-btn" 
                        style={{ padding: '4px 12px', fontSize: '0.65rem' }}
                        onClick={() => addComment(selectedNodeId, activeComment)}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </aside>
              ) : null}

              <div className="toolbar" onPointerDown={(event) => event.stopPropagation()}>
                <button type="button" className="toolbar-btn" onClick={() => centerOnNode('JP')} title="Locate My Profile">
                  <svg viewBox="0 0 24 24"><path d="M12 2v2M12 20v2M2 12h2M20 12h2" /><circle cx="12" cy="12" r="7" /></svg>
                </button>
                <button type="button" className="toolbar-btn" onClick={collapseAll} title="Collapse All Branches">
                  <svg viewBox="0 0 24 24"><path d="M4 14h6v6" /><path d="M20 10h-6V4" /><path d="M14 10l7-7" /><path d="M3 21l7-7" /></svg>
                </button>
                <button type="button" className="toolbar-btn" onClick={expandTopTeams} title="Focus Team">
                  <svg viewBox="0 0 24 24"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                </button>
              </div>

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
              {toast ? <div className="toast">{toast}</div> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
