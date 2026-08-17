(function () {
  "use strict";
  const params = new URLSearchParams(window.location.search);
  const key = (params.get("key") || "").trim();
  const input = document.getElementById("searchKey");
  const form = document.getElementById("resultSearchForm");
  const summary = document.getElementById("resultSummary");
  const list = document.getElementById("resultList");
  input.value = key;
  form.addEventListener("submit", function (event) {
    if (!input.value.trim()) {
      event.preventDefault();
      window.alert("请输入关键字！");
      input.focus();
    }
  });

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (char) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char];
    });
  }
  function searchable(value) { return String(value).replace(/\s+/g, "").toLowerCase(); }
  function displayTitle(value) { return String(value).replace(/\s*\n\s*/g, "　"); }
  function dateLabel(value) { return value.replace(/-/g, "/"); }

  const recordMap = new Map();
  Object.keys(window.WUYI_DAILY_ISSUES || {}).sort().reverse().forEach(function (date) {
    window.WUYI_DAILY_ISSUES[date].pages.forEach(function (page, pageIndex) {
      page.headlines.forEach(function (headline, articleIndex) {
        const record = { date:date, page:pageIndex, article:articleIndex, title:headline.title, open:!!headline.article };
        const identity = date + "\u0000" + searchable(headline.title);
        const existing = recordMap.get(identity);
        if (!existing || (!existing.open && record.open)) recordMap.set(identity, record);
      });
    });
  });
  const records = Array.from(recordMap.values());

  if (!key) {
    summary.textContent = "";
    list.innerHTML = "";
    return;
  }

  const needle = searchable(key);
  const matches = records.filter(function (record) { return searchable(record.title).indexOf(needle) !== -1; });
  summary.textContent = "关键词：“" + key + "”　共 " + matches.length + " 条";
  if (!matches.length) {
    list.innerHTML = "";
    return;
  }
  list.innerHTML = '<div class="result-table"><div class="result-row result-label"><span>标题</span><span>日期</span></div>' + matches.map(function (record) {
    const title = escapeHtml(displayTitle(record.title));
    const content = record.open ? '<a href="article.html?date=' + record.date + '&amp;page=' + record.page + '&amp;article=' + record.article + '">' + title + '</a>' : '<button type="button">' + title + '</button>';
    return '<div class="result-row"><span>' + content + '</span><time datetime="' + record.date + '">' + dateLabel(record.date) + '</time></div>';
  }).join("") + "</div>";
}());
