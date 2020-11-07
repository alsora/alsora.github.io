$( function() {

  // count number of languages to populate dropdown
  // and key it so it can be alphabetized by language
  var project_languages = {};
  $('.project-languages').each(function() {
    var cur_languages = $(this).html();
    cur_languages = cur_languages.split(',');
    for (var i = 0; i < cur_languages.length; i++) {
      var cur_language = cur_languages[i].trim();
      var lcur_language = cur_language.toLowerCase();
      if(cur_language !== '') {
        if(project_languages[lcur_language] === undefined)
          project_languages[lcur_language] = {language: cur_language, count: 0};
          project_languages[lcur_language].count = project_languages[lcur_language].count + 1;
      }
    }
  });

  // populate the language filter dropdown
  $.each(Object.keys(project_languages).sort(), function (i, val) {
    $('#languagefilter').append($('<option/>', {
      value: project_languages[val].language,
      text : project_languages[val].language + ' (' + project_languages[val].count + ')'
    }));
  });

  // count tags to populate dropdown
  // and key it so it can be alphabetized by author
  var project_tags = {};
  $('.project-tags').each(function() {
    var cur_tags = $(this).html();
    cur_tags = cur_tags.split(',');
    for (var i = 0; i < cur_tags.length; i++) {
      var cur_tag = cur_tags[i].trim();
      var lcur_tag = cur_tag.toLowerCase();
      if(cur_tag !== '') {
        if(project_tags[lcur_tag] === undefined)
          project_tags[lcur_tag] = {tag: cur_tag, count: 0};
          project_tags[lcur_tag].count = project_tags[lcur_tag].count + 1;
      }
    }
  });

  // populate the tag filter dropdown
  $.each(Object.keys(project_tags).sort(), function (i, val) {
    $('#tagfilter').append($('<option/>', {
      value: project_tags[val].tag,
      text : project_tags[val].tag + ' (' + project_tags[val].count + ')'
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
        var name = $( itemElem ).find('.project-languages').text();
        return name.toLowerCase();
      },
      name: function( itemElem ) {
        var name = $( itemElem ).find('.card-title').text();
        console.log("NAME: " + name);
        return name.toLowerCase();
      },
      stars: function( itemElem ) {
        var stars = -parseInt($( itemElem ).find(".stargazers_count").html());
        console.log("STARS: --- " + stars);
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
        curText = $(this).find('.card-title').html() + " " + $(this).find('.project-languages').html() + " " + $(this).find('.project-tags').html() + " " + $(this).find('.project-shortdesc').html();
        textBool = qsRegex.test(curText);
      }

      var tagBool = true;
      if(! (tagVal === '' || tagVal === null)) {
        tagBool = false;
        var tags = $(this).find('.project-tags').html();
        tags = tags.split(',');
        for (var i = 0; i < tags.length; i++) {
          tagBool = tagBool || (tags[i].trim() == tagVal);
        }
      }

      var languageBool = true;
      if(! (languageVal === '' || languageVal === null)) {
        languageBool = false;
        var languages = $(this).find('.project-languages').html();
        languages = languages.split(',');
        for (var i = 0; i < languages.length; i++) {
          languageBool = languageBool || (languages[i].trim() == languageVal);
        }
      }

      var res = textBool && tagBool && languageBool;
      if(res) {
        $(this).addClass('is-showing');
      } else {
        $(this).removeClass('is-showing');
      }
      return res;
    }});
    $("#shown-projects").html($('.is-showing').length);
  }

  // wrap hrefs around the language listings for each project
  // so when clicked they can fire off a filter on that language
  $('.project-languages').each(function(i) {
    var languageVals = $(this).html().split(',');
    $(this).addClass('hidden');
    for (var j = 0; j < languageVals.length; j++) {
      var el = document.createElement("a");
      el.className = 'languagehref';
      el.textContent = languageVals[j];
      el.href = 'javascript:;';
      $(this).before(el);
      if (j < languageVals.length - 1) {
        $(this).before(", ");
      }
    }
  });

  // handle click on language hrefs
  $('.languagehref').click(function() {
    $('#languagefilter > option').removeAttr("selected");
    $('#languagefilter > option[value="' + $(this).html() + '"]').attr("selected", "selected");
    $('select').formSelect();
    $('#languagefilter').trigger('change');
  });

  // wrap hrefs around the tag listings for each project
  // so when clicked they can fire off a filter on that tag
  $('.project-tags').each(function(i) {
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
  
  // default sort is by github stars - trigger it on load
  $('#gridsort').trigger('change');
  // now make things transparent
  $('.grid-item').removeClass('invisible');
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


