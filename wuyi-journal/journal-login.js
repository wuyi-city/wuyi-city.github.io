(function () {
  var loginKey = "wuyi-journal-reader-login";
  var pendingAction = null;
  var loginWindow = null;

  function loggedIn() {
    return document.cookie.split(";").some(function (part) {
      return part.replace(/^\s+|\s+$/g, "") === loginKey + "=1";
    });
  }

  function currentLocation() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  function openLogin(action) {
    pendingAction = action || null;
    if (loginWindow && !loginWindow.closed) {
      loginWindow.focus();
      return;
    }
    var loginUrl = "login.html?v=20260817d&return=" + encodeURIComponent(currentLocation());
    loginWindow = window.open(loginUrl, "_blank");
    if (!loginWindow) {
      pendingAction = null;
      window.location.href = loginUrl;
    }
  }

  function requireLogin(action) {
    if (loggedIn()) {
      if (action) action();
      return true;
    }
    openLogin(action);
    return false;
  }

  function protectedLink(href) {
    if (!href || href.indexOf("javascript:") === 0 || href.charAt(0) === "#") return false;
    var target;
    try { target = new URL(href, window.location.href); } catch (error) { return false; }
    if (target.origin !== window.location.origin) return false;
    return /\/(?:search|advanced-search|paper-reader)(?:\.html)?$/.test(target.pathname) || target.pathname.indexOf("/wuyi-journal/pdfs/") >= 0;
  }

  window.WuyiJournalLogin = {
    isLoggedIn: loggedIn,
    requireLogin: requireLogin
  };

  window.addEventListener("message", function (event) {
    if (event.origin !== window.location.origin || event.data !== "wuyi-journal-login-success") return;
    if (pendingAction) {
      var action = pendingAction;
      pendingAction = null;
      action();
    }
  }, false);

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || !(form.className.indexOf("search") >= 0 || form.className.indexOf("advanced-box") >= 0)) return;
    if (loggedIn()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    requireLogin(function () { form.submit(); });
  }, true);

  document.addEventListener("click", function (event) {
    var button = event.target;
    while (button && button.tagName !== "BUTTON") button = button.parentNode;
    if (button && !loggedIn()) {
      var buttonText = button.innerText || button.textContent || "";
      var buttonAction = button.getAttribute("onclick") || "";
      if (/高级搜索|高级检索/.test(buttonText) || buttonAction.indexOf("advanced-search.html") >= 0) {
        event.preventDefault();
        event.stopImmediatePropagation();
        requireLogin(function () { window.location.href = "advanced-search.html"; });
        return;
      }
    }
    var link = event.target;
    while (link && link.tagName !== "A") link = link.parentNode;
    if (!link || loggedIn()) return;
    var href = link.getAttribute("href") || "";
    if (!protectedLink(href)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    requireLogin(function () { link.click(); });
  }, true);

  var pageName = window.location.pathname.split("/").pop();
  if (pageName && pageName.indexOf(".") < 0) pageName += ".html";
  if ((pageName === "search.html" || pageName === "advanced-search.html") && !loggedIn()) {
    requireLogin();
  }
})();
