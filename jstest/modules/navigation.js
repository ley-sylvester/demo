"use strict";

window.LiveLabsNavigation = (function () {
    const extendedNav = { "#last": 2, "#next": 1, "#prev": -1, "#first": -2 };

    let deps = {
        manifest: null,
        getParam: null,
        setParam: null,
        alphaNumOnly: null,
        include: null,
        singlesource: null,
        queryParam: "lab",
        navParamName: "nav",
        relatedPath: "",
        createShortNameFromTitle: null,
        expandSection: null,
        changeButtonState: null,
        expandSectionBasedOnHash: null
    };

    let selectedTutorial = null;
    let scrollBound = false;
    let hashBound = false;

    function initNavigation(config) {
        deps = Object.assign({}, deps, config || {});
        if (config && config.manifest) {
            deps.manifest = config.manifest;
        }
        selectedTutorial = null;

        if (!deps.manifest) {
            return createApi();
        }

        cleanupNavigationShell();

        selectedTutorial = setupTutorialNav(deps.manifest);
        prepareToc(deps.manifest);
        setupRelatedSection(deps.manifest);
        bindScrollHandler();
        bindHashChange();
        bindToggleControl();
        handleInitialNavigationState();

        return createApi();
    }

    function createApi() {
        return {
            getInitialTutorial: function () {
                if (selectedTutorial) {
                    return selectedTutorial;
                }
                if (deps.manifest && deps.manifest.tutorials && deps.manifest.tutorials.length) {
                    return deps.manifest.tutorials[0];
                }
                return null;
            },
            getToggleHandler: function () {
                return toggleTutorialNav;
            },
            showRightAndLeftArrow: function (articleElement, manifestFileContent) {
                return _showRightAndLeftArrow(articleElement, manifestFileContent || deps.manifest);
            },
            selectTutorial: function (manifestFileContent, position) {
                return selectTutorial(manifestFileContent || deps.manifest, position);
            },
            updateManifest: function (manifestFileContent) {
                deps.manifest = manifestFileContent;
            }
        };
    }

    function cleanupNavigationShell() {
        $('#leftNav-toc').remove();
        $('#leftNav .hol-Nav-list').remove();
    }

    function toggleTutorialNav() {
        let navParam = deps.getParam ? deps.getParam(deps.navParamName) : null;

        if (!navParam || navParam === 'open') {
            $('.hol-Nav-list > li:not(.selected)').attr('tabindex', '0');
            $('#leftNav-toc, #leftNav, #contentBox').addClass('open').removeClass('close');
        } else if (navParam === 'close') {
            $('.hol-Nav-list > li:not(.selected)').attr('tabindex', '-1');
            $('#leftNav-toc, #leftNav, #contentBox').addClass('close').removeClass('open');
        }
        setTimeout(function () {
            $(window).scroll();
        }, 100);
    }

    function setupTutorialNav(manifestFileContent) {
        let div = $(document.createElement('div')).attr('id', 'leftNav-toc');
        let ul = $(document.createElement('ul')).addClass('hol-Nav-list');

        $(manifestFileContent.tutorials).each(function (i, tutorial) {
            let fileName = getMDFileName(tutorial.filename);

            $(document.createElement('li')).each(function () {
                $(this).click(function (e) {
                    if (!$(e.target).hasClass('arrow') && !$(e.target).hasClass('toc-item') && !$(e.target).hasClass('toc-item active')) {
                        if ($(e.target).parent().parent().hasClass('selected') || $(e.target).hasClass('selected')) {
                            try {
                                $('.selected .arrow').click();
                            } catch (err) { console.debug('Nav click error:', err); }
                        } else {
                            changeTutorial(fileName);
                        }
                    }
                });
                $(this).attr('id', getLabNavID(fileName));
                $(this).text(tutorial.title).wrapInner("<a href=\"" + unescape(callSetParam(window.location.href, deps.queryParam, getMDFileName(tutorial.filename))) + "\"><div></div></a>");
                $(this).appendTo(ul);

                $(this).keydown(function (e) {
                    if (e.keyCode === 13 || e.keyCode === 32) {
                        e.preventDefault();
                        changeTutorial(fileName);
                    }
                });
            });
        });

        $(ul).appendTo(div);
        $(div).appendTo('#leftNav');
        return selectTutorial(manifestFileContent);
    }

    function getMDFileName(fileName) {
        return fileName.split('/')[fileName.split('/').length - 1].replace('.md', '');
    }

    function getLabNavID(fileName, prefix = 'tut-') {
        return prefix + getMDFileName(fileName.toString()).replace(/[\(\)]+?/g, '').replace('.md', '');
    }

    function selectTutorial(manifestFileContent, position = 0) {
        if (!manifestFileContent) {
            return null;
        }

        $('#' + getLabNavID(callGetParam(deps.queryParam))).addClass('selected');
        $('.selected').find('a').contents().unwrap();
        $('.selected').unbind('keydown');

        if (position === -2) return manifestFileContent.tutorials[0];
        if (position === 2) return manifestFileContent.tutorials[manifestFileContent.tutorials.length - 1];

        for (let i = 0; i < manifestFileContent.tutorials.length; i++) {
            if (callGetParam(deps.queryParam) === getMDFileName(manifestFileContent.tutorials[i].filename))
                return manifestFileContent.tutorials[i + position];
        }

        for (let i = 0; i < manifestFileContent.tutorials.length; i++) {
            if (deps.createShortNameFromTitle &&
                callGetParam(deps.queryParam) === deps.createShortNameFromTitle(manifestFileContent.tutorials[i].title)) {
                changeTutorial(getMDFileName(manifestFileContent.tutorials[i].filename), window.location.hash.substr(1));
                return;
            }
        }

        $('.hol-Nav-list').find('li:eq(0)').addClass("selected");
        return manifestFileContent.tutorials[0 + position];
    }

    function changeTutorial(fileName, anchor = "") {
        if (anchor !== "") anchor = '#' + anchor;
        location.href = unescape(callSetParam(window.location.href, deps.queryParam, fileName) + anchor);
    }

    function arrowClick() {
        if ($(this).text() === '-') {
            $(this).next().next().fadeOut('fast', function () {
                $(window).scroll();
            });
            $(this).text('+');
        } else {
            $(this).next().next().fadeIn('fast', function () {
                $(window).scroll();
            });
            $(this).text('-');
        }
    }

    function setupRelatedSection(manifestFileContent) {
        const maxRelated = 5;
        let relatedItems = [];
        if (!manifestFileContent || !('show_related' in manifestFileContent)) {
            return;
        }

        $(manifestFileContent.show_related).each(function (i, item) {
            if (!('filename' in item) || !('tags' in item) || !('title' in item)) {
                return;
            }
            $.getJSON(deps.relatedPath + item.filename, function (content) {
                relatedItems[i] = $(document.createElement('li')).attr('id', 'related-content-' + i).css({
                    'border-bottom': '0px',
                    'padding-left': '36px',
                    'cursor': 'default',
                    'background-color': 'rgb(0,0,0,0.06)'
                });

                let divMain = $(document.createElement('div'));
                let link = $(document.createElement('a')).css('cursor', 'pointer');
                let arrow;
                let div;

                $(link).click(function () {
                    $(this).prev().click();
                });
                $(link).append($(document.createElement('div')).text(item.title).css({ 'font-weight': '600' }));
                $(divMain).append(link);
                $(relatedItems[i]).append(divMain);
                div = $(document.createElement('div')).attr('id', 'toc-related-' + i).addClass('toc');
                $(divMain).append(div);

                if ('state' in item && item.state === "collapsed") {
                    $(div).hide();
                    arrow = $(document.createElement('div')).addClass('arrow').text('+');
                } else {
                    arrow = $(document.createElement('div')).addClass('arrow').text('-');
                }

                $(arrow).css('cursor', 'pointer').click(arrowClick);
                $(divMain).prepend(arrow);
                $("#leftNav-toc ul.hol-Nav-list:first-of-type").append(relatedItems[i]);

                let relatedWorkshops = {};
                $(item.tags).each(function (_, tag) {
                    relatedWorkshops = { ...relatedWorkshops, ...content[tag] };
                });

                let tutorialTitles = manifestFileContent.tutorials.map(function (tutorial) {
                    return tutorial.title.toLowerCase();
                });

                let filteredWorkshops = {};

                Object.keys(relatedWorkshops).forEach(function (key) {
                    if (manifestFileContent.workshoptitle.toLowerCase() === key.toLowerCase()) {
                        return;
                    }
                    if ($.inArray(key.toLowerCase(), tutorialTitles) !== -1) {
                        return;
                    }
                    filteredWorkshops[key] = relatedWorkshops[key];
                });

                let randomSelection = Object.keys(filteredWorkshops).sort(function () { return Math.random() - Math.random(); }).slice(0, maxRelated);

                $(randomSelection).each(function (_, workshopTitle) {
                    let ul = document.createElement('ul');
                    let li = $(document.createElement('li')).addClass('toc-item').text(workshopTitle);
                    $(li).wrapInner('<a href="' + filteredWorkshops[workshopTitle] + '"></a>');
                    $(ul).append(li);
                    $(ul).appendTo(div);
                });
            });
        });
    }

    function prepareToc(manifestFileContent) {
        let h2Regex = new RegExp(/^##\s(.+)*/gm);

        $(manifestFileContent.tutorials).each(function (i, tutorial) {
            let ul;
            let div = document.createElement('div');
            $(div).attr('id', 'toc' + i).addClass('toc');

            let tutFileName;
            if (tutorial.filename.startsWith("/") && window.location.origin.includes("livelabs.oracle.com")) {
                tutFileName = "/cdn/" + tutorial.filename.replace(/^\/+/, "");
            } else if (tutorial.filename.startsWith("/") && window.location.origin.includes("apexapps-stage.oracle.com")) {
                tutFileName = "/livelabs/cdn/" + tutorial.filename.replace(/^\/+/, "");
            } else {
                tutFileName = tutorial.filename;
            }

            $.get(tutFileName, function (markdownContent) {
                if (tutorial.filename == 'preview' && markdownContent == "None") {
                    markdownContent = window.localStorage.getItem("mdValue");
                }
                if (deps.include) {
                    markdownContent = deps.include(markdownContent, deps.manifest.include);
                }
                if (deps.singlesource) {
                    markdownContent = deps.singlesource(markdownContent, tutorial.type);
                }

                let matches;
                do {
                    matches = h2Regex.exec(markdownContent);

                    if (matches !== null) {
                        ul = document.createElement('ul');
                        let heading = matches[1];
                        let uniqueKey = deps.alphaNumOnly ? deps.alphaNumOnly(heading) : heading;
                        $(ul).append($(document.createElement('li')).addClass('toc-item').text(heading.replace(/\**/g, '').replace(/\##/g, '')).attr('data-unique', uniqueKey));
                        $(ul).click(function () {
                            if ($(this).parent().parent().parent().hasClass('selected')) {
                                location.hash = uniqueKey;
                                if (deps.expandSectionBasedOnHash) {
                                    deps.expandSectionBasedOnHash(uniqueKey);
                                }
                            } else {
                                changeTutorial(getMDFileName(tutorial.filename), uniqueKey);
                            }

                        });

                        $(ul).each(function () {
                            if (tutorial !== selectTutorial(manifestFileContent)) {
                                let li = $(this).find('li')[0];
                                $(li).wrapInner('<a href="' + unescape(callSetParam(window.location.href, deps.queryParam, getMDFileName(tutorial.filename))) + '#' + li.getAttribute('data-unique') + '"></a>');
                            }
                        });
                        $(ul).appendTo(div);
                    }
                } while (matches);

            });

            $('.hol-Nav-list li')[i].append(div);
        });

        setTimeout(function () {
            let anchorItem = $('.selected li[data-unique="' + location.hash.slice(1) + '"]');
            if (anchorItem.length !== 0)
                $(anchorItem)[0].click();
        }, 1000);
        $(".hol-Nav-list>li").wrapInner("<div></div>");

        $(".hol-Nav-list>li>div").prepend($(document.createElement('div')).addClass('arrow').text('+'));

        $('.hol-Nav-list > li > div .arrow').click(arrowClick);

        $('.selected div.arrow').text('-');
        $('.hol-Nav-list > li:not(.selected) .toc').hide();
    }

    function _showRightAndLeftArrow(articleElement, manifestFileContent) {
        if (!manifestFileContent) {
            return articleElement;
        }

        let nextPage = selectTutorial(manifestFileContent, extendedNav['#next']);
        let prevPage = selectTutorial(manifestFileContent, extendedNav['#prev']);

        if (nextPage !== undefined) {
            $('.hol-Footer-rightLink').removeClass('hide').addClass('show').attr({
                'href': unescape(callSetParam(window.location.href, deps.queryParam, getMDFileName(nextPage.filename))),
                'title': 'Next'
            }).text('Next');
        }
        if (prevPage !== undefined) {
            $('.hol-Footer-leftLink').removeClass('hide').addClass('show').attr({
                'href': unescape(callSetParam(window.location.href, deps.queryParam, getMDFileName(prevPage.filename))),
                'title': 'Previous'
            }).text('Previous');
        }
        return articleElement;
    }

    function handleInitialNavigationState() {
        setTimeout(function () {
            let hashValue = location.hash.slice(1);
            if (hashValue && deps.expandSectionBasedOnHash) {
                deps.expandSectionBasedOnHash(hashValue);
            }

            if ($('#leftNav-toc').hasClass('scroll') && $('.selected')[0]) {
                $('.selected')[0].scrollIntoView(true);
            }
        }, 1000);
    }

    function bindScrollHandler() {
        if (scrollBound) {
            return;
        }
        scrollBound = true;

        $(window).on('scroll.livelabsnav', function () {
            if (($('#contentBox').outerHeight() + $('header').outerHeight() + $('footer').outerHeight()) > $(window).outerHeight()) {
                $('#leftNav-toc').addClass("scroll");

                if (($(window).scrollTop() + $(window).height()) > $('footer').offset().top) {
                    $('#leftNav-toc').css('max-height', $('footer').offset().top - $('#leftNav-toc').offset().top);
                } else {
                    $('#leftNav-toc').css('max-height', $(window).height() - $('header').height());
                }
            } else {
                $('#leftNav-toc').removeClass("scroll");
            }

            try {
                let activeTocItem = document.querySelector('.selected .active');
                if (activeTocItem &&
                    (activeTocItem.getBoundingClientRect().y + activeTocItem.clientHeight) > $(window).height() &&
                    $('#leftNav-toc').hasClass("scroll")) {
                    activeTocItem.scrollIntoView(false);
                }
            } catch (e) { console.debug('TOC scroll error:', e); }

            let active = $('#contentBox').find('[data-unique]').first();
            $('#contentBox').find('[data-unique]').each(function () {
                if (($(this).offset().top - $(window).scrollTop() - $('header').height()) < Math.abs($(active).offset().top - $(window).scrollTop())) {
                    active = $(this);
                }
            });
            $('.selected .toc .toc-item').removeClass('active');
            if (active && active.length) {
                $('.selected .toc').find('[data-unique="' + $(active).attr('data-unique') + '"]').addClass('active');
            }
        });
    }

    function bindHashChange() {
        if (hashBound) {
            return;
        }
        hashBound = true;

        $(window).on('hashchange.livelabsnav load.livelabsnav', function (e) {
            try {
                let position = extendedNav[e.target.location.hash];
                if (position !== undefined && deps.manifest) {
                    changeTutorial(getMDFileName(selectTutorial(deps.manifest, position).filename));
                }

                setTimeout(function () {
                    let body = window.parent && window.parent.document ? window.parent.document.body : null;
                    if (body) {
                        let triggerElement = window.parent.document.getElementById("translation-trigger");
                        if (!triggerElement) {
                            triggerElement = window.parent.document.createElement("span");
                            triggerElement.id = "translation-trigger";
                            triggerElement.style.display = "none";
                            body.appendChild(triggerElement);
                        }
                        triggerElement.textContent = triggerElement.textContent === "." ? " " : ".";
                        console.log("Translation trigger updated:", triggerElement);
                    }
                }, 500);
            } catch (err) {
                console.debug('Hash change error:', err);
            }
        });
    }

    function bindToggleControl() {
        $('#openNav').off('click.livelabsnav').on('click.livelabsnav', function () {
            let navParam = deps.getParam ? deps.getParam(deps.navParamName) : null;
            if (!navParam || navParam === 'open') {
                window.history.pushState('', '', callSetParam(window.location.href, deps.navParamName, 'close'));
            } else if (navParam === 'close') {
                window.history.pushState('', '', callSetParam(window.location.href, deps.navParamName, 'open'));
            }
            toggleTutorialNav();
        });
    }

    function callGetParam(paramName) {
        return deps.getParam ? deps.getParam(paramName) : false;
    }

    function callSetParam(url, paramName, paramValue) {
        return deps.setParam ? deps.setParam(url, paramName, paramValue) : url;
    }

    return {
        initNavigation: initNavigation
    };
})();
