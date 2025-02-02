(function () {
  const e = document.createElement('link').relList;
  if (e && e.supports && e.supports('modulepreload')) return;
  for (const n of document.querySelectorAll('link[rel="modulepreload"]')) t(n);
  new MutationObserver((n) => {
    for (const l of n)
      if (l.type === 'childList')
        for (const a of l.addedNodes) a.tagName === 'LINK' && a.rel === 'modulepreload' && t(a);
  }).observe(document, { childList: !0, subtree: !0 });
  function i(n) {
    const l = {};
    return (
      n.integrity && (l.integrity = n.integrity),
      n.referrerPolicy && (l.referrerPolicy = n.referrerPolicy),
      n.crossOrigin === 'use-credentials'
        ? (l.credentials = 'include')
        : n.crossOrigin === 'anonymous'
          ? (l.credentials = 'omit')
          : (l.credentials = 'same-origin'),
      l
    );
  }
  function t(n) {
    if (n.ep) return;
    n.ep = !0;
    const l = i(n);
    fetch(n.href, l);
  }
})();
/**
 * lil-gui
 * https://lil-gui.georgealways.com
 * @version 0.19.2
 * @author George Michael Brower
 * @license MIT
 */ class x {
  constructor(e, i, t, n, l = 'div') {
    (this.parent = e),
      (this.object = i),
      (this.property = t),
      (this._disabled = !1),
      (this._hidden = !1),
      (this.initialValue = this.getValue()),
      (this.domElement = document.createElement(l)),
      this.domElement.classList.add('controller'),
      this.domElement.classList.add(n),
      (this.$name = document.createElement('div')),
      this.$name.classList.add('name'),
      (x.nextNameID = x.nextNameID || 0),
      (this.$name.id = `lil-gui-name-${++x.nextNameID}`),
      (this.$widget = document.createElement('div')),
      this.$widget.classList.add('widget'),
      (this.$disable = this.$widget),
      this.domElement.appendChild(this.$name),
      this.domElement.appendChild(this.$widget),
      this.domElement.addEventListener('keydown', (a) => a.stopPropagation()),
      this.domElement.addEventListener('keyup', (a) => a.stopPropagation()),
      this.parent.children.push(this),
      this.parent.controllers.push(this),
      this.parent.$children.appendChild(this.domElement),
      (this._listenCallback = this._listenCallback.bind(this)),
      this.name(t);
  }
  name(e) {
    return (this._name = e), (this.$name.textContent = e), this;
  }
  onChange(e) {
    return (this._onChange = e), this;
  }
  _callOnChange() {
    this.parent._callOnChange(this),
      this._onChange !== void 0 && this._onChange.call(this, this.getValue()),
      (this._changed = !0);
  }
  onFinishChange(e) {
    return (this._onFinishChange = e), this;
  }
  _callOnFinishChange() {
    this._changed &&
      (this.parent._callOnFinishChange(this),
      this._onFinishChange !== void 0 && this._onFinishChange.call(this, this.getValue())),
      (this._changed = !1);
  }
  reset() {
    return this.setValue(this.initialValue), this._callOnFinishChange(), this;
  }
  enable(e = !0) {
    return this.disable(!e);
  }
  disable(e = !0) {
    return e === this._disabled
      ? this
      : ((this._disabled = e),
        this.domElement.classList.toggle('disabled', e),
        this.$disable.toggleAttribute('disabled', e),
        this);
  }
  show(e = !0) {
    return (this._hidden = !e), (this.domElement.style.display = this._hidden ? 'none' : ''), this;
  }
  hide() {
    return this.show(!1);
  }
  options(e) {
    const i = this.parent.add(this.object, this.property, e);
    return i.name(this._name), this.destroy(), i;
  }
  min(e) {
    return this;
  }
  max(e) {
    return this;
  }
  step(e) {
    return this;
  }
  decimals(e) {
    return this;
  }
  listen(e = !0) {
    return (
      (this._listening = e),
      this._listenCallbackID !== void 0 &&
        (cancelAnimationFrame(this._listenCallbackID), (this._listenCallbackID = void 0)),
      this._listening && this._listenCallback(),
      this
    );
  }
  _listenCallback() {
    this._listenCallbackID = requestAnimationFrame(this._listenCallback);
    const e = this.save();
    e !== this._listenPrevValue && this.updateDisplay(), (this._listenPrevValue = e);
  }
  getValue() {
    return this.object[this.property];
  }
  setValue(e) {
    return (
      this.getValue() !== e &&
        ((this.object[this.property] = e), this._callOnChange(), this.updateDisplay()),
      this
    );
  }
  updateDisplay() {
    return this;
  }
  load(e) {
    return this.setValue(e), this._callOnFinishChange(), this;
  }
  save() {
    return this.getValue();
  }
  destroy() {
    this.listen(!1),
      this.parent.children.splice(this.parent.children.indexOf(this), 1),
      this.parent.controllers.splice(this.parent.controllers.indexOf(this), 1),
      this.parent.$children.removeChild(this.domElement);
  }
}
class Y extends x {
  constructor(e, i, t) {
    super(e, i, t, 'boolean', 'label'),
      (this.$input = document.createElement('input')),
      this.$input.setAttribute('type', 'checkbox'),
      this.$input.setAttribute('aria-labelledby', this.$name.id),
      this.$widget.appendChild(this.$input),
      this.$input.addEventListener('change', () => {
        this.setValue(this.$input.checked), this._callOnFinishChange();
      }),
      (this.$disable = this.$input),
      this.updateDisplay();
  }
  updateDisplay() {
    return (this.$input.checked = this.getValue()), this;
  }
}
function V(r) {
  let e, i;
  return (
    (e = r.match(/(#|0x)?([a-f0-9]{6})/i))
      ? (i = e[2])
      : (e = r.match(/rgb\(\s*(\d*)\s*,\s*(\d*)\s*,\s*(\d*)\s*\)/))
        ? (i =
            parseInt(e[1]).toString(16).padStart(2, 0) +
            parseInt(e[2]).toString(16).padStart(2, 0) +
            parseInt(e[3]).toString(16).padStart(2, 0))
        : (e = r.match(/^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i)) &&
          (i = e[1] + e[1] + e[2] + e[2] + e[3] + e[3]),
    i ? '#' + i : !1
  );
}
const X = { isPrimitive: !0, match: (r) => typeof r == 'string', fromHexString: V, toHexString: V },
  O = {
    isPrimitive: !0,
    match: (r) => typeof r == 'number',
    fromHexString: (r) => parseInt(r.substring(1), 16),
    toHexString: (r) => '#' + r.toString(16).padStart(6, 0)
  },
  N = {
    isPrimitive: !1,
    match: (r) => Array.isArray(r),
    fromHexString(r, e, i = 1) {
      const t = O.fromHexString(r);
      (e[0] = (((t >> 16) & 255) / 255) * i),
        (e[1] = (((t >> 8) & 255) / 255) * i),
        (e[2] = ((t & 255) / 255) * i);
    },
    toHexString([r, e, i], t = 1) {
      t = 255 / t;
      const n = ((r * t) << 16) ^ ((e * t) << 8) ^ ((i * t) << 0);
      return O.toHexString(n);
    }
  },
  q = {
    isPrimitive: !1,
    match: (r) => Object(r) === r,
    fromHexString(r, e, i = 1) {
      const t = O.fromHexString(r);
      (e.r = (((t >> 16) & 255) / 255) * i),
        (e.g = (((t >> 8) & 255) / 255) * i),
        (e.b = ((t & 255) / 255) * i);
    },
    toHexString({ r, g: e, b: i }, t = 1) {
      t = 255 / t;
      const n = ((r * t) << 16) ^ ((e * t) << 8) ^ ((i * t) << 0);
      return O.toHexString(n);
    }
  },
  W = [X, O, N, q];
function j(r) {
  return W.find((e) => e.match(r));
}
class J extends x {
  constructor(e, i, t, n) {
    super(e, i, t, 'color'),
      (this.$input = document.createElement('input')),
      this.$input.setAttribute('type', 'color'),
      this.$input.setAttribute('tabindex', -1),
      this.$input.setAttribute('aria-labelledby', this.$name.id),
      (this.$text = document.createElement('input')),
      this.$text.setAttribute('type', 'text'),
      this.$text.setAttribute('spellcheck', 'false'),
      this.$text.setAttribute('aria-labelledby', this.$name.id),
      (this.$display = document.createElement('div')),
      this.$display.classList.add('display'),
      this.$display.appendChild(this.$input),
      this.$widget.appendChild(this.$display),
      this.$widget.appendChild(this.$text),
      (this._format = j(this.initialValue)),
      (this._rgbScale = n),
      (this._initialValueHexString = this.save()),
      (this._textFocused = !1),
      this.$input.addEventListener('input', () => {
        this._setValueFromHexString(this.$input.value);
      }),
      this.$input.addEventListener('blur', () => {
        this._callOnFinishChange();
      }),
      this.$text.addEventListener('input', () => {
        const l = V(this.$text.value);
        l && this._setValueFromHexString(l);
      }),
      this.$text.addEventListener('focus', () => {
        (this._textFocused = !0), this.$text.select();
      }),
      this.$text.addEventListener('blur', () => {
        (this._textFocused = !1), this.updateDisplay(), this._callOnFinishChange();
      }),
      (this.$disable = this.$text),
      this.updateDisplay();
  }
  reset() {
    return this._setValueFromHexString(this._initialValueHexString), this;
  }
  _setValueFromHexString(e) {
    if (this._format.isPrimitive) {
      const i = this._format.fromHexString(e);
      this.setValue(i);
    } else
      this._format.fromHexString(e, this.getValue(), this._rgbScale),
        this._callOnChange(),
        this.updateDisplay();
  }
  save() {
    return this._format.toHexString(this.getValue(), this._rgbScale);
  }
  load(e) {
    return this._setValueFromHexString(e), this._callOnFinishChange(), this;
  }
  updateDisplay() {
    return (
      (this.$input.value = this._format.toHexString(this.getValue(), this._rgbScale)),
      this._textFocused || (this.$text.value = this.$input.value.substring(1)),
      (this.$display.style.backgroundColor = this.$input.value),
      this
    );
  }
}
class M extends x {
  constructor(e, i, t) {
    super(e, i, t, 'function'),
      (this.$button = document.createElement('button')),
      this.$button.appendChild(this.$name),
      this.$widget.appendChild(this.$button),
      this.$button.addEventListener('click', (n) => {
        n.preventDefault(), this.getValue().call(this.object), this._callOnChange();
      }),
      this.$button.addEventListener('touchstart', () => {}, { passive: !0 }),
      (this.$disable = this.$button);
  }
}
class K extends x {
  constructor(e, i, t, n, l, a) {
    super(e, i, t, 'number'), this._initInput(), this.min(n), this.max(l);
    const c = a !== void 0;
    this.step(c ? a : this._getImplicitStep(), c), this.updateDisplay();
  }
  decimals(e) {
    return (this._decimals = e), this.updateDisplay(), this;
  }
  min(e) {
    return (this._min = e), this._onUpdateMinMax(), this;
  }
  max(e) {
    return (this._max = e), this._onUpdateMinMax(), this;
  }
  step(e, i = !0) {
    return (this._step = e), (this._stepExplicit = i), this;
  }
  updateDisplay() {
    const e = this.getValue();
    if (this._hasSlider) {
      let i = (e - this._min) / (this._max - this._min);
      (i = Math.max(0, Math.min(i, 1))), (this.$fill.style.width = i * 100 + '%');
    }
    return (
      this._inputFocused ||
        (this.$input.value = this._decimals === void 0 ? e : e.toFixed(this._decimals)),
      this
    );
  }
  _initInput() {
    (this.$input = document.createElement('input')),
      this.$input.setAttribute('type', 'text'),
      this.$input.setAttribute('aria-labelledby', this.$name.id),
      window.matchMedia('(pointer: coarse)').matches &&
        (this.$input.setAttribute('type', 'number'), this.$input.setAttribute('step', 'any')),
      this.$widget.appendChild(this.$input),
      (this.$disable = this.$input);
    const i = () => {
        let o = parseFloat(this.$input.value);
        isNaN(o) || (this._stepExplicit && (o = this._snap(o)), this.setValue(this._clamp(o)));
      },
      t = (o) => {
        const u = parseFloat(this.$input.value);
        isNaN(u) || (this._snapClampSetValue(u + o), (this.$input.value = this.getValue()));
      },
      n = (o) => {
        o.key === 'Enter' && this.$input.blur(),
          o.code === 'ArrowUp' && (o.preventDefault(), t(this._step * this._arrowKeyMultiplier(o))),
          o.code === 'ArrowDown' &&
            (o.preventDefault(), t(this._step * this._arrowKeyMultiplier(o) * -1));
      },
      l = (o) => {
        this._inputFocused && (o.preventDefault(), t(this._step * this._normalizeMouseWheel(o)));
      };
    let a = !1,
      c,
      m,
      g,
      f,
      p;
    const v = 5,
      _ = (o) => {
        (c = o.clientX),
          (m = g = o.clientY),
          (a = !0),
          (f = this.getValue()),
          (p = 0),
          window.addEventListener('mousemove', w),
          window.addEventListener('mouseup', A);
      },
      w = (o) => {
        if (a) {
          const u = o.clientX - c,
            h = o.clientY - m;
          Math.abs(h) > v
            ? (o.preventDefault(),
              this.$input.blur(),
              (a = !1),
              this._setDraggingStyle(!0, 'vertical'))
            : Math.abs(u) > v && A();
        }
        if (!a) {
          const u = o.clientY - g;
          (p -= u * this._step * this._arrowKeyMultiplier(o)),
            f + p > this._max ? (p = this._max - f) : f + p < this._min && (p = this._min - f),
            this._snapClampSetValue(f + p);
        }
        g = o.clientY;
      },
      A = () => {
        this._setDraggingStyle(!1, 'vertical'),
          this._callOnFinishChange(),
          window.removeEventListener('mousemove', w),
          window.removeEventListener('mouseup', A);
      },
      b = () => {
        this._inputFocused = !0;
      },
      d = () => {
        (this._inputFocused = !1), this.updateDisplay(), this._callOnFinishChange();
      };
    this.$input.addEventListener('input', i),
      this.$input.addEventListener('keydown', n),
      this.$input.addEventListener('wheel', l, { passive: !1 }),
      this.$input.addEventListener('mousedown', _),
      this.$input.addEventListener('focus', b),
      this.$input.addEventListener('blur', d);
  }
  _initSlider() {
    (this._hasSlider = !0),
      (this.$slider = document.createElement('div')),
      this.$slider.classList.add('slider'),
      (this.$fill = document.createElement('div')),
      this.$fill.classList.add('fill'),
      this.$slider.appendChild(this.$fill),
      this.$widget.insertBefore(this.$slider, this.$input),
      this.domElement.classList.add('hasSlider');
    const e = (d, o, u, h, E) => ((d - o) / (u - o)) * (E - h) + h,
      i = (d) => {
        const o = this.$slider.getBoundingClientRect();
        let u = e(d, o.left, o.right, this._min, this._max);
        this._snapClampSetValue(u);
      },
      t = (d) => {
        this._setDraggingStyle(!0),
          i(d.clientX),
          window.addEventListener('mousemove', n),
          window.addEventListener('mouseup', l);
      },
      n = (d) => {
        i(d.clientX);
      },
      l = () => {
        this._callOnFinishChange(),
          this._setDraggingStyle(!1),
          window.removeEventListener('mousemove', n),
          window.removeEventListener('mouseup', l);
      };
    let a = !1,
      c,
      m;
    const g = (d) => {
        d.preventDefault(), this._setDraggingStyle(!0), i(d.touches[0].clientX), (a = !1);
      },
      f = (d) => {
        d.touches.length > 1 ||
          (this._hasScrollBar
            ? ((c = d.touches[0].clientX), (m = d.touches[0].clientY), (a = !0))
            : g(d),
          window.addEventListener('touchmove', p, { passive: !1 }),
          window.addEventListener('touchend', v));
      },
      p = (d) => {
        if (a) {
          const o = d.touches[0].clientX - c,
            u = d.touches[0].clientY - m;
          Math.abs(o) > Math.abs(u)
            ? g(d)
            : (window.removeEventListener('touchmove', p),
              window.removeEventListener('touchend', v));
        } else d.preventDefault(), i(d.touches[0].clientX);
      },
      v = () => {
        this._callOnFinishChange(),
          this._setDraggingStyle(!1),
          window.removeEventListener('touchmove', p),
          window.removeEventListener('touchend', v);
      },
      _ = this._callOnFinishChange.bind(this),
      w = 400;
    let A;
    const b = (d) => {
      if (Math.abs(d.deltaX) < Math.abs(d.deltaY) && this._hasScrollBar) return;
      d.preventDefault();
      const u = this._normalizeMouseWheel(d) * this._step;
      this._snapClampSetValue(this.getValue() + u),
        (this.$input.value = this.getValue()),
        clearTimeout(A),
        (A = setTimeout(_, w));
    };
    this.$slider.addEventListener('mousedown', t),
      this.$slider.addEventListener('touchstart', f, { passive: !1 }),
      this.$slider.addEventListener('wheel', b, { passive: !1 });
  }
  _setDraggingStyle(e, i = 'horizontal') {
    this.$slider && this.$slider.classList.toggle('active', e),
      document.body.classList.toggle('lil-gui-dragging', e),
      document.body.classList.toggle(`lil-gui-${i}`, e);
  }
  _getImplicitStep() {
    return this._hasMin && this._hasMax ? (this._max - this._min) / 1e3 : 0.1;
  }
  _onUpdateMinMax() {
    !this._hasSlider &&
      this._hasMin &&
      this._hasMax &&
      (this._stepExplicit || this.step(this._getImplicitStep(), !1),
      this._initSlider(),
      this.updateDisplay());
  }
  _normalizeMouseWheel(e) {
    let { deltaX: i, deltaY: t } = e;
    return (
      Math.floor(e.deltaY) !== e.deltaY &&
        e.wheelDelta &&
        ((i = 0), (t = -e.wheelDelta / 120), (t *= this._stepExplicit ? 1 : 10)),
      i + -t
    );
  }
  _arrowKeyMultiplier(e) {
    let i = this._stepExplicit ? 1 : 10;
    return e.shiftKey ? (i *= 10) : e.altKey && (i /= 10), i;
  }
  _snap(e) {
    const i = Math.round(e / this._step) * this._step;
    return parseFloat(i.toPrecision(15));
  }
  _clamp(e) {
    return e < this._min && (e = this._min), e > this._max && (e = this._max), e;
  }
  _snapClampSetValue(e) {
    this.setValue(this._clamp(this._snap(e)));
  }
  get _hasScrollBar() {
    const e = this.parent.root.$children;
    return e.scrollHeight > e.clientHeight;
  }
  get _hasMin() {
    return this._min !== void 0;
  }
  get _hasMax() {
    return this._max !== void 0;
  }
}
class Z extends x {
  constructor(e, i, t, n) {
    super(e, i, t, 'option'),
      (this.$select = document.createElement('select')),
      this.$select.setAttribute('aria-labelledby', this.$name.id),
      (this.$display = document.createElement('div')),
      this.$display.classList.add('display'),
      this.$select.addEventListener('change', () => {
        this.setValue(this._values[this.$select.selectedIndex]), this._callOnFinishChange();
      }),
      this.$select.addEventListener('focus', () => {
        this.$display.classList.add('focus');
      }),
      this.$select.addEventListener('blur', () => {
        this.$display.classList.remove('focus');
      }),
      this.$widget.appendChild(this.$select),
      this.$widget.appendChild(this.$display),
      (this.$disable = this.$select),
      this.options(n);
  }
  options(e) {
    return (
      (this._values = Array.isArray(e) ? e : Object.values(e)),
      (this._names = Array.isArray(e) ? e : Object.keys(e)),
      this.$select.replaceChildren(),
      this._names.forEach((i) => {
        const t = document.createElement('option');
        (t.textContent = i), this.$select.appendChild(t);
      }),
      this.updateDisplay(),
      this
    );
  }
  updateDisplay() {
    const e = this.getValue(),
      i = this._values.indexOf(e);
    return (
      (this.$select.selectedIndex = i),
      (this.$display.textContent = i === -1 ? e : this._names[i]),
      this
    );
  }
}
class Q extends x {
  constructor(e, i, t) {
    super(e, i, t, 'string'),
      (this.$input = document.createElement('input')),
      this.$input.setAttribute('type', 'text'),
      this.$input.setAttribute('spellcheck', 'false'),
      this.$input.setAttribute('aria-labelledby', this.$name.id),
      this.$input.addEventListener('input', () => {
        this.setValue(this.$input.value);
      }),
      this.$input.addEventListener('keydown', (n) => {
        n.code === 'Enter' && this.$input.blur();
      }),
      this.$input.addEventListener('blur', () => {
        this._callOnFinishChange();
      }),
      this.$widget.appendChild(this.$input),
      (this.$disable = this.$input),
      this.updateDisplay();
  }
  updateDisplay() {
    return (this.$input.value = this.getValue()), this;
  }
}
const ee = `.lil-gui {
  font-family: var(--font-family);
  font-size: var(--font-size);
  line-height: 1;
  font-weight: normal;
  font-style: normal;
  text-align: left;
  color: var(--text-color);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  --background-color: #1f1f1f;
  --text-color: #ebebeb;
  --title-background-color: #111111;
  --title-text-color: #ebebeb;
  --widget-color: #424242;
  --hover-color: #4f4f4f;
  --focus-color: #595959;
  --number-color: #2cc9ff;
  --string-color: #a2db3c;
  --font-size: 11px;
  --input-font-size: 11px;
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  --font-family-mono: Menlo, Monaco, Consolas, "Droid Sans Mono", monospace;
  --padding: 4px;
  --spacing: 4px;
  --widget-height: 20px;
  --title-height: calc(var(--widget-height) + var(--spacing) * 1.25);
  --name-width: 45%;
  --slider-knob-width: 2px;
  --slider-input-width: 27%;
  --color-input-width: 27%;
  --slider-input-min-width: 45px;
  --color-input-min-width: 45px;
  --folder-indent: 7px;
  --widget-padding: 0 0 0 3px;
  --widget-border-radius: 2px;
  --checkbox-size: calc(0.75 * var(--widget-height));
  --scrollbar-width: 5px;
}
.lil-gui, .lil-gui * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.lil-gui.root {
  width: var(--width, 245px);
  display: flex;
  flex-direction: column;
  background: var(--background-color);
}
.lil-gui.root > .title {
  background: var(--title-background-color);
  color: var(--title-text-color);
}
.lil-gui.root > .children {
  overflow-x: hidden;
  overflow-y: auto;
}
.lil-gui.root > .children::-webkit-scrollbar {
  width: var(--scrollbar-width);
  height: var(--scrollbar-width);
  background: var(--background-color);
}
.lil-gui.root > .children::-webkit-scrollbar-thumb {
  border-radius: var(--scrollbar-width);
  background: var(--focus-color);
}
@media (pointer: coarse) {
  .lil-gui.allow-touch-styles, .lil-gui.allow-touch-styles .lil-gui {
    --widget-height: 28px;
    --padding: 6px;
    --spacing: 6px;
    --font-size: 13px;
    --input-font-size: 16px;
    --folder-indent: 10px;
    --scrollbar-width: 7px;
    --slider-input-min-width: 50px;
    --color-input-min-width: 45px;
  }
}
.lil-gui.force-touch-styles, .lil-gui.force-touch-styles .lil-gui {
  --widget-height: 28px;
  --padding: 6px;
  --spacing: 6px;
  --font-size: 13px;
  --input-font-size: 16px;
  --folder-indent: 10px;
  --scrollbar-width: 7px;
  --slider-input-min-width: 50px;
  --color-input-min-width: 65px;
}
.lil-gui.autoPlace {
  max-height: 100%;
  position: fixed;
  top: 0;
  right: 15px;
  z-index: 1001;
}

.lil-gui .controller {
  display: flex;
  align-items: center;
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
}
.lil-gui .controller.disabled {
  opacity: 0.5;
}
.lil-gui .controller.disabled, .lil-gui .controller.disabled * {
  pointer-events: none !important;
}
.lil-gui .controller > .name {
  min-width: var(--name-width);
  flex-shrink: 0;
  white-space: pre;
  padding-right: var(--spacing);
  line-height: var(--widget-height);
}
.lil-gui .controller .widget {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--widget-height);
}
.lil-gui .controller.string input {
  color: var(--string-color);
}
.lil-gui .controller.boolean {
  cursor: pointer;
}
.lil-gui .controller.color .display {
  width: 100%;
  height: var(--widget-height);
  border-radius: var(--widget-border-radius);
  position: relative;
}
@media (hover: hover) {
  .lil-gui .controller.color .display:hover:before {
    content: " ";
    display: block;
    position: absolute;
    border-radius: var(--widget-border-radius);
    border: 1px solid #fff9;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}
.lil-gui .controller.color input[type=color] {
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.lil-gui .controller.color input[type=text] {
  margin-left: var(--spacing);
  font-family: var(--font-family-mono);
  min-width: var(--color-input-min-width);
  width: var(--color-input-width);
  flex-shrink: 0;
}
.lil-gui .controller.option select {
  opacity: 0;
  position: absolute;
  width: 100%;
  max-width: 100%;
}
.lil-gui .controller.option .display {
  position: relative;
  pointer-events: none;
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  line-height: var(--widget-height);
  max-width: 100%;
  overflow: hidden;
  word-break: break-all;
  padding-left: 0.55em;
  padding-right: 1.75em;
  background: var(--widget-color);
}
@media (hover: hover) {
  .lil-gui .controller.option .display.focus {
    background: var(--focus-color);
  }
}
.lil-gui .controller.option .display.active {
  background: var(--focus-color);
}
.lil-gui .controller.option .display:after {
  font-family: "lil-gui";
  content: "↕";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding-right: 0.375em;
}
.lil-gui .controller.option .widget,
.lil-gui .controller.option select {
  cursor: pointer;
}
@media (hover: hover) {
  .lil-gui .controller.option .widget:hover .display {
    background: var(--hover-color);
  }
}
.lil-gui .controller.number input {
  color: var(--number-color);
}
.lil-gui .controller.number.hasSlider input {
  margin-left: var(--spacing);
  width: var(--slider-input-width);
  min-width: var(--slider-input-min-width);
  flex-shrink: 0;
}
.lil-gui .controller.number .slider {
  width: 100%;
  height: var(--widget-height);
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
  padding-right: var(--slider-knob-width);
  overflow: hidden;
  cursor: ew-resize;
  touch-action: pan-y;
}
@media (hover: hover) {
  .lil-gui .controller.number .slider:hover {
    background: var(--hover-color);
  }
}
.lil-gui .controller.number .slider.active {
  background: var(--focus-color);
}
.lil-gui .controller.number .slider.active .fill {
  opacity: 0.95;
}
.lil-gui .controller.number .fill {
  height: 100%;
  border-right: var(--slider-knob-width) solid var(--number-color);
  box-sizing: content-box;
}

.lil-gui-dragging .lil-gui {
  --hover-color: var(--widget-color);
}
.lil-gui-dragging * {
  cursor: ew-resize !important;
}

.lil-gui-dragging.lil-gui-vertical * {
  cursor: ns-resize !important;
}

.lil-gui .title {
  height: var(--title-height);
  line-height: calc(var(--title-height) - 4px);
  font-weight: 600;
  padding: 0 var(--padding);
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
  outline: none;
  text-decoration-skip: objects;
}
.lil-gui .title:before {
  font-family: "lil-gui";
  content: "▾";
  padding-right: 2px;
  display: inline-block;
}
.lil-gui .title:active {
  background: var(--title-background-color);
  opacity: 0.75;
}
@media (hover: hover) {
  body:not(.lil-gui-dragging) .lil-gui .title:hover {
    background: var(--title-background-color);
    opacity: 0.85;
  }
  .lil-gui .title:focus {
    text-decoration: underline var(--focus-color);
  }
}
.lil-gui.root > .title:focus {
  text-decoration: none !important;
}
.lil-gui.closed > .title:before {
  content: "▸";
}
.lil-gui.closed > .children {
  transform: translateY(-7px);
  opacity: 0;
}
.lil-gui.closed:not(.transition) > .children {
  display: none;
}
.lil-gui.transition > .children {
  transition-duration: 300ms;
  transition-property: height, opacity, transform;
  transition-timing-function: cubic-bezier(0.2, 0.6, 0.35, 1);
  overflow: hidden;
  pointer-events: none;
}
.lil-gui .children:empty:before {
  content: "Empty";
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
  display: block;
  height: var(--widget-height);
  font-style: italic;
  line-height: var(--widget-height);
  opacity: 0.5;
}
.lil-gui.root > .children > .lil-gui > .title {
  border: 0 solid var(--widget-color);
  border-width: 1px 0;
  transition: border-color 300ms;
}
.lil-gui.root > .children > .lil-gui.closed > .title {
  border-bottom-color: transparent;
}
.lil-gui + .controller {
  border-top: 1px solid var(--widget-color);
  margin-top: 0;
  padding-top: var(--spacing);
}
.lil-gui .lil-gui .lil-gui > .title {
  border: none;
}
.lil-gui .lil-gui .lil-gui > .children {
  border: none;
  margin-left: var(--folder-indent);
  border-left: 2px solid var(--widget-color);
}
.lil-gui .lil-gui .controller {
  border: none;
}

.lil-gui label, .lil-gui input, .lil-gui button {
  -webkit-tap-highlight-color: transparent;
}
.lil-gui input {
  border: 0;
  outline: none;
  font-family: var(--font-family);
  font-size: var(--input-font-size);
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  background: var(--widget-color);
  color: var(--text-color);
  width: 100%;
}
@media (hover: hover) {
  .lil-gui input:hover {
    background: var(--hover-color);
  }
  .lil-gui input:active {
    background: var(--focus-color);
  }
}
.lil-gui input:disabled {
  opacity: 1;
}
.lil-gui input[type=text],
.lil-gui input[type=number] {
  padding: var(--widget-padding);
  -moz-appearance: textfield;
}
.lil-gui input[type=text]:focus,
.lil-gui input[type=number]:focus {
  background: var(--focus-color);
}
.lil-gui input[type=checkbox] {
  appearance: none;
  width: var(--checkbox-size);
  height: var(--checkbox-size);
  border-radius: var(--widget-border-radius);
  text-align: center;
  cursor: pointer;
}
.lil-gui input[type=checkbox]:checked:before {
  font-family: "lil-gui";
  content: "✓";
  font-size: var(--checkbox-size);
  line-height: var(--checkbox-size);
}
@media (hover: hover) {
  .lil-gui input[type=checkbox]:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui button {
  outline: none;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: var(--font-size);
  color: var(--text-color);
  width: 100%;
  height: var(--widget-height);
  text-transform: none;
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
  border: none;
}
@media (hover: hover) {
  .lil-gui button:hover {
    background: var(--hover-color);
  }
  .lil-gui button:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui button:active {
  background: var(--focus-color);
}

@font-face {
  font-family: "lil-gui";
  src: url("data:application/font-woff;charset=utf-8;base64,d09GRgABAAAAAAUsAAsAAAAACJwAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABHU1VCAAABCAAAAH4AAADAImwmYE9TLzIAAAGIAAAAPwAAAGBKqH5SY21hcAAAAcgAAAD0AAACrukyyJBnbHlmAAACvAAAAF8AAACEIZpWH2hlYWQAAAMcAAAAJwAAADZfcj2zaGhlYQAAA0QAAAAYAAAAJAC5AHhobXR4AAADXAAAABAAAABMAZAAAGxvY2EAAANsAAAAFAAAACgCEgIybWF4cAAAA4AAAAAeAAAAIAEfABJuYW1lAAADoAAAASIAAAIK9SUU/XBvc3QAAATEAAAAZgAAAJCTcMc2eJxVjbEOgjAURU+hFRBK1dGRL+ALnAiToyMLEzFpnPz/eAshwSa97517c/MwwJmeB9kwPl+0cf5+uGPZXsqPu4nvZabcSZldZ6kfyWnomFY/eScKqZNWupKJO6kXN3K9uCVoL7iInPr1X5baXs3tjuMqCtzEuagm/AAlzQgPAAB4nGNgYRBlnMDAysDAYM/gBiT5oLQBAwuDJAMDEwMrMwNWEJDmmsJwgCFeXZghBcjlZMgFCzOiKOIFAB71Bb8AeJy1kjFuwkAQRZ+DwRAwBtNQRUGKQ8OdKCAWUhAgKLhIuAsVSpWz5Bbkj3dEgYiUIszqWdpZe+Z7/wB1oCYmIoboiwiLT2WjKl/jscrHfGg/pKdMkyklC5Zs2LEfHYpjcRoPzme9MWWmk3dWbK9ObkWkikOetJ554fWyoEsmdSlt+uR0pCJR34b6t/TVg1SY3sYvdf8vuiKrpyaDXDISiegp17p7579Gp3p++y7HPAiY9pmTibljrr85qSidtlg4+l25GLCaS8e6rRxNBmsnERunKbaOObRz7N72ju5vdAjYpBXHgJylOAVsMseDAPEP8LYoUHicY2BiAAEfhiAGJgZWBgZ7RnFRdnVJELCQlBSRlATJMoLV2DK4glSYs6ubq5vbKrJLSbGrgEmovDuDJVhe3VzcXFwNLCOILB/C4IuQ1xTn5FPilBTj5FPmBAB4WwoqAHicY2BkYGAA4sk1sR/j+W2+MnAzpDBgAyEMQUCSg4EJxAEAwUgFHgB4nGNgZGBgSGFggJMhDIwMqEAYAByHATJ4nGNgAIIUNEwmAABl3AGReJxjYAACIQYlBiMGJ3wQAEcQBEV4nGNgZGBgEGZgY2BiAAEQyQWEDAz/wXwGAAsPATIAAHicXdBNSsNAHAXwl35iA0UQXYnMShfS9GPZA7T7LgIu03SSpkwzYTIt1BN4Ak/gKTyAeCxfw39jZkjymzcvAwmAW/wgwHUEGDb36+jQQ3GXGot79L24jxCP4gHzF/EIr4jEIe7wxhOC3g2TMYy4Q7+Lu/SHuEd/ivt4wJd4wPxbPEKMX3GI5+DJFGaSn4qNzk8mcbKSR6xdXdhSzaOZJGtdapd4vVPbi6rP+cL7TGXOHtXKll4bY1Xl7EGnPtp7Xy2n00zyKLVHfkHBa4IcJ2oD3cgggWvt/V/FbDrUlEUJhTn/0azVWbNTNr0Ens8de1tceK9xZmfB1CPjOmPH4kitmvOubcNpmVTN3oFJyjzCvnmrwhJTzqzVj9jiSX911FjeAAB4nG3HMRKCMBBA0f0giiKi4DU8k0V2GWbIZDOh4PoWWvq6J5V8If9NVNQcaDhyouXMhY4rPTcG7jwYmXhKq8Wz+p762aNaeYXom2n3m2dLTVgsrCgFJ7OTmIkYbwIbC6vIB7WmFfAAAA==") format("woff");
}`;
function te(r) {
  const e = document.createElement('style');
  e.innerHTML = r;
  const i = document.querySelector('head link[rel=stylesheet], head style');
  i ? document.head.insertBefore(e, i) : document.head.appendChild(e);
}
let U = !1;
class I {
  constructor({
    parent: e,
    autoPlace: i = e === void 0,
    container: t,
    width: n,
    title: l = 'Controls',
    closeFolders: a = !1,
    injectStyles: c = !0,
    touchStyles: m = !0
  } = {}) {
    if (
      ((this.parent = e),
      (this.root = e ? e.root : this),
      (this.children = []),
      (this.controllers = []),
      (this.folders = []),
      (this._closed = !1),
      (this._hidden = !1),
      (this.domElement = document.createElement('div')),
      this.domElement.classList.add('lil-gui'),
      (this.$title = document.createElement('div')),
      this.$title.classList.add('title'),
      this.$title.setAttribute('role', 'button'),
      this.$title.setAttribute('aria-expanded', !0),
      this.$title.setAttribute('tabindex', 0),
      this.$title.addEventListener('click', () => this.openAnimated(this._closed)),
      this.$title.addEventListener('keydown', (g) => {
        (g.code === 'Enter' || g.code === 'Space') && (g.preventDefault(), this.$title.click());
      }),
      this.$title.addEventListener('touchstart', () => {}, { passive: !0 }),
      (this.$children = document.createElement('div')),
      this.$children.classList.add('children'),
      this.domElement.appendChild(this.$title),
      this.domElement.appendChild(this.$children),
      this.title(l),
      this.parent)
    ) {
      this.parent.children.push(this),
        this.parent.folders.push(this),
        this.parent.$children.appendChild(this.domElement);
      return;
    }
    this.domElement.classList.add('root'),
      m && this.domElement.classList.add('allow-touch-styles'),
      !U && c && (te(ee), (U = !0)),
      t
        ? t.appendChild(this.domElement)
        : i &&
          (this.domElement.classList.add('autoPlace'), document.body.appendChild(this.domElement)),
      n && this.domElement.style.setProperty('--width', n + 'px'),
      (this._closeFolders = a);
  }
  add(e, i, t, n, l) {
    if (Object(t) === t) return new Z(this, e, i, t);
    const a = e[i];
    switch (typeof a) {
      case 'number':
        return new K(this, e, i, t, n, l);
      case 'boolean':
        return new Y(this, e, i);
      case 'string':
        return new Q(this, e, i);
      case 'function':
        return new M(this, e, i);
    }
    console.error(
      `gui.add failed
	property:`,
      i,
      `
	object:`,
      e,
      `
	value:`,
      a
    );
  }
  addColor(e, i, t = 1) {
    return new J(this, e, i, t);
  }
  addFolder(e) {
    const i = new I({ parent: this, title: e });
    return this.root._closeFolders && i.close(), i;
  }
  load(e, i = !0) {
    return (
      e.controllers &&
        this.controllers.forEach((t) => {
          t instanceof M || (t._name in e.controllers && t.load(e.controllers[t._name]));
        }),
      i &&
        e.folders &&
        this.folders.forEach((t) => {
          t._title in e.folders && t.load(e.folders[t._title]);
        }),
      this
    );
  }
  save(e = !0) {
    const i = { controllers: {}, folders: {} };
    return (
      this.controllers.forEach((t) => {
        if (!(t instanceof M)) {
          if (t._name in i.controllers)
            throw new Error(`Cannot save GUI with duplicate property "${t._name}"`);
          i.controllers[t._name] = t.save();
        }
      }),
      e &&
        this.folders.forEach((t) => {
          if (t._title in i.folders)
            throw new Error(`Cannot save GUI with duplicate folder "${t._title}"`);
          i.folders[t._title] = t.save();
        }),
      i
    );
  }
  open(e = !0) {
    return (
      this._setClosed(!e),
      this.$title.setAttribute('aria-expanded', !this._closed),
      this.domElement.classList.toggle('closed', this._closed),
      this
    );
  }
  close() {
    return this.open(!1);
  }
  _setClosed(e) {
    this._closed !== e && ((this._closed = e), this._callOnOpenClose(this));
  }
  show(e = !0) {
    return (this._hidden = !e), (this.domElement.style.display = this._hidden ? 'none' : ''), this;
  }
  hide() {
    return this.show(!1);
  }
  openAnimated(e = !0) {
    return (
      this._setClosed(!e),
      this.$title.setAttribute('aria-expanded', !this._closed),
      requestAnimationFrame(() => {
        const i = this.$children.clientHeight;
        (this.$children.style.height = i + 'px'), this.domElement.classList.add('transition');
        const t = (l) => {
          l.target === this.$children &&
            ((this.$children.style.height = ''),
            this.domElement.classList.remove('transition'),
            this.$children.removeEventListener('transitionend', t));
        };
        this.$children.addEventListener('transitionend', t);
        const n = e ? this.$children.scrollHeight : 0;
        this.domElement.classList.toggle('closed', !e),
          requestAnimationFrame(() => {
            this.$children.style.height = n + 'px';
          });
      }),
      this
    );
  }
  title(e) {
    return (this._title = e), (this.$title.textContent = e), this;
  }
  reset(e = !0) {
    return (e ? this.controllersRecursive() : this.controllers).forEach((t) => t.reset()), this;
  }
  onChange(e) {
    return (this._onChange = e), this;
  }
  _callOnChange(e) {
    this.parent && this.parent._callOnChange(e),
      this._onChange !== void 0 &&
        this._onChange.call(this, {
          object: e.object,
          property: e.property,
          value: e.getValue(),
          controller: e
        });
  }
  onFinishChange(e) {
    return (this._onFinishChange = e), this;
  }
  _callOnFinishChange(e) {
    this.parent && this.parent._callOnFinishChange(e),
      this._onFinishChange !== void 0 &&
        this._onFinishChange.call(this, {
          object: e.object,
          property: e.property,
          value: e.getValue(),
          controller: e
        });
  }
  onOpenClose(e) {
    return (this._onOpenClose = e), this;
  }
  _callOnOpenClose(e) {
    this.parent && this.parent._callOnOpenClose(e),
      this._onOpenClose !== void 0 && this._onOpenClose.call(this, e);
  }
  destroy() {
    this.parent &&
      (this.parent.children.splice(this.parent.children.indexOf(this), 1),
      this.parent.folders.splice(this.parent.folders.indexOf(this), 1)),
      this.domElement.parentElement && this.domElement.parentElement.removeChild(this.domElement),
      Array.from(this.children).forEach((e) => e.destroy());
  }
  controllersRecursive() {
    let e = Array.from(this.controllers);
    return (
      this.folders.forEach((i) => {
        e = e.concat(i.controllersRecursive());
      }),
      e
    );
  }
  foldersRecursive() {
    let e = Array.from(this.folders);
    return (
      this.folders.forEach((i) => {
        e = e.concat(i.foldersRecursive());
      }),
      e
    );
  }
}
const G = Math.sqrt(3),
  ie = 0.5 * (G - 1),
  R = (3 - G) / 6,
  P = (r) => Math.floor(r) | 0,
  H = new Float64Array([
    1, 1, -1, 1, 1, -1, -1, -1, 1, 0, -1, 0, 1, 0, -1, 0, 0, 1, 0, -1, 0, 1, 0, -1
  ]);
function ne(r = Math.random) {
  const e = re(r),
    i = new Float64Array(e).map((n) => H[(n % 12) * 2]),
    t = new Float64Array(e).map((n) => H[(n % 12) * 2 + 1]);
  return function (l, a) {
    let c = 0,
      m = 0,
      g = 0;
    const f = (l + a) * ie,
      p = P(l + f),
      v = P(a + f),
      _ = (p + v) * R,
      w = p - _,
      A = v - _,
      b = l - w,
      d = a - A;
    let o, u;
    b > d ? ((o = 1), (u = 0)) : ((o = 0), (u = 1));
    const h = b - o + R,
      E = d - u + R,
      F = b - 1 + 2 * R,
      L = d - 1 + 2 * R,
      $ = p & 255,
      y = v & 255;
    let S = 0.5 - b * b - d * d;
    if (S >= 0) {
      const C = $ + e[y],
        k = i[C],
        T = t[C];
      (S *= S), (c = S * S * (k * b + T * d));
    }
    let B = 0.5 - h * h - E * E;
    if (B >= 0) {
      const C = $ + o + e[y + u],
        k = i[C],
        T = t[C];
      (B *= B), (m = B * B * (k * h + T * E));
    }
    let D = 0.5 - F * F - L * L;
    if (D >= 0) {
      const C = $ + 1 + e[y + 1],
        k = i[C],
        T = t[C];
      (D *= D), (g = D * D * (k * F + T * L));
    }
    return 70 * (c + m + g);
  };
}
function re(r) {
  const i = new Uint8Array(512);
  for (let t = 0; t < 512 / 2; t++) i[t] = t;
  for (let t = 0; t < 512 / 2 - 1; t++) {
    const n = t + ~~(r() * (256 - t)),
      l = i[t];
    (i[t] = i[n]), (i[n] = l);
  }
  for (let t = 256; t < 512; t++) i[t] = i[t - 256];
  return i;
}
function z(r, e, i) {
  const t = r.createShader(e);
  return (
    r.shaderSource(t, i),
    r.compileShader(t),
    r.getShaderParameter(t, r.COMPILE_STATUS)
      ? t
      : (console.error('Shader compile error:', r.getShaderInfoLog(t)), r.deleteShader(t), null)
  );
}
const se = `
    attribute vec4 a_position;
    void main() {
        gl_Position = a_position;
    }
`,
  s = {
    waveSpeed: 0.2,
    waveScale: 5,
    spiralCount: 2,
    spiralSpeed: 1,
    colorSpeed: 0.1,
    saturation: 1,
    contrast: 0.75,
    colors: {
      deepBlue: { r: 0, g: 0.15, b: 0.8 },
      brightBlue: { r: 0, g: 0.5, b: 1 },
      brightOrange: { r: 1, g: 0.6, b: 0 },
      deepRed: { r: 0.9, g: 0.1, b: 0 }
    },
    interference: {
      frequency1: 100,
      frequency2: 100,
      amplitude: 0.08
    },
    noise: {
      scale: 0.8613,
      speed: 0,
      strength: 0
    }
  },
  oe = `
    precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform sampler2D u_noiseTexture;
    
    uniform float u_waveSpeed;
    uniform float u_waveScale;
    uniform float u_spiralCount;
    uniform float u_spiralSpeed;
    uniform float u_colorSpeed;
    uniform float u_saturation;
    uniform float u_contrast;
    uniform vec3 u_deepBlue;
    uniform vec3 u_brightBlue;
    uniform vec3 u_brightOrange;
    uniform vec3 u_deepRed;
    uniform float u_interferenceFreq1;
    uniform float u_interferenceFreq2;
    uniform float u_interferenceAmp;
    uniform float u_noiseScale;
    uniform float u_noiseSpeed;
    uniform float u_noiseStrength;

    vec3 colorMap(float t) {
        t = fract(t);
        if (t < 0.33) {
            return mix(u_deepBlue, u_brightBlue, t * 3.0);
        } else if (t < 0.66) {
            return mix(u_brightBlue, u_brightOrange, (t - 0.33) * 3.0);
        } else {
            return mix(u_brightOrange, u_deepRed, (t - 0.66) * 3.0);
        }
    }

    float waveCurve(vec2 uv, float time) {
        float wave1 = sin(uv.x * u_waveScale + uv.y * u_waveScale + time * u_waveSpeed) * 0.5;
        float wave2 = sin(uv.x * u_waveScale * 1.5 - uv.y * u_waveScale * 0.75 + time * u_waveSpeed * 0.7) * 0.3;
        float wave3 = sin(uv.x * u_waveScale * 0.75 + uv.y * u_waveScale * 1.5 + time * u_waveSpeed * 1.3) * 0.4;
        
        float angle = atan(uv.y, uv.x);
        float spiral = sin(u_spiralCount * angle + time * u_spiralSpeed + length(uv) * 5.0) * 0.2;
        
        return wave1 + wave2 * cos(time * 0.1) + wave3 * sin(time * 0.15) + spiral;
    }

    float interferencePattern(vec2 uv, float time) {
        vec2 p = uv * 2.0;
        float pattern = sin(p.x * u_interferenceFreq1 + p.y * u_interferenceFreq2 + time);
        pattern *= sin(p.x * u_interferenceFreq2 - p.y * u_interferenceFreq1 + time * 0.7);
        return pattern * u_interferenceAmp;
    }

    void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        
        vec2 noiseUV = uv * u_noiseScale + vec2(u_time * u_noiseSpeed);
        float noise = texture2D(u_noiseTexture, noiseUV * 0.5 + 0.5).r * 2.0 - 1.0;
        
        uv += noise * u_noiseStrength;
        
        float pattern = waveCurve(uv, u_time);
        pattern += interferencePattern(uv, u_time);
        
        float edgeFade = 1.0 - length(uv) * 0.7;
        edgeFade = smoothstep(0.0, 0.8, edgeFade);
        
        pattern += sin(edgeFade * 3.14) * 0.1;
        pattern += noise * 0.1;
        
        vec3 color = colorMap(pattern + u_time * u_colorSpeed);
        color *= edgeFade;
        
        color = pow(color, vec3(u_contrast));
        color = mix(color, pow(color, vec3(1.2)), u_saturation);
        
        gl_FragColor = vec4(color, 1.0);
    }
`;
function le(r, e = 256) {
  const i = ne(),
    t = new Uint8Array(e * e * 4);
  for (let l = 0; l < e; l++)
    for (let a = 0; a < e; a++) {
      const c = (l * e + a) * 4,
        m = (i(a / 32, l / 32) + 1) * 0.5;
      (t[c] = t[c + 1] = t[c + 2] = m * 255), (t[c + 3] = 255);
    }
  const n = r.createTexture();
  return (
    r.bindTexture(r.TEXTURE_2D, n),
    r.texImage2D(r.TEXTURE_2D, 0, r.RGBA, e, e, 0, r.RGBA, r.UNSIGNED_BYTE, t),
    r.texParameteri(r.TEXTURE_2D, r.TEXTURE_MIN_FILTER, r.LINEAR),
    r.texParameteri(r.TEXTURE_2D, r.TEXTURE_MAG_FILTER, r.LINEAR),
    r.texParameteri(r.TEXTURE_2D, r.TEXTURE_WRAP_S, r.REPEAT),
    r.texParameteri(r.TEXTURE_2D, r.TEXTURE_WRAP_T, r.REPEAT),
    n
  );
}
function ae() {
  const r = document.querySelector('#canvas'),
    e = r.getContext('webgl', { preserveDrawingBuffer: !0 });
  if (!e) {
    console.error('WebGL not supported');
    return;
  }
  const i = z(e, e.VERTEX_SHADER, se),
    t = z(e, e.FRAGMENT_SHADER, oe),
    n = e.createProgram();
  if (
    (e.attachShader(n, i),
    e.attachShader(n, t),
    e.linkProgram(n),
    !e.getProgramParameter(n, e.LINK_STATUS))
  ) {
    console.error('Program link error:', e.getProgramInfoLog(n));
    return;
  }
  const l = le(e),
    a = new I(),
    c = a.addFolder('Wave Parameters');
  c.add(s, 'waveSpeed', 0.1, 2).name('Wave Speed'),
    c.add(s, 'waveScale', 0.5, 5).name('Wave Scale'),
    c.add(s, 'spiralCount', 1, 20).name('Spiral Count'),
    c.add(s, 'spiralSpeed', 0.1, 2).name('Spiral Speed');
  const m = a.addFolder('Color Parameters');
  m.add(s, 'colorSpeed', 0.01, 0.5).name('Color Speed'),
    m.add(s, 'saturation', 0, 1).name('Saturation'),
    m.add(s, 'contrast', 0.5, 2).name('Contrast');
  const g = a.addFolder('Colors'),
    f = g.addFolder('Deep Blue');
  f.add(s.colors.deepBlue, 'r', 0, 1).name('Red'),
    f.add(s.colors.deepBlue, 'g', 0, 1).name('Green'),
    f.add(s.colors.deepBlue, 'b', 0, 1).name('Blue');
  const p = g.addFolder('Bright Blue');
  p.add(s.colors.brightBlue, 'r', 0, 1).name('Red'),
    p.add(s.colors.brightBlue, 'g', 0, 1).name('Green'),
    p.add(s.colors.brightBlue, 'b', 0, 1).name('Blue');
  const v = g.addFolder('Bright Orange');
  v.add(s.colors.brightOrange, 'r', 0, 1).name('Red'),
    v.add(s.colors.brightOrange, 'g', 0, 1).name('Green'),
    v.add(s.colors.brightOrange, 'b', 0, 1).name('Blue');
  const _ = g.addFolder('Deep Red');
  _.add(s.colors.deepRed, 'r', 0, 1).name('Red'),
    _.add(s.colors.deepRed, 'g', 0, 1).name('Green'),
    _.add(s.colors.deepRed, 'b', 0, 1).name('Blue');
  const w = a.addFolder('Interference');
  w.add(s.interference, 'frequency1', 10, 100).name('Frequency 1'),
    w.add(s.interference, 'frequency2', 10, 100).name('Frequency 2'),
    w.add(s.interference, 'amplitude', 0, 0.3).name('Amplitude');
  const A = a.addFolder('Noise');
  A.add(s.noise, 'scale', 0.1, 10).name('Scale'),
    A.add(s.noise, 'speed', 0, 1).name('Speed'),
    A.add(s.noise, 'strength', 0, 0.5).name('Strength');
  const b = e.getAttribLocation(n, 'a_position'),
    d = e.getUniformLocation(n, 'u_time'),
    o = e.getUniformLocation(n, 'u_resolution'),
    u = e.getUniformLocation(n, 'u_noiseTexture'),
    h = {
      waveSpeed: e.getUniformLocation(n, 'u_waveSpeed'),
      waveScale: e.getUniformLocation(n, 'u_waveScale'),
      spiralCount: e.getUniformLocation(n, 'u_spiralCount'),
      spiralSpeed: e.getUniformLocation(n, 'u_spiralSpeed'),
      colorSpeed: e.getUniformLocation(n, 'u_colorSpeed'),
      saturation: e.getUniformLocation(n, 'u_saturation'),
      contrast: e.getUniformLocation(n, 'u_contrast'),
      deepBlue: e.getUniformLocation(n, 'u_deepBlue'),
      brightBlue: e.getUniformLocation(n, 'u_brightBlue'),
      brightOrange: e.getUniformLocation(n, 'u_brightOrange'),
      deepRed: e.getUniformLocation(n, 'u_deepRed'),
      interferenceFreq1: e.getUniformLocation(n, 'u_interferenceFreq1'),
      interferenceFreq2: e.getUniformLocation(n, 'u_interferenceFreq2'),
      interferenceAmp: e.getUniformLocation(n, 'u_interferenceAmp'),
      noiseScale: e.getUniformLocation(n, 'u_noiseScale'),
      noiseSpeed: e.getUniformLocation(n, 'u_noiseSpeed'),
      noiseStrength: e.getUniformLocation(n, 'u_noiseStrength')
    },
    E = e.createBuffer();
  e.bindBuffer(e.ARRAY_BUFFER, E);
  const F = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
  e.bufferData(e.ARRAY_BUFFER, new Float32Array(F), e.STATIC_DRAW);
  function L() {
    const y = r.clientWidth,
      S = r.clientHeight;
    (r.width !== y || r.height !== S) &&
      ((r.width = y), (r.height = S), e.viewport(0, 0, e.canvas.width, e.canvas.height));
  }
  function $(y) {
    (y *= 0.001),
      L(),
      e.clearColor(0, 0, 0, 1),
      e.clear(e.COLOR_BUFFER_BIT),
      e.useProgram(n),
      e.enableVertexAttribArray(b),
      e.bindBuffer(e.ARRAY_BUFFER, E),
      e.vertexAttribPointer(b, 2, e.FLOAT, !1, 0, 0),
      e.activeTexture(e.TEXTURE0),
      e.bindTexture(e.TEXTURE_2D, l),
      e.uniform1i(u, 0),
      e.uniform1f(d, y),
      e.uniform2f(o, e.canvas.width, e.canvas.height),
      e.uniform1f(h.waveSpeed, s.waveSpeed),
      e.uniform1f(h.waveScale, s.waveScale),
      e.uniform1f(h.spiralCount, s.spiralCount),
      e.uniform1f(h.spiralSpeed, s.spiralSpeed),
      e.uniform1f(h.colorSpeed, s.colorSpeed),
      e.uniform1f(h.saturation, s.saturation),
      e.uniform1f(h.contrast, s.contrast),
      e.uniform3f(h.deepBlue, s.colors.deepBlue.r, s.colors.deepBlue.g, s.colors.deepBlue.b),
      e.uniform3f(
        h.brightBlue,
        s.colors.brightBlue.r,
        s.colors.brightBlue.g,
        s.colors.brightBlue.b
      ),
      e.uniform3f(
        h.brightOrange,
        s.colors.brightOrange.r,
        s.colors.brightOrange.g,
        s.colors.brightOrange.b
      ),
      e.uniform3f(h.deepRed, s.colors.deepRed.r, s.colors.deepRed.g, s.colors.deepRed.b),
      e.uniform1f(h.interferenceFreq1, s.interference.frequency1),
      e.uniform1f(h.interferenceFreq2, s.interference.frequency2),
      e.uniform1f(h.interferenceAmp, s.interference.amplitude),
      e.uniform1f(h.noiseScale, s.noise.scale),
      e.uniform1f(h.noiseSpeed, s.noise.speed),
      e.uniform1f(h.noiseStrength, s.noise.strength),
      e.drawArrays(e.TRIANGLES, 0, 6),
      requestAnimationFrame($);
  }
  requestAnimationFrame($);
}
ae();
