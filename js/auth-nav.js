/* Shared ROJGARDWAAR account identity for every page. */
(function () {
  "use strict";
  var scriptUrl = document.currentScript && document.currentScript.src
    ? document.currentScript.src : new URL("/js/auth-nav.js", location.origin).href;
  var siteRoot = new URL("/", scriptUrl).origin;
  var client = null;
  var statusEl = null;
  var accountChip = null;

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

  function ensureAccountChip() {
    accountChip = document.getElementById("rjd-account-chip");
    if (accountChip) return accountChip;
    var host = document.querySelector(".header-inner, .header-row, .rjd-site-header__inner") || document.querySelector("header");
    if (!host) return null;
    accountChip = document.createElement("div");
    accountChip.id = "rjd-account-chip";
    accountChip.setAttribute("aria-live", "polite");
    accountChip.style.cssText = "margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;max-width:100%;font:600 13px/1.35 Inter,Arial,sans-serif;";
    host.appendChild(accountChip);
    return accountChip;
  }

  function makeLink(text, href) {
    var a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    a.style.cssText = "color:#1d4ed8;text-decoration:none;font-weight:700;white-space:nowrap";
    return a;
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

    var oldStatus = document.getElementById("rjd-auth-status");
    if (oldStatus) oldStatus.remove();

    var chip = ensureAccountChip();
    if (!chip) return;
    chip.replaceChildren();
    chip.style.cssText = "margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;max-width:100%;font:600 13px/1.35 Inter,Arial,sans-serif;";
    if (!user) {
      var login = makeLink("🔐 Login", loginUrl());
      chip.appendChild(login);
      return;
    }

    var identity = document.createElement("a");
    identity.href = accountUrl();
    identity.style.cssText = "display:flex;align-items:center;gap:8px;max-width:100%;padding:7px 10px;border:1px solid #dbe3ef;border-radius:12px;background:#fff;color:#172554;text-decoration:none;box-shadow:0 2px 8px rgba(15,23,42,.04)";
    var avatar = document.createElement("span");
    avatar.textContent = "♙";
    avatar.setAttribute("aria-hidden", "true");
    avatar.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;flex:0 0 34px;border-radius:9px;background:#172b49;color:#fff;font-size:18px";
    var details = document.createElement("span");
    details.style.cssText = "display:flex;flex-direction:column;min-width:0;max-width:190px";
    var name = document.createElement("strong");
    name.textContent = user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split("@")[0] : "My Account");
    name.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
    var email = document.createElement("small");
    email.textContent = user.email || "";
    email.style.cssText = "font-size:11px;font-weight:500;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
    details.appendChild(name);
    details.appendChild(email);
    var arrow = document.createElement("span");
    arrow.textContent = "⌄";
    arrow.style.cssText = "color:#64748b;margin-left:3px";
    identity.appendChild(avatar);
    identity.appendChild(details);
    identity.appendChild(arrow);
    chip.appendChild(identity);

    var logout = document.createElement("button");
    logout.type = "button";
    logout.textContent = "Logout";
    logout.style.cssText = "border:0;border-radius:7px;padding:7px 9px;background:#fee2e2;color:#991b1b;font-weight:700;cursor:pointer";
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
    chip.appendChild(logout);
