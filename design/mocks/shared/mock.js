/**
 * Shared mock review behaviors: radiogroups, help tips, dialogs/drawers,
 * numbered callouts, and issue tabs. Page scripts call window.MockReview.
 */
(function (global) {
  "use strict";

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function syncRadioGroup(group, checked) {
    if (!group) return;
    var radios = Array.prototype.slice.call(
      group.querySelectorAll('[role="radio"]')
    );
    radios.forEach(function (r) {
      var on = r === checked;
      r.setAttribute("aria-checked", on ? "true" : "false");
      r.tabIndex = on ? 0 : -1;
    });
  }

  function bindRadioGroup(group, attr, onPick) {
    if (!group || group.hasAttribute("data-bound")) return;
    group.setAttribute("data-bound", "1");
    function radios() {
      return Array.prototype.slice.call(
        group.querySelectorAll('[role="radio"]')
      );
    }
    function selectSafe(btn, announce) {
      syncRadioGroup(group, btn);
      if (btn.hasAttribute("data-dw-tab")) {
        var root = btn.closest(".dw");
        var submit = root && root.querySelector("[data-dw-submit]");
        if (submit) submit.textContent = btn.getAttribute("data-dw-tab");
      }
      if (typeof onPick === "function" && announce !== false) {
        var value = attr ? btn.getAttribute(attr) : null;
        onPick(value, btn);
      }
    }
    var initial =
      group.querySelector('[role="radio"][aria-checked="true"]') || radios()[0];
    if (initial) selectSafe(initial, false);

    group.addEventListener("click", function (e) {
      var btn = e.target.closest('[role="radio"]');
      if (!btn || !group.contains(btn)) return;
      selectSafe(btn);
    });
    group.addEventListener("keydown", function (e) {
      var items = radios();
      var i = items.indexOf(document.activeElement);
      if (i < 0) return;
      var next;
      if (e.key === "ArrowRight" || e.key === "ArrowDown")
        next = (i + 1) % items.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
        next = (i - 1 + items.length) % items.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = items.length - 1;
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        selectSafe(items[i]);
        return;
      } else return;
      e.preventDefault();
      items[next].focus();
      selectSafe(items[next]);
    });
  }

  function clearDismissed(help) {
    if (help) help.classList.remove("is-tip-dismissed");
  }

  function placeHelpTip(help) {
    var tip = help && help.querySelector(".tooltip-help");
    if (!tip) return;
    tip.classList.remove("is-below");
    var rect = tip.getBoundingClientRect();
    if (rect.top < 8) tip.classList.add("is-below");
  }

  function placeOpenTips() {
    document
      .querySelectorAll(".help:not(.is-tip-dismissed)")
      .forEach(function (h) {
        if (h.matches(":hover, :focus-within")) placeHelpTip(h);
      });
  }

  function bindHelpTips(root) {
    var scope = root || document;
    scope.addEventListener(
      "keydown",
      function (e) {
        if (e.key !== "Escape") return;
        var open = scope.querySelectorAll(".help:focus-within, .help:hover");
        var closed = false;
        open.forEach(function (h) {
          h.classList.add("is-tip-dismissed");
          closed = true;
        });
        if (closed) e.stopPropagation();
      },
      true
    );
    scope.addEventListener(
      "mouseenter",
      function (e) {
        var help = e.target.closest && e.target.closest(".help");
        if (help) {
          clearDismissed(help);
          placeHelpTip(help);
        }
      },
      true
    );
    scope.addEventListener("focusin", function (e) {
      var help = e.target.closest && e.target.closest(".help");
      if (help) {
        clearDismissed(help);
        placeHelpTip(help);
      }
    });
    window.addEventListener("resize", placeOpenTips);
    window.addEventListener("scroll", placeOpenTips, true);
  }

  function focusables(root) {
    if (!root) return [];
    return Array.prototype.slice
      .call(
        root.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
      .filter(function (el) {
        return !el.hasAttribute("disabled") && el.tabIndex !== -1;
      });
  }

  function trapFocus(container, event) {
    var list = focusables(container);
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* 802 amount drawer (narrow) */
  function bindAmountDrawer(options) {
    options = options || {};
    var breakpoint = options.breakpoint || 1199;
    function narrow() {
      return window.matchMedia("(max-width: " + breakpoint + "px)").matches;
    }
    var drawerReturn = new WeakMap();
    var drawerTrap = null;

    function ensureBackdrop(frame) {
      var existing = frame.querySelector(".drawer-backdrop");
      if (existing) return existing;
      var el = document.createElement("button");
      el.type = "button";
      el.className = "drawer-backdrop";
      el.setAttribute("aria-label", "Close amount drawer");
      frame.appendChild(el);
      el.addEventListener("click", function () {
        setDrawerOpen(frame, false);
      });
      return el;
    }

    function setInertAttr(el, on) {
      if (!el) return;
      if (on) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    }

    function setBackgroundInert(frame, on) {
      var main = frame.querySelector(".pf-main");
      setInertAttr(main, on);
    }

    function setDrawerOpen(frame, open) {
      if (!frame) return;
      ensureBackdrop(frame);
      frame.classList.toggle("is-drawer-open", open);
      setBackgroundInert(frame, open && narrow());
      if (open) {
        var input = frame.querySelector(".pf-rail input.dw-input");
        var opener = document.activeElement;
        if (opener) drawerReturn.set(frame, opener);
        if (input) input.focus();
        drawerTrap = function (e) {
          if (e.key === "Tab")
            trapFocus(frame.querySelector(".pf-rail") || frame, e);
        };
        frame.addEventListener("keydown", drawerTrap);
      } else {
        if (drawerTrap) {
          frame.removeEventListener("keydown", drawerTrap);
          drawerTrap = null;
        }
        setBackgroundInert(frame, false);
        var ret = drawerReturn.get(frame);
        if (ret && typeof ret.focus === "function") ret.focus();
      }
    }

    function openAmount(frame) {
      if (!narrow()) return;
      setDrawerOpen(frame, true);
    }

    document.addEventListener("click", function (e) {
      var opener = e.target.closest("[data-focus-widget]");
      if (opener) {
        var frame = opener.closest(".page-frame, .pf");
        if (frame) openAmount(frame);
      }
      var toggle = e.target.closest("[data-drawer-focus]");
      if (toggle) {
        var f = toggle.closest(".page-frame, .pf");
        if (f) setDrawerOpen(f, !f.classList.contains("is-drawer-open"));
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var openHelp = document.querySelector(".help.is-tip-dismissed");
      if (document.querySelector(".help:focus-within, .help:hover")) return;
      var openFrame = document.querySelector(
        ".page-frame.is-drawer-open, .pf.is-drawer-open"
      );
      if (openFrame) {
        setDrawerOpen(openFrame, false);
        e.preventDefault();
      }
      void openHelp;
    });

    window
      .matchMedia("(max-width: " + breakpoint + "px)")
      .addEventListener("change", function (ev) {
        if (ev.matches) return;
        document
          .querySelectorAll(".page-frame.is-drawer-open, .pf.is-drawer-open")
          .forEach(function (f) {
            setDrawerOpen(f, false);
          });
      });

    return {
      openAmount: openAmount,
      setDrawerOpen: setDrawerOpen,
      narrow: narrow,
    };
  }

  function bindNativeDialog(dialog, openBtn) {
    if (!dialog) return;
    var returnFocus = null;
    function open() {
      returnFocus = document.activeElement;
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      var title = dialog.querySelector("h2, h3, [id]");
      if (title) title.focus();
    }
    function close() {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
      if (returnFocus && typeof returnFocus.focus === "function")
        returnFocus.focus();
    }
    if (openBtn) openBtn.addEventListener("click", open);
    dialog.querySelectorAll("[data-dialog-close]").forEach(function (btn) {
      btn.addEventListener("click", close);
    });
    dialog.addEventListener("cancel", function () {
      if (returnFocus && typeof returnFocus.focus === "function")
        returnFocus.focus();
    });
    return { open: open, close: close };
  }

  function smoothScrollTo(el) {
    if (!el) return;
    el.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }

  function activateTab(tablist, tab) {
    if (!tablist || !tab) return;
    var tabs = Array.prototype.slice.call(
      tablist.querySelectorAll('[role="tab"]')
    );
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute("aria-selected", selected ? "true" : "false");
      t.tabIndex = selected ? 0 : -1;
      var panelId = t.getAttribute("aria-controls");
      var panel = panelId && document.getElementById(panelId);
      if (panel) panel.classList.toggle("is-active", selected);
    });
  }

  function bindIssueTabs(root) {
    var scope = root || document;
    scope
      .querySelectorAll('[role="tablist"].tablist')
      .forEach(function (tablist) {
        var tabs = Array.prototype.slice.call(
          tablist.querySelectorAll('[role="tab"]')
        );
        if (!tabs.length) return;
        var initial =
          tabs.find(function (t) {
            return t.getAttribute("aria-selected") === "true";
          }) || tabs[0];
        activateTab(tablist, initial);

        function selectTab(tab) {
          activateTab(tablist, tab);
          if (history.replaceState) {
            history.replaceState(
              null,
              "",
              "#" + (tab.id || tab.getAttribute("aria-controls") || "")
            );
          }
        }

        tablist.addEventListener("click", function (e) {
          var tab = e.target.closest('[role="tab"]');
          if (!tab || !tablist.contains(tab)) return;
          selectTab(tab);
        });
        tablist.addEventListener("keydown", function (e) {
          var i = tabs.indexOf(document.activeElement);
          if (i < 0) return;
          var next;
          if (e.key === "ArrowRight" || e.key === "ArrowDown")
            next = (i + 1) % tabs.length;
          else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
            next = (i - 1 + tabs.length) % tabs.length;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = tabs.length - 1;
          else return;
          e.preventDefault();
          tabs[next].focus();
          selectTab(tabs[next]);
        });
      });
  }

  function litTargetForNote(noteId) {
    var note = document.getElementById(noteId);
    if (!note) return null;
    var markerHref = note.querySelector(".show-in-mock");
    if (markerHref) {
      var id = (markerHref.getAttribute("href") || "").replace(/^#/, "");
      return id ? document.getElementById(id) : null;
    }
    return null;
  }

  function showNote(noteId, opts) {
    opts = opts || {};
    var note = document.getElementById(noteId);
    if (!note) return;
    var panel = note.closest(".tab-panel");
    if (panel) {
      var tablist = document.querySelector(
        '[role="tablist"].tablist [aria-controls="' + panel.id + '"]'
      );
      if (tablist)
        activateTab(
          tablist.parentElement || tablist.closest('[role="tablist"]'),
          tablist
        );
      else {
        var tab = document.querySelector(
          '[role="tab"][aria-controls="' + panel.id + '"]'
        );
        var list = tab && tab.closest('[role="tablist"]');
        if (list && tab) activateTab(list, tab);
      }
    }
    document.querySelectorAll(".callout-target.is-lit").forEach(function (el) {
      el.classList.remove("is-lit");
    });
    var target =
      litTargetForNote(noteId) ||
      document.querySelector(
        '.callout-target a.callout[href="#' + noteId + '"]'
      );
    if (target && target.classList.contains("callout")) {
      target = target.closest(".callout-target");
    }
    if (target) target.classList.add("is-lit");
    if (opts.scroll !== false) smoothScrollTo(note);
    if (opts.focus !== false) {
      note.setAttribute("tabindex", "-1");
      note.focus({ preventScroll: true });
    }
    if (opts.hash !== false && history.replaceState) {
      history.replaceState(null, "", "#" + noteId);
    }
  }

  var hashHandlingBound = false;

  function noteIdForMarker(markerEl) {
    if (!markerEl) return null;
    // Prefer the marker's own callout; a descendant query can hit a nested
    // callout-target's link first when markers wrap other markers.
    var callout =
      markerEl.querySelector(':scope > a.callout[href^="#n-"]') ||
      markerEl.querySelector('a.callout[href^="#n-"]');
    if (callout) return (callout.getAttribute("href") || "").replace(/^#/, "");
    var id = markerEl.id;
    if (!id) return null;
    var show = document.querySelector('.show-in-mock[href="#' + id + '"]');
    var note = show && show.closest(".note-card");
    return note ? note.id : null;
  }

  function bindCallouts(root) {
    var scope = root || document;
    scope.addEventListener("click", function (e) {
      var callout = e.target.closest("a.callout");
      if (callout) {
        var href = callout.getAttribute("href") || "";
        if (href.charAt(0) === "#") {
          e.preventDefault();
          showNote(href.slice(1), { scroll: true, focus: true });
        }
        return;
      }
      var back = e.target.closest("a.show-in-mock");
      if (back) {
        var id = (back.getAttribute("href") || "").replace(/^#/, "");
        var marker = id && document.getElementById(id);
        if (marker) {
          e.preventDefault();
          document
            .querySelectorAll(".callout-target.is-lit")
            .forEach(function (el) {
              el.classList.remove("is-lit");
            });
          var wrap = marker.classList.contains("callout-target")
            ? marker
            : marker.closest(".callout-target") || marker;
          wrap.classList.add("is-lit");
          smoothScrollTo(wrap);
          var noteCard = back.closest(".note-card");
          var noteId = noteCard && noteCard.id;
          var calloutEl =
            (noteId &&
              document.querySelector('a.callout[href="#' + noteId + '"]')) ||
            wrap.querySelector(":scope > a.callout") ||
            wrap.querySelector("a.callout") ||
            marker;
          if (calloutEl && calloutEl.focus)
            calloutEl.focus({ preventScroll: true });
          if (history.replaceState) history.replaceState(null, "", "#" + id);
        }
      }
    });

    scope.querySelectorAll(".note-card").forEach(function (note) {
      note.addEventListener("mouseenter", function () {
        var t = litTargetForNote(note.id);
        document
          .querySelectorAll(".callout-target.is-lit")
          .forEach(function (el) {
            el.classList.remove("is-lit");
          });
        if (t) t.classList.add("is-lit");
      });
      note.addEventListener("focusin", function () {
        var t = litTargetForNote(note.id);
        document
          .querySelectorAll(".callout-target.is-lit")
          .forEach(function (el) {
            el.classList.remove("is-lit");
          });
        if (t) t.classList.add("is-lit");
      });
    });
    if (!hashHandlingBound) {
      hashHandlingBound = true;
      applyHash();
      window.addEventListener("hashchange", applyHash);
    }
  }

  function bindHideMarkers() {
    var btn = document.querySelector(".hide-markers");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var on = document.body.classList.toggle("hide-markers");
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.textContent = on ? "Show markers" : "Hide markers";
    });
  }

  function applyHash() {
    var hash = (location.hash || "").replace(/^#/, "");
    if (!hash) return;
    if (hash.indexOf("tab-") === 0) {
      var tab = document.getElementById(hash);
      var list = tab && tab.closest('[role="tablist"]');
      if (list && tab) activateTab(list, tab);
      return;
    }
    var el = document.getElementById(hash);
    if (!el) return;
    if (hash.indexOf("n-") === 0) {
      showNote(hash, { scroll: true, focus: true, hash: false });
      return;
    }
    if (hash.indexOf("m-") === 0 || el.classList.contains("callout-target")) {
      var noteId = noteIdForMarker(el);
      if (noteId)
        showNote(noteId, { scroll: false, focus: false, hash: false });
      smoothScrollTo(el);
      return;
    }
    smoothScrollTo(el);
  }

  function initReviewChrome(root) {
    bindHelpTips(root);
    bindIssueTabs(root);
    bindCallouts(root);
    bindHideMarkers();
    document.querySelectorAll('[role="radiogroup"]').forEach(function (g) {
      if (!g.hasAttribute("data-bound")) {
        bindRadioGroup(g);
        g.setAttribute("data-bound", "1");
      }
    });
  }

  global.MockReview = {
    prefersReducedMotion: prefersReducedMotion,
    syncRadioGroup: syncRadioGroup,
    bindRadioGroup: bindRadioGroup,
    bindHelpTips: bindHelpTips,
    bindAmountDrawer: bindAmountDrawer,
    bindNativeDialog: bindNativeDialog,
    focusables: focusables,
    trapFocus: trapFocus,
    smoothScrollTo: smoothScrollTo,
    activateTab: activateTab,
    bindIssueTabs: bindIssueTabs,
    showNote: showNote,
    bindCallouts: bindCallouts,
    bindHideMarkers: bindHideMarkers,
    initReviewChrome: initReviewChrome,
  };
})(typeof window !== "undefined" ? window : globalThis);
