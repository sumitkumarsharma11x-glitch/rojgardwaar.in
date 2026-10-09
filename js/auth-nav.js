/* Shared ROJGARDWAAR account identity for every page except About, Contact and Disclaimer. */
(function () {
  "use strict";

  var client = null;
  var siteRoot = window.location.origin;

  function loadScript(src, isSupabaseLibrary) {
    return new Promise(function (resolve, reject) {
      if (isSupabaseLibrary && window.supabase) return resolve();
      if (!isSupabaseLibrary && window.ROJGARDWAAR_SUPABASE) return resolve();

      var existing = Array.from(document.scripts).find(function (s) {
        return s.src && s.src.split("?")[0] === src.split("?")[0];
      });
      if (existing) {
        if (existing.dataset.authLoaded === "true") return resolve();
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = function () {
        script.dataset.authLoaded = "true";
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function getHost() {
    return document.querySelector(".header-inner, .header-row, .rjd-site-header__inner") ||
      document.querySelector("header");
  }

  function makeLink(label, href) {
    var a = document.createElement("a");
    a.href = href;
    a.textContent = label;
    a.style.cssText = "color:#1d4ed8;text-decoration:none;font-weight:700;white-space:nowrap";
    return a;
  }

  function render(user) {
    var host = getHost();
    if (!host) return;

    var chip = document.getElementById("rjd-account-chip");
    if (!chip) {
      chip = document.createElement("div");
      chip.id = "rjd-account-chip";
      chip.setAttribute("aria-live", "polite");
      host.appendChild(chip);
    }
    chip.replaceChildren();
    chip.style.cssText = "margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;max-width:100%;font:600 13px/1.35 Inter,Arial,sans-serif;";

    document.querySelectorAll(".auth-nav-link").forEach(function (el) {
      el.href = user ? siteRoot + "/account.html" : siteRoot + "/login.html";
      el.textContent = user ? "My Account" : "🔐 Login";
    });
    document.querySelectorAll(".auth-register-link").forEach(function (el) {
      el.href = user ? siteRoot + "/account.html" : siteRoot + "/register.html";
      el.textContent = user ? "My Account" : "Create Account";
    });

    if (!user) {
      chip.appendChild(makeLink("🔐 Login", siteRoot + "/login.html"));
      return;
    }

    var identity = document.createElement("a");
    identity.href = siteRoot + "/account.html";
    identity.style.cssText = "display:flex;align-items:center;gap:8px;max-width:100%;padding:6px 9px;border:1px solid #dbe3ef;border-radius:12px;background:#fff;color:#172554;text-decoration:none;";
    var avatar = document.createElement("span");
    avatar.textContent = "♙";
    avatar.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;flex:0 0 34px;border-radius:9px;background:#172b49;color:#fff;font-size:18px";
    var details = document.createElement("span");
    details.style.cssText = "display:flex;flex-direction:column;min-width:0;max-width:190px";
    var name = document.createElement("strong");
    name.textContent = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || (user.email ? user.email.split("@")[0] : "My Account");
    name.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
    var email = document.createElement("small");
    email.textContent = user.email || "";
    email.style.cssText = "font-size:11px;font-weight:500;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
    details.appendChild(name);
    details.appendChild(email);
    identity.appendChild(avatar);
    identity.appendChild(details);
    identity.appendChild(document.createTextNode("⌄"));
    chip.appendChild(identity);

    var logout = document.createElement("button");
    logout.type = "button";
    logout.textContent = "Logout";
    logout.style.cssText = "border:0;border-radius:7px;padding:7px 9px;background:#fee2e2;color:#991b1b;font-weight:700;cursor:pointer";
    logout.addEventListener("click", async function () {
      logout.disabled = true;
      logout.textContent = "Logging out…";
      try {
        var result = await client.auth.signOut();
        if (result.error) throw result.error;
        window.location.href = siteRoot + "/login.html";
      } catch (error) {
        console.error("Logout failed", error);
        logout.disabled = false;
        logout.textContent = "Logout";
        alert("Logout नहीं हो पाया। कृपया फिर से कोशिश करें।");
      }
    });
    chip.appendChild(logout);
  }

  async function boot() {
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", true);
      await loadScript(siteRoot + "/js/supabase-config.js", false);
      var config = window.ROJGARDWAAR_SUPABASE || {};
      if (!window.supabase || !config.url || !config.anonKey) {
        render(null);
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
      render(result && result.data && result.data.session ? result.data.session.user : null);
      client.auth.onAuthStateChange(function (_event, session) {
        render(session ? session.user : null);
      });
    } catch (error) {
      console.error("ROJGARDWAAR account header failed to load", error);
      render(null);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();