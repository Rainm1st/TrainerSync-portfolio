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
