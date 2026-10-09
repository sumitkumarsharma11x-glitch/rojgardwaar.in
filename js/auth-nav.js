/* Shared ROJGARDWAAR login indicator for every page. */
(function () {
  "use strict";
  var scriptUrl = document.currentScript && document.currentScript.src
    ? document.currentScript.src : new URL("/js/auth-nav.js", location.origin).href;
  var siteRoot = new URL("/", scriptUrl).origin;
  var client = null;
  var statusEl = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = Array.from(document.scripts).find(function (s) { return s.src === src; });
      if (existing) {
        if (existing.dataset.loaded === "true") return resolve();
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        if (existing.dataset.loading !== "true") resolve();
        return;
      }
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.dataset.loading = "true";
      s.onload = function () { s.dataset.loaded = "true"; resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function ensureStatus() {
    if (statusEl && statusEl.isConnected) return statusEl;
    statusEl = document.getElementById("rjd-auth-status");
    if (statusEl) return statusEl;
    var host = document.querySelector(".header-inner, .header-row, .rjd-site-header__inner, header");
    if (!host) return null;
    statusEl = document.createElement("div");
    statusEl.id = "rjd-auth-status";
    statusEl.setAttribute("aria-live", "polite");
    statusEl.style.cssText = "display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;font:600 13px/1.35 Inter,Arial,sans-serif;margin:6px 10px;padding:6px 10px;border:1px solid #dbeafe;border-radius:10px;background:#eff6ff;color:#1e3a8a;";
    host.appendChild(statusEl);
    return statusEl;
  }

  function accountUrl() { return siteRoot + "/account.html"; }
  function loginUrl() { return siteRoot + "/login.html"; }

  function updateAuthNav(user) {
    document.querySelectorAll(".auth-nav-link").forEach(function (el) {
      el.href = user ? accountUrl() : loginUrl();
      el.textContent = user ? "My Account" : "🔐 Login";
      el.setAttribute("aria-label", user ? "My Account" : "Login");
    });
    document.querySelectorAll(".auth-register-link").forEach(function (el) {
      el.href = user ? accountUrl() : siteRoot + "/register.html";
      el.textContent = user ? "My Account" : "Create Account";
      el.setAttribute("aria-label", user ? "My Account" : "Create Account");
    });

    var box = ensureStatus();
    if (!box) return;
    box.replaceChildren();
    if (!user) {
      var login = document.createElement("a");
      login.href = loginUrl();
      login.textContent = "🔐 Login";
      login.style.cssText = "color:#1d4ed8;text-decoration:none;font-weight:700";
      box.appendChild(login);
      return;
    }

    var label = document.createElement("span");
    label.textContent = "✓ Logged in: " + (user.email || user.user_metadata?.full_name || "My account");
    label.style.cssText = "overflow-wrap:anywhere";
    box.appendChild(label);

    var account = document.createElement("a");
    account.href = accountUrl();
    account.textContent = "My Account";
    account.style.cssText = "color:#1d4ed8;text-decoration:underline;white-space:nowrap";
    box.appendChild(account);

    var logout = document.createElement("button");
    logout.type = "button";
    logout.textContent = "Logout";
    logout.style.cssText = "border:0;border-radius:6px;padding:5px 8px;background:#fee2e2;color:#991b1b;font-weight:700;cursor:pointer";
    logout.addEventListener("click", async function () {
      logout.disabled = true;
      logout.textContent = "Logging out…";
      try {
        if (client) {
          var result = await client.auth.signOut();
          if (result.error) throw result.error;
        }
        window.location.href = loginUrl();
      } catch (err) {
        logout.disabled = false;
        logout.textContent = "Logout";
        console.error("Logout failed", err);
        alert("Logout नहीं हो पाया। कृपया फिर से कोशिश करें।");
      }
    });
    box.appendChild(logout);
  }

  async function bootAuthNav() {
    try {
      if (!window.supabase) {
        await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
      }
      if (!window.ROJGARDWAAR_SUPABASE) {
        await loadScript(siteRoot + "/js/supabase-config.js");
      }
      var config = window.ROJGARDWAAR_SUPABASE || {};
      if (!window.supabase || !config.url || !config.anonKey) {
        updateAuthNav(null);
        return;
      }
      client = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
          storageKey: "rojgardwaar-auth"
        }
      });
      var result = await client.auth.getSession();
      updateAuthNav(result && result.data ? result.data.session?.user : null);
      client.auth.onAuthStateChange(function (_event, session) {
        updateAuthNav(session ? session.user : null);
      });
    } catch (err) {
      console.warn("Auth navigation update failed", err);
      updateAuthNav(null);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAuthNav);
  } else {
    bootAuthNav();
  }
})();
