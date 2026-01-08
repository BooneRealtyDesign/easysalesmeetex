/* ==========================================================
   Slide-like Scroll Deck (scroll snapping + parallax)
   - Renders ALL slides as sections
   - Sidebar links scroll to sections
   - Scroll snapping in the main deck
   - Parallax background layers per section
   - Tracks completion with localStorage
   ========================================================== */

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  const lesson = window.LESSON;
  if (!lesson || !Array.isArray(lesson.slides)) {
    console.error("LESSON data not found. Ensure content/lesson-data.js loads before js/app.js");
    return;
  }

  // Elements
  const brandNameEl = $("#brandName");
  const lessonTitleEl = $("#lessonTitle");
  const footerLinkEl = $("#footerLink");
  const yearEl = $("#year");

  const tocEl = $("#toc");
  const sectionsEl = $("#sections");
  const deckEl = $("#scrolldeck"); // scroll container

  const progressBarEl = $("#progressBar");
  const progressPillEl = $("#progressPill");

  const btnReset = $("#btnReset");
  const helpModal = $("#helpModal");
  const btnHelp = $("#btnHelp");
  const btnCtaTop = $("#btnCtaTop");

  // Progress stored in localStorage
  const STORAGE_KEY = "interactive_lesson_progress_v3_snap";
  const getProgress = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { done: {} };
    } catch {
      return { done: {} };
    }
  };
  const setProgress = (p) => localStorage.setItem(STORAGE_KEY, JSON.stringify(p));

  const esc = (s) => String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const slideCount = lesson.slides.length;

  function markDone(slideId) {
    const p = getProgress();
    p.done[slideId] = true;
    setProgress(p);
  }

  function updateProgressUI() {
    const p = getProgress();
    const doneCount = lesson.slides.filter(s => p.done[s.id]).length;
    const pct = Math.round((doneCount / slideCount) * 100);

    if (progressBarEl) progressBarEl.style.width = `${pct}%`;
    if (progressPillEl) progressPillEl.textContent = `${pct}% complete`;
  }

  function renderTOC(activeId) {
    const p = getProgress();
    tocEl.innerHTML = "";

    lesson.slides.forEach((slide, i) => {
      const done = !!p.done[slide.id];
      const item = document.createElement("button");
      item.type = "button";
      item.className = "toc__item" + (slide.id === activeId ? " toc__item--active" : "");
      item.setAttribute("data-target", slide.id);

      const left = document.createElement("div");
      left.className = "toc__title";
      left.textContent = slide.title || `Section ${i + 1}`;

      const meta = document.createElement("div");
      meta.className = "toc__meta";
      const dot = document.createElement("span");
      dot.className = "toc__dot" + (done ? " toc__dot--done" : "");
      const small = document.createElement("span");
      small.textContent = `${i + 1}/${slideCount}`;

      meta.appendChild(dot);
      meta.appendChild(small);

      item.appendChild(left);
      item.appendChild(meta);

      item.addEventListener("click", () => {
        const el = document.getElementById(slide.id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      tocEl.appendChild(item);
    });
  }

  // Block renderers
  function renderBlock(block, slideId) {
    const wrap = document.createElement("div");

    switch (block.type) {
      case "text": {
        wrap.innerHTML = block.html || "";
        return wrap;
      }
      case "callout": {
        wrap.className = "callout";
        wrap.innerHTML = `
          <div class="callout__title">${esc(block.title || "Note")}</div>
          <div class="callout__body">${esc(block.body || "")}</div>
        `;
        return wrap;
      }
      case "list": {
        const title = block.title ? `<p><strong>${esc(block.title)}</strong></p>` : "";
        const items = (block.items || []).map(it => `<li>${esc(it)}</li>`).join("");
        wrap.innerHTML = `${title}<ul class="list">${items}</ul>`;
        return wrap;
      }
      case "image": {
        wrap.className = "media";
        const alt = esc(block.alt || "");
        const cap = block.caption ? `<div class="media__caption">${esc(block.caption)}</div>` : "";
        wrap.innerHTML = `<img src="${esc(block.src || "")}" alt="${alt}" />${cap}`;
        return wrap;
      }
      case "video": {
        wrap.className = "media";
        const cap = block.caption ? `<div class="media__caption">${esc(block.caption)}</div>` : "";
        const src = esc(block.src || "");
        wrap.innerHTML = `
          <video controls preload="metadata">
            <source src="${src}" />
            Your browser does not support the video tag.
          </video>
          ${cap}
        `;
        return wrap;
      }
      case "embed": {
        wrap.className = "media";
        const cap = block.caption ? `<div class="media__caption">${esc(block.caption)}</div>` : "";
        const src = esc(block.src || "");
        wrap.innerHTML = `
          <iframe
            src="${src}"
            title="${esc(block.title || "Embedded media")}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
          ${cap}
        `;
        return wrap;
      }
      case "actions": {
        wrap.className = "actions";
        (block.items || []).forEach((a) => {
          const link = document.createElement("a");
          link.className = "action-link";
          link.href = a.url || "#";
          link.target = (a.url || "").startsWith("http") || (a.url || "").startsWith("mailto:") ? "_blank" : "_self";
          link.rel = link.target === "_blank" ? "noopener" : "";

          const label = document.createElement("span");
          label.textContent = a.label || "Link";
          link.appendChild(label);

          if (a.badge) {
            const badge = document.createElement("span");
            badge.className = "badge";
            badge.textContent = a.badge;
            link.appendChild(badge);
          }

          wrap.appendChild(link);
        });
        return wrap;
      }
      case "quiz": {
        wrap.className = "quiz";

        const q = document.createElement("div");
        q.className = "quiz__q";
        q.textContent = block.question || "Question";

        const form = document.createElement("div");
        const feedback = document.createElement("div");
        feedback.className = "quiz__feedback";
        feedback.textContent = "";

        const name = `q_${slideId}`;

        (block.options || []).forEach((opt, idx) => {
          const row = document.createElement("label");
          row.className = "quiz__opt";

          const input = document.createElement("input");
          input.type = "radio";
          input.name = name;
          input.value = String(idx);

          const text = document.createElement("div");
          text.textContent = opt.label || `Option ${idx + 1}`;

          row.appendChild(input);
          row.appendChild(text);

          row.addEventListener("click", () => {
            const isCorrect = !!opt.correct;
            feedback.textContent = opt.feedback || (isCorrect ? "Correct." : "Not quite—try again.");

            if (isCorrect) {
              markDone(slideId);
              updateProgressUI();
              renderTOC(activeSectionId || slideId);
            }
          });

          form.appendChild(row);
        });

        wrap.appendChild(q);
        wrap.appendChild(form);
        wrap.appendChild(feedback);
        return wrap;
      }
      default: {
        wrap.innerHTML = `<p><em>Unknown block type:</em> <code>${esc(block.type)}</code></p>`;
        return wrap;
      }
    }
  }

  function renderSections() {
    sectionsEl.innerHTML = "";
    const p = getProgress();

    lesson.slides.forEach((slide, i) => {
      const section = document.createElement("section");
      section.className = "section reveal";
      section.id = slide.id;

      const header = document.createElement("div");
      header.className = "section__header";

      const kicker = document.createElement("div");
      kicker.className = "section__kicker";
      kicker.textContent = slide.kicker || `Section ${i + 1}`;

      const title = document.createElement("h2");
      title.className = "section__title";
      title.textContent = slide.title || `Section ${i + 1}`;

      header.appendChild(kicker);
      header.appendChild(title);

      const body = document.createElement("div");
      body.className = "section__body";

      if (slide.lead) {
        const lead = document.createElement("p");
        lead.className = "section__lead";
        lead.textContent = slide.lead;
        body.appendChild(lead);
      }

      (slide.blocks || []).forEach((b) => body.appendChild(renderBlock(b, slide.id)));

      const footer = document.createElement("div");
      footer.className = "section__footer";

      const status = document.createElement("small");
      status.setAttribute("data-status", slide.id);
      status.textContent = p.done[slide.id] ? "Completed" : "Not completed yet";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn--ghost";
      btn.textContent = p.done[slide.id] ? "Mark as not done" : "Mark complete";

      btn.addEventListener("click", () => {
        const prog = getProgress();
        const isDone = !!prog.done[slide.id];
        if (isDone) delete prog.done[slide.id];
        else prog.done[slide.id] = true;
        setProgress(prog);

        status.textContent = prog.done[slide.id] ? "Completed" : "Not completed yet";
        btn.textContent = prog.done[slide.id] ? "Mark as not done" : "Mark complete";
        renderTOC(activeSectionId || slide.id);
        updateProgressUI();
      });

      footer.appendChild(status);
      footer.appendChild(btn);

      section.appendChild(header);
      section.appendChild(body);
      section.appendChild(footer);
      sectionsEl.appendChild(section);
    });
  }

  let activeSectionId = lesson.slides[0]?.id || null;
  function setActiveSection(id) {
    if (!id) return;
    activeSectionId = id;
    renderTOC(id);
  }

  function initBranding() {
    brandNameEl.textContent = lesson.brandName || "Your Organization";
    lessonTitleEl.textContent = lesson.lessonTitle || "Monthly Lesson";
    footerLinkEl.textContent = lesson.footerLinkText || "yourwebsite.com";
    footerLinkEl.href = lesson.footerLinkUrl || "#";
    yearEl.textContent = String(new Date().getFullYear());

    if (lesson.topCta && lesson.topCta.show && lesson.topCta.label && lesson.topCta.url) {
      btnCtaTop.style.display = "inline-flex";
      btnCtaTop.textContent = lesson.topCta.label;
      btnCtaTop.href = lesson.topCta.url;
    } else {
      btnCtaTop.style.display = "none";
    }
  }

  let revealObserver = null;
  let activeObserver = null;

  function setupObservers() {
    if (revealObserver) revealObserver.disconnect();
    if (activeObserver) activeObserver.disconnect();

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");

        const id = entry.target.id;
        const slide = lesson.slides.find(s => s.id === id);
        if (slide && slide.markCompleteOnView) {
          const p = getProgress();
          if (!p.done[id]) {
            p.done[id] = true;
            setProgress(p);

            const status = document.querySelector(`[data-status="${id}"]`);
            if (status) status.textContent = "Completed";
            const btn = entry.target.querySelector(".section__footer .btn");
            if (btn) btn.textContent = "Mark as not done";

            updateProgressUI();
            renderTOC(activeSectionId || id);
          }
        }
      });
    }, { root: deckEl || null, threshold: 0.18 });

    document.querySelectorAll(".section.reveal").forEach(el => revealObserver.observe(el));

    activeObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setActiveSection(visible.target.id);
    }, { root: deckEl || null, threshold: [0.35, 0.55, 0.75] });

    document.querySelectorAll(".section").forEach(el => activeObserver.observe(el));
  }

  // Parallax: update CSS variable per section based on its position in the scroll container
  let raf = null;
  function updateParallax() {
    if (!deckEl) return;
    const deckRect = deckEl.getBoundingClientRect();
    const viewportH = deckRect.height || window.innerHeight;

    document.querySelectorAll(".section").forEach((sec) => {
      const r = sec.getBoundingClientRect();
      const center = r.top - deckRect.top + r.height / 2;
      const delta = (center - viewportH / 2) / (viewportH / 2);
      const y = Math.max(-24, Math.min(24, delta * 18));
      sec.style.setProperty("--parallaxY", `${y}px`);
    });
  }

  function onDeckScroll() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      updateParallax();
    });
  }

  function bindEvents() {
    btnReset.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      renderSections();
      setupObservers();
      setActiveSection(lesson.slides[0]?.id || null);
      updateProgressUI();
      updateParallax();
    });

    btnHelp.addEventListener("click", () => {
      if (helpModal && typeof helpModal.showModal === "function") helpModal.showModal();
    });

    if (deckEl) {
      deckEl.addEventListener("scroll", onDeckScroll, { passive: true });
      window.addEventListener("resize", updateParallax);
    }
  }

  initBranding();
  renderSections();
  bindEvents();
  updateProgressUI();
  renderTOC(activeSectionId);
  setupObservers();
  updateParallax();
})();
