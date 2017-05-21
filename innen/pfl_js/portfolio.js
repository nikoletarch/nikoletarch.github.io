function addPage(page, book)
{
  var id, pages = book.turn('pages');

  // Create a new element for this page
  var element = $('<div />', {});

  if (page == 1 || page == 2 || 
      (((PAGES % 2) == 0) && (page == PAGES - 1 || page == PAGES)))
  {
    element.attr('class', 'hard');
  }
  
  // Add the page to the portfolio
  if (book.turn('addPage', element, page))
  {
    // Add the initial HTML
    // It will contain a loader indicator and a gradient
    element.html('<div class="gradient"></div><div class="loader"></div>');

    // Load the page
    loadPage(page, element);
  }
}

function loadPage(page, pageElement)
{
  // Create an image element
  var img = $('<img />');

  img.mousedown(
    function(e)
    {
      e.preventDefault();
    });

  img.load(
    function()
    {
      // Set the size
      $(this).css({width: '100%', height: '100%'});

      // Add the image to the page after loaded
      $(this).appendTo(pageElement);

      // Remove the loader indicator
      pageElement.find('.loader').remove();
    });

  // Load the page
  img.attr('src', PAGES_DIR +  page + '.png');

  // loadRegions(page, pageElement);
}

// Zoom in / Zoom out
function zoomTo(event)
{
    setTimeout(
      function()
      {
        if ($('.portfolio-viewport').data().regionClicked)
        {
          $('.portfolio-viewport').data().regionClicked = false;
        }
        else
        {
          if ($('.portfolio-viewport').zoom('value') == 1)
          {
            $('.portfolio-viewport').zoom('zoomIn', event);
          }
          else
          {
            $('.portfolio-viewport').zoom('zoomOut');
          }
        }
      }, 1);
}



// Load regions
function loadRegions(page, element)
{
  $.getJSON(PAGES_DIR + page + '-regions.json').done(
    function(data)
    {
      $.each(data, 
        function(key, region)
        {
          addRegion(region, element);
        });
    });
}

// Add region
function addRegion(region, pageElement)
{
  var reg = $('<div />', {'class': 'region  ' + region['class']}),
    options = $('.portfolio').turn('options'),
    pageWidth = options.width / 2,
    pageHeight = options.height;

  reg.css({
    top:    Math.round(region.y/pageHeight * 100) + '%',
    left:   Math.round(region.x/pageWidth * 100) + '%',
    width:  Math.round(region.width/pageWidth * 100) + '%',
    height: Math.round(region.height/pageHeight * 100) + '%'
  }).attr('region-data', $.param(region.data || ''));

  reg.appendTo(pageElement);
}

// Process click on a region
function regionClick(event)
{
  var region = $(event.target);

  if (region.hasClass('region'))
  {
    $('.portfolio-viewport').data().regionClicked = true;
    
    setTimeout(
      function() {
        $('.portfolio-viewport').data().regionClicked = false;
      }, 100);
    
    var regionType = $.trim(region.attr('class').replace('region', ''));

    return processRegion(region, regionType);
  }
}

// Process the data of every region
function processRegion(region, regionType)
{
  data = decodeParams(region.attr('region-data'));

  switch (regionType)
  {
  case 'link':
    window.open(data.url);
    break;
  case 'zoom':
    var regionOffset = region.offset(),
      viewportOffset = $('.portfolio-viewport').offset(),
      pos =
        {
          x: regionOffset.left-viewportOffset.left,
          y: regionOffset.top-viewportOffset.top
        };
    $('.portfolio-viewport').zoom('zoomIn', pos);
    break;

  case 'to-page':
    $('.portfolio').turn('page', data.page);
    break;
  }

}

// Load large page
function loadLargePage(page, pageElement)
{
  var img = $('<img />');

  img.load(
    function()
    {
      var prevImg = pageElement.find('img');
      $(this).css({width: '100%', height: '100%'});
      $(this).appendTo(pageElement);
      prevImg.remove();
    });

  // Loadnew page
  img.attr('src', PAGES_DIR + page + '-large.png');
}

// Load small page
function loadSmallPage(page, pageElement) 
{
  
  var img = pageElement.find('img');

  img.css({width: '100%', height: '100%'});

  img.unbind('load');

  // Loadnew page
  img.attr('src', PAGES_DIR +  page + '.png');
}

function isChrome()
{
  // http://code.google.com/p/chromium/issues/detail?id=128488
  // return navigator.userAgent.indexOf('Chrome')!=-1;
  return false;
}

function disableControls(page)
{
  var npages = $('.portfolio').turn('pages');

  if (page == 1)
    $('.previous-button').hide();
  else
    $('.previous-button').show();
        
  if (((npages % 2 == 1) && (page == npages - 1)) || page == npages)
    $('.next-button').hide();
  else
    $('.next-button').show();
}

