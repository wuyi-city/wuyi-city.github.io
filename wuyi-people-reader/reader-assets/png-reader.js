(function (global) {
  function init(config) {
    var pages=config.pages||{};
    var pageKeys=[];
    for(var key in pages) if(Object.prototype.hasOwnProperty.call(pages,key)) pageKeys[pageKeys.length]=String(key);
    pageKeys.sort(function(a,b){return parseInt(a,10)-parseInt(b,10);});
    var currentPage=pageKeys.length?pageKeys[0]:"1";
    var stage=document.getElementById("readerStage");
    var sheet=document.getElementById("readerPage");
    var image=document.getElementById("readerImage");
    var empty=document.getElementById("readerEmpty");
    var input=document.getElementById("pageInput");
    var title=document.getElementById("pageTitle");
    var quick=document.getElementById("readerQuick");
    var total=document.getElementById("readerTotal");
    var zoomSteps=[0.5,0.75,1,1.25,1.5,1.75,2];
    var zoomIndex=2;
    var panX=0,panY=0,dragging=false,dragStartX=0,dragStartY=0,dragOriginX=0,dragOriginY=0;

    function record(page) {
      var value=pages[String(page)];
      return typeof value==="string"?{src:value}:value;
    }
    function pagePosition(page) {
      for(var i=0;i<pageKeys.length;i++) if(pageKeys[i]===String(page)) return i;
      return -1;
    }
    function clampPan() {
      var zoom=zoomSteps[zoomIndex];
      var maxX=Math.max(0,(sheet.offsetWidth*zoom-stage.clientWidth)/2);
      var maxY=Math.max(0,(sheet.offsetHeight*zoom-stage.clientHeight)/2);
      panX=Math.max(-maxX,Math.min(maxX,panX));
      panY=Math.max(-maxY,Math.min(maxY,panY));
    }
    function applyPan() {
      document.documentElement.style.setProperty("--page-pan-x",panX+"px");
      document.documentElement.style.setProperty("--page-pan-y",panY+"px");
    }
    function applyZoom() {
      var zoom=zoomSteps[zoomIndex];
      document.documentElement.style.setProperty("--page-zoom",zoom);
      document.getElementById("zoomValue").innerHTML=Math.round(zoom*100)+"%";
      sheet.classList.toggle("zoomed",zoom>1);
      clampPan();
      applyPan();
    }
    function showPage(page, options) {
      page=String(parseInt(page,10)||1);
      var data=record(page);
      if(!data) { input.value=currentPage; return; }
      if(options&&options.resetZoom&&config.resetZoomOnPageChange) zoomIndex=2;
      currentPage=page;
      input.value=page;
      title.innerHTML="Page "+page+" - "+config.title;
      image.src=data.src;
      image.alt="";
      sheet.style.aspectRatio=data.aspect||config.aspect||"856 / 1208";
      sheet.style.display="block";
      empty.style.display="none";
      panX=0; panY=0; applyPan();
      applyZoom();
      if(window.location.hash!=="#p="+page) window.location.hash="p="+page;
    }
    function beginDrag(event) {
      if(zoomSteps[zoomIndex]<=1) return;
      dragging=true;
      dragStartX=event.clientX; dragStartY=event.clientY; dragOriginX=panX; dragOriginY=panY;
      sheet.classList.add("dragging");
      if(sheet.setPointerCapture) sheet.setPointerCapture(event.pointerId);
      event.preventDefault();
    }
    function moveDrag(event) {
      if(!dragging) return;
      panX=dragOriginX+event.clientX-dragStartX;
      panY=dragOriginY+event.clientY-dragStartY;
      clampPan(); applyPan(); event.preventDefault();
    }
    function endDrag(event) {
      if(!dragging) return;
      dragging=false; sheet.classList.remove("dragging");
      if(sheet.releasePointerCapture&&sheet.hasPointerCapture&&sheet.hasPointerCapture(event.pointerId)) sheet.releasePointerCapture(event.pointerId);
    }
    function neighboringPage(offset) {
      var index=pagePosition(currentPage);
      if(index<0||!config.navigateArrows) return;
      var next=pageKeys[index+offset];
      if(!next) return;
      if(config.adjacentArrowsOnly&&Math.abs(parseInt(next,10)-parseInt(currentPage,10))!==1) return;
      showPage(next,{resetZoom:true});
    }

    document.title=config.documentTitle||config.title+" - 在线阅读";
    total.innerHTML=String(config.totalPages||pageKeys.length||1);
    var quickPages=config.quickPages||[];
    for(var q=0;q<quickPages.length;q++) {
      if(!record(quickPages[q])) continue;
      var link=document.createElement("span");
      link.className="reader-page-link";
      link.setAttribute("data-page",quickPages[q]);
      link.innerHTML=quickPages[q];
      link.onclick=function(){showPage(this.getAttribute("data-page"));};
      quick.appendChild(link);
    }
    document.getElementById("readerForm").onsubmit=function(){showPage(input.value);return false;};
    document.getElementById("zoomOut").onclick=function(){if(zoomIndex>0){zoomIndex-=1;applyZoom();}};
    document.getElementById("zoomIn").onclick=function(){if(zoomIndex<zoomSteps.length-1){zoomIndex+=1;applyZoom();}};
    document.getElementById("readerPrev").onclick=function(){neighboringPage(-1);};
    document.getElementById("readerNext").onclick=function(){neighboringPage(1);};
    sheet.onpointerdown=beginDrag;
    document.onpointermove=moveDrag;
    document.onpointerup=endDrag;
    document.onpointercancel=endDrag;
    window.onresize=function(){clampPan();applyPan();};

    if(!pageKeys.length) {
      title.innerHTML=config.title;
      sheet.style.display="none";
      empty.style.display="block";
      empty.innerHTML=config.emptyText||"暂无可供在线阅读的页面。";
      applyZoom();
      return;
    }
    var hashPage=(window.location.hash.match(/p=(\d+)/)||[,config.initialPage||pageKeys[0]])[1];
    applyZoom();
    showPage(record(hashPage)?hashPage:(config.initialPage||pageKeys[0]));
  }
  global.PngReader={init:init};
}(window));
