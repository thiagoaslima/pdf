/* Copyright 2014 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

if (!PDFJS.PDFViewer || !PDFJS.getDocument) {
  alert('Please build the pdfjs-dist library using\n' +
    '  `gulp dist`');
}

// The workerSrc property shall be specified.
//
PDFJS.workerSrc = 'js/build/pdf.worker.js';

// Some PDFs need external cmaps.
//
// PDFJS.cMapUrl = '../../build/dist/cmaps/';
// PDFJS.cMapPacked = true;

var DEFAULT_URL = 'pdf/01.pdf';
var SEARCH_FOR = ''; // try 'Mozilla';

var container = document.getElementById('viewerContainer');
var DEFAULT_SCALE;

// (Optionally) enable hyperlinks within PDF files.
var pdfLinkService = new PDFJS.PDFLinkService();

var pdfViewer = new PDFJS.PDFViewer({
  container: container,
  linkService: pdfLinkService,
});
pdfLinkService.setViewer(pdfViewer);

// (Optionally) enable find controller.
var pdfFindController = new PDFJS.PDFFindController({
  pdfViewer: pdfViewer
});
pdfViewer.setFindController(pdfFindController);

container.addEventListener('pagesinit', function () {
  DEFAULT_SCALE = 600 / pdfViewer.getPageView(0).width;

  // We can use pdfViewer now, e.g. let's change default scale.
  pdfViewer.currentScale = DEFAULT_SCALE;

  if (SEARCH_FOR) { // We can try search for things
    pdfFindController.executeCommand('find', { query: SEARCH_FOR });
  }
});

// Loading document.
PDFJS.getDocument(DEFAULT_URL).then(function (pdfDocument) {
  // Document loaded, specifying document for the viewer and
  // the (optional) linkService.
  pdfViewer.setDocument(pdfDocument);
  pdfLinkService.setDocument(pdfDocument, null);
});



function loadApp() {
  var $container = jQuery(container);
  $container
    .addClass('container')
    .wrap('<div class="flipbook-viewport"></div>');

  jQuery('#viewer').addClass('flipbook').removeClass('float');

  jQuery('#viewerContainer').removeAttr('id');

  $('.page')
    .addClass('pageView own-size')
    .removeClass('page')

  var flipbook = $('.flipbook');

  // Check if the CSS was already loaded

  if (flipbook.width() == 0 || flipbook.height() == 0) {
    setTimeout(loadApp, 10);
    return;
  }


  // Create the flipbook

  $('.flipbook').turn({
    // Elevation


    elevation: 50,
    inclination: 0,

    // Enable gradients

    gradients: true,
    pages: 6,
    // Auto center this flipbook

    autoCenter: true,
    when: {
			turning: function(e, page, view) {
				
				var book = $(this),
					currentPage = book.turn('page'),
					pages = book.turn('pages');


				Hash.go('page/'+page).update();
					
			},
    }
  })


  pdfViewer.renderingQueue.renderView(pdfViewer.getPageView(0));

  // links
  $('.flipbook').on('click', 'a[href="#01.indd%3A.387%3A2"]', function (evt) {
    evt.preventDefault();
    $('.flipbook').turn('page', 4);
  });
  $('.flipbook').on('click', 'a[href="#01.indd%3A.939%3A16"]', function (evt) {
    evt.preventDefault();
    $('.flipbook').turn('page', 5);
  });

  //arrows
  $(document).keydown(function(e){

		var previous = 37, next = 39;

		switch (e.keyCode) {
			case previous:

				$('.flipbook').turn('previous');

			break;
			case next:
				
				$('.flipbook').turn('next');

			break;
		}

	});

  // URIs
	
	Hash.on('^page\/([0-9]*)$', {
		yep: function(path, parts) {
      debugger;
			var page = parts[1];

			if (page!==undefined) {
				if ($('.flipbook').turn('is'))
					$('.flipbook').turn('page', page);
			}

		},
		nop: function(path) {
      debugger;
			if ($('.flipbook').turn('is'))
				$('.flipbook').turn('page', 1);
		}
	});
}



container.addEventListener('pagesloaded', function () { console.log('ínit'); loadApp() });
container.addEventListener('pagerendered', function (e) {
  console.log('render', e.detail);
  if (e.detail.pageNumber < 6) {
    var pageNumber = e.detail.pageNumber;
    var pageView = pdfViewer.getPageView(pageNumber);

    while (pageView.renderingState >= 2 && pageNumber < 6) {
      pageNumber++;
      pageView = pdfViewer.getPageView(pageNumber);
    }
    pdfViewer.renderingQueue.renderView(pageView);

  }
});

