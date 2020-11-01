$( function() {

  // count number of languages to populate dropdown
  // and key it so it can be alphabetized by language
  var widget_languages = {};
  $('.widget-language').each(function() {
    var cur_language = $(this).html();
    var lcur_language = cur_language.toLowerCase();
    if(widget_languages[lcur_language] === undefined)
      widget_languages[lcur_language] = {language: cur_language, count: 0};
    widget_languages[lcur_language].count = widget_languages[lcur_language].count + 1;
  });

  // populate the language filter dropdown
  $.each(Object.keys(widget_languages).sort(), function (i, val) {
    $('#languagefilter').append($('<option/>', {
      value: widget_languages[val].language,
      text : widget_languages[val].language + ' (' + widget_languages[val].count + ')'
    }));
  });

  // count tags to populate dropdown
  // and key it so it can be alphabetized by author
  var widget_tags = {};
  $('.widget-tags').each(function() {
    var cur_tags = $(this).html();
    cur_tags = cur_tags.split(',');
    for (var i = 0; i < cur_tags.length; i++) {
      var cur_tag = cur_tags[i].trim();
      var lcur_tag = cur_tag.toLowerCase();
      if(cur_tag !== '') {
        if(widget_tags[lcur_tag] === undefined)
          widget_tags[lcur_tag] = {tag: cur_tag, count: 0};
        widget_tags[lcur_tag].count = widget_tags[lcur_tag].count + 1;
      }
    }
  });

  // populate the tag filter dropdown
  $.each(Object.keys(widget_tags).sort(), function (i, val) {
    $('#tagfilter').append($('<option/>', {
      value: widget_tags[val].tag,
      text : widget_tags[val].tag + ' (' + widget_tags[val].count + ')'
    }));
  });

  // initialize language and tag select dropdowns
  $('select').formSelect();

  var $grid = $('#grid');

  $grid.isotope({
    itemSelector : '.grid-item',
    layoutMode: 'masonry',
    getSortData: {
      // language: '[data-language]',
      language: function( itemElem ) {
        var name = $( itemElem ).find('.widget-language').text();
        return name.toLowerCase();
      },
      name: function( itemElem ) {
        var name = $( itemElem ).find('.card-title').text();
        return name.toLowerCase();
      },
      stars: function( itemElem ) {
        var stars = -parseInt($( itemElem ).find(".gh-count").html());
        return stars;
      }
    },
    masonry: {
      isFitWidth: true,
      gutter: 20
    }
  });

  // use value of search field to filter
  var $textfilter = $('#textfilter').keyup( debounce( function() {
    $("#crancheckbox").prop('checked', false);
    if(! $("#tagfilter").val() === "") {
      $("#tagfilter").val(0);
      $("#tagfilter").formSelect();
    }
    if(! $("#languagefilter").val() === "") {
      $("#languagefilter").val(0);
      $("#languagefilter").formSelect();
    }
    handleFilter();
  }, 100 ) );

  // trigger isotope sort on #gridsort change
  $('#gridsort').change(function() {
    var sortVal = $(this).val();
    if(sortVal === 'stars')
      $grid.isotope('updateSortData');
    $grid.isotope({ sortBy : sortVal });
  });

  // trigger isotope filter on #languagefilter change
  // this resets tag and text filters and unchecks CRAN, as the
  // number in the dropdown is for all packages by this language
  $('#languagefilter').change(function() {
    $("#tagfilter").val(0);
    $("#tagfilter").formSelect();
    $("#textfilter").val("");
    $("#crancheckbox").prop('checked', false);
    handleFilter();
  });

  // trigger isotope filter on #tagfilter change
  // this resets language and text filters and unchecks CRAN, as the
  // number in the dropdown is for all packages by this language
  $('#tagfilter').change(function() {
    $("#languagefilter").val(0);
    $("#languagefilter").formSelect();
    $("#textfilter").val("");
    $("#crancheckbox").prop('checked', false);
    handleFilter();
  });

  // trigger isotope filter on #crancheckbox change
  $("#crancheckbox").click(function() {
    handleFilter();
  });

  // look at all filter inputs and determine which ones to show
  function handleFilter() {
    var tagVal = $('#tagfilter').val();
    var languageVal = $('#languagefilter').val();
    var textVal = $('#textfilter').val();
    var qsRegex;

    console.log("tagVal: " + tagVal);
    console.log("languageVal: " + languageVal);
    console.log("textVal: " + textVal);
    console.log("qsRegex: " + qsRegex);

    $grid.isotope({ filter : function() {
      var textBool = true;
      if(textVal !== '') {
        qsRegex = new RegExp( textVal, 'gi' );
        curText = $(this).find('.card-title').html() + " " + $(this).find('.widget-language').html() + " " + $(this).find('.widget-tags').html() + " " + $(this).find('.widget-shortdesc').html();
        textBool = qsRegex.test(curText);
      }

      var tagBool = true;
      if(! (tagVal === '' || tagVal === null)) {
        tagBool = false;
        var tags = $(this).find('.widget-tags').html();
        tags = tags.split(',');
        for (var i = 0; i < tags.length; i++) {
          tagBool = tagBool || (tags[i] == tagVal);
        }
      }

      var languageBool = true;
      if(! (languageVal === '' || languageVal === null)) {
        languageBool = false;
        languageBool = $(this).find('.widget-language').html() == languageVal;
      }

      var cranBool = $(this).find('.widget-cran').html() === "true";
      if($("#crancheckbox:checked").length === 0) {
        cranBool = true;
      }

      var res = textBool && tagBool && languageBool && cranBool;
      if(res) {
        $(this).addClass('is-showing');
      } else {
        $(this).removeClass('is-showing');
      }
      return res;
    }});
    $("#shown-widgets").html($('.is-showing').length);
  }

  // wrap hrefs around the tag listings for each widget
  // so when clicked they can fire off a filter on that tag
  $('.widget-tags').each(function(i) {
    var tagVals = $(this).html().split(',');
    $(this).addClass('hidden');
    for (var j = 0; j < tagVals.length; j++) {
      var el = document.createElement("a");
      el.className = 'taghref';
      el.textContent = tagVals[j];
      el.href = 'javascript:;';
      $(this).before(el);
      if (j < tagVals.length - 1) {
        $(this).before(", ");
      }
    }
  });

  // handle click on tag hrefs
  $('.taghref').click(function() {
    $('#tagfilter > option').removeAttr("selected");
    $('#tagfilter > option[value="' + $(this).html() + '"]').attr("selected", "selected");
    $('select').formSelect();
    $('#tagfilter').trigger('change');
  });

  $.getJSON( "github_meta.json", function(data) {
    $.each(data, function(key, val) {
      $('#' + key).html(val.stargazers_count);
    });
  })
  .success(function() {
    // default sort is by github stars - trigger it on load
    $('#gridsort').trigger('change');
  });

  // enforce initial filter (CRAN only)
  handleFilter();
  // make sure "Showing x of n" is correct
  var curlen = $(".widget-cran").filter(function() {return $(this).html() === "true"}).length;
  $("#shown-widgets").html(curlen);
});

function debounce( fn, threshold ) {
  var timeout;
  return function debounced() {
    if ( timeout ) {
      clearTimeout( timeout );
    }
    function delayed() {
      fn();
      timeout = null;
    }
    timeout = setTimeout( delayed, threshold || 100 );
  };
}



// var $grid = $('.grid').isotope({
//   itemSelector: '.grid-item',
//   isFitWidth: true
//   // percentPosition: true,
//   // masonry: {
//   //   // use element for option
//   //   columnWidth: '.grid-item',
//   //   rowHeight: '.grid-item'
//   // }
// });


