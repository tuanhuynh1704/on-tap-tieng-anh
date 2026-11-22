import fs from 'node:fs';

const HOST = 'http://127.0.0.1:9222';

async function httpJson(p, opts) {
  const r = await fetch(HOST + p, opts);
  return r.json();
}

export class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.handlers = new Map();
    this.consoleErrors = [];
    this.exceptions = [];
    this.dialogs = [];
    ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      this._onMessage(msg);
    });
  }

  static async connect() {
    let targets = [];
    for (let i = 0; i < 30; i++) {
      try { targets = await httpJson('/json/list'); if (targets.length) break; } catch {}
      await new Promise((r) => setTimeout(r, 300));
    }
    let page = targets.find((t) => t.type === 'page');
    if (!page) page = await httpJson('/json/new?about:blank', { method: 'PUT' });
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true });
      ws.addEventListener('error', rej, { once: true });
    });
    const c = new CDP(ws);
    await c.send('Page.enable');
    await c.send('Runtime.enable');
    await c.send('Log.enable');
    return c;
  }

  _onMessage(msg) {
    if (msg.id && this.pending.has(msg.id)) {
      const p = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
      return;
    }
    if (!msg.method) return;
    const hs = this.handlers.get(msg.method) || [];
    for (const h of hs) h(msg.params);
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails || {};
      this.exceptions.push((d.text || '') + ' | ' + ((d.exception && d.exception.description) || ''));
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      this.consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry && msg.params.entry.level === 'error') {
      this.consoleErrors.push('[log] ' + msg.params.entry.text);
    }
    if (msg.method === 'Page.javascriptDialogOpening') this.dialogs.push(msg.params);
  }

  on(method, h) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(h);
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const r = await this.send('Runtime.evaluate', {
      expression: expr, returnByValue: true, awaitPromise: true, userGesture: true,
    });
    if (r.exceptionDetails) throw new Error('EVAL ERR: ' + JSON.stringify(r.exceptionDetails));
    return r.result.value;
  }

  async waitFor(expr, timeout = 45000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try { if (await this.eval(expr)) return true; } catch {}
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error('waitFor timeout: ' + expr);
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await this.waitFor('document.readyState === "complete"', 30000);
  }

  async reload() {
    await this.send('Page.reload', { ignoreCache: true });
    await this.waitFor('document.readyState === "complete"', 30000);
  }

  async setViewport(w, h, mobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width: w, height: h, deviceScaleFactor: 1, mobile,
    });
    await this.send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  }

  async screenshot(absPath) {
    const r = await this.send('Page.captureScreenshot', {
      format: 'png', fromSurface: true, captureBeyondViewport: false,
    });
    fs.writeFileSync(absPath, Buffer.from(r.data, 'base64'));
    return absPath;
  }

  close() { try { this.ws.close(); } catch {} }
}
