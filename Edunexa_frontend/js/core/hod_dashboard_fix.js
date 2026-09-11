/* =========================================================
   EDUNEXA HOD DASHBOARD FINAL FIX
   Fixes the blank HOD content caused by the legacy V2 HOD
   navigation/default-page override. Keeps the newer HOD pages.
========================================================= */
(function(){
  "use strict";

  // The older V2 patch redirected HOD login to hod-v2-dashboard.
  // The current HOD implementation uses the richer hod-* pages.
  const previousDefaultPage = window.defaultPage;
  window.defaultPage = function(){
    if(window.currentUser && currentUser.role === "hod") return "hod-dashboard";
    return typeof previousDefaultPage === "function" ? previousDefaultPage() : "management-dashboard";
  };

  // Keep the current HOD navigation and remove the obsolete V2 menu items.
  const previousBuildNav = window.buildNav;
  window.buildNav = function(){
    if(typeof previousBuildNav === "function") previousBuildNav();
    if(!window.currentUser || currentUser.role !== "hod") return;

    const nav = document.getElementById("nav");
    if(!nav) return;

    nav.querySelectorAll('.nav[data-page^="hod-v2-"]').forEach(el => el.remove());

    // Remove an orphaned V2 section title if it became empty.
    [...nav.querySelectorAll('.menu-title')].forEach(title => {
      const next = title.nextElementSibling;
      if(title.textContent.trim() === "HOD Department Console" &&
         (!next || !next.classList.contains("nav") || !next.dataset.page?.startsWith("hod-"))){
        title.remove();
      }
    });
  };

  // Ensure every HOD navigation click has a matching visible page.
  const previousGo = window.go;
  window.go = function(pageId){
    let id = pageId;
    const legacyMap = {
      "hod-v2-dashboard":"hod-dashboard",
      "hod-v2-faculty":"hod-faculty",
      "hod-v2-students":"hod-students",
      "hod-v2-feedback":"hod-feedback"
    };
    if(legacyMap[id]) id = legacyMap[id];

    if(typeof previousGo === "function") previousGo(id);

    // Defensive recovery: if a page was not activated, explicitly activate it.
    const target = document.getElementById(id);
    if(target){
      document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p === target));
      document.querySelectorAll(".nav").forEach(n => n.classList.toggle("active", n.dataset.page === id));
      if(typeof renderEnhancementPage === "function") renderEnhancementPage(id);
    }
  };

  // Make sure the HOD pages exist even if an older renderer skipped them.
  const ensureHodPages = function(){
    if(!window.currentUser || currentUser.role !== "hod") return;
    const pages = document.getElementById("pages");
    if(!pages) return;

    const required = [
      "hod-dashboard","hod-faculty","hod-students","hod-mark-requests",
      "hod-class-details","hod-timetable","hod-faculty-timetable",
      "hod-faculty-attendance","hod-extra","hod-feedback","hod-achievements"
    ];

    // enhancementPages() is the source of the current HOD markup.
    if(typeof window.enhancementPages === "function"){
      const existing = new Set(required.filter(id => document.getElementById(id)));
      if(existing.size !== required.length){
        const temp = document.createElement("div");
        temp.innerHTML = enhancementPages();
        required.forEach(id => {
          if(!document.getElementById(id)){
            const page = temp.querySelector("#" + CSS.escape(id));
            if(page) pages.appendChild(page.cloneNode(true));
          }
        });
      }
    }
  };

  const previousRenderPages = window.renderPages;
  window.renderPages = function(){
    if(typeof previousRenderPages === "function") previousRenderPages();
    ensureHodPages();
  };

  const previousOpenApp = window.openApp;
  window.openApp = function(){
    if(typeof previousOpenApp === "function") previousOpenApp();
    if(window.currentUser && currentUser.role === "hod"){
      ensureHodPages();
      buildNav();
      go("hod-dashboard");
      if(typeof refreshEnhancements === "function") refreshEnhancements();
    }
  };

  // If the page is restored from an existing localStorage HOD session,
  // run the same repair after the DOM is ready.
  document.addEventListener("DOMContentLoaded", function(){
    if(window.currentUser && currentUser.role === "hod"){
      setTimeout(function(){
        ensureHodPages();
        buildNav();
        go("hod-dashboard");
      }, 0);
    }
  });
})();
