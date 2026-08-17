(function () {
  "use strict";
  const issues = window.WUYI_DAILY_ISSUES;
  const params = new URLSearchParams(window.location.search);
  const availableIssueKeys = Object.keys(issues).sort();
  const requestedIssueKey = params.get("date");
  const issueKey = requestedIssueKey && issues[requestedIssueKey] ? requestedIssueKey : availableIssueKeys[availableIssueKeys.length - 1];
  const issue = issues[issueKey];
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  let pageIndex = Math.max(0, Math.min(issue.pages.length - 1, Number(params.get("page")) || 0));
  const issueDate = new Date(issueKey + "T00:00:00");
  const archiveStartDate = new Date("1999-01-01T00:00:00");
  const archiveEndDate = new Date(availableIssueKeys[availableIssueKeys.length - 1] + "T00:00:00");
  let calendarYear = issueDate.getFullYear();
  let calendarMonth = issueDate.getMonth();
  const body = document.getElementById("readerBody");
  const dateLabel = document.getElementById("issueDate");

  function dateText(date) {
    return date.getFullYear() + "年" + String(date.getMonth() + 1).padStart(2, "0") + "月" + String(date.getDate()).padStart(2, "0") + "日　星期" + weekdays[date.getDay()];
  }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, function (char) { return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]; }); }
  function lines(value) { return escapeHtml(value).replace(/\n/g, "<br>"); }
  function currentPage() { return issue.pages[pageIndex]; }
  function pageTitle(page) {
    const bits = page.label.split("：");
    return "<span>" + escapeHtml(bits.shift()) + "</span>：<strong>" + escapeHtml(bits.join("：")) + "</strong>";
  }
  function canOpen(headline) { return !!headline.article; }
  function noAction() { return false; }
  function button(text, action, className) { return '<button type="button"' + (className ? ' class="' + className + '"' : "") + ' data-action="' + action + '">' + text + "</button>"; }
  function sheet(page) {
    const image = page.image || "images/" + issueKey + "-p" + String(issue.pages.indexOf(page) + 1).padStart(2, "0") + ".jpg";
    return '<div class="paper-sheet"><img src="' + image + '" width="322" height="478" alt=""></div>';
  }
  function articleUrl(page, headline) {
    return "article.html?date=" + encodeURIComponent(issueKey) + "&page=" + page + "&article=" + headline;
  }
  function headlineList(page) {
    return '<div class="panel headline-panel"><h3>标题导航</h3><ul>' + page.headlines.map(function (headline, index) {
      return '<li>' + (canOpen(headline) ? '<a class="headline-link" href="' + articleUrl(pageIndex, index) + '">' + lines(headline.title) + "</a>" : button(lines(headline.title), "none", "headline-link")) + "</li>";
    }).join("") + "</ul></div>";
  }
  function previewColumn() {
    const page = currentPage();
    const previous = pageIndex > 0 ? button("&lt; 上一版", "edition-" + (pageIndex - 1)) : "";
    const next = pageIndex < issue.pages.length - 1 ? button("下一版 &gt;", "edition-" + (pageIndex + 1)) : "";
    return '<section class="preview-column">' + sheet(page) + '<div class="preview-nav"><span>' + pageTitle(page) + '</span><div>' + previous + next + '</div></div>' + headlineList(page) + "</section>";
  }
  function dateControls() {
    const years = [];
    for (let year = 1999; year <= 2050; year += 1) years.push('<option value="' + year + '"' + (year === calendarYear ? " selected" : "") + ">" + year + "年</option>");
    const months = [];
    for (let month = 0; month < 12; month += 1) months.push('<option value="' + month + '"' + (month === calendarMonth ? " selected" : "") + ">" + (month + 1) + "月</option>");
    return '<div class="date-selects"><div class="date-stepper"><button type="button" data-action="year-prev">◀</button><select id="yearSelect">' + years.join("") + '</select><button type="button" data-action="year-next">▶</button></div><div class="date-stepper"><button type="button" data-action="month-prev">◀</button><select id="monthSelect">' + months.join("") + '</select><button type="button" data-action="month-next">▶</button></div></div>';
  }
  function calendar() {
    const first = new Date(calendarYear, calendarMonth, 1).getDay();
    const count = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    let cells = "";
    for (let empty = 0; empty < first; empty += 1) cells += '<span class="calendar-empty"></span>';
    for (let day = 1; day <= count; day += 1) {
      const candidate = new Date(calendarYear, calendarMonth, day);
      const dateKey = candidate.getFullYear() + "-" + String(candidate.getMonth() + 1).padStart(2, "0") + "-" + String(candidate.getDate()).padStart(2, "0");
      const available = !!issues[dateKey];
      const current = dateKey === issueKey;
      const sunday = candidate.getDay() === 0;
      const historicWeekday = !sunday && candidate.getTime() >= archiveStartDate.getTime() && candidate.getTime() <= archiveEndDate.getTime();
      const appearance = current ? "current" : available ? "available" : historicWeekday ? "fake" : "unavailable";
      cells += '<button type="button" class="' + appearance + (sunday ? " sunday" : "") + '" data-action="' + (available ? "issue-" + dateKey : "none") + '">' + day + "</button>";
    }
    let usedCells = first + count;
    while (usedCells % 7 !== 0) { cells += '<span class="calendar-empty"></span>'; usedCells += 1; }
    return '<div class="panel calendar-panel"><h3>按日期查阅</h3>' + dateControls() + '<div class="calendar-week"><b>日</b><b>一</b><b>二</b><b>三</b><b>四</b><b>五</b><b>六</b></div><div class="calendar-days">' + cells + "</div></div>";
  }
  function editionList() { return '<section class="panel edition-panel"><h3>版面目录</h3><div>' + issue.pages.map(function (page, index) { return '<div class="edition-row">' + button(escapeHtml(page.label), "edition-" + index) + "</div>"; }).join("") + "</div></section>"; }
  function quickList() { return '<div class="panel quick-panel"><h3>快速导航</h3><div>' + issue.pages.map(function (page, index) { return '<section><strong class="quick-page-label">' + escapeHtml(page.label) + '</strong><ul>' + page.headlines.map(function (headline, headlineIndex) { return '<li>' + (canOpen(headline) ? '<a href="' + articleUrl(index, headlineIndex) + '">' + lines(headline.title) + "</a>" : button(lines(headline.title), "none")) + "</li>"; }).join("") + "</ul></section>"; }).join("") + "</div></div>"; }
  function homeView() { return '<div class="workspace">' + previewColumn() + editionList() + '<aside class="side-column">' + calendar() + quickList() + "</aside></div>"; }
  function render() { dateLabel.textContent = dateText(issueDate); body.innerHTML = homeView(); bind(); }
  function adjustCalendar(yearDelta, monthDelta) {
    let monthTotal = calendarYear * 12 + calendarMonth + monthDelta + yearDelta * 12;
    monthTotal = Math.max(1999 * 12, Math.min(2050 * 12 + 11, monthTotal));
    calendarYear = Math.floor(monthTotal / 12); calendarMonth = monthTotal % 12; render();
  }
  function bind() {
    document.querySelectorAll("[data-action]").forEach(function (element) { element.addEventListener("click", function () {
      const action = element.getAttribute("data-action");
      if (action === "none") return noAction();
      if (action.indexOf("issue-") === 0) { window.location.href = "index.html?date=" + action.slice(6); return; }
      if (action === "year-prev") return adjustCalendar(-1, 0); if (action === "year-next") return adjustCalendar(1, 0);
      if (action === "month-prev") return adjustCalendar(0, -1); if (action === "month-next") return adjustCalendar(0, 1);
      if (action.indexOf("edition-") === 0) { pageIndex = Number(action.split("-")[1]); render(); return; }
    }); });
    const year = document.getElementById("yearSelect"), month = document.getElementById("monthSelect");
    if (year) year.addEventListener("change", function () { calendarYear = Number(year.value); render(); });
    if (month) month.addEventListener("change", function () { calendarMonth = Number(month.value); render(); });
  }
  document.getElementById("homeLink").addEventListener("click", function () { pageIndex = 0; render(); });
  const currentIssuePosition = availableIssueKeys.indexOf(issueKey);
  document.getElementById("previousIssue").addEventListener("click", function () {
    if (currentIssuePosition > 0) window.location.href = "index.html?date=" + availableIssueKeys[currentIssuePosition - 1];
  });
  document.getElementById("nextIssue").addEventListener("click", function () {
    if (currentIssuePosition < availableIssueKeys.length - 1) window.location.href = "index.html?date=" + availableIssueKeys[currentIssuePosition + 1];
    else window.alert("已经是最后一期！");
  });
  render();
}());
