(function () {
  var LOG_KEY = 'bagha_debug_logs_v1';
  var logs = [];
  try { logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch (e) { logs = []; }

  var panel = null;
  var logView = null;
  var badge = null;
  var isOpen = false;

  function saveLogs() {
    try { localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(-200))); } catch (e) {}
  }

  function formatLogs() {
    if (!logs.length) return '✅ خطایی ثبت نشده.';
    return logs.map(function (l) {
      return '[' + l.time + '] ' + l.type + ': ' + l.msg;
    }).join('\n');
  }

  function refresh() {
    if (logView) logView.textContent = formatLogs();
    if (badge) {
      badge.textContent = logs.length ? String(logs.length) : '';
      badge.style.display = logs.length ? 'flex' : 'none';
    }
  }

  function addLog(type, msg) {
    logs.push({
      time: new Date().toLocaleTimeString('fa-IR'),
      type: type,
      msg: String(msg || '')
    });
    if (logs.length > 200) logs = logs.slice(-200);
    saveLogs();
    refresh();
  }

  function safeStringify(obj) {
    try { return JSON.stringify(obj); } catch (e) { return String(obj); }
  }

  window.addEventListener('error', function (e) {
    addLog(
      'JS Error',
      (e.message || 'unknown') + ' | ' + (e.filename || '') + ':' + (e.lineno || '?') + ':' + (e.colno || '?')
    );
  });

  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    var msg = (r && r.message) ? r.message : (typeof r === 'object' ? safeStringify(r) : String(r));
    addLog('Promise', msg || 'unknown rejection');
  });

  var oldError = console.error;
  console.error = function () {
    var msg = Array.prototype.slice.call(arguments).map(function (a) {
      if (a && a.message) return a.message;
      if (typeof a === 'object') return safeStringify(a);
      return String(a);
    }).join(' ');
    addLog('Console', msg);
    if (oldError) oldError.apply(console, arguments);
  };

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      alert('کپی شد ✅');
    } catch (e) {
      alert('کپی نشد؛ اسکرین‌شات بگیر.');
    }
    ta.remove();
  }

  function copyLogs() {
    var text = formatLogs();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        alert('کپی شد ✅');
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function clearLogs() {
    logs = [];
    saveLogs();
    refresh();
  }

  function openPanel() {
    if (!panel) return;
    panel.style.display = 'block';
    isOpen = true;
    refresh();
  }

  function closePanel() {
    if (!panel) return;
    panel.style.display = 'none';
    isOpen = false;
  }

  function togglePanel() {
    if (isOpen) closePanel();
    else openPanel();
  }

  function buildUI() {
    if (document.getElementById('debug-fab')) return;

    var host = document.getElementById('rotate-wrap') || document.body;

    var fab = document.createElement('button');
    fab.id = 'debug-fab';
    fab.type = 'button';
    fab.textContent = '🐞';
    fab.style.cssText =
      'position:absolute;top:44px;left:8px;z-index:10000;width:36px;height:36px;border-radius:50%;' +
      'border:2px solid rgba(255,255,255,.65);background:rgba(0,0,0,.55);color:#fff;font-size:17px;pointer-events:auto;';

    badge = document.createElement('span');
    badge.style.cssText =
      'position:absolute;top:-6px;right:-6px;min-width:17px;height:17px;border-radius:999px;' +
      'background:#e05353;color:#fff;font-size:10px;display:none;align-items:center;justify-content:center;padding:0 3px;';

    fab.appendChild(badge);

    fab.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      togglePanel();
    });

    panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText =
      'position:absolute;top:12px;right:12px;bottom:12px;left:12px;z-index:10001;display:none;' +
      'background:rgba(0,0,0,.92);border:1px solid #555;border-radius:12px;padding:10px;' +
      'direction:ltr;text-align:left;pointer-events:auto;';

    panel.innerHTML =
      '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;direction:rtl;">' +
      '<button id="debug-close" type="button" style="background:#444;color:#fff;border:none;border-radius:8px;padding:8px 10px;">✕ بستن</button>' +
      '<button id="debug-copy" type="button" style="background:#3d7dd8;color:#fff;border:none;border-radius:8px;padding:8px 10px;">📋 کپی</button>' +
      '<button id="debug-clear" type="button" style="background:#7a3d3d;color:#fff;border:none;border-radius:8px;padding:8px 10px;">🗑️ پاک کردن</button>' +
      '</div>' +
      '<pre id="debug-log" style="white-space:pre-wrap;word-break:break-word;color:#7CFC00;font:11px/1.6 monospace;overflow:auto;height:calc(100% - 52px);margin:0;"></pre>';

    host.appendChild(fab);
    host.appendChild(panel);

    logView = panel.querySelector('#debug-log');
    panel.querySelector('#debug-close').onclick = closePanel;
    panel.querySelector('#debug-copy').onclick = copyLogs;
    panel.querySelector('#debug-clear').onclick = clearLogs;

    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildUI);
  } else {
    buildUI();
  }
})();
