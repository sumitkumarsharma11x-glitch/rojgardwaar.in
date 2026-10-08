/** ROJGARDWAAR Student Dashboard */
(function () {
  const SUBJECTS = [
    { key: "biology", name: "Biology", icon: "🧬" },
    { key: "physics", name: "Physics", icon: "⚡" },
    { key: "chemistry", name: "Chemistry", icon: "🧪" }
  ];
  const CLASS_NUM = "6";
  const CHAPTERS = Array.from({ length: 12 }, function (_, i) { return "chapter-" + String(i + 1).padStart(2, "0"); });
  const TOTAL_QUESTIONS = SUBJECTS.length * CHAPTERS.length * 150;
  const state = { user: null, chapters: [], history: [], attemptedIds: new Set(), wrongIds: new Set(), subjectStats: {} };
  const $ = function (id) { return document.getElementById(id); };

  function chapterUrl(subject, chapter) {
    return "./chapter.html?class=" + CLASS_NUM + "&subject=" + encodeURIComponent(subject) + "&chapter=" + encodeURIComponent(chapter);
  }
  function formatDate(ts) {
    if (!ts) return "—";
    try { return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
    catch (e) { return "—"; }
  }
  function percent(value) { return Number.isFinite(value) ? Math.round(value) + "%" : "0%"; }
  function subjectStats(subject) {
    return state.subjectStats[subject] || { attempted: 0, wrong: 0, mocks: 0, best: 0, lastTs: 0, chapters: 0 };
  }

  async function loadUser() {
    const result = await supabaseClient.auth.getUser();
    if (result.error || !result.data.user) {
      window.location.href = "./login.html?redirect=account.html";
      return false;
    }
    state.user = result.data.user;
    const name = result.data.user.user_metadata && result.data.user.user_metadata.full_name
      ? result.data.user.user_metadata.full_name
      : ((result.data.user.email || "").split("@")[0] || "Student");
    $("accountName").textContent = name;
    $("accountEmail").textContent = result.data.user.email || "";
    $("welcomeName").textContent = name;
    $("accountCreated").textContent = formatDate(result.data.user.created_at);
    return true;
  }

  function collectChapter(subject, chapter) {
    const attempted = StorageManager.getAttemptedQuestionIds(CLASS_NUM, subject, chapter) || [];
    const wrong = StorageManager.getWrongQuestionIds(CLASS_NUM, subject, chapter) || [];
    const history = StorageManager.getResultHistory(CLASS_NUM, subject, chapter) || [];
    attempted.forEach(function (id) { state.attemptedIds.add(id); });
    wrong.forEach(function (id) { state.wrongIds.add(id); });
    const mockHistory = history.filter(function (item) { return String(item.testId || "").indexOf("mock-") === 0; });
    const best = mockHistory.reduce(function (max, item) { return Math.max(max, Number(item.summary && item.summary.percentage) || 0); }, 0);
    const lastTs = history.reduce(function (max, item) { return Math.max(max, Number(item.ts) || 0); }, 0);
    state.chapters.push({ subject: subject, chapter: chapter, attempted: attempted.length, wrong: wrong.length, mocks: mockHistory.length, best: best, lastTs: lastTs });
    const s = subjectStats(subject);
    s.attempted += attempted.length; s.wrong += wrong.length; s.mocks += mockHistory.length;
    s.best = Math.max(s.best, best); s.lastTs = Math.max(s.lastTs, lastTs);
    if (attempted.length || history.length) s.chapters += 1;
    state.subjectStats[subject] = s;
    history.forEach(function (item) {
      state.history.push({ testId: item.testId, ts: Number(item.ts) || 0, summary: item.summary || {}, subject: subject, chapter: chapter });
    });
  }

  function loadProgress() {
    state.chapters = []; state.history = []; state.attemptedIds = new Set(); state.wrongIds = new Set(); state.subjectStats = {};
    SUBJECTS.forEach(function (subject) { CHAPTERS.forEach(function (chapter) { collectChapter(subject.key, chapter); }); });
    state.history.sort(function (a, b) { return b.ts - a.ts; });
  }

  function renderMetrics() {
    const mocks = state.history.filter(function (x) { return String(x.testId || "").indexOf("mock-") === 0; });
    const best = mocks.reduce(function (max, x) { return Math.max(max, Number(x.summary.percentage) || 0); }, 0);
    const active = state.chapters.filter(function (x) { return x.attempted || x.mocks; }).length;
    $("metricAttempted").textContent = state.attemptedIds.size.toLocaleString("en-IN");
    $("metricAccuracy").textContent = state.attemptedIds.size ? percent(((state.attemptedIds.size - state.wrongIds.size) / state.attemptedIds.size) * 100) : "0%";
    $("metricMocks").textContent = mocks.length.toLocaleString("en-IN");
    $("metricBest").textContent = best + "%";
    $("metricWrong").textContent = state.wrongIds.size.toLocaleString("en-IN");
    $("metricChapters").textContent = active + "/36";
    const coverage = Math.min(100, (state.attemptedIds.size / TOTAL_QUESTIONS) * 100);
    $("coverageValue").textContent = percent(coverage);
    $("coverageBar").style.width = coverage + "%";
  }

  function renderContinue() {
    const latest = state.chapters.filter(function (x) { return x.lastTs || x.attempted; }).sort(function (a, b) { return b.lastTs - a.lastTs; })[0];
    if (!latest) {
      $("continueTitle").textContent = "Start your first chapter";
      $("continueMeta").textContent = "Notes → Practice → FREE Mock Test";
      $("continueBtn").href = chapterUrl("biology", "chapter-01");
      return;
    }
    const subjectName = (SUBJECTS.find(function (s) { return s.key === latest.subject; }) || {}).name || latest.subject;
    $("continueTitle").textContent = subjectName + " · Chapter " + latest.chapter.slice(-2);
    $("continueMeta").textContent = latest.wrong > 0 ? latest.attempted + " questions attempted · " + latest.wrong + " to improve" : latest.attempted + " questions attempted · " + latest.mocks + " mock tests";
    $("continueBtn").href = chapterUrl(latest.subject, latest.chapter);
  }

  function renderWrong() {
    const wrong = state.wrongIds.size;
    $("wrongCount").textContent = wrong.toLocaleString("en-IN");
    $("wrongDescription").textContent = wrong ? "These are questions you most recently got wrong. Practice them before your next mock." : "Great! No saved wrong questions yet. Take a free mock test to build your improvement list.";
    $("wrongBtn").href = wrong ? "./chapter.html?class=6&subject=biology&chapter=chapter-01&open=practice-wrong#practice" : "./science/index.html";
  }

  function renderSubjects() {
    $("subjectGrid").innerHTML = SUBJECTS.map(function (subject) {
      const s = subjectStats(subject.key);
      const accuracy = s.attempted ? ((s.attempted - s.wrong) / s.attempted) * 100 : 0;
      return "<article class=\"dashboard-subject-card\">" +
        "<div class=\"subject-card-top\"><span class=\"subject-icon\">" + subject.icon + "</span><div><h3>" + subject.name + "</h3><p>" + s.chapters + "/12 chapters started</p></div></div>" +
        "<div class=\"subject-progress\"><span style=\"width:" + Math.min(100, accuracy) + "%\"></span></div>" +
        "<div class=\"subject-stats\"><span><b>" + s.attempted + "</b> Questions</span><span><b>" + percent(accuracy) + "</b> Accuracy</span><span><b>" + s.mocks + "</b> Mocks</span><span><b>" + s.best + "%</b> Best</span></div>" +
        "<a href=\"./science/" + subject.key + "/index.html\">Open " + subject.name + " →</a></article>";
    }).join("");
  }

  function renderRecent() {
    const rows = state.history.slice(0, 6);
    $("recentList").innerHTML = rows.length ? rows.map(function (item) {
      const subjectName = (SUBJECTS.find(function (s) { return s.key === item.subject; }) || {}).name || item.subject;
      const pct = Number(item.summary.percentage) || 0;
      const type = String(item.testId || "").indexOf("mock-") === 0 ? "FREE Mock Test" : "Practice Test";
      return "<a class=\"recent-row\" href=\"" + chapterUrl(item.subject, item.chapter) + "\"><div><strong>" + subjectName + " · Chapter " + item.chapter.slice(-2) + "</strong><span>" + type + " · " + formatDate(item.ts) + "</span></div><b>" + pct + "%</b></a>";
    }).join("") : "<div class=\"empty-dashboard\">Your test history will appear here after your first FREE Mock Test.</div>";
  }


  function renderAdvancedProgress(){
    const active=state.chapters.filter(function(x){return x.attempted||x.mocks;}).length;
    const course=Math.min(100,(active/36)*100);
    const ring=document.getElementById("overallProgress"); if(ring) ring.textContent=Math.round(course)+"%";
    const msg=document.getElementById("progressMessage"); if(msg) msg.textContent=active+" of 36 chapters started. Complete your preparation step by step.";
    const vals=["weakBio","weakPhy","weakChem"];
    SUBJECTS.forEach(function(s,i){const el=document.getElementById(vals[i]); if(el) el.textContent=subjectStats(s.key).wrong;});
  }
  async function renderPaidExams() {
    const products = [
      { code: "technician-grade-iii", icon: "🔧", title: "RRB Technician Grade-III", desc: "50 full mock tests · 3 free + 47 premium", href: "./railway-technician-grade-3.html" },
      { code: "technician-grade-i-signal", icon: "⚙️", title: "RRB Technician Grade-I Signal", desc: "50 full mock tests · 3 free + 47 premium", href: "./railway-technician-grade-1-signal.html" }
    ];
    let purchased = {};
    try {
      const { data } = await supabaseClient.from("purchases").select("product_code,status,purchased_at").eq("user_id", state.user.id).eq("status", "paid");
      (data || []).forEach(function (row) { purchased[row.product_code] = row; });
    } catch (e) {}
    const paidMarkup = products.map(function (p) {
      const own = !!purchased[p.code];
      return "<article class=\"paid-exam-card\"><div class=\"paid-exam-icon\">" + p.icon + "</div><div class=\"paid-exam-copy\"><span class=\"paid-status " + (own ? "is-purchased" : "") + "\">" + (own ? "PURCHASED • UNLOCKED" : "NOT PURCHASED") + "</span><h3>" + p.title + "</h3><p>" + p.desc + "</p><div class=\"paid-exam-meta\"><span>₹49 Launch Price</span><span>" + (own ? "Access unlocked" : "Secure Razorpay checkout") + "</span></div></div><a class=\"dashboard-btn dashboard-btn-primary\" href=\"" + p.href + "\">" + (own ? "Continue Preparation →" : "View & Buy →") + "</a></article>";
    }).join("");
    $("paidExamGrid").innerHTML = paidMarkup;
    const topGrid = $("paidExamGridTop"); if (topGrid) topGrid.innerHTML = paidMarkup;
  }
  async function init() {
    if (!await loadUser()) return;
    loadProgress(); renderMetrics(); renderContinue(); renderWrong(); renderSubjects(); renderRecent(); renderAdvancedProgress(); await renderPaidExams();
  }
  window.loadAccount = init;
})();

(function setupProfileDetails(){
  function openProfileDetails(){
    const modal=document.getElementById("profileDetailsModal");
    if(!modal) return;
    const name=document.getElementById("accountName")?.textContent || "—";
    const email=document.getElementById("accountEmail")?.textContent || "—";
    const created=document.getElementById("accountCreated")?.textContent || "—";
    document.getElementById("profileDetailName").textContent=name;
    document.getElementById("profileDetailEmail").textContent=email;
    document.getElementById("profileDetailCreated").textContent=created;
    modal.hidden=false;
    document.getElementById("profileDetailsClose")?.focus();
  }
  function closeProfileDetails(){ const modal=document.getElementById("profileDetailsModal"); if(modal) modal.hidden=true; }
  document.addEventListener("DOMContentLoaded",function(){
    document.getElementById("profileDetailsBtn")?.addEventListener("click",openProfileDetails);
    document.getElementById("profileDetailsClose")?.addEventListener("click",closeProfileDetails);
    document.getElementById("profileDetailsDone")?.addEventListener("click",closeProfileDetails);
    document.getElementById("profileDetailsModal")?.addEventListener("click",function(e){if(e.target===this) closeProfileDetails();});
    document.addEventListener("keydown",function(e){if(e.key==="Escape") closeProfileDetails();});
  });
})();