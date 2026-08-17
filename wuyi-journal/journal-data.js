function journalAuthor(id) { return journalAuthors[id] || {name:"佚名",unit:""}; }
function journalAuthorNames(paper) { var names=[]; for(var i=0;i<paper.authorIds.length;i++) names[names.length]=journalAuthor(paper.authorIds[i]).name; return names.join("; ") + ";"; }
function journalAuthorUnits(paper) { var units=[]; for(var i=0;i<paper.authorIds.length;i++){ var unit=journalAuthor(paper.authorIds[i]).unit; var exists=false; for(var j=0;j<units.length;j++) if(units[j]===unit) exists=true; if(unit&&!exists) units[units.length]=unit; } return units.join("; "); }
function journalVolumeNumber(paper) { return Number(paper.year) - 1986; }
function journalArchiveNumber(paper) { return (Number(paper.year) - 1987) * 4 + Number(paper.issue); }
function journalVolumeText(paper) { return "v." + journalVolumeNumber(paper) + ";No." + journalArchiveNumber(paper); }
function journalIssueText(paper) { return paper.year + "年" + paper.issue + "期 " + journalVolumeText(paper) + " " + paper.pages + "页"; }
function journalChronologyCompare(a,b) {
  var yearDifference=Number(a.year)-Number(b.year);
  if(yearDifference) return yearDifference;
  var issueDifference=Number(a.issue)-Number(b.issue);
  if(issueDifference) return issueDifference;
  return Number(a.pageStart)-Number(b.pageStart);
}
function journalTextCompare(a,b) {
  var left=String(a||""),right=String(b||"");
  if(left===right) return 0;
  if(left.localeCompare) return left.localeCompare(right,"zh-CN");
  return left>right?1:-1;
}
function journalPaperCompare(sortType,a,b) {
  var difference=0;
  if(sortType==="author") difference=journalTextCompare(journalAuthorNames(a),journalAuthorNames(b));
  else if(sortType==="keyword") difference=journalTextCompare(a.keywords||"",b.keywords||"");
  if(difference) return difference;
  return journalChronologyCompare(a,b);
}
function journalPaperById(id) { for(var i=0;i<journalPapers.length;i++) if(journalPapers[i].id===id) return journalPapers[i]; return null; }
function journalPaperLink(paper) { return paper.detail ? "article.html?id=" + encodeURIComponent(paper.id) : "javascript:void(0)"; }
function journalPaperActionLink(paper, action) {
  if (!paper.detail) return "javascript:void(0)";
  if (action === "abstract") return journalPaperLink(paper);
  if (action === "online") return paper.pdfUrl ? "paper-reader.html?id=" + encodeURIComponent(paper.id) : "javascript:void(0)";
  if (action === "download") return paper.pdfUrl || "javascript:void(0)";
  return "javascript:void(0)";
}
function journalPaperActions(paper) {
  var downloadUrl = journalPaperActionLink(paper,"download");
  var downloadAttribute = downloadUrl === "javascript:void(0)" ? "" : " download=\"\"";
  var newTab = paper.detail ? " target=\"_blank\"" : "";
  return "<span class=\"actions\">[<a href=\"" + journalPaperActionLink(paper,"abstract") + "\"" + newTab + ">查看摘要</a>] [<a href=\"" + journalPaperActionLink(paper,"online") + "\"" + newTab + ">在线阅读</a>] [<a href=\"" + downloadUrl + "\"" + downloadAttribute + ">下载</a> " + paper.fileSize + "]</span>";
}
