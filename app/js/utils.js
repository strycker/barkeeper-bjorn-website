// Shared utilities

const Utils = (() => {

  function el(tag, attrs = {}, ...children) {
    const elem = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') elem.className = v;
      else if (k === 'style') Object.assign(elem.style, v);
      else if (k.startsWith('on')) elem.addEventListener(k.slice(2).toLowerCase(), v);
      else elem.setAttribute(k, v);
    });
    children.forEach(c => {
      if (c == null) return;
      elem.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return elem;
  }

  function html(str) {
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.firstElementChild;
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function today() {
    return new Date().toISOString().split('T')[0];
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = el('div', { class: `toast toast-${type}` }, message);
    container.appendChild(toast);
    // Animate in
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    setTimeout(() => {
      toast.classList.remove('toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function showLoading(container, message = 'Loading…') {
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>${escapeHtml(message)}</p>
      </div>`;
  }

  function showError(container, message) {
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠</div>
        <p>${escapeHtml(message)}</p>
      </div>`;
  }

  function countInventoryItems(inventory) {
    if (!inventory) return 0;
    let count = 0;
    const spirits = inventory.base_spirits || {};
    Object.values(spirits).forEach(arr => { if (Array.isArray(arr)) count += arr.length; });
    const liqueurs = inventory.liqueurs_and_cordials || {};
    Object.values(liqueurs).forEach(arr => { if (Array.isArray(arr)) count += arr.length; });
    const bitters = inventory.bitters || {};
    Object.values(bitters).forEach(arr => { if (Array.isArray(arr)) count += arr.length; });
    if (Array.isArray(inventory.fortified_wines_and_aperitif_wines)) count += inventory.fortified_wines_and_aperitif_wines.length;
    if (Array.isArray(inventory.syrups)) count += inventory.syrups.length;
    return count;
  }

  // Axis position string or float → 0..1 numeric (A=0, B=1, Middle=0.5)
  function axisToValue(pos) {
    if (pos === null || pos === undefined || pos === '—') return null;
    if (typeof pos === 'number') return Math.max(0, Math.min(1, pos));
    const p = pos.toLowerCase();
    if (p.includes('strong a')) return 0.05;
    if (p.includes('lean a'))   return 0.25;
    if (p.includes('middle'))   return 0.5;
    if (p.includes('lean b'))   return 0.75;
    if (p.includes('strong b')) return 0.95;
    // Fallback: try to parse a number
    const n = parseFloat(pos);
    if (!isNaN(n)) return Math.max(0, Math.min(1, n));
    return null;
  }

  function valueToAxisLabel(val) {
    if (val <= 0.15)  return 'Strong A';
    if (val <= 0.35)  return 'Lean A';
    if (val <= 0.65)  return 'Middle';
    if (val <= 0.85)  return 'Lean B';
    return 'Strong B';
  }

  return { el, html, escapeHtml, today, formatDate, showToast, showLoading, showError,
           countInventoryItems, axisToValue, valueToAxisLabel };
})();
