(function (window, $) {
    'use strict';

    var CSS_CLASSES = {
        btnPressed: 'btn--pressed'
    }

    var BookView = {
        initiated: false,
        flipMode: {
            scale: 1,
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
        _currentPage: 1,
        get currentPage() {
            return this._currentPage;
        },
        set currentPage(page) {
            debugger;
            if ($('#magazine').turn('is')) {
                $('#magazine').turn('page', page);
            }
            this._currentPage = page;
        },
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

            if (this.initiated) {
                debugger;
                this.showFlip();
            }

            $('#viewerContainer')
                .after(BookView.flipMode.$container.clone())
                .hide();
            $("#magazine").show();

            BookView.oldScale = pdfViewer.currentScale;
            pdfViewer.currentScaleValue = 1;

            var pageHeight = $(window).height()
                - parseInt($('#magazineContainer').css('padding-top'), 10)
                - parseInt($('#magazineContainer').css('padding-bottom'), 10);

            var height = parseInt($('.canvasWrapper').css('height'), 10);
            var scale = pageHeight / height;
            var bookWidth = parseInt($('.canvasWrapper').css('width'), 10) * scale;
            BookView.updateScale(scale);
            BookView.flipMode.scale = scale;

            BookView.currentPage = pdfViewer.currentPageNumber;

            var pages = [1,3,5];
            var totalPages = pdfViewer.pdfDocument.numPages;

            BookView.loadTurnJsPages(pages, $('#magazine'), true, true).then(function () {

                $("#magazine").turn({
                    autoCenter: true,
                    display: 'single',
                    width: bookWidth,
                    height: pageHeight,
                    pages: totalPages,
                    page: 1,
                    elevation: 100,
                    duration: 600,
                    acceleration: !BookView.isChrome(),
                    when: {
                        missing: function (event, pages) {
                            BookView.loadTurnJsPages(pages, this, false, false);
                        },
                        turning: function (event, page, view) {
                            if (!$('#magazine').turn('hasPage', page)) {
                                BookView.loadTurnJsPages([page], this, false, true).then(function () {
                                    $('#magazine').turn('page', page);
                                });
                                event.preventDefault();
                            }
                            BookView._currentPage = page;
                            // BookView.showHidePageButtons(page);
                        }
                    }
                });

                setTimeout(function () {
                    $("#magazine").turn("display", BookView.layout);
                    var multiplier = BookView.layout == 'double' ? 2 : 1;
                    var width = parseInt($("#magazine canvas").css('width'), 10);
                    var height = parseInt($("#magazine canvas").css('height'), 10);
                    $("#magazine").turn("size", width * multiplier, height);
                    if (BookView.currentPage > 1) $("#magazine").turn("page", BookView.currentPage);
                }, 10);
            });


        },
        updateScale: function (scale) {
            // if (scale !== pdfViewer.currentScale) {
            //     BookView.oldScale = pdfViewer.currentScale;
            // }
            pdfViewer.currentScale = scale;
        },

        updateScaleValue: function (scale) {
            // if (scale !== pdfViewer.currentScale) {
            //     BookView.oldScale = pdfViewer.currentScale;
            // }
            pdfViewer.currentScaleValue = scale;
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
                    // BookView.updateScale(pdfViewer.currentScale);
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

            if (deferred) return deferred;
        },

        destroy: function () {
            BookView.updateScale(BookView.oldScale);
            pdfViewer.page = BookView.currentPage;
            $("#magazineContainer").hide();
            $("#magazineContainer").empty();
            $("#viewerContainer").show();
        },

        suspend: function() {
            BookView.updateScale(BookView.oldScale);
            pdfViewer.page = BookView.currentPage;
            $("#magazineContainer").hide();
            $("#viewerContainer").show();
        },

        showFlip: function() {
            BookView.updateScale(BookView.flipMode.scale);
            BookView.currentPage = pdfViewer.page;
            $("#magazineContainer").show();
            $("#viewerContainer").hide();
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

            $(pageEl).on('textlayerrendered', function (evt) {
                _clone.find('.textLayer').replaceWith($(pageEl).find('.textLayer').clone());
            });

            if (!isInit) {
                if ($('#magazine').turn('hasPage', pageNumber)) {
                    $('.p' + pageNumber).parent().html(_clone);
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
        .on('pagechange', function (e) { })
    window.BookView = BookView;

    function cloneCanvas(oldCanvas) {

        //create a new canvas
        var newCanvas = document.createElement('canvas');
        var context = newCanvas.getContext('2d');

        //set dimensions
        newCanvas.width = oldCanvas.width;
        newCanvas.height = oldCanvas.height;
        $(newCanvas).attr('style', $(oldCanvas).attr('style'))

        //apply the old canvas to the new one
        context.drawImage(oldCanvas, 0, 0);

        //return the new canvas
        return newCanvas;
    }

})(window, jQuery);