// Set the width and height for the viewport
function resizeViewport()
{
  var width = $(window).width(),
    height = $(window).height(),
    options = $('.portfolio').turn('options');

  $('.portfolio').removeClass('animated');

  $('.portfolio-viewport').css({
      width: width,
      height: height
    }).
  zoom('resize');


  if ($('.portfolio').turn('zoom') == 1)
  {
    var bound = calculateBound({
      width: options.width,
      height: options.height,
      boundWidth: Math.min(options.width, width),
      boundHeight: Math.min(options.height, height)
    });

    if (bound.width % 2 !== 0)
      bound.width -= 1;

    if (bound.width != $('.portfolio').width() || 
        bound.height != $('.portfolio').height())
    {
      $('.portfolio').turn('size', bound.width, bound.height);

      if ($('.portfolio').turn('page') == 1)
      {
        $('.portfolio').turn('peel', 'br');
      }

      $('.next-button').css(
        {
          height: bound.height, 
          backgroundPosition: '-28px ' + (bound.height / 2 - 32 / 2) + 'px'
        });
      $('.previous-button').css(
        {
          height: bound.height, 
          backgroundPosition: '6px ' + (bound.height / 2 - 32 / 2) + 'px'
        });
    }

    $('.portfolio').css(
      {
        top: -bound.height / 2,
        left: -bound.width / 2
      });
  }

  var portfolioOffset = $('.portfolio').offset(),
    boundH = height - portfolioOffset.top - $('.portfolio').height(),
    marginTop = (boundH - $('.thumbnails > div').height()) / 2;

  if (marginTop < 0)
  {
    $('.thumbnails').css({height: 1});
  }
  else
  {
    $('.thumbnails').css({height: boundH});
    $('.thumbnails > div').css({marginTop: marginTop});
  }

  if (portfolioOffset.top < $('.made').height())
    $('.made').hide();
  else
    $('.made').show();

  $('.portfolio').addClass('animated');
  
}

// Number of views in a portfolio
function numberOfViews(book)
{
  var npages = book.turn('pages');
  
  /* The first page is solo */
  npages--;

  return 1 + Math.floor((npages + 1) / 2);
  
}

// Current view in a portfolio
function getViewNumber(book, page)
{
  var npages = book.turn('pages');

  return parseInt((page || book.turn('page')) / 2 + 1, 10);
}

function moveBar(yes)
{
  if (Modernizr && Modernizr.csstransforms)
  {
    $('#slider .ui-slider-handle').css({zIndex: yes ? -1 : 10000});
  }
}

function setPreview(view)
{
  var previewWidth = 127 * 2,
    previewHeight = 90,
    previewSrc = PAGES_DIR + 'preview.png',
    preview = $(_thumbPreview.children(':first')),
    numPages = (view == 1 || 
                ($('#slider').slider('option', 'max') % 2 == 1 && view == $('#slider').slider('option', 'max'))) ? 1 : 2,
    width = (numPages == 1) ? previewWidth / 2 : previewWidth;

  _thumbPreview.
    addClass('no-transition').
    css(
      {width: width + 15,
        height: previewHeight + 15,
        top: -previewHeight - 30,
        left: ($($('#slider').children(':first')).width() - width - 15)/2
      });

  preview.css(
    {
      width: width,
      height: previewHeight
    });

  if (preview.css('background-image')==='' ||
      preview.css('background-image')=='none')
  {

    preview.css({backgroundImage: 'url(' + previewSrc + ')'});

    setTimeout(
      function() { 
        _thumbPreview.removeClass('no-transition');
      }, 0);

  }

  preview.css(
    {
      backgroundPosition: '0px -' + ((view - 1) * previewHeight) + 'px'
    });
}

// Width of the portfolio when zoomed in
function largePortfolioWidth()
{
  return 2 * 1754;
}

// decode URL Parameters
function decodeParams(data)
{
  var parts = data.split('&'), d, obj = {};

  for (var i = 0; i < parts.length; i++)
  {
    d = parts[i].split('=');
    obj[decodeURIComponent(d[0])] = decodeURIComponent(d[1]);
  }
  return obj;
}

// Calculate the width and height of a square within another square
function calculateBound(d)
{

  var bound = {width: d.width, height: d.height};

  if (bound.width > d.boundWidth || 
      bound.height > d.boundHeight)
  {
    var rel = bound.width/bound.height;

    if (d.boundWidth / rel > d.boundHeight && 
        d.boundHeight * rel <= d.boundWidth)
    {
      bound.width = Math.round(d.boundHeight * rel);
      bound.height = d.boundHeight;
    }
    else
    {
      bound.width = d.boundWidth;
      bound.height = Math.round(d.boundWidth/rel);
    }
  }
  
  return bound;
}