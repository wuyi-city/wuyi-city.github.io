(function () {
  "use strict";
  const issues = window.WUYI_DAILY_ISSUES || {};
  const params = new URLSearchParams(window.location.search);
  const keys = Object.keys(issues).sort();
  const issueKey = params.get("date");
  const issue = issues[issueKey];
  const pageIndex = Number(params.get("page"));
  const articleIndex = Number(params.get("article"));
  const headline = issue && issue.pages[pageIndex] && issue.pages[pageIndex].headlines[articleIndex];
  const article = headline && headline.article;
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const content = document.getElementById("articleContent");
  const preview = document.getElementById("articlePreview");

  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, function (char) { return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]; }); }
  function lines(value) { return escapeHtml(value).replace(/\n/g, "<br>"); }
  function bodyBlocks(value, imagePath) {
    const photo = imagePath ? '<div class="article-photo"><img src="' + escapeHtml(imagePath) + '" alt=""></div>' : "";
    const paragraphs = value.split(/\r?\n[ \t]*\r?\n/).filter(Boolean).map(function (paragraph) {
      return '<p>　　' + escapeHtml(paragraph.replace(/\r?\n/g, "").trim()) + "</p>";
    }).join("");
    return photo + paragraphs;
  }
  function textDate(value) { const date = new Date(value + "T00:00:00"); return date.getFullYear() + "年" + String(date.getMonth() + 1).padStart(2, "0") + "月" + String(date.getDate()).padStart(2, "0") + "日　星期" + weekdays[date.getDay()]; }
  function issueUrl(key) { return "index.html?date=" + encodeURIComponent(key); }
  function articleUrl(index) { return "article.html?date=" + encodeURIComponent(issueKey) + "&page=" + pageIndex + "&article=" + index; }
  function noAction() { return false; }

  if (!article) {
    window.location.replace("index.html");
    return;
  }
  document.title = headline.title.replace(/\s+/g, " ").trim();
  document.getElementById("issueDate").textContent = textDate(issueKey);
  const page = issue.pages[pageIndex];
  const pageImage = page.image || "images/" + issueKey + "-p" + String(pageIndex + 1).padStart(2, "0") + ".jpg";
  const labelBits = page.label.split("：");
  const pageLabel = "<span>" + escapeHtml(labelBits.shift()) + "</span>：<strong>" + escapeHtml(labelBits.join("：")) + "</strong>";
  const previousPage = pageIndex > 0 ? '<button type="button" data-page="' + (pageIndex - 1) + '">&lt; 上一版</button>' : "";
  const nextPage = pageIndex < issue.pages.length - 1 ? '<button type="button" data-page="' + (pageIndex + 1) + '">下一版 &gt;</button>' : "";
  preview.innerHTML = '<div class="paper-sheet"><img src="' + pageImage + '" width="322" height="478" alt=""></div><div class="preview-nav"><span>' + pageLabel + '</span><div>' + previousPage + nextPage + '</div></div><div class="panel headline-panel"><h3>标题导航</h3><ul>' + page.headlines.map(function (item, index) { return '<li>' + (item.article ? '<a class="headline-link" href="' + articleUrl(index) + '">' + lines(item.title) + '</a>' : '<button type="button" class="headline-link">' + lines(item.title) + '</button>') + '</li>'; }).join("") + '</ul></div>';
  const dailyHeadlines = [];
  issue.pages.forEach(function (issuePage, issuePageIndex) {
    issuePage.headlines.forEach(function (item, itemIndex) {
      dailyHeadlines.push({ page:issuePageIndex, article:itemIndex, item:item });
    });
  });
  const dailyPosition = dailyHeadlines.findIndex(function (entry) { return entry.page === pageIndex && entry.article === articleIndex; });
  function adjacentButton(entry, label) {
    if (!entry) return "";
    return entry.item.article
      ? '<button type="button" data-target-page="' + entry.page + '" data-target-article="' + entry.article + '">' + label + '</button>'
      : '<button type="button">' + label + '</button>';
  }
  const previousArticle = adjacentButton(dailyPosition > 0 ? dailyHeadlines[dailyPosition - 1] : null, "上一篇");
  const nextArticle = adjacentButton(dailyPosition >= 0 && dailyPosition < dailyHeadlines.length - 1 ? dailyHeadlines[dailyPosition + 1] : null, "下一篇");
  content.innerHTML = '<div class="article-tools"><div class="article-pagination"><span>' + previousArticle + '</span><span>' + nextArticle + '</span></div><div class="font-controls"><span>字体：</span><button type="button" data-size="13">小</button><button type="button" class="selected" data-size="15">中</button><button type="button" data-size="17">大</button></div></div>' + (article.kicker ? '<p class="article-kicker">' + lines(article.kicker) + "</p>" : "") + '<h1>' + lines(headline.title) + "</h1>" + (article.source ? '<p class="article-source">' + lines(article.source) + "</p>" : "") + '<div class="article-body" id="articleBody">' + bodyBlocks(article.body, article.image) + "</div>";
  const articleBody = document.getElementById("articleBody");
  document.querySelectorAll("[data-size]").forEach(function (button) { button.addEventListener("click", function () { const size = Number(button.getAttribute("data-size")); articleBody.style.fontSize = size + "px"; document.querySelectorAll("[data-size]").forEach(function (item) { item.classList.toggle("selected", item === button); }); }); });
  document.querySelectorAll("[data-page]").forEach(function (button) { button.addEventListener("click", function () { window.location.href = "index.html?date=" + encodeURIComponent(issueKey) + "&page=" + button.getAttribute("data-page"); }); });
  document.querySelectorAll("[data-target-article]").forEach(function (button) { button.addEventListener("click", function () { window.location.href = "article.html?date=" + encodeURIComponent(issueKey) + "&page=" + button.getAttribute("data-target-page") + "&article=" + button.getAttribute("data-target-article"); }); });
  document.getElementById("homeLink").addEventListener("click", function () { window.location.href = issueUrl(issueKey); });
  const position = keys.indexOf(issueKey);
  document.getElementById("previousIssue").addEventListener("click", function () { if (position > 0) window.location.href = issueUrl(keys[position - 1]); else noAction(); });
  document.getElementById("nextIssue").addEventListener("click", function () { if (position < keys.length - 1) window.location.href = issueUrl(keys[position + 1]); else window.alert("已经是最后一期！"); });
}());
