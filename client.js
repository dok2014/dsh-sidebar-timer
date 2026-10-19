/**
 * Client half of the sidebar timer.
 *
 * Registers a usage stopwatch into the `sidebar.footer.action` slot (beside
 * Settings at the sidebar foot). Everything is client-local: no Host services,
 * no agent/session coupling, so program/agent execution time never counts.
 *
 * Timing rules (final, matching the approved mockup):
 *  - Counts only while the page is visible AND the window is focused; real
 *    in-page input (pointer/keys/wheel) within a 60s grace window is a fallback
 *    presence signal in case focus detection is unreliable.
 *  - Leaving pauses and never resets; the count resumes on return.
 *  - The count lives in sessionStorage: a page refresh keeps it, closing the
 *    page (DSH closed) discards it, so the next launch starts from zero.
 *  - Display steps in 5-second increments: digits and the seconds hand move
 *    together on aligned 5s boundaries; the internal total stays millisecond-true.
 *  - Past 30 minutes of a single run, the digits get a warning-orange ground.
 *  - Manual reset via the small ↺ button only.
 */
window.__ModuleLoader__.load({
  id: 'dsh-sidebar-timer',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const STORAGE_KEY = 'dsh-sidebar-timer/session/v1';
    const GRACE_MS = 60 * 1000;        // fallback: presence grace after last real input
    const WARN_MS = 30 * 60 * 1000;    // single run > 30 min -> warning orange digits
    const DISPLAY_STEP_MS = 5000;      // display steps in 5s increments (digits + hand together)
    const PERSIST_EVERY_MS = 5000;     // throttle sessionStorage writes

    // ---- Session state (page session == one DSH run) ----
    let accumulated = 0;      // active-usage total for this run (ms)
    let lastStamp = Date.now();
    let lastInputAt = 0;      // last real in-page input
    let wasPresent = false;
    let lastEvaluateAt = 0;
    let lastPersistAt = 0;

    try {
      const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved.accumulated === 'number' && saved.accumulated >= 0) {
        accumulated = saved.accumulated; // page refresh within the same run
      }
    } catch (e) { /* first run or storage unavailable: start from zero */ }

    function isPresent(t) {
      if (document.visibilityState !== 'visible') return false;
      if (document.hasFocus()) return true;
      return lastInputAt > 0 && (t - lastInputAt) <= GRACE_MS;
    }

    function persist(force) {
      const t = Date.now();
      if (!force && t - lastPersistAt < PERSIST_EVERY_MS) return;
      lastPersistAt = t;
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ accumulated: accumulated }));
      } catch (e) { /* ignore */ }
    }

    function evaluate() {
      const t = Date.now();
      const present = isPresent(t);
      // 边界精确记账：持续使用与“离开瞬间”都记满到最后事件时刻；
      // 仅“恢复瞬间”不补记失焦间隙（离开时间不长计，从当前时刻重新起算）。
      const idleTick = !present && !wasPresent;
      if (!idleTick) accumulated += Math.max(0, t - lastStamp);
      lastStamp = t;
      wasPresent = present;
      persist(false);
    }

    // 显示值按 5 秒步进量化：内部累计精确到毫秒，仅展示取整
    function quantize(ms) {
      return Math.floor(ms / DISPLAY_STEP_MS) * DISPLAY_STEP_MS;
    }

    function format(ms) {
      const total = Math.floor(quantize(ms) / 1000);
      const hh = Math.floor(total / 3600);
      const mm = Math.floor((total % 3600) / 60);
      const ss = total % 60;
      const p = function (n) { return String(n).padStart(2, '0'); };
      return hh > 0 ? hh + ':' + p(mm) + ':' + p(ss) : p(mm) + ':' + p(ss);
    }

    // Styles ride with the component; unmounting removes them. Theme tokens
    // only, so light/dark follow the app automatically.
    const STYLE = [
      '.dsw-timer-chip{display:flex;align-items:center;gap:2px;min-width:0;max-width:100%}',
      '.dsw-timer-toggle{display:flex;align-items:center;justify-content:center;gap:7px;height:36px;padding:0 12px;',
      'border:0;border-radius:10px;background:var(--dsw-alias-bg-layer-1);',
      'color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;font-weight:500;line-height:1;cursor:default}',
      '.dsw-timer-toggle svg{flex:none}',
      '.dsw-timer-time{font-variant-numeric:tabular-nums;letter-spacing:.02em;white-space:nowrap}',
      '.dsw-timer-chip.running .dsw-timer-icon{color:var(--dsw-alias-brand-primary)}',
      '.dsw-timer-chip.paused .dsw-timer-icon{color:var(--dsw-alias-label-secondary)}',
      '.dsw-timer-chip.paused .dsw-timer-time{color:var(--dsw-alias-label-secondary)}',
      '.dsw-timer-hand{transform-origin:8px 9.2px;transition:transform .2s linear}',
      '.dsw-timer-reset{display:flex;align-items:center;justify-content:center;width:28px;height:36px;flex:none;',
      'border:0;border-radius:10px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;padding:0}',
      '.dsw-timer-reset:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.dsw-timer-time.warn{background:var(--dsw-alias-state-warn-primary);color:#fff;padding:2px 8px;border-radius:8px}',
    ].join('');

    function StopwatchIcon(props) {
      return h('svg', { className: 'dsw-timer-icon', viewBox: '0 0 16 16', width: 15, height: 15, 'aria-hidden': true },
        h('circle', { cx: 8, cy: 9.2, r: 5.2, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 }),
        h('line', {
          className: 'dsw-timer-hand', x1: 8, y1: 9.2, x2: 8, y2: 6.1,
          stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round',
          style: { transform: 'rotate(' + (props.angle || 0) + 'deg)' },
        }),
        h('line', { x1: 6.4, y1: 1.7, x2: 9.6, y2: 1.7, stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }),
        h('line', { x1: 8, y1: 1.7, x2: 8, y2: 3.5, stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }),
      );
    }

    function ResetIcon() {
      return h('svg', { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': true },
        h('path', { d: 'M8 2.8a5.2 5.2 0 1 1-5.2 5.2', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }),
        h('path', { d: 'M8 0.6v4.4L11 2.8z', fill: 'currentColor' }),
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(function registerDictionary() {
          return ctx.locale.register('sidebarTimer', {
            zh: {
              label: '计时器',
              running: '使用中：实际使用时间累计中（切走窗口自动暂停，不归零）',
              paused: '已暂停：窗口未聚焦 / 页面不可见（时间保留，回来继续）',
              reset: '手动归零',
              warn: '单次使用已超过 30 分钟，注意休息',
            },
            en: {
              label: 'Timer',
              running: 'In use: active time accumulating (auto-pauses when you switch away; never resets)',
              paused: 'Paused: window unfocused or page hidden (time is kept and resumes)',
              reset: 'Reset',
              warn: 'Over 30 minutes of continuous use — take a break',
            },
          });
        }, 'sidebar-timer: locale dictionary');

        const t = ctx.locale.bind('sidebarTimer');

        function Timer() {
          const [snap, setSnap] = React.useState(function initialSnapshot() {
            return { accumulated: accumulated, present: wasPresent };
          });

          React.useEffect(function startEngine() {
            lastStamp = Date.now(); // remount must not charge the unmounted gap

            // 值未变化就不触发 React 重渲染：输入事件等额外结算不会打乱读秒节奏
            let lastDisplay = null;
            let lastPresent = null;
            let lastWarn = null;
            const render = function () {
              const display = format(accumulated);
              const warn = accumulated > WARN_MS;
              if (display === lastDisplay && wasPresent === lastPresent && warn === lastWarn) return;
              lastDisplay = display;
              lastPresent = wasPresent;
              lastWarn = warn;
              setSnap({ accumulated: accumulated, present: wasPresent });
            };            const onEdge = function () {
              evaluate();
              render();
              if (alignedTimer) window.clearTimeout(alignedTimer);
              armAligned(); // 边界事件后按最新相位重排下一次显示翻转
            };
            const onInput = function () { lastInputAt = Date.now(); };
            const onInputEdge = function () {
              const t2 = Date.now();
              if (t2 - lastEvaluateAt > 250) onEdge(); // prompt, but at most ~4/s
            };

            const disposers = [];
            const on = function (target, type, fn, opts) {
              target.addEventListener(type, fn, opts);
              disposers.push(function () { target.removeEventListener(type, fn, opts); });
            };

            on(document, 'visibilitychange', onEdge);
            on(window, 'focus', onEdge);
            on(window, 'blur', onEdge);
            on(window, 'pagehide', function () { persist(true); });

            const inputTypes = ['pointermove', 'pointerdown', 'mousedown', 'keydown', 'wheel', 'touchstart'];
            inputTypes.forEach(function (type) {
              on(window, type, onInput, { passive: true, capture: true });
            });
            on(document, 'scroll', onInput, { passive: true, capture: true });
            ['pointerdown', 'mousedown', 'keydown', 'wheel', 'touchstart', 'pointermove'].forEach(function (type) {
              on(window, type, onInputEdge, { passive: true, capture: true });
            });

            // 自校正调度：把渲染对齐到 5 秒显示步进的翻转时刻（使用中按剩余毫秒调度，
            // 离开期间低频巡检）；离开/恢复等边界事件经 onEdge 立即重排相位
            let alignedTimer = 0;
            const armAligned = function () {
              const delay = wasPresent
                ? Math.max(50, DISPLAY_STEP_MS - (accumulated % DISPLAY_STEP_MS))
                : 2000;
              alignedTimer = window.setTimeout(onEdge, delay);
            };
            armAligned();
            onEdge(); // settle the initial presence state immediately

            return function cleanup() {
              window.clearTimeout(alignedTimer);
              disposers.forEach(function (d) { d(); });
              persist(true);
            };
          }, []);

          const ms = snap.accumulated;
          const shownMs = quantize(ms);
          const warn = ms > WARN_MS;
          const angle = (Math.floor(shownMs / 1000) % 60) * 6;

          const onReset = function () {
            accumulated = 0;
            lastStamp = Date.now();
            evaluate();
            setSnap({ accumulated: accumulated, present: wasPresent });
          };

          return h('div', { className: 'dsw-timer-chip' + (snap.present ? ' running' : ' paused') },
            h('style', { dangerouslySetInnerHTML: { __html: STYLE } }),
            h('span', {
              className: 'dsw-timer-toggle', role: 'timer',
              title: snap.present ? t('running') : t('paused'),
            },
              h(StopwatchIcon, { angle: angle }),
              h('span', {
                className: 'dsw-timer-time' + (warn ? ' warn' : ''),
                title: warn ? t('warn') : undefined,
              }, format(ms)),
            ),
            ms > 0
              ? h('button', {
                  className: 'dsw-timer-reset', type: 'button',
                  title: t('reset'), 'aria-label': t('reset'), onClick: onReset,
                }, h(ResetIcon))
              : null,
          );
        }

        ctx.slots.inject('sidebar.footer.action', function factory() {
          return ctx.slots.register({
            name: 'sidebar.footer.action',
            id: 'sidebar-timer',
            order: 5,
            label: function () { return t('label'); },
          }, Timer);
        });
      },
    };
  },
});
