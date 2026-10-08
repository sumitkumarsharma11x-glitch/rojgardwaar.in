/* Premium Railway access guard. */
(function () {
  async function canOpenCurrentTest() {
    const params = new URLSearchParams(location.search);
    if (params.get("class") !== "railway") return true;
    const testId = params.get("testId") || "";
    const n = Number((testId.match(/mock-(\d+)/) || [])[1] || 0);
    if (n <= 3) return true;

    const product = params.get("subject");
    if (!window.supabase || !window.ROJGARDWAAR_SUPABASE) return false;
    const sb = window.supabase.createClient(window.ROJGARDWAAR_SUPABASE.url, window.ROJGARDWAAR_SUPABASE.anonKey);
    const { data: auth } = await sb.auth.getUser();
    if (!auth?.user) {
      location.href = "./login.html?redirect=" + encodeURIComponent("test.html" + location.search);
      return false;
    }
    const { data, error } = await sb.from("purchases").select("id").eq("user_id", auth.user.id).eq("product_code", product).eq("status", "paid").limit(1);
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