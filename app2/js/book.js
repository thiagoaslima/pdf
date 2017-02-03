(function (window, $) {
    'use strict';

    var CSS_CLASSES = {
        btnPressed: 'btn--pressed'
    }

    var BookView = {
        flipMode: {
            _status: false,
            $button: $('#flipModeBtn'),
            $container: $([
                '<div id="magazineContainer">',

                '<div class="icon-holder">',
                '<div class="exit-icon" id="exitMagazineView" alt="Exit magazine mode"></div>',
                '<div class="zoom-icon zoom-icon-in" alt="Zoom"></div>',
                '</div>',

                '<div id="magazine">',
                '<div ignore="1" class="next-button"></div>',
                '<div ignore="1" class="previous-button" style="display: block;"></div>',
                '</div>',

                '</div>'
            ].join('')),
            activate: function () {
                this.$button.addClass(CSS_CLASSES.btnPressed);
                this._status = true;
                BookView.start();
            },
            deactivate: function () {
                this.$button.removeClass(CSS_CLASSES.btnPressed);
                this._status = false;
                BookView.destroy();
            }
        },
        oldScale: 1,
        currentPage: 1,
        currentScale: 1,
        layout: 'double',
        maxScale: 2,

        init: function () {
            BookView.flipMode.$button.on('click', function (evt) {
                BookView.flipMode._status 
                    ? BookView.flipMode.deactivate() 
                    : BookView.flipMode.activate();
            })
        },

        start: function () {
            BookView.oldScale = pdfViewer.currentScale;
            pdfViewer.currentScaleValue = 'auto'

            $('#viewerContainer')
                .after(BookView.flipMode.$container.clone())
                .hide();
            $("#magazine").show();

            BookView.currentPage = pdfViewer.currentPageNumber;

            var pages = [1];
            var totalPages = pdfViewer.pdfDocument.numPages;
            BookView.loadTurnJsPages(pages, $('#magazine'), true, true).then(function () {
                var pageHeight = $(window).height()
                    - parseInt($('#magazineContainer').css('padding-top'), 10)
                    - parseInt($('#magazineContainer').css('padding-bottom'), 10);

                var size = pdfViewer.getPagesOverview()[0];

                var scale = pageHeight / size.height;

                $("#magazine").turn({
                    autoCenter: true,
                    display: 'single',
                    width: size.width * scale,
                    height: pageHeight,
                    pages: totalPages,
                    page: 1,
                    elevation: 100,
                    duration: 600,
                    acceleration: !BookView.isChrome(),
                    when: {
                        missing: function (event, pages) {
                            debugger;
                            BookView.loadTurnJsPages(pages, this, false, false);
                        },
                        turning: function (event, page, view) {
                            debugger;
                            if (!$('#magazine').turn('hasPage', page)) {
                                BookView.loadTurnJsPages([page], this, false, true).then(function () {
                                    $('#magazine').turn('page', page);
                                });
                                event.preventDefault();
                            }
                            BookView.currentPage = page;
                            // BookView.showHidePageButtons(page);
                        }
                    }
                });

                setTimeout(function () {
                    $("#magazine").turn("display", BookView.layout);
                    var multiplier = BookView.layout == 'double' ? 2 : 1;
                    $("#magazine").turn("size", $("#magazine canvas")[0].width * multiplier, $("#magazine canvas")[0].height);
                    if (BookView.currentPage > 1) $("#magazine").turn("page", BookView.currentPage);
                }, 10);
            });


        },

        updateScale: function (scale) {
            if (scale !== pdfViewer.currentScale) {
                BookView.oldScale = pdfViewer.currentScale;
                pdfViewer.currentScaleValue = scale;
            }
        },

        loadTurnJsPages: function (pages, bookDiv, isInit, defer, scale) {
            var self = BookView;
            var deferred = null;
            if (defer) deferred = $.Deferred();
            var pagesRendered = 0;
            var i = 0;

            var _pageRenderedHandler = function (evt) {
                var pageNumber = $(evt.target).attr('data-page-number');

                self._appendPageElement(pageNumber, $(pdfViewer.container).find('[data-page-number=' + pageNumber + ']'), isInit);
                pagesRendered++;
                if (pagesRendered == pages.length) {
                    $(pdfViewer.container).off('pagerendered', _pageRenderedHandler);
                    BookView.updateScale(pdfViewer.currentScale);
                    if (deferred) deferred.resolve();
                } else {
                    _render(pages, ++i);
                }
            }

            var _render = function (pages, i) {
                var pageView = pdfViewer.getPageView(pages[i] - 1);

                if (pdfViewer.renderingQueue.isViewFinished(pageView)) {
                    var $pageEl = $(pdfViewer.viewer).find('[data-page-number=' + pages[i] + ']').clone();
                    //$("#magazine").append($pageEl);
                    _pageRenderedHandler(BookView._convertToPageRenderedHandlerSignature(pages[i], $pageEl[0]));
                } else {
                    pdfViewer.renderingQueue.renderView(pageView);
                }

            }

            $(pdfViewer.container).on('pagerendered', _pageRenderedHandler);
            _render(pages, i);
            // for (var i = 0; i < pages.length; i++) {


            //     if (pdfViewer.renderingQueue.isViewFinished(pageView)) {
            //         var $pageEl = $(pdfViewer.viewer).find('[data-page-number=' + pages[i] + ']').clone();
            //         $("#magazine").append($pageEl);
            //         _pageRenderedHandler(BookView._convertToPageRenderedHandlerSignature(pages[i], $pageEl[0]));
            //     } else {
            //         pdfViewer.renderingQueue.renderView(pageView);
            //     }
            // }

            if (deferred) return deferred;
        },

        destroy: function () {
            BookView.updateScale(BookView.oldScale);
            pdfViewer.page = BookView.currentPage;
            $("#magazineContainer").hide();
            $("#magazineContainer").empty();
            $("#viewerContainer").show();
        },

        isChrome: function () {
            return navigator.userAgent.indexOf('Chrome') != -1;
        },

        _convertToPageRenderedHandlerSignature: function (pageNumber, element) {
            return {
                target: element,
                detail: {
                    pageNumber: pageNumber
                }
            };
        },

        _appendPageElement: function (pageNumber, pageEl, isInit) {
            let _clone = $(pageEl).clone();

            _clone.find('canvas').replaceWith(cloneCanvas($(pageEl).find('canvas')[0]));
            // _clone.find('[style]').removeAttr('style');

            $(pageEl).on('textlayerrendered', function (evt) {
                _clone.find('.textLayer').replaceWith($(pageEl).find('.textLayer').clone());
                // _clone.find('[style]').removeAttr('style');
            });

            if (!isInit) {
                if ($('#magazine').turn('hasPage', pageNumber)) {
                    debugger;
                    /*var oldCanvas = $('#magCanvas' + pageNumber)[0];
                    oldCanvas.width = destinationCanvas.width;
                    oldCanvas.height = destinationCanvas.height;
                    var oldCtx = oldCanvas.getContext("2d");
                    oldCtx.drawImage(destinationCanvas, 0, 0);*/
                } else {
                    $('#magazine').turn('addPage', _clone, pageNumber);
                }
            } else {
                $('#magazine').append(_clone);
            }
        }
    }


    $(document)
        .on('pagesinit', function (e) { })
        .on('pagesloaded', function (e) {
            BookView.init(); 
        })
        .on('updateviewarea', function (e) { })
        .on('pagechange', function (e) { debugger; })
    window.BookView = BookView;

    function cloneCanvas(oldCanvas) {

        //create a new canvas
        var newCanvas = document.createElement('canvas');
        var context = newCanvas.getContext('2d');

        //set dimensions
        newCanvas.width = oldCanvas.width;
        newCanvas.height = oldCanvas.height;

        //apply the old canvas to the new one
        context.drawImage(oldCanvas, 0, 0);

        //return the new canvas
        return newCanvas;
    }

})(window, jQuery);
