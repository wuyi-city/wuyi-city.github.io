import * as pdfjsLib from "./pdfjs/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdfjs/pdf.worker.min.mjs";

function startReader() {
  var params = new URLSearchParams(window.location.search);
  var paper = journalPaperById(params.get("id") || "");
  var pdfUrl = paper && paper.pdfUrl;
  var stage = document.getElementById("readerStage");
  var sheet = document.getElementById("readerPage");
  var canvas = document.getElementById("readerCanvas");
  var empty = document.getElementById("readerEmpty");
  var input = document.getElementById("pageInput");
  var title = document.getElementById("pageTitle");
  var total = document.getElementById("readerTotal");
  var context = canvas.getContext("2d", { alpha:false });
  var pdf = null;
  var currentPage = 1;
  var renderTask = null;
  var renderSerial = 0;
  var zoomSteps = [0.5,0.75,1,1.25,1.5,1.75,2];
  var zoomIndex = 2;
  var panX = 0, panY = 0, dragging = false;
  var dragStartX = 0, dragStartY = 0, dragOriginX = 0, dragOriginY = 0;

  document.title = "五义学院学报-期刊在线阅读";

  function clampPan() {
    var zoom = zoomSteps[zoomIndex];
    var maxX = Math.max(0,(sheet.offsetWidth*zoom-stage.clientWidth)/2);
    var maxY = Math.max(0,(sheet.offsetHeight*zoom-stage.clientHeight)/2);
    panX = Math.max(-maxX,Math.min(maxX,panX));
    panY = Math.max(-maxY,Math.min(maxY,panY));
  }
  function applyPan() {
    document.documentElement.style.setProperty("--page-pan-x",panX+"px");
    document.documentElement.style.setProperty("--page-pan-y",panY+"px");
  }
  function applyZoom() {
    var zoom = zoomSteps[zoomIndex];
    document.documentElement.style.setProperty("--page-zoom",zoom);
    document.getElementById("zoomValue").innerHTML = Math.round(zoom*100)+"%";
    sheet.classList.toggle("zoomed",zoom>1);
    clampPan(); applyPan();
  }
  function resetView() {
    zoomIndex = 2; panX = 0; panY = 0; applyZoom();
  }
  async function showPage(pageNumber, reset) {
    if(!pdf) return;
    pageNumber = parseInt(pageNumber,10);
    if(!pageNumber || pageNumber<1 || pageNumber>pdf.numPages) { input.value=currentPage; return; }
    var serial = ++renderSerial;
    if(renderTask) { try { renderTask.cancel(); } catch(ignore) {} }
    var page = await pdf.getPage(pageNumber);
    if(serial!==renderSerial) return;
    var viewport = page.getViewport({scale:2});
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    sheet.style.aspectRatio = viewport.width+" / "+viewport.height;
    context.save(); context.fillStyle="#fff"; context.fillRect(0,0,canvas.width,canvas.height); context.restore();
    renderTask = page.render({canvasContext:context,viewport:viewport});
    try { await renderTask.promise; } catch(error) { if(error&&error.name!=="RenderingCancelledException") throw error; return; }
    if(serial!==renderSerial) return;
    currentPage = pageNumber;
    input.value = String(pageNumber);
    title.innerHTML = "Page "+pageNumber+" - "+paper.title;
    sheet.style.display = "block";
    empty.style.display = "none";
    if(reset) resetView();
    if(window.location.hash!=="#p="+pageNumber) window.location.hash="p="+pageNumber;
  }
  function showEmpty(message) {
    title.innerHTML = paper ? paper.title : "论文在线阅读";
    sheet.style.display = "none";
    empty.style.display = "block";
    empty.innerHTML = message || "暂无可供在线阅读的论文页面。";
  }
  function changePage(offset) {
    if(!pdf) return;
    var next = currentPage + offset;
    if(next>=1 && next<=pdf.numPages) showPage(next,true);
  }
  function beginDrag(event) {
    if(zoomSteps[zoomIndex]<=1) return;
    dragging=true; dragStartX=event.clientX; dragStartY=event.clientY; dragOriginX=panX; dragOriginY=panY;
    sheet.classList.add("dragging");
    if(sheet.setPointerCapture) sheet.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  function moveDrag(event) {
    if(!dragging) return;
    panX=dragOriginX+event.clientX-dragStartX; panY=dragOriginY+event.clientY-dragStartY;
    clampPan(); applyPan(); event.preventDefault();
  }
  function endDrag(event) {
    if(!dragging) return;
    dragging=false; sheet.classList.remove("dragging");
    if(sheet.releasePointerCapture&&sheet.hasPointerCapture&&sheet.hasPointerCapture(event.pointerId)) sheet.releasePointerCapture(event.pointerId);
  }

  document.getElementById("readerForm").onsubmit=function(){showPage(input.value,true);return false;};
  document.getElementById("readerPrev").onclick=function(){changePage(-1);};
  document.getElementById("readerNext").onclick=function(){changePage(1);};
  document.getElementById("zoomOut").onclick=function(){if(zoomIndex>0){zoomIndex--;applyZoom();}};
  document.getElementById("zoomIn").onclick=function(){if(zoomIndex<zoomSteps.length-1){zoomIndex++;applyZoom();}};
  sheet.onpointerdown=beginDrag;
  document.onpointermove=moveDrag;
  document.onpointerup=endDrag;
  document.onpointercancel=endDrag;
  window.onresize=function(){clampPan();applyPan();};

  if(!paper || !pdfUrl) { showEmpty("暂无可供在线阅读的论文页面。"); return; }
  title.innerHTML = "正在载入 - "+paper.title;
  var resolvedPdfUrl = new URL(String(pdfUrl), document.baseURI).href;
  pdfjsLib.getDocument({url:resolvedPdfUrl}).promise.then(function(documentPdf){
    pdf=documentPdf; total.innerHTML=String(pdf.numPages);
    var hashPage=parseInt((window.location.hash.match(/p=(\d+)/)||[,1])[1],10)||1;
    showPage(hashPage>=1&&hashPage<=pdf.numPages?hashPage:1,true);
  }).catch(function(error){ console.error("PDF reader error",error); showEmpty("论文文件暂时无法读取。"); });
}

if (window.WuyiJournalLogin) window.WuyiJournalLogin.requireLogin(startReader);
else startReader();
