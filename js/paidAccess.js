/* Premium Railway access guard. */
(function () {
  async function canOpenCurrentTest() {
    const params = new URLSearchParams(location.search);
    if (params.get("class") !== "railway") return true;
    const testId = params.get("testId") || "";
    const n = Number((testId.match(/mock-(\\d+)/) || [])[1] || 0);
    if (n <= 3) return true;

    const product = params.get("subject");
    const config = window.ROJGARDWAAR_SUPABASE || {};
    if (!window.supabase || !config.url || !config.anonKey) return false;

    // Use exactly the same persistent auth storage as js/auth.js and payment.js.
    const sb = window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: "rojgardwaar-auth"
      }
    });

    const { data: sessionData, error: sessionError } = await sb.auth.getSession();
    if (sessionError || !sessionData?.session?.user) {
      location.href = "./login.html?redirect=" + encodeURIComponent("test.html" + location.search);
      return false;
    }

    const user = sessionData.session.user;
    const { data, error } = await sb.from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_code", product)
      .eq("status", "paid")
      .limit(1);

    if (error || !data?.length) {
      location.href = product === "technician-grade-i-signal"
        ? "./railway-technician-grade-1-signal.html"
        : "./railway-technician-grade-3.html";
      return false;
    }
    return true;
  }
  window.RJD_PaidAccess = { canOpenCurrentTest };
})();