/** MockTestApp */
(function () {
  const root = document.getElementById("rjd-mock-root");
  if (!root) return;
  const start = function () { initTestSession(root); };
  if (window.RJD_PaidAccess) {
    window.RJD_PaidAccess.canOpenCurrentTest().then(function (allowed) {
      if (allowed) start();
    }).catch(function () {
      window.location.href = "./railway-exams.html";
    });
  } else {
    start();
  }
})();
