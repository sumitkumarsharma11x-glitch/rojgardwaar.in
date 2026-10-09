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

  var STYLE_ID = "rjd-account-chip-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent = [
      "#rjd-account-chip{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:8px;flex:0 1 auto;min-width:0;flex-wrap:nowrap;font:600 13px/1.35 Inter,Arial,sans-serif}",
      "#rjd-account-chip a.rjd-chip-link{color:#1d4ed8;text-decoration:none;font-weight:700;white-space:nowrap}",
      "#rjd-account-chip .rjd-chip-identity{display:flex;align-items:center;gap:8px;min-width:0;padding:5px 9px;border:1px solid #dbe3ef;border-radius:12px;background:#fff;color:#172554;text-decoration:none}",
      "#rjd-account-chip .rjd-chip-avatar{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;flex:0 0 32px;border-radius:9px;background:#172b49;color:#fff;font-size:17px}",
      "#rjd-account-chip .rjd-chip-details{display:flex;flex-direction:column;min-width:0;max-width:190px}",
      "#rjd-account-chip .rjd-chip-details strong,#rjd-account-chip .rjd-chip-details small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      "#rjd-account-chip .rjd-chip-details small{font-size:11px;font-weight:500;color:#64748b}",
      "#rjd-account-chip .rjd-chip-logout{border:0;border-radius:7px;padding:7px 9px;background:#fee2e2;color:#991b1b;font-weight:700;cursor:pointer;white-space:nowrap}",
      "body.rjd-logged-in .auth-nav-link,body.rjd-logged-in .auth-register-link{display:none!important}",
      "@media(min-width:768px){body.rjd-nav-has-auth #rjd-account-chip .rjd-chip-link{display:none}}",
      "@media(max-width:767px){#rjd-account-chip{gap:6px}#rjd-account-chip .rjd-chip-details{max-width:120px}#rjd-account-chip .rjd-chip-identity{padding:4px 6px;gap:6px}}",
      "@media(max-width:480px){#rjd-account-chip .rjd-chip-details{max-width:84px}#rjd-account-chip .rjd-chip-details small{font-size:10px}#rjd-account-chip .rjd-chip-caret,#rjd-account-chip .rjd-chip-register{display:none}#rjd-account-chip .rjd-chip-logout{padding:6px 7px;font-size:12px}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function getHost() {
    return document.querySelector(".header-inner, .header-row, .rjd-site-header__inner") ||
      document.querySelector("header");
  }

  function makeLink(label, href, extraClass) {
    var a = document.createElement("a");
    a.href = href;
    a.textContent = label;
    a.className = "rjd-chip-link " + (extraClass || "");
    return a;
  }

  function ensureChip(host) {
    var chip = document.getElementById("rjd-account-chip");
    if (chip) return chip;
    chip = document.createElement("div");
    chip.id = "rjd-account-chip";
    chip.setAttribute("aria-live", "polite");
    var burger = host.querySelector(":scope > .mobile-menu-disclosure");
    if (burger) host.insertBefore(chip, burger); else host.appendChild(chip);
    return chip;
  }

  function render(user) {
    var host = getHost();
    if (!host) return;
    injectStyle();
    var chip = ensureChip(host);
    chip.replaceChildren();

    document.body.classList.toggle("rjd-logged-in", !!user);
    document.body.classList.toggle("rjd-nav-has-auth", !!document.querySelector(".main-nav .auth-nav-link"));

    document.querySelectorAll(".auth-nav-link").forEach(function (el) {
      el.href = siteRoot + "/login.html";
      el.textContent = "🔐 Login";
    });
    document.querySelectorAll(".auth-register-link").forEach(function (el) {
      el.href = siteRoot + "/register.html";
      el.textContent = "Create Account";
    });

    if (!user) {
      chip.appendChild(makeLink("🔐 Login", siteRoot + "/login.html"));
      chip.appendChild(makeLink("Create Account", siteRoot + "/register.html", "rjd-chip-register"));
      return;
    }

    var identity = document.createElement("a");
    identity.href = siteRoot + "/account.html";
    identity.className = "rjd-chip-identity";
    identity.title = "My Account";
    identity.setAttribute("aria-label", "My Account");
    var avatar = document.createElement("span");
    avatar.className = "rjd-chip-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = "♙";
    var details = document.createElement("span");
    details.className = "rjd-chip-details";
    var meta = user.user_metadata || {};
    var name = document.createElement("strong");
    name.textContent = meta.full_name || meta.name || (user.email ? user.email.split("@")[0] : "My Account");
    var email = document.createElement("small");
    email.textContent = user.email || "";
    details.appendChild(name);
    details.appendChild(email);
    var caret = document.createElement("span");
    caret.className = "rjd-chip-caret";
    caret.setAttribute("aria-hidden", "true");
    caret.textContent = "⌄";
    identity.appendChild(avatar);
    identity.appendChild(details);
    identity.appendChild(caret);
    chip.appendChild(identity);

    var logout = document.createElement("button");
    logout.type = "button";
    logout.className = "rjd-chip-logout";
    logout.textContent = "Logout";
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