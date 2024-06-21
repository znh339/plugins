(function () {
  "use strict";
  var tmdbApiUrl = "https://api.themoviedb.org/3/";
  var kp_prox = "https://cors.apn.monster/";
  var urlEndTMDB = "?language=en-US&api_key=4ef0d7355d9ffb5151e987764708ce96";
  var namemovie;
  var www;
  var ew;
  var year;
  var url;
  
	function reazkaParseHtmlDom(url, name, year, onSuccess, onError) {
	  var xhr = new XMLHttpRequest();
	  var fullUrl = kp_prox + url + (name ? name : "") + (year ? "+" + year : "");
	  xhr.open('GET', fullUrl, true);
	  xhr.onload = function() {
		if (xhr.status === 200) {
		  var doc = new DOMParser().parseFromString(xhr.responseText, 'text/html');
		  onSuccess(doc);
		} else {
		  onError(xhr.status);
		}
	  };
	  xhr.onerror = function() {
		onError(xhr.status);
	  };
	  xhr.send();
	}
	
	var cleanTitle = function (str) {
		return str.replace(/[\s.,:;''`!?]+/g, "%20").trim();
	};
  
	var normalizeTitle = function (str) {
		return cleanTitle(
		  str
			.toLowerCase()
			.replace(/[\-\u2010-\u2015\u2E3A\u2E3B\uFE58\uFE63\uFF0D]+/g, "-")
			.replace(/ё/g, "е")
		);
	};
  
	var searchRezka = function(name, year) {
	  reazkaParseHtmlDom(
		"https://hdrezka.ag/search/?do=search&subaction=search&q=",
		name,
		year,
		function(dom) { // onSuccess callback for the first reazkaParseHtmlDom call
		  var arr = Array.prototype.slice.call(
			dom.getElementsByClassName("b-content__inline_item-link")
		  );
		  var url = arr[0].children[0].href;

		  reazkaParseHtmlDom(url, "", "", function(dom) { // onSuccess callback for the second reazkaParseHtmlDom call
			var arr = Array.prototype.slice.call(dom.getElementsByClassName("b-post__partcontent_item"));
			collectRender(arr);
		  }, function(status) { // onError callback for the second reazkaParseHtmlDom call
			console.error('Error fetching content: ', status);
		  });
		},
		function(status) { // onError callback for the first reazkaParseHtmlDom call
		  console.error('Error fetching search results: ', status);
		}
	  );
	};


  var collectRender = function (data) {
    var www = "";
    var franchiseTitle = $("<h2>Франшиза</h2>");
    franchiseTitle.css({
	  "font-size": "1.6em",
	  "font-weight": "400"
	});
    var wid;
	
    data.forEach(function(el, index) {
        if (el.className.indexOf("current") !== -1) {
            wid = index;
			//$('.current').removeClass('current')
			//$('.collectionfocus').removeClass('collectionfocus selector')
        }
    });

    data.forEach(function(el, index) {
        www += "<div id=\"search" + el.children[0].innerText + "\" class=\"stringhide selector " + el.className;
        if (wid + 2 >= index && index >= wid - 2) {
            www += " show";
        } else {
            www += " hide hdhd";
        }
        www += "\"><span class=\"" + el.children[0].className + "\">" + el.children[0].innerText + "</span><span class=\"" + el.children[1].className + "\">" + el.children[1].innerText + "</span><span class=\"" + el.children[1].className + "\">";
        if ($("a", el.children[1]).attr("href")) {
            www += Lampa.Lang.translate($("a", el.children[1]).attr("href").split("/")[3]);
        } else {
            www += "";
        }
        www += "</span><span class=\"" + el.children[2].className + "\">" + el.children[2].innerText + "</span><span class=\"" + el.children[3].className + "\"><i class=\"hd-tooltip tooltipstered\">" + el.children[3].innerText + "</i></span></div>";
    });
    

    var collect = $("<div id=\"collect\" class=\"collection selector collectionfocus\" style='display: table;width: 100%;'>" + www + "</div>");

    $(".collection").remove();
    $(".full-descr__text").after(collect);
    $(".full-descr__text").after(franchiseTitle);
    

    $("#collect").ready(function () {
        $(".collectionfocus").on("hover:enter", function() {
            $(".hdhd").removeClass("hide");
            $("#collect").removeClass("collectionfocus selector");

            $(".b-post__partcontent_item").on("hover:enter", function(e) {
                var input = $(this).children()[1].innerText.split("/")[0].trim().replace(/\s+$/, "");
                Lampa.Search.open({
                    input: input
                });
            });
        });
    });
};


	var getEnTitle = function (id, type) {
		var url;

		if (type === "movie") {
			url = kp_prox + tmdbApiUrl + "movie/" + id + urlEndTMDB;
		} else {
			url = kp_prox + tmdbApiUrl + "tv/" + id + urlEndTMDB;
		}

		ennTitle(url);
	};
	
	var ennTitle = function (url) {
	  var enTitle;
	  var xhr = new XMLHttpRequest();
	  xhr.open('GET', url, true);
	  xhr.onreadystatechange = function () {
		if (xhr.readyState === 4 && xhr.status === 200) {
		  var response = JSON.parse(xhr.responseText);
		  enTitle = response.title || response.name;
		  searchRezka(normalizeTitle(enTitle), year);
		}
	  };
	  xhr.send();
	};

  // Функция для начала работы плагина
  var startPlugin = function () {
    window.rezkacoll_plugin = true;
    Lampa.Listener.follow("full", function (e) {
      if (e.type == "complite") {
        Lampa.Lang.add({
          films: {
            ru: "Фильм",
            uk: "Фільм",
            en: "Film",
            be: "Фільм",
          },
          series: {
            ru: "Сериал",
            uk: "Серіал",
            en: "Series",
            be: "Серыял",
          },
          cartoons: {
            ru: "Мультфильм",
            uk: "Мультфільм",
            en: "Cartoon",
            be: "Мультфільм",
          },
          animation: {
            ru: "Аниме",
            uk: "Аніме",
            en: "Anime",
            be: "Анімэ",
          },
        });

        if (e.data.movie.release_date) {
          year = e.data.movie.release_date.slice(0, 4);
        } else if (e.data.movie.first_air) {
          year = e.data.movie.first_air.slice(0, 4);
        } else {
          year = "";
        }

        namemovie = e.data.movie.title || e.data.movie.name;

        getEnTitle(e.data.movie.id, e.object.method);

        var styleEl = document.createElement("style");
        styleEl.setAttribute("type", "text/css");
		styleEl.innerHTML = '.searchfr{border-radius: 100%;}' +
							'.td{display:table-cell;border-bottom:2.5px solid rgba(255,255,255,.1);color:rgba(255,255,255);padding:9 10px;font-size: 12.2px;}.collection{display:table;width:90%;}.collectionfocus{}.collectionfocus.focus{outline:outset #FFF;}.rating{text-align:center;width:4em;font-size:1.3em}.year{width:8em;text-align:right;font-size:1.3em}.title{text-align:left;font-size:1.3em}.num{text-align:center;width:3em;font-size:1.3em}' +
							'.b-post__partcontent_item{display:table-row;width:90%;}' +
							'.searchfr.focus{background-color:#fff;color:#000;}' +
							'.b-post__partcontent_item:hover{background-color:#ffffff11;}' +
							'.focus{background-color:#ffffff11;}' +
							'.stringhide.focus{box-shadow: 0 0 0 0.2em #ffffff}' +
							'.current{background-color:#ffffff1f;}.show{visibility:visible;}.hide{visibility:hidden;}';
        
        //
        document.head.appendChild(styleEl);
		setTimeout(function(){
			$('.current').removeClass('current')
			$('.collectionfocus').removeClass('selector')
			if (Navigator.canmove('right')) Navigator.move('right');
			if (Navigator.canmove('left')) Navigator.move('left');
				$(".stringhide.selector.b-post__partcontent_item.show").on("hover:enter", function(e) {
					var input = $(this).children()[1].innerText.split("/")[0].trim().replace(/\s+$/, "");
					Lampa.Search.open({
						input: input
					});
				});
		}, 2000)
      }
    });
  };

  if (!window.rezkacoll_plugin) startPlugin();
})();
