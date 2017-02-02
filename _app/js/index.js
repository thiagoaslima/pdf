// https://github.com/mzabriskie/pdf-textlayer-example/blob/master/index.js

var pdfDocument;
var PAGE_HEIGHT;
var DEFAULT_SCALE = 1.33;

var pdfLinkService = new PDFJS.PDFLinkService();
PDFJS.workerSrc = 'js/build/pdf.worker.js';
PDFJS.getDocument('pdf/01.pdf').then(pdf => {
    pdfDocument = pdf;

    var viewer = document.getElementById('viewer');
    for (var i = 0; i < pdf.pdfInfo.numPages; i++) {
        var page = createEmptyPage(i + 1);
        viewer.appendChild(page);
    }

    loadPage(1).then(pdfPage => {
        var viewport = pdfPage.getViewport(DEFAULT_SCALE);
        PAGE_HEIGHT = viewport.height;
        document.body.style.width = `${viewport.width}px`;

    });
});

window.addEventListener('scroll', handleWindowScroll);

function createEmptyPage(num) {
    var page = document.createElement('div');
    var canvas = document.createElement('canvas');
    var wrapper = document.createElement('div');
    var textLayer = document.createElement('div');
    var annotationsLayer = document.createElement('div');

    page.className = 'page';
    wrapper.className = 'canvasWrapper';
    textLayer.className = 'textLayer';
    annotationsLayer.className = 'annotationLayer'

    page.setAttribute('id', `pageContainer${num}`);
    page.setAttribute('data-loaded', 'false');
    page.setAttribute('data-page-number', num);

    canvas.setAttribute('id', `page${num}`);

    page.appendChild(wrapper);
    page.appendChild(textLayer);
    page.appendChild(annotationsLayer);
    wrapper.appendChild(canvas);

    return page;
}

function loadPage(pageNum) {
    return pdfDocument.getPage(pageNum).then(pdfPage => {
        var page = document.getElementById(`pageContainer${pageNum}`);
        var canvas = page.querySelector('canvas');
        var wrapper = page.querySelector('.canvasWrapper');
        var container = page.querySelector('.textLayer');
        var canvasContext = canvas.getContext('2d');
        var viewport = pdfPage.getViewport(DEFAULT_SCALE);
        var divAnnotations = page.querySelector('.annotationLayer');

        canvas.width = viewport.width * 2;
        canvas.height = viewport.height * 2;
        page.style.width = `${viewport.width}px`;
        page.style.height = `${viewport.height}px`;
        wrapper.style.width = `${viewport.width}px`;
        wrapper.style.height = `${viewport.height}px`;
        container.style.width = `${viewport.width}px`;
        container.style.height = `${viewport.height}px`;

        pdfPage.render({
            canvasContext,
            viewport
        });

        pdfPage.getAnnotations().then(annotations => {
            console.log(annotations);
            debugger;
            PDFJS.AnnotationLayer.render({
                annotations,
                div: divAnnotations,
                page: pdfPage,
                viewport,
                linkService: pdfLinkService
            });
        })


        pdfPage.getTextContent().then(textContent => {
            PDFJS.renderTextLayer({
                textContent,
                container,
                viewport,
                textDivs: []
            });
        });


        page.setAttribute('data-loaded', 'true');

        return pdfPage;
    });
}

function handleWindowScroll() {
    var visiblePageNum = Math.round(window.scrollY / PAGE_HEIGHT) + 1;
    var visiblePage = document.querySelector(`.page[data-page-number="${visiblePageNum}"][data-loaded="false"]`);
    if (visiblePage) {
        setTimeout(function () {
            var page = loadPage(visiblePageNum);
            /*page.then(function(page) {
                if (page.pageNumber === 5) {
                    page.getTextContent().then(function(content){
                        content.items.forEach(function(item) {
                            if (item.str === "www.anp.gov.br") {
                                item.str = '<a href="www.anp.gov.br">www.anp.gov.br</a>';
                            }
                        });
                    });
                }
            })*/
        });
    }
}