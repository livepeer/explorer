/**
 * Draws the `next` sidebar and header inside every `.app` frame so each mock
 * sits in the real shell. Set data-nav (route key) and data-crumb on `.app`.
 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var ICONS = {
    portfolio:
      '<path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>',
    orchestrators:
      '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 6h.01M6 18h.01"/>',
    validators:
      '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    gateways:
      '<circle cx="12" cy="4.5" r="2.5"/><path d="m10.2 6.3-3.9 3.9"/><circle cx="4.5" cy="12" r="2.5"/><path d="M7 12h10"/><circle cx="19.5" cy="12" r="2.5"/><path d="m13.8 17.7 3.9-3.9"/><circle cx="12" cy="19.5" r="2.5"/>',
    network:
      '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
    governance:
      '<path d="M10 18v-7M14 18v-7M18 18v-7M6 18v-7M3 22h18M12 2 3 7h18z"/>',
    activity:
      '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  };
  var NAV = [
    ["portfolio", "Portfolio", "../delegating/index.html"],
    ["orchestrators", "Orchestrators", "../orchestrators/index.html"],
    ["validators", "Validators", "../validators/index.html"],
    ["gateways", "Gateways", null],
    ["network", "Network", null],
    ["governance", "Governance", null],
    ["activity", "Activity", "../history/index.html"],
  ];

  function icon(key) {
    return (
      '<svg xmlns="' +
      NS +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      ICONS[key] +
      "</svg>"
    );
  }

  function build(app) {
    var active = app.getAttribute("data-nav");
    var crumb = app.getAttribute("data-crumb") || "";
    var parent = app.getAttribute("data-crumb-parent");
    var side = app.querySelector(".app-side");
    if (side && !side.children.length) {
      var links = NAV.map(function (n) {
        var cur = n[0] === active ? ' aria-current="page"' : "";
        var href = n[2]
          ? ' href="' + n[2] + '"'
          : ' href="#" aria-disabled="true"';
        return "<li><a" + href + cur + ">" + icon(n[0]) + n[1] + "</a></li>";
      }).join("");
      side.innerHTML =
        '<div class="app-brand">Livepeer <span class="badge">Explorer</span></div>' +
        '<div class="app-search" aria-hidden="true">Search<kbd>⌘K</kbd></div>' +
        '<nav aria-label="Primary"><ul class="app-nav">' +
        links +
        "</ul></nav>" +
        '<div class="app-side-foot"><span>Appearance</span>' +
        '<button type="button" class="theme-toggle" aria-pressed="false">Dark</button></div>';
    }
    var header = app.querySelector(".app-header");
    if (header && !header.children.length) {
      header.innerHTML =
        '<div class="crumb">' +
        (parent
          ? "<span>" + parent + '</span><span aria-hidden="true">/</span>'
          : "") +
        '<span aria-current="page">' +
        crumb +
        "</span></div>" +
        '<div class="app-actions"><span class="badge">Mock wallet</span></div>';
    }
  }

  function bindTheme() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest(".theme-toggle");
      if (!btn) return;
      var root = document.documentElement;
      var light = root.getAttribute("data-theme") !== "light";
      if (light) root.setAttribute("data-theme", "light");
      else root.removeAttribute("data-theme");
      document.querySelectorAll(".theme-toggle").forEach(function (b) {
        b.textContent = light ? "Light" : "Dark";
        b.setAttribute("aria-pressed", light ? "true" : "false");
      });
    });
  }

  document.querySelectorAll(".app").forEach(build);
  bindTheme();
})();
