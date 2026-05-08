(function () {
  "use strict";

  if (window.lucide && typeof lucide.createIcons === "function") {
    lucide.createIcons();
  }

  /* Pin section nav with fixed positioning after scroll (more reliable than CSS sticky on Pages / iOS). */
  (function initJumpDock() {
    var dock = document.querySelector(".jump-dock");
    var sentinel = dock && dock.querySelector(".jump-dock__sentinel");
    var nav = dock && dock.querySelector("nav.jump");
    if (!dock || !sentinel || !nav || typeof IntersectionObserver === "undefined") {
      return;
    }

    function setJumpHeight() {
      dock.style.setProperty("--jump-h", nav.offsetHeight + "px");
    }

    var io = new IntersectionObserver(
      function (entries) {
        var e = entries[0];
        var pin = !e.isIntersecting && e.boundingClientRect.top < 0;
        dock.classList.toggle("is-pinned", pin);
        setJumpHeight();
      },
      { root: null, threshold: [0, 1] }
    );
    io.observe(sentinel);

    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(setJumpHeight).observe(nav);
    }
    window.addEventListener("resize", setJumpHeight);
    window.addEventListener("load", setJumpHeight);
    setJumpHeight();
  })();

  var links = Array.prototype.slice.call(document.querySelectorAll('.jump a[href^="#"]'));
  var seen = {};
  var sections = [];
  links.forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    if (seen[id]) return;
    seen[id] = true;
    var el = document.getElementById(id);
    if (el) sections.push(el);
  });
  if (!sections.length) return;

  function setActive(id) {
    links.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
    });
  }

  var observer = new IntersectionObserver(
    function (entries) {
      var visible = entries
        .filter(function (e) {
          return e.isIntersecting && e.intersectionRatio > 0.08;
        })
        .sort(function (a, b) {
          return b.intersectionRatio - a.intersectionRatio;
        });
      if (visible.length) setActive(visible[0].target.id);
    },
    { root: null, rootMargin: "-14% 0px -58% 0px", threshold: [0, 0.08, 0.15, 0.25, 0.4, 0.6] }
  );
  sections.forEach(function (el) {
    observer.observe(el);
  });
})();

(function () {
  "use strict";

  var root = document.getElementById("survey-lightbox");
  if (!root) return;

  var imgEl = root.querySelector(".survey-lightbox__img");
  var closeBtn = root.querySelector(".survey-lightbox__close");
  var backdrop = root.querySelector(".survey-lightbox__backdrop");
  var prevBtn = root.querySelector(".survey-lightbox__nav--prev");
  var nextBtn = root.querySelector(".survey-lightbox__nav--next");
  var counterEl = root.querySelector(".survey-lightbox__counter");

  var lastFocus = null;
  var slides = [];
  var slideIndex = 0;

  Array.prototype.forEach.call(document.querySelectorAll(".survey-accordion__gallery img"), function (thumb) {
    thumb.tabIndex = 0;
    thumb.setAttribute("role", "button");
    thumb.setAttribute("aria-label", (thumb.getAttribute("alt") || "Figure") + " — enlarge");
  });

  function applySlide() {
    if (!slides.length || slideIndex < 0 || slideIndex >= slides.length) return;
    var item = slides[slideIndex];
    imgEl.src = item.src;
    imgEl.alt = item.alt;

    var multi = slides.length > 1;
    if (counterEl) {
      counterEl.hidden = !multi;
      counterEl.textContent = multi ? slideIndex + 1 + " / " + slides.length : "";
    }
    if (prevBtn && nextBtn) {
      prevBtn.hidden = !multi;
      nextBtn.hidden = !multi;
      prevBtn.disabled = slideIndex <= 0;
      nextBtn.disabled = slideIndex >= slides.length - 1;
    }

    if (multi) {
      root.setAttribute("aria-label", "Figure " + (slideIndex + 1) + " / " + slides.length);
    } else {
      root.setAttribute("aria-label", "Figure viewer");
    }
  }

  function stepSlide(delta) {
    if (slides.length <= 1) return;
    var next = slideIndex + delta;
    if (next < 0 || next >= slides.length) return;
    slideIndex = next;
    applySlide();
  }

  function openFromThumb(thumb) {
    if (!thumb || thumb.tagName !== "IMG") return;
    var gallery = thumb.closest(".survey-accordion__gallery");
    if (!gallery) return;

    var imgs = gallery.querySelectorAll("img");
    slides = Array.prototype.map.call(imgs, function (el) {
      return {
        src: el.currentSrc || el.getAttribute("src") || "",
        alt: el.getAttribute("alt") || ""
      };
    });
    slideIndex = Array.prototype.indexOf.call(imgs, thumb);
    if (slideIndex < 0) slideIndex = 0;

    var first = slides[slideIndex];
    if (!first || !first.src) return;

    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add("survey-lightbox-open");
    applySlide();
    closeBtn.focus();
  }

  function closeLightbox() {
    root.hidden = true;
    slides = [];
    slideIndex = 0;
    imgEl.removeAttribute("src");
    imgEl.alt = "";
    if (counterEl) {
      counterEl.textContent = "";
      counterEl.hidden = true;
    }
    if (prevBtn && nextBtn) {
      prevBtn.hidden = true;
      nextBtn.hidden = true;
      prevBtn.disabled = true;
      nextBtn.disabled = true;
    }
    root.setAttribute("aria-label", "Figure viewer");
    document.body.classList.remove("survey-lightbox-open");
    if (lastFocus && typeof lastFocus.focus === "function") {
      try {
        lastFocus.focus();
      } catch (err) {
        /* ignore */
      }
    }
    lastFocus = null;
  }

  document.addEventListener(
    "click",
    function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var gallery = t.closest(".survey-accordion__gallery");
      if (!gallery || t.tagName !== "IMG") return;
      e.preventDefault();
      openFromThumb(t);
    },
    false
  );

  document.addEventListener(
    "keydown",
    function (e) {
      var t = e.target;
      if (
        (e.key === "Enter" || e.key === " ") &&
        t &&
        t.tagName === "IMG" &&
        t.closest &&
        t.closest(".survey-accordion__gallery")
      ) {
        e.preventDefault();
        openFromThumb(t);
      }

      if (root.hidden) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
        return;
      }

      if (slides.length <= 1) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepSlide(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepSlide(1);
      }
    },
    false
  );

  closeBtn.addEventListener("click", closeLightbox);
  backdrop.addEventListener("click", closeLightbox);

  if (prevBtn) {
    prevBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      stepSlide(-1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      stepSlide(1);
    });
  }
})();
