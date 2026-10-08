/* ROJGARDWAAR paid-series checkout */
(function () {
  const config = window.ROJGARDWAAR_SUPABASE || {};
  const client = (window.supabase && config.url && config.anonKey)
    ? window.supabase.createClient(config.url, config.anonKey)
    : null;

  const PRODUCTS = {
    "technician-grade-iii": { name: "RRB Technician Grade-III — 50 Mock Test Series", price: 49, course: "./railway-technician-grade-3.html" },
    "technician-grade-i-signal": { name: "RRB Technician Grade-I Signal — 50 Mock Test Series", price: 49, course: "./railway-technician-grade-1-signal.html" }
  };

  function show(message, type) {
    const el = document.getElementById("paymentMsg");
    if (!el) { alert(message); return; }
    el.textContent = message;
    el.className = "payment-msg " + (type || "info");
    el.hidden = false;
  }

  async function session() {
    if (!client) throw new Error("Payment system is not configured.");
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) {
      const back = encodeURIComponent(location.pathname.split("/").pop() + location.search);
      location.href = "./login.html?redirect=" + back;
      throw new Error("Login required.");
    }
    return data.session;
  }

  async function callFunction(name, body) {
    const s = await session();
    const response = await fetch(config.url + "/functions/v1/" + name, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + s.access_token,
        "apikey": config.anonKey
      },
      body: JSON.stringify(body || {})
    });
    const data = await response.json().catch(function () { return {}; });
    if (!response.ok || data.error) throw new Error(data.error || "Payment service error.");
    return data;
  }

  async function buyProduct(productCode) {
    const product = PRODUCTS[productCode];
    if (!product) return;
    try {
      show("Preparing secure checkout…", "info");
      const order = await callFunction("create-order", { product_code: productCode });
      if (order.already_purchased) {
        show("You already own this test series. Opening it…", "success");
        setTimeout(function () { location.href = product.course; }, 500);
        return;
      }
      if (!window.Razorpay) throw new Error("Razorpay Checkout could not be loaded.");
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.order_id,
        theme: { color: "#2563eb" },
        handler: async function (response) {
          try {
            show("Payment received. Verifying your purchase…", "info");
            await callFunction("verify-payment", response);
            show("Payment successful! Your test series is unlocked.", "success");
            setTimeout(function () { location.href = "./account.html"; }, 700);
          } catch (error) {
            show(error.message || "Payment verification failed. Please contact support.", "error");
          }
        },
        modal: { ondismiss: function () { show("Checkout closed. No payment was confirmed.", "info"); } }
      };
      const checkout = new Razorpay(options);
      checkout.on("payment.failed", function (response) {
        show(response.error?.description || "Payment failed. Please try again.", "error");
      });
      checkout.open();
    } catch (error) {
      if (error.message !== "Login required.") show(error.message || "Unable to start payment.", "error");
    }
  }

  async function hasPurchased(productCode) {
    if (!client) return false;
    const { data: auth } = await client.auth.getUser();
    if (!auth?.user) return false;
    const { data } = await client.from("purchases").select("id").eq("user_id", auth.user.id).eq("product_code", productCode).eq("status", "paid").limit(1);
    return !!(data && data.length);
  }

  async function updateCourseAccess(productCode) {
    const purchased = await hasPurchased(productCode);
    document.querySelectorAll("[data-buy-product]").forEach(function (el) {
      el.hidden = purchased;
    });
    document.querySelectorAll("[data-premium-label]").forEach(function (el) {
      el.textContent = purchased ? "PURCHASED • UNLOCKED" : "PREMIUM";
    });
    if (purchased) document.querySelectorAll("[data-premium-link]").forEach(function (el) {
      const testId = el.getAttribute("data-test-id");
      el.classList.remove("locked");
      el.textContent = "Start Test →";
      el.href = "./test.html?class=railway&subject=" + encodeURIComponent(productCode) + "&chapter=series&mode=mock&testId=" + encodeURIComponent(testId);
    });
  }

  window.RJD_Payment = { buyProduct, hasPurchased, updateCourseAccess, PRODUCTS };
})();