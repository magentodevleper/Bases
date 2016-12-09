/*
 *  jQuery OwlCarousel v1.3.3
 *
 *  Copyright (c) 2013 Bartosz Wojciechowski
 *  http://www.owlgraphic.com/owlcarousel/
 *
 *  Licensed under MIT
 *
 */

/*JS Lint helpers: */
/*global dragMove: false, dragEnd: false, $, jQuery, alert, window, document */
/*jslint nomen: true, continue:true */

if (typeof Object.create !== "function") {
    Object.create = function (obj) {
        function F() {}
        F.prototype = obj;
        return new F();
    };
}
(function ($, window, document) {

    var Carousel = {
        init : function (options, el) {
            var Base = this;

            Base.$elem = $(el);
            Base.options = $.extend({}, $.fn.owlCarousel.options, Base.$elem.data(), options);

            Base.userOptions = options;
            Base.loadContent();
        },

        loadContent : function () {
            var Base = this, url;

            function getData(data) {
                var i, content = "";
                if (typeof Base.options.jsonSuccess === "function") {
                    Base.options.jsonSuccess.apply(this, [data]);
                } else {
                    for (i in data.owl) {
                        if (data.owl.hasOwnProperty(i)) {
                            content += data.owl[i].item;
                        }
                    }
                    Base.$elem.html(content);
                }
                Base.logIn();
            }

            if (typeof Base.options.beforeInit === "function") {
                Base.options.beforeInit.apply(this, [Base.$elem]);
            }

            if (typeof Base.options.jsonPath === "string") {
                url = Base.options.jsonPath;
                $.getJSON(url, getData);
            } else {
                Base.logIn();
            }
        },

        logIn : function () {
            var Base = this;

            Base.$elem.data("owl-originalStyles", Base.$elem.attr("style"));
            Base.$elem.data("owl-originalClasses", Base.$elem.attr("class"));

            Base.$elem.css({opacity: 0});
            Base.orignalItems = Base.options.items;
            Base.checkBrowser();
            Base.wrapperWidth = 0;
            Base.checkVisible = null;
            Base.setVars();
        },

        setVars : function () {
            var Base = this;
            if (Base.$elem.children().length === 0) {return false; }
            Base.BaseClass();
            Base.eventTypes();
            Base.$userItems = Base.$elem.children();
            Base.itemsAmount = Base.$userItems.length;
            Base.wrapItems();
            Base.$owlItems = Base.$elem.find(".owl-item");
            Base.$owlWrapper = Base.$elem.find(".owl-wrapper");
            Base.playDirection = "next";
            Base.prevItem = 0;
            Base.prevArr = [0];
            Base.currentItem = 0;
            Base.customEvents();
            Base.onStartup();
        },

        onStartup : function () {
            var Base = this;
            Base.updateItems();
            Base.calculateAll();
            Base.buildControls();
            Base.updateControls();
            Base.response();
            Base.moveEvents();
            Base.stopOnHover();
            Base.owlStatus();

            if (Base.options.transitionStyle !== false) {
                Base.transitionTypes(Base.options.transitionStyle);
            }
            if (Base.options.autoPlay === true) {
                Base.options.autoPlay = 5000;
            }
            Base.play();

            Base.$elem.find(".owl-wrapper").css("display", "block");

            if (!Base.$elem.is(":visible")) {
                Base.watchVisibility();
            } else {
                Base.$elem.css("opacity", 1);
            }
            Base.onstartup = false;
            Base.eachMoveUpdate();
            if (typeof Base.options.afterInit === "function") {
                Base.options.afterInit.apply(this, [Base.$elem]);
            }
        },

        eachMoveUpdate : function () {
            var Base = this;

            if (Base.options.lazyLoad === true) {
                Base.lazyLoad();
            }
            if (Base.options.autoHeight === true) {
                Base.autoHeight();
            }
            Base.onVisibleItems();

            if (typeof Base.options.afterAction === "function") {
                Base.options.afterAction.apply(this, [Base.$elem]);
            }
        },

        updateVars : function () {
            var Base = this;
            if (typeof Base.options.beforeUpdate === "function") {
                Base.options.beforeUpdate.apply(this, [Base.$elem]);
            }
            Base.watchVisibility();
            Base.updateItems();
            Base.calculateAll();
            Base.updatePosition();
            Base.updateControls();
            Base.eachMoveUpdate();
            if (typeof Base.options.afterUpdate === "function") {
                Base.options.afterUpdate.apply(this, [Base.$elem]);
            }
        },

        reload : function () {
            var Base = this;
            window.setTimeout(function () {
                Base.updateVars();
            }, 0);
        },

        watchVisibility : function () {
            var Base = this;

            if (Base.$elem.is(":visible") === false) {
                Base.$elem.css({opacity: 0});
                window.clearInterval(Base.autoPlayInterval);
                window.clearInterval(Base.checkVisible);
            } else {
                return false;
            }
            Base.checkVisible = window.setInterval(function () {
                if (Base.$elem.is(":visible")) {
                    Base.reload();
                    Base.$elem.animate({opacity: 1}, 200);
                    window.clearInterval(Base.checkVisible);
                }
            }, 500);
        },

        wrapItems : function () {
            var Base = this;
            Base.$userItems.wrapAll("<div class=\"owl-wrapper\">").wrap("<div class=\"owl-item\"></div>");
            Base.$elem.find(".owl-wrapper").wrap("<div class=\"owl-wrapper-outer\">");
            Base.wrapperOuter = Base.$elem.find(".owl-wrapper-outer");
            Base.$elem.css("display", "block");
        },

        BaseClass : function () {
            var Base = this,
                hasBaseClass = Base.$elem.hasClass(Base.options.BaseClass),
                hasThemeClass = Base.$elem.hasClass(Base.options.theme);

            if (!hasBaseClass) {
                Base.$elem.addClass(Base.options.BaseClass);
            }

            if (!hasThemeClass) {
                Base.$elem.addClass(Base.options.theme);
            }
        },

        updateItems : function () {
            var Base = this, width, i;

            if (Base.options.responsive === false) {
                return false;
            }
            if (Base.options.singleItem === true) {
                Base.options.items = Base.orignalItems = 1;
                Base.options.itemsCustom = false;
                Base.options.itemsDesktop = false;
                Base.options.itemsDesktopSmall = false;
                Base.options.itemsTablet = false;
                Base.options.itemsTabletSmall = false;
                Base.options.itemsMobile = false;
                return false;
            }

            width = $(Base.options.responsiveBaseWidth).width();

            if (width > (Base.options.itemsDesktop[0] || Base.orignalItems)) {
                Base.options.items = Base.orignalItems;
            }
            if (Base.options.itemsCustom !== false) {
                //Reorder array by screen size
                Base.options.itemsCustom.sort(function (a, b) {return a[0] - b[0]; });

                for (i = 0; i < Base.options.itemsCustom.length; i += 1) {
                    if (Base.options.itemsCustom[i][0] <= width) {
                        Base.options.items = Base.options.itemsCustom[i][1];
                    }
                }

            } else {

                if (width <= Base.options.itemsDesktop[0] && Base.options.itemsDesktop !== false) {
                    Base.options.items = Base.options.itemsDesktop[1];
                }

                if (width <= Base.options.itemsDesktopSmall[0] && Base.options.itemsDesktopSmall !== false) {
                    Base.options.items = Base.options.itemsDesktopSmall[1];
                }

                if (width <= Base.options.itemsTablet[0] && Base.options.itemsTablet !== false) {
                    Base.options.items = Base.options.itemsTablet[1];
                }

                if (width <= Base.options.itemsTabletSmall[0] && Base.options.itemsTabletSmall !== false) {
                    Base.options.items = Base.options.itemsTabletSmall[1];
                }

                if (width <= Base.options.itemsMobile[0] && Base.options.itemsMobile !== false) {
                    Base.options.items = Base.options.itemsMobile[1];
                }
            }

            //if number of items is less than declared
            if (Base.options.items > Base.itemsAmount && Base.options.itemsScaleUp === true) {
                Base.options.items = Base.itemsAmount;
            }
        },

        response : function () {
            var Base = this,
                smallDelay,
                lastWindowWidth;

            if (Base.options.responsive !== true) {
                return false;
            }
            lastWindowWidth = $(window).width();

            Base.resizer = function () {
                if ($(window).width() !== lastWindowWidth) {
                    if (Base.options.autoPlay !== false) {
                        window.clearInterval(Base.autoPlayInterval);
                    }
                    window.clearTimeout(smallDelay);
                    smallDelay = window.setTimeout(function () {
                        lastWindowWidth = $(window).width();
                        Base.updateVars();
                    }, Base.options.responsiveRefreshRate);
                }
            };
            $(window).resize(Base.resizer);
        },

        updatePosition : function () {
            var Base = this;
            Base.jumpTo(Base.currentItem);
            if (Base.options.autoPlay !== false) {
                Base.checkAp();
            }
        },

        appendItemsSizes : function () {
            var Base = this,
                roundPages = 0,
                lastItem = Base.itemsAmount - Base.options.items;

            Base.$owlItems.each(function (index) {
                var $this = $(this);
                $this
                    .css({"width": Base.itemWidth})
                    .data("owl-item", Number(index));

                if (index % Base.options.items === 0 || index === lastItem) {
                    if (!(index > lastItem)) {
                        roundPages += 1;
                    }
                }
                $this.data("owl-roundPages", roundPages);
            });
        },

        appendWrapperSizes : function () {
            var Base = this,
                width = Base.$owlItems.length * Base.itemWidth;

            Base.$owlWrapper.css({
                "width": width * 2,
                "left": 0
            });
            Base.appendItemsSizes();
        },

        calculateAll : function () {
            var Base = this;
            Base.calculateWidth();
            Base.appendWrapperSizes();
            Base.loops();
            Base.max();
        },

        calculateWidth : function () {
            var Base = this;
            Base.itemWidth = Math.round(Base.$elem.width() / Base.options.items);
        },

        max : function () {
            var Base = this,
                maximum = ((Base.itemsAmount * Base.itemWidth) - Base.options.items * Base.itemWidth) * -1;
            if (Base.options.items > Base.itemsAmount) {
                Base.maximumItem = 0;
                maximum = 0;
                Base.maximumPixels = 0;
            } else {
                Base.maximumItem = Base.itemsAmount - Base.options.items;
                Base.maximumPixels = maximum;
            }
            return maximum;
        },

        min : function () {
            return 0;
        },

        loops : function () {
            var Base = this,
                prev = 0,
                elWidth = 0,
                i,
                item,
                roundPageNum;

            Base.positionsInArray = [0];
            Base.pagesInArray = [];

            for (i = 0; i < Base.itemsAmount; i += 1) {
                elWidth += Base.itemWidth;
                Base.positionsInArray.push(-elWidth);

                if (Base.options.scrollPerPage === true) {
                    item = $(Base.$owlItems[i]);
                    roundPageNum = item.data("owl-roundPages");
                    if (roundPageNum !== prev) {
                        Base.pagesInArray[prev] = Base.positionsInArray[i];
                        prev = roundPageNum;
                    }
                }
            }
        },

        buildControls : function () {
            var Base = this;
            if (Base.options.navigation === true || Base.options.pagination === true) {
                Base.owlControls = $("<div class=\"owl-controls\"/>").toggleClass("clickable", !Base.browser.isTouch).appendTo(Base.$elem);
            }
            if (Base.options.pagination === true) {
                Base.buildPagination();
            }
            if (Base.options.navigation === true) {
                Base.buildButtons();
            }
        },

        buildButtons : function () {
            var Base = this,
                buttonsWrapper = $("<div class=\"owl-buttons\"/>");
            Base.owlControls.append(buttonsWrapper);

            Base.buttonPrev = $("<div/>", {
                "class" : "owl-prev",
                "html" : Base.options.navigationText[0] || ""
            });

            Base.buttonNext = $("<div/>", {
                "class" : "owl-next",
                "html" : Base.options.navigationText[1] || ""
            });

            buttonsWrapper
                .append(Base.buttonPrev)
                .append(Base.buttonNext);

            buttonsWrapper.on("touchstart.owlControls mousedown.owlControls", "div[class^=\"owl\"]", function (event) {
                event.preventDefault();
            });

            buttonsWrapper.on("touchend.owlControls mouseup.owlControls", "div[class^=\"owl\"]", function (event) {
                event.preventDefault();
                if ($(this).hasClass("owl-next")) {
                    Base.next();
                } else {
                    Base.prev();
                }
            });
        },

        buildPagination : function () {
            var Base = this;

            Base.paginationWrapper = $("<div class=\"owl-pagination\"/>");
            Base.owlControls.append(Base.paginationWrapper);

            Base.paginationWrapper.on("touchend.owlControls mouseup.owlControls", ".owl-page", function (event) {
                event.preventDefault();
                if (Number($(this).data("owl-page")) !== Base.currentItem) {
                    Base.goTo(Number($(this).data("owl-page")), true);
                }
            });
        },

        updatePagination : function () {
            var Base = this,
                counter,
                lastPage,
                lastItem,
                i,
                paginationButton,
                paginationButtonInner;

            if (Base.options.pagination === false) {
                return false;
            }

            Base.paginationWrapper.html("");

            counter = 0;
            lastPage = Base.itemsAmount - Base.itemsAmount % Base.options.items;

            for (i = 0; i < Base.itemsAmount; i += 1) {
                if (i % Base.options.items === 0) {
                    counter += 1;
                    if (lastPage === i) {
                        lastItem = Base.itemsAmount - Base.options.items;
                    }
                    paginationButton = $("<div/>", {
                        "class" : "owl-page"
                    });
                    paginationButtonInner = $("<span></span>", {
                        "text": Base.options.paginationNumbers === true ? counter : "",
                        "class": Base.options.paginationNumbers === true ? "owl-numbers" : ""
                    });
                    paginationButton.append(paginationButtonInner);

                    paginationButton.data("owl-page", lastPage === i ? lastItem : i);
                    paginationButton.data("owl-roundPages", counter);

                    Base.paginationWrapper.append(paginationButton);
                }
            }
            Base.checkPagination();
        },
        checkPagination : function () {
            var Base = this;
            if (Base.options.pagination === false) {
                return false;
            }
            Base.paginationWrapper.find(".owl-page").each(function () {
                if ($(this).data("owl-roundPages") === $(Base.$owlItems[Base.currentItem]).data("owl-roundPages")) {
                    Base.paginationWrapper
                        .find(".owl-page")
                        .removeClass("active");
                    $(this).addClass("active");
                }
            });
        },

        checkNavigation : function () {
            var Base = this;

            if (Base.options.navigation === false) {
                return false;
            }
            if (Base.options.rewindNav === false) {
                if (Base.currentItem === 0 && Base.maximumItem === 0) {
                    Base.buttonPrev.addClass("disabled");
                    Base.buttonNext.addClass("disabled");
                } else if (Base.currentItem === 0 && Base.maximumItem !== 0) {
                    Base.buttonPrev.addClass("disabled");
                    Base.buttonNext.removeClass("disabled");
                } else if (Base.currentItem === Base.maximumItem) {
                    Base.buttonPrev.removeClass("disabled");
                    Base.buttonNext.addClass("disabled");
                } else if (Base.currentItem !== 0 && Base.currentItem !== Base.maximumItem) {
                    Base.buttonPrev.removeClass("disabled");
                    Base.buttonNext.removeClass("disabled");
                }
            }
        },

        updateControls : function () {
            var Base = this;
            Base.updatePagination();
            Base.checkNavigation();
            if (Base.owlControls) {
                if (Base.options.items >= Base.itemsAmount) {
                    Base.owlControls.hide();
                } else {
                    Base.owlControls.show();
                }
            }
        },

        destroyControls : function () {
            var Base = this;
            if (Base.owlControls) {
                Base.owlControls.remove();
            }
        },

        next : function (speed) {
            var Base = this;

            if (Base.isTransition) {
                return false;
            }

            Base.currentItem += Base.options.scrollPerPage === true ? Base.options.items : 1;
            if (Base.currentItem > Base.maximumItem + (Base.options.scrollPerPage === true ? (Base.options.items - 1) : 0)) {
                if (Base.options.rewindNav === true) {
                    Base.currentItem = 0;
                    speed = "rewind";
                } else {
                    Base.currentItem = Base.maximumItem;
                    return false;
                }
            }
            Base.goTo(Base.currentItem, speed);
        },

        prev : function (speed) {
            var Base = this;

            if (Base.isTransition) {
                return false;
            }

            if (Base.options.scrollPerPage === true && Base.currentItem > 0 && Base.currentItem < Base.options.items) {
                Base.currentItem = 0;
            } else {
                Base.currentItem -= Base.options.scrollPerPage === true ? Base.options.items : 1;
            }
            if (Base.currentItem < 0) {
                if (Base.options.rewindNav === true) {
                    Base.currentItem = Base.maximumItem;
                    speed = "rewind";
                } else {
                    Base.currentItem = 0;
                    return false;
                }
            }
            Base.goTo(Base.currentItem, speed);
        },

        goTo : function (position, speed, drag) {
            var Base = this,
                goToPixel;

            if (Base.isTransition) {
                return false;
            }
            if (typeof Base.options.beforeMove === "function") {
                Base.options.beforeMove.apply(this, [Base.$elem]);
            }
            if (position >= Base.maximumItem) {
                position = Base.maximumItem;
            } else if (position <= 0) {
                position = 0;
            }

            Base.currentItem = Base.owl.currentItem = position;
            if (Base.options.transitionStyle !== false && drag !== "drag" && Base.options.items === 1 && Base.browser.support3d === true) {
                Base.swapSpeed(0);
                if (Base.browser.support3d === true) {
                    Base.transition3d(Base.positionsInArray[position]);
                } else {
                    Base.css2slide(Base.positionsInArray[position], 1);
                }
                Base.afterGo();
                Base.singleItemTransition();
                return false;
            }
            goToPixel = Base.positionsInArray[position];

            if (Base.browser.support3d === true) {
                Base.isCss3Finish = false;

                if (speed === true) {
                    Base.swapSpeed("paginationSpeed");
                    window.setTimeout(function () {
                        Base.isCss3Finish = true;
                    }, Base.options.paginationSpeed);

                } else if (speed === "rewind") {
                    Base.swapSpeed(Base.options.rewindSpeed);
                    window.setTimeout(function () {
                        Base.isCss3Finish = true;
                    }, Base.options.rewindSpeed);

                } else {
                    Base.swapSpeed("slideSpeed");
                    window.setTimeout(function () {
                        Base.isCss3Finish = true;
                    }, Base.options.slideSpeed);
                }
                Base.transition3d(goToPixel);
            } else {
                if (speed === true) {
                    Base.css2slide(goToPixel, Base.options.paginationSpeed);
                } else if (speed === "rewind") {
                    Base.css2slide(goToPixel, Base.options.rewindSpeed);
                } else {
                    Base.css2slide(goToPixel, Base.options.slideSpeed);
                }
            }
            Base.afterGo();
        },

        jumpTo : function (position) {
            var Base = this;
            if (typeof Base.options.beforeMove === "function") {
                Base.options.beforeMove.apply(this, [Base.$elem]);
            }
            if (position >= Base.maximumItem || position === -1) {
                position = Base.maximumItem;
            } else if (position <= 0) {
                position = 0;
            }
            Base.swapSpeed(0);
            if (Base.browser.support3d === true) {
                Base.transition3d(Base.positionsInArray[position]);
            } else {
                Base.css2slide(Base.positionsInArray[position], 1);
            }
            Base.currentItem = Base.owl.currentItem = position;
            Base.afterGo();
        },

        afterGo : function () {
            var Base = this;

            Base.prevArr.push(Base.currentItem);
            Base.prevItem = Base.owl.prevItem = Base.prevArr[Base.prevArr.length - 2];
            Base.prevArr.shift(0);

            if (Base.prevItem !== Base.currentItem) {
                Base.checkPagination();
                Base.checkNavigation();
                Base.eachMoveUpdate();

                if (Base.options.autoPlay !== false) {
                    Base.checkAp();
                }
            }
            if (typeof Base.options.afterMove === "function" && Base.prevItem !== Base.currentItem) {
                Base.options.afterMove.apply(this, [Base.$elem]);
            }
        },

        stop : function () {
            var Base = this;
            Base.apStatus = "stop";
            window.clearInterval(Base.autoPlayInterval);
        },

        checkAp : function () {
            var Base = this;
            if (Base.apStatus !== "stop") {
                Base.play();
            }
        },

        play : function () {
            var Base = this;
            Base.apStatus = "play";
            if (Base.options.autoPlay === false) {
                return false;
            }
            window.clearInterval(Base.autoPlayInterval);
            Base.autoPlayInterval = window.setInterval(function () {
                Base.next(true);
            }, Base.options.autoPlay);
        },

        swapSpeed : function (action) {
            var Base = this;
            if (action === "slideSpeed") {
                Base.$owlWrapper.css(Base.addCssSpeed(Base.options.slideSpeed));
            } else if (action === "paginationSpeed") {
                Base.$owlWrapper.css(Base.addCssSpeed(Base.options.paginationSpeed));
            } else if (typeof action !== "string") {
                Base.$owlWrapper.css(Base.addCssSpeed(action));
            }
        },

        addCssSpeed : function (speed) {
            return {
                "-webkit-transition": "all " + speed + "ms ease",
                "-moz-transition": "all " + speed + "ms ease",
                "-o-transition": "all " + speed + "ms ease",
                "transition": "all " + speed + "ms ease"
            };
        },

        removeTransition : function () {
            return {
                "-webkit-transition": "",
                "-moz-transition": "",
                "-o-transition": "",
                "transition": ""
            };
        },

        doTranslate : function (pixels) {
            return {
                "-webkit-transform": "translate3d(" + pixels + "px, 0px, 0px)",
                "-moz-transform": "translate3d(" + pixels + "px, 0px, 0px)",
                "-o-transform": "translate3d(" + pixels + "px, 0px, 0px)",
                "-ms-transform": "translate3d(" + pixels + "px, 0px, 0px)",
                "transform": "translate3d(" + pixels + "px, 0px,0px)"
            };
        },

        transition3d : function (value) {
            var Base = this;
            Base.$owlWrapper.css(Base.doTranslate(value));
        },

        css2move : function (value) {
            var Base = this;
            Base.$owlWrapper.css({"left" : value});
        },

        css2slide : function (value, speed) {
            var Base = this;

            Base.isCssFinish = false;
            Base.$owlWrapper.stop(true, true).animate({
                "left" : value
            }, {
                duration : speed || Base.options.slideSpeed,
                complete : function () {
                    Base.isCssFinish = true;
                }
            });
        },

        checkBrowser : function () {
            var Base = this,
                translate3D = "translate3d(0px, 0px, 0px)",
                tempElem = document.createElement("div"),
                regex,
                asSupport,
                support3d,
                isTouch;

            tempElem.style.cssText = "  -moz-transform:" + translate3D +
                                  "; -ms-transform:"     + translate3D +
                                  "; -o-transform:"      + translate3D +
                                  "; -webkit-transform:" + translate3D +
                                  "; transform:"         + translate3D;
            regex = /translate3d\(0px, 0px, 0px\)/g;
            asSupport = tempElem.style.cssText.match(regex);
            support3d = (asSupport !== null && asSupport.length === 1);

            isTouch = "ontouchstart" in window || window.navigator.msMaxTouchPoints;

            Base.browser = {
                "support3d" : support3d,
                "isTouch" : isTouch
            };
        },

        moveEvents : function () {
            var Base = this;
            if (Base.options.mouseDrag !== false || Base.options.touchDrag !== false) {
                Base.gestures();
                Base.disabledEvents();
            }
        },

        eventTypes : function () {
            var Base = this,
                types = ["s", "e", "x"];

            Base.ev_types = {};

            if (Base.options.mouseDrag === true && Base.options.touchDrag === true) {
                types = [
                    "touchstart.owl mousedown.owl",
                    "touchmove.owl mousemove.owl",
                    "touchend.owl touchcancel.owl mouseup.owl"
                ];
            } else if (Base.options.mouseDrag === false && Base.options.touchDrag === true) {
                types = [
                    "touchstart.owl",
                    "touchmove.owl",
                    "touchend.owl touchcancel.owl"
                ];
            } else if (Base.options.mouseDrag === true && Base.options.touchDrag === false) {
                types = [
                    "mousedown.owl",
                    "mousemove.owl",
                    "mouseup.owl"
                ];
            }

            Base.ev_types.start = types[0];
            Base.ev_types.move = types[1];
            Base.ev_types.end = types[2];
        },

        disabledEvents :  function () {
            var Base = this;
            Base.$elem.on("dragstart.owl", function (event) { event.preventDefault(); });
            Base.$elem.on("mousedown.disableTextSelect", function (e) {
                return $(e.target).is('input, textarea, select, option');
            });
        },

        gestures : function () {
            /*jslint unparam: true*/
            var Base = this,
                locals = {
                    offsetX : 0,
                    offsetY : 0,
                    BaseElWidth : 0,
                    relativePos : 0,
                    position: null,
                    minSwipe : null,
                    maxSwipe: null,
                    sliding : null,
                    dargging: null,
                    targetElement : null
                };

            Base.isCssFinish = true;

            function getTouches(event) {
                if (event.touches !== undefined) {
                    return {
                        x : event.touches[0].pageX,
                        y : event.touches[0].pageY
                    };
                }

                if (event.touches === undefined) {
                    if (event.pageX !== undefined) {
                        return {
                            x : event.pageX,
                            y : event.pageY
                        };
                    }
                    if (event.pageX === undefined) {
                        return {
                            x : event.clientX,
                            y : event.clientY
                        };
                    }
                }
            }

            function swapEvents(type) {
                if (type === "on") {
                    $(document).on(Base.ev_types.move, dragMove);
                    $(document).on(Base.ev_types.end, dragEnd);
                } else if (type === "off") {
                    $(document).off(Base.ev_types.move);
                    $(document).off(Base.ev_types.end);
                }
            }

            function dragStart(event) {
                var ev = event.originalEvent || event || window.event,
                    position;

                if (ev.which === 3) {
                    return false;
                }
                if (Base.itemsAmount <= Base.options.items) {
                    return;
                }
                if (Base.isCssFinish === false && !Base.options.dragBeforeAnimFinish) {
                    return false;
                }
                if (Base.isCss3Finish === false && !Base.options.dragBeforeAnimFinish) {
                    return false;
                }

                if (Base.options.autoPlay !== false) {
                    window.clearInterval(Base.autoPlayInterval);
                }

                if (Base.browser.isTouch !== true && !Base.$owlWrapper.hasClass("grabbing")) {
                    Base.$owlWrapper.addClass("grabbing");
                }

                Base.newPosX = 0;
                Base.newRelativeX = 0;

                $(this).css(Base.removeTransition());

                position = $(this).position();
                locals.relativePos = position.left;

                locals.offsetX = getTouches(ev).x - position.left;
                locals.offsetY = getTouches(ev).y - position.top;

                swapEvents("on");

                locals.sliding = false;
                locals.targetElement = ev.target || ev.srcElement;
            }

            function dragMove(event) {
                var ev = event.originalEvent || event || window.event,
                    minSwipe,
                    maxSwipe;

                Base.newPosX = getTouches(ev).x - locals.offsetX;
                Base.newPosY = getTouches(ev).y - locals.offsetY;
                Base.newRelativeX = Base.newPosX - locals.relativePos;

                if (typeof Base.options.startDragging === "function" && locals.dragging !== true && Base.newRelativeX !== 0) {
                    locals.dragging = true;
                    Base.options.startDragging.apply(Base, [Base.$elem]);
                }

                if ((Base.newRelativeX > 8 || Base.newRelativeX < -8) && (Base.browser.isTouch === true)) {
                    if (ev.preventDefault !== undefined) {
                        ev.preventDefault();
                    } else {
                        ev.returnValue = false;
                    }
                    locals.sliding = true;
                }

                if ((Base.newPosY > 10 || Base.newPosY < -10) && locals.sliding === false) {
                    $(document).off("touchmove.owl");
                }

                minSwipe = function () {
                    return Base.newRelativeX / 5;
                };

                maxSwipe = function () {
                    return Base.maximumPixels + Base.newRelativeX / 5;
                };

                Base.newPosX = Math.max(Math.min(Base.newPosX, minSwipe()), maxSwipe());
                if (Base.browser.support3d === true) {
                    Base.transition3d(Base.newPosX);
                } else {
                    Base.css2move(Base.newPosX);
                }
            }

            function dragEnd(event) {
                var ev = event.originalEvent || event || window.event,
                    newPosition,
                    handlers,
                    owlStopEvent;

                ev.target = ev.target || ev.srcElement;

                locals.dragging = false;

                if (Base.browser.isTouch !== true) {
                    Base.$owlWrapper.removeClass("grabbing");
                }

                if (Base.newRelativeX < 0) {
                    Base.dragDirection = Base.owl.dragDirection = "left";
                } else {
                    Base.dragDirection = Base.owl.dragDirection = "right";
                }

                if (Base.newRelativeX !== 0) {
                    newPosition = Base.getNewPosition();
                    Base.goTo(newPosition, false, "drag");
                    if (locals.targetElement === ev.target && Base.browser.isTouch !== true) {
                        $(ev.target).on("click.disable", function (ev) {
                            ev.stopImmediatePropagation();
                            ev.stopPropagation();
                            ev.preventDefault();
                            $(ev.target).off("click.disable");
                        });
                        handlers = $._data(ev.target, "events").click;
                        owlStopEvent = handlers.pop();
                        handlers.splice(0, 0, owlStopEvent);
                    }
                }
                swapEvents("off");
            }
            Base.$elem.on(Base.ev_types.start, ".owl-wrapper", dragStart);
        },

        getNewPosition : function () {
            var Base = this,
                newPosition = Base.closestItem();

            if (newPosition > Base.maximumItem) {
                Base.currentItem = Base.maximumItem;
                newPosition  = Base.maximumItem;
            } else if (Base.newPosX >= 0) {
                newPosition = 0;
                Base.currentItem = 0;
            }
            return newPosition;
        },
        closestItem : function () {
            var Base = this,
                array = Base.options.scrollPerPage === true ? Base.pagesInArray : Base.positionsInArray,
                goal = Base.newPosX,
                closest = null;

            $.each(array, function (i, v) {
                if (goal - (Base.itemWidth / 20) > array[i + 1] && goal - (Base.itemWidth / 20) < v && Base.moveDirection() === "left") {
                    closest = v;
                    if (Base.options.scrollPerPage === true) {
                        Base.currentItem = $.inArray(closest, Base.positionsInArray);
                    } else {
                        Base.currentItem = i;
                    }
                } else if (goal + (Base.itemWidth / 20) < v && goal + (Base.itemWidth / 20) > (array[i + 1] || array[i] - Base.itemWidth) && Base.moveDirection() === "right") {
                    if (Base.options.scrollPerPage === true) {
                        closest = array[i + 1] || array[array.length - 1];
                        Base.currentItem = $.inArray(closest, Base.positionsInArray);
                    } else {
                        closest = array[i + 1];
                        Base.currentItem = i + 1;
                    }
                }
            });
            return Base.currentItem;
        },

        moveDirection : function () {
            var Base = this,
                direction;
            if (Base.newRelativeX < 0) {
                direction = "right";
                Base.playDirection = "next";
            } else {
                direction = "left";
                Base.playDirection = "prev";
            }
            return direction;
        },

        customEvents : function () {
            /*jslint unparam: true*/
            var Base = this;
            Base.$elem.on("owl.next", function () {
                Base.next();
            });
            Base.$elem.on("owl.prev", function () {
                Base.prev();
            });
            Base.$elem.on("owl.play", function (event, speed) {
                Base.options.autoPlay = speed;
                Base.play();
                Base.hoverStatus = "play";
            });
            Base.$elem.on("owl.stop", function () {
                Base.stop();
                Base.hoverStatus = "stop";
            });
            Base.$elem.on("owl.goTo", function (event, item) {
                Base.goTo(item);
            });
            Base.$elem.on("owl.jumpTo", function (event, item) {
                Base.jumpTo(item);
            });
        },

        stopOnHover : function () {
            var Base = this;
            if (Base.options.stopOnHover === true && Base.browser.isTouch !== true && Base.options.autoPlay !== false) {
                Base.$elem.on("mouseover", function () {
                    Base.stop();
                });
                Base.$elem.on("mouseout", function () {
                    if (Base.hoverStatus !== "stop") {
                        Base.play();
                    }
                });
            }
        },

        lazyLoad : function () {
            var Base = this,
                i,
                $item,
                itemNumber,
                $lazyImg,
                follow;

            if (Base.options.lazyLoad === false) {
                return false;
            }
            for (i = 0; i < Base.itemsAmount; i += 1) {
                $item = $(Base.$owlItems[i]);

                if ($item.data("owl-loaded") === "loaded") {
                    continue;
                }

                itemNumber = $item.data("owl-item");
                $lazyImg = $item.find(".lazyOwl");

                if (typeof $lazyImg.data("src") !== "string") {
                    $item.data("owl-loaded", "loaded");
                    continue;
                }
                if ($item.data("owl-loaded") === undefined) {
                    $lazyImg.hide();
                    $item.addClass("loading").data("owl-loaded", "checked");
                }
                if (Base.options.lazyFollow === true) {
                    follow = itemNumber >= Base.currentItem;
                } else {
                    follow = true;
                }
                if (follow && itemNumber < Base.currentItem + Base.options.items && $lazyImg.length) {
                    Base.lazyPreload($item, $lazyImg);
                }
            }
        },

        lazyPreload : function ($item, $lazyImg) {
            var Base = this,
                iterations = 0,
                isBackgroundImg;

            if ($lazyImg.prop("tagName") === "DIV") {
                $lazyImg.css("background-image", "url(" + $lazyImg.data("src") + ")");
                isBackgroundImg = true;
            } else {
                $lazyImg[0].src = $lazyImg.data("src");
            }

            function showImage() {
                $item.data("owl-loaded", "loaded").removeClass("loading");
                $lazyImg.removeAttr("data-src");
                if (Base.options.lazyEffect === "fade") {
                    $lazyImg.fadeIn(400);
                } else {
                    $lazyImg.show();
                }
                if (typeof Base.options.afterLazyLoad === "function") {
                    Base.options.afterLazyLoad.apply(this, [Base.$elem]);
                }
            }

            function checkLazyImage() {
                iterations += 1;
                if (Base.completeImg($lazyImg.get(0)) || isBackgroundImg === true) {
                    showImage();
                } else if (iterations <= 100) {//if image loads in less than 10 seconds 
                    window.setTimeout(checkLazyImage, 100);
                } else {
                    showImage();
                }
            }

            checkLazyImage();
        },

        autoHeight : function () {
            var Base = this,
                $currentimg = $(Base.$owlItems[Base.currentItem]).find("img"),
                iterations;

            function addHeight() {
                var $currentItem = $(Base.$owlItems[Base.currentItem]).height();
                Base.wrapperOuter.css("height", $currentItem + "px");
                if (!Base.wrapperOuter.hasClass("autoHeight")) {
                    window.setTimeout(function () {
                        Base.wrapperOuter.addClass("autoHeight");
                    }, 0);
                }
            }

            function checkImage() {
                iterations += 1;
                if (Base.completeImg($currentimg.get(0))) {
                    addHeight();
                } else if (iterations <= 100) { //if image loads in less than 10 seconds 
                    window.setTimeout(checkImage, 100);
                } else {
                    Base.wrapperOuter.css("height", ""); //Else remove height attribute
                }
            }

            if ($currentimg.get(0) !== undefined) {
                iterations = 0;
                checkImage();
            } else {
                addHeight();
            }
        },

        completeImg : function (img) {
            var naturalWidthType;

            if (!img.complete) {
                return false;
            }
            naturalWidthType = typeof img.naturalWidth;
            if (naturalWidthType !== "undefined" && img.naturalWidth === 0) {
                return false;
            }
            return true;
        },

        onVisibleItems : function () {
            var Base = this,
                i;

            if (Base.options.addClassActive === true) {
                Base.$owlItems.removeClass("active");
            }
            Base.visibleItems = [];
            for (i = Base.currentItem; i < Base.currentItem + Base.options.items; i += 1) {
                Base.visibleItems.push(i);

                if (Base.options.addClassActive === true) {
                    $(Base.$owlItems[i]).addClass("active");
                }
            }
            Base.owl.visibleItems = Base.visibleItems;
        },

        transitionTypes : function (className) {
            var Base = this;
            //Currently available: "fade", "backSlide", "goDown", "fadeUp"
            Base.outClass = "owl-" + className + "-out";
            Base.inClass = "owl-" + className + "-in";
        },

        singleItemTransition : function () {
            var Base = this,
                outClass = Base.outClass,
                inClass = Base.inClass,
                $currentItem = Base.$owlItems.eq(Base.currentItem),
                $prevItem = Base.$owlItems.eq(Base.prevItem),
                prevPos = Math.abs(Base.positionsInArray[Base.currentItem]) + Base.positionsInArray[Base.prevItem],
                origin = Math.abs(Base.positionsInArray[Base.currentItem]) + Base.itemWidth / 2,
                animEnd = 'webkitAnimationEnd oAnimationEnd MSAnimationEnd animationend';

            Base.isTransition = true;

            Base.$owlWrapper
                .addClass('owl-origin')
                .css({
                    "-webkit-transform-origin" : origin + "px",
                    "-moz-perspective-origin" : origin + "px",
                    "perspective-origin" : origin + "px"
                });
            function transStyles(prevPos) {
                return {
                    "position" : "relative",
                    "left" : prevPos + "px"
                };
            }

            $prevItem
                .css(transStyles(prevPos, 10))
                .addClass(outClass)
                .on(animEnd, function () {
                    Base.endPrev = true;
                    $prevItem.off(animEnd);
                    Base.clearTransStyle($prevItem, outClass);
                });

            $currentItem
                .addClass(inClass)
                .on(animEnd, function () {
                    Base.endCurrent = true;
                    $currentItem.off(animEnd);
                    Base.clearTransStyle($currentItem, inClass);
                });
        },

        clearTransStyle : function (item, classToRemove) {
            var Base = this;
            item.css({
                "position" : "",
                "left" : ""
            }).removeClass(classToRemove);

            if (Base.endPrev && Base.endCurrent) {
                Base.$owlWrapper.removeClass('owl-origin');
                Base.endPrev = false;
                Base.endCurrent = false;
                Base.isTransition = false;
            }
        },

        owlStatus : function () {
            var Base = this;
            Base.owl = {
                "userOptions"   : Base.userOptions,
                "BaseElement"   : Base.$elem,
                "userItems"     : Base.$userItems,
                "owlItems"      : Base.$owlItems,
                "currentItem"   : Base.currentItem,
                "prevItem"      : Base.prevItem,
                "visibleItems"  : Base.visibleItems,
                "isTouch"       : Base.browser.isTouch,
                "browser"       : Base.browser,
                "dragDirection" : Base.dragDirection
            };
        },

        clearEvents : function () {
            var Base = this;
            Base.$elem.off(".owl owl mousedown.disableTextSelect");
            $(document).off(".owl owl");
            $(window).off("resize", Base.resizer);
        },

        unWrap : function () {
            var Base = this;
            if (Base.$elem.children().length !== 0) {
                Base.$owlWrapper.unwrap();
                Base.$userItems.unwrap().unwrap();
                if (Base.owlControls) {
                    Base.owlControls.remove();
                }
            }
            Base.clearEvents();
            Base.$elem
                .attr("style", Base.$elem.data("owl-originalStyles") || "")
                .attr("class", Base.$elem.data("owl-originalClasses"));
        },

        destroy : function () {
            var Base = this;
            Base.stop();
            window.clearInterval(Base.checkVisible);
            Base.unWrap();
            Base.$elem.removeData();
        },

        reinit : function (newOptions) {
            var Base = this,
                options = $.extend({}, Base.userOptions, newOptions);
            Base.unWrap();
            Base.init(options, Base.$elem);
        },

        addItem : function (htmlString, targetPosition) {
            var Base = this,
                position;

            if (!htmlString) {return false; }

            if (Base.$elem.children().length === 0) {
                Base.$elem.append(htmlString);
                Base.setVars();
                return false;
            }
            Base.unWrap();
            if (targetPosition === undefined || targetPosition === -1) {
                position = -1;
            } else {
                position = targetPosition;
            }
            if (position >= Base.$userItems.length || position === -1) {
                Base.$userItems.eq(-1).after(htmlString);
            } else {
                Base.$userItems.eq(position).before(htmlString);
            }

            Base.setVars();
        },

        removeItem : function (targetPosition) {
            var Base = this,
                position;

            if (Base.$elem.children().length === 0) {
                return false;
            }
            if (targetPosition === undefined || targetPosition === -1) {
                position = -1;
            } else {
                position = targetPosition;
            }

            Base.unWrap();
            Base.$userItems.eq(position).remove();
            Base.setVars();
        }

    };

    $.fn.owlCarousel = function (options) {
        return this.each(function () {
            if ($(this).data("owl-init") === true) {
                return false;
            }
            $(this).data("owl-init", true);
            var carousel = Object.create(Carousel);
            carousel.init(options, this);
            $.data(this, "owlCarousel", carousel);
        });
    };

    $.fn.owlCarousel.options = {

        items : 5,
        itemsCustom : false,
        itemsDesktop : [1199, 4],
        itemsDesktopSmall : [979, 3],
        itemsTablet : [768, 2],
        itemsTabletSmall : false,
        itemsMobile : [479, 1],
        singleItem : false,
        itemsScaleUp : false,

        slideSpeed : 200,
        paginationSpeed : 800,
        rewindSpeed : 1000,

        autoPlay : false,
        stopOnHover : false,

        navigation : false,
        navigationText : ["prev", "next"],
        rewindNav : true,
        scrollPerPage : false,

        pagination : true,
        paginationNumbers : false,

        responsive : true,
        responsiveRefreshRate : 200,
        responsiveBaseWidth : window,

        BaseClass : "owl-carousel",
        theme : "owl-theme",

        lazyLoad : false,
        lazyFollow : true,
        lazyEffect : "fade",

        autoHeight : false,

        jsonPath : false,
        jsonSuccess : false,

        dragBeforeAnimFinish : true,
        mouseDrag : true,
        touchDrag : true,

        addClassActive : false,
        transitionStyle : false,

        beforeUpdate : false,
        afterUpdate : false,
        beforeInit : false,
        afterInit : false,
        beforeMove : false,
        afterMove : false,
        afterAction : false,
        startDragging : false,
        afterLazyLoad: false
    };
}(window.Zepto || window.jQuery || window.jquery || jQuery, window, document));