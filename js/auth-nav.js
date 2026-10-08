(function () {
  "use strict";

  function updateAuthNav(user) {
    document.querySelectorAll(".auth-register-link").forEach(function (el) {
      if (user) {
        el.href = "./account.html";
        el.textContent = "My Account";
        el.setAttribute("aria-label", "My Account");
      } else {
        el.href = "./register.html";
        el.textContent = "Create Account";
        el.removeAttribute("aria-label");
      }
    });
  }

  async function bootAuthNav() {
    var config = window.ROJGARDWAAR_SUPABASE || {};
    if (!window.supabase || !config.url || !config.anonKey) return;

    try {
      var client = window.supabase.createClient(config.url, config.anonKey);
      var result = await client.auth.getSession();
      updateAuthNav(result && result.data ? result.data.session?.user : null);

      client.auth.onAuthStateChange(function (_event, session) {
        updateAuthNav(session ? session.user : null);
      });
    } catch (err) {
      console.warn("Auth navigation update failed", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAuthNav);
  } else {
    bootAuthNav();
  }
})();