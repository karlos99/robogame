import { MAP, COLS, ROWS, W, H } from '../world/maps.js';

const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');

export function drawMinimap(pos, angle) {
  const ctx = minimapCtx;
  const cw = minimapCanvas.width;
  const ch = minimapCanvas.height;
  const scaleX = cw / COLS;
  const scaleY = ch / ROWS;

  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, cw, ch);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = MAP[r][c];
      const x = c * scaleX;
      const y = r * scaleY;

      if (v === 5 || v === 9 || v === 6 || v === 7 || v === 8) {
        ctx.fillStyle = '#1c1c2e';
        ctx.fillRect(x, y, scaleX, scaleY);
      }

      if (v === 1 || v === 6) {
        ctx.fillStyle = v === 6 ? '#5a5a7a' : '#3a3a5a';
        ctx.fillRect(x, y, scaleX, scaleY);
      } else if (v === 2 || v === 7) {
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(x + 1, y + 1, scaleX - 2, scaleY - 2);
      } else if (v === 3 || v === 8) {
        ctx.fillStyle = '#556B2F';
        ctx.beginPath();
        ctx.arc(x + scaleX / 2, y + scaleY / 2, Math.min(scaleX, scaleY) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (['RU', 'RD', 'RL', 'RR'].includes(v)) {
        ctx.fillStyle = '#3a5a6e';
        ctx.fillRect(x, y, scaleX, scaleY);
        ctx.fillStyle = '#44ffaa';
        ctx.font = '7px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let arrow = '\u25b2';
        if (v === 'RD') arrow = '\u25bc';
        if (v === 'RL') arrow = '\u25c0';
        if (v === 'RR') arrow = '\u25b6';
        ctx.fillText(arrow, x + scaleX / 2, y + scaleY / 2);
      } else if (v === 9) {
        ctx.fillStyle = '#e94560';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u2605', x + scaleX / 2, y + scaleY / 2);
      } else if (v === 'S') {
        ctx.fillStyle = 'rgba(233,69,96,0.2)';
        ctx.beginPath();
        ctx.arc(x + scaleX / 2, y + scaleY / 2, Math.min(scaleX, scaleY) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const mx = ((pos.x + W / 2) / W) * cw;
  const mz = ((pos.z + H / 2) / H) * ch;

  ctx.fillStyle = '#44ddff';
  ctx.beginPath();
  ctx.arc(mx, mz, 3, 0, Math.PI * 2);
  ctx.fill();

  const dirLen = 7;
  const dirX = mx + Math.sin(angle) * dirLen;
  const dirY = mz + Math.cos(angle) * dirLen;
  ctx.strokeStyle = '#44ffaa';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mx, mz);
  ctx.lineTo(dirX, dirY);
  ctx.stroke();

  const headLen = 3;
  const headAngle = 0.5;
  ctx.fillStyle = '#44ffaa';
  ctx.beginPath();
  ctx.moveTo(dirX, dirY);
  ctx.lineTo(dirX - Math.sin(angle - headAngle) * headLen, dirY - Math.cos(angle - headAngle) * headLen);
  ctx.lineTo(dirX - Math.sin(angle + headAngle) * headLen, dirY - Math.cos(angle + headAngle) * headLen);
  ctx.closePath();
  ctx.fill();
}
