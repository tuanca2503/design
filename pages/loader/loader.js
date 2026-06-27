class Loader {
  constructor(selector) {
    this.selector = selector;
    this._tasks = new Map(); // riêng
    this._target = 0; // % thật, nhảy ngay khi event xong
    this._display = 0; // % hiển thị, trượt dần tới target
    this._running = false;
    this._raf = null;
    this._bar = null;
    this._text = null;
    this._loader = null;

    // config
    this.opts = {
      style: "custom",
      smoothing: 0.12,
      ceiling: 92,
      timeout: 15000,
      fadeDelay: 350,
      addDefault: true,
    };
  }

  add(key, promise) {
    if (this._tasks.has(key)) return this;
    this._tasks.set(key, { done: false, ok: null });

    // bọc timeout: cái nào treo quá lâu thì tự cho qua
    const withTimeout = Promise.race([
      Promise.resolve(promise),
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error(`timeout: ${key}`)), this.opts.timeout),
      ),
    ]);

    withTimeout
      .then(() => this._markDone(key, true))
      .catch((err) => {
        console.warn(`PageLoader: "${key}" lỗi/timeout —`, err.message);
        this._markDone(key, false); // lỗi vẫn tính là xong
      });

    return this; // cho phép gọi chuỗi: PageLoader.add(...).add(...)
  }

  /**
   * Tiện ích: biến một event của EventTarget thành Promise để add().
   * Ví dụ: PageLoader.add('img', PageLoader.fromEvent(imgEl, 'load', 'error'));
   */
  static fromEvent(target, okEvent, errEvent) {
    return new Promise((resolve, reject) => {
      target.addEventListener(okEvent, resolve, { once: true });
      if (errEvent) target.addEventListener(errEvent, reject, { once: true });
    });
  }
  /**
   * Tiện ích: đợi một ảnh (kể cả khi nó đã cache xong từ trước).
   * Truyền vào phần tử <img> hoặc URL.
   */
  static image(imgOrUrl) {
    return new Promise((resolve, reject) => {
      let img;
      if (typeof imgOrUrl === "string") {
        img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = imgOrUrl;
      } else {
        img = imgOrUrl;
        if (img.complete) {
          // đã xong từ trước (cache) → load/error không bắn nữa, quyết luôn
          img.naturalWidth > 0 ? resolve() : reject(new Error("ảnh hỏng"));
        } else {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", reject, { once: true });
        }
      }
    });
  }

  start(opts) {
    if (this._running) return this;
    this.opts = { ...this.opts, ...opts };
    if (this.opts.addDefault) {
      this.add("dom", this._waitReadyState("interactive"));
      this.add("load", this._waitReadyState("complete"));
    }
    this._running = true;
    this._ensureDom(); // dựng thanh nếu DOM đã có; nếu chưa thì đợi
    this._loop(); // bắt đầu vòng vẽ mượt
    return this;
  }

  /** đợi document tới một readyState, an toàn cả khi đã qua mốc */
  _waitReadyState(state) {
    return new Promise((resolve) => {
      // nếu đã đạt rồi thì resolve ngay
      if (state === "interactive" && document.readyState !== "loading")
        return resolve();
      if (state === "complete" && document.readyState === "complete")
        return resolve();
      // chưa đạt → nghe
      if (state === "interactive") {
        document.addEventListener("DOMContentLoaded", resolve, { once: true });
      } else {
        window.addEventListener("load", resolve, { once: true });
      }
    });
  }

  _markDone(key, ok) {
    const t = this._tasks.get(key);
    if (!t || t.done) return;
    t.done = true;
    t.ok = ok;
    this._recalcTarget();
  }

  /** tính lại % thật từ số event đã xong (chỉ tiến, không lùi) */
  _recalcTarget() {
    const total = this._tasks.size;
    if (total === 0) return;
    const done = [...this._tasks.values()].filter((t) => t.done).length;
    const pct = (done / total) * 100;

    if (done === total) {
      this._target = 100; // xong hết → cho phép chạm 100
    } else {
      // chưa xong hết → chặn trần để không "đầy giả"
      this._target = Math.min(pct, this.opts.ceiling);
    }
    if (this._target < this._display) this._target = this._display; // không lùi
  }

  // ---------------------------------------------------------------
  // UI DRAW
  // ---------------------------------------------------------------

  /** vòng lặp vẽ: hiển thị trượt mượt về target (easing) */
  _loop() {
    const step = () => {
      if (!this._running) return;
      // trượt dần: mỗi khung nhích một phần quãng còn lại
      this._display += (this._target - this._display) * this.opts.smoothing;
      if (this._target - this._display < 0.1) this._display = this._target;

      this._render();

      const allDone = [...this._tasks.values()].every((t) => t.done);
      if (allDone && this._display >= 99.9) {
        this._render(100);
        this._finish();
        return; // dừng vòng lặp
      }
      this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  }
  _render(force) {
    const v = force != null ? force : this._display;
    if (this._bar) {
      this._bar.style.width = `${v}%`;
      this._bar.dataset.value = v;
    }
    if (this._text) {
      this._text.textContent = Math.round(v) + "%";
      this._text.dataset.value = v;
    }
  }
  _finish() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._running = false;
    setTimeout(() => {
      if (!this._loader) return;
      this._loader.style.opacity = "0";
      setTimeout(
        () => {
          this._loader.style.display = "none";
        },
        parseFloat(getComputedStyle(this._loader).transitionDuration) * 1000,
      );
    }, this.opts.fadeDelay);
  }
  _ensureDom() {
    const build = () => {
      this._loader = document.querySelector(this.selector);
      if (!this._loader) {
        this._running = false;
        return;
      }
      this._loader.classList.add(`loader--${this.opts.style}`);
      this._bar = this._loader.querySelector(".loader-bar");
      if (this._bar){
        this._bar.style.width = "0%";
        this._bar.style.transition = "width .05s linear";
      }
      this._text = this._loader.querySelector(".loader-text");
    };

    if (document.body) build();
    else document.addEventListener("DOMContentLoaded", build, { once: true });
  }
}
