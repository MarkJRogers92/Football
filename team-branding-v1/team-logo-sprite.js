// Dynasty Lab Team Branding v1 — staging atlas helper.
// The atlas is 12 columns x 10 rows, one 32px logo cell per canonical numeric teamId.
// This file is intentionally framework-free so Claude can adapt it to the existing app architecture.
(function (root) {
  'use strict';

  const COLS = 12;
  const ROWS = 10;
  const NATIVE_CELL = 32;
  const DEFAULT_ATLAS_PATH = 'team-branding-v1/team-logos-atlas-32.png';

  function validTeamId(teamId) {
    const id = Number(teamId);
    return Number.isInteger(id) && id >= 1 && id <= 120 ? id : null;
  }

  function spriteCoordinates(teamId) {
    const id = validTeamId(teamId);
    if (!id) return null;
    const index = id - 1;
    return { id, col: index % COLS, row: Math.floor(index / COLS) };
  }

  function spriteStyle(teamId, size = 32, atlasPath = DEFAULT_ATLAS_PATH) {
    const pos = spriteCoordinates(teamId);
    if (!pos) return null;
    const s = Number(size) > 0 ? Number(size) : NATIVE_CELL;
    return {
      width: `${s}px`,
      height: `${s}px`,
      display: 'inline-block',
      backgroundImage: `url("${atlasPath}")`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${COLS * s}px ${ROWS * s}px`,
      backgroundPosition: `${-pos.col * s}px ${-pos.row * s}px`,
      flex: '0 0 auto'
    };
  }

  function applySprite(el, teamId, size = 32, atlasPath = DEFAULT_ATLAS_PATH) {
    if (!el) return false;
    const style = spriteStyle(teamId, size, atlasPath);
    if (!style) return false;
    Object.assign(el.style, style);
    el.setAttribute('role', 'img');
    el.dataset.teamLogoId = String(Number(teamId));
    return true;
  }

  root.DynastyTeamBranding = {
    COLS,
    ROWS,
    NATIVE_CELL,
    DEFAULT_ATLAS_PATH,
    spriteCoordinates,
    spriteStyle,
    applySprite
  };
})(typeof window !== 'undefined' ? window : globalThis);
