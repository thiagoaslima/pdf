var flipbook = $('#flipbook');

flipbook.turn({
    // elevation: 50,
    autoCenter: true,
    pages: 20,
    width: 400,
    height: 300,
    
    when: {
/*
        turning: function (e, page, view) {

            var book = $(this),
                currentPage = book.turn('page'),
                pages = book.turn('pages');

            if (currentPage > 3 && currentPage < pages - 3) {
                if (page == 1) {
                    book.turn('page', 2).turn('stop').turn('page', page);
                    e.preventDefault();
                    return;
                } else if (page == pages) {
                    book.turn('page', pages - 1).turn('stop').turn('page', page);
                    e.preventDefault();
                    return;
                }
            } else if (page > 3 && page < pages - 3) {
                if (currentPage == 1) {
                    book.turn('page', 2).turn('stop').turn('page', page);
                    e.preventDefault();
                    return;
                } else if (currentPage == pages) {
                    book.turn('page', pages - 1).turn('stop').turn('page', page);
                    e.preventDefault();
                    return;
                }
            }

            // Hash.go('page/' + page).update();

            // if (page == 1 || page == pages)
            //     $('.sample-docs .tabs').hide();


        },

        turned: function (e, page, view) {

            var book = $(this);

            // $('#slider').slider('value', getViewNumber(book, page));

            // if (page != 1 && page != book.turn('pages'))
            //     $('.sample-docs .tabs').fadeIn(500);
            // else
            //     $('.sample-docs .tabs').hide();

            book.turn('center');
            // updateTabs();

        },

        start: function (e, pageObj) {

            // moveBar(true);

        },

        end: function (e, pageObj) {

            var book = $(this);

            // setTimeout(function () {
            //     $('#slider').slider('value', getViewNumber(book));
            // }, 1);

            // moveBar(false);

        },
*/
        missing: function (e, pages) {
            for (var i = 0; i < pages.length; i++)
                addPage(pages[i], $(this));

        }
    }
    
})

// <div style="width:100px;height:100px;background:lightblue;line-height:100px">Page 1</div>

function loadPage(page) {

    var template = '<div style="background:lightblue;line-height:100px">Page 1</div>';

    $('.p' + page).html(template);
	// $.ajax({url: 'pages/page' + page + '.html'}).
	// 	done(function(pageHtml) {
	// 		$('.sj-book .p' + page).html(pageHtml.replace('samples/steve-jobs/', ''));
	// 	});

}

function addPage(page, book) {

	var id, pages = book.turn('pages');

	if (!book.turn('hasPage', page)) {

		var element = $('<div />',
			{css: book.turn('size')}).
			html('<div class="loader"></div>');

		if (book.turn('addPage', element, page)) {
			loadPage(page);
            book.turn('resize');
		}

	}
}