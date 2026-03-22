"use strict";

window.LiveLabsNavigation = (function () {
    let deps = {};

    function init(config) {
        deps = config || {};
    }

    function getMDFileName(url) {
        return url.split('/').pop().replace('.md', '');
    }

    function getLabNavID(file_name, prefix = 'tut-') {
        let clean = getMDFileName(file_name.toString())
            .replace(/[\(\)]+?/g, '')
            .replace('.md', '');

        return prefix + clean;
    }

    function changeTutorial(file_name, anchor = "") {
        if (anchor !== "") anchor = '#' + anchor;

        location.href = unescape(
            deps.setParam(
                window.location.href,
                deps.queryParam,
                file_name
            ) + anchor
        );
    }

    function arrowClick(e) {
        const direction = $(this).hasClass('right') ? 1 : -1;

        let currentFile = deps.getParam(window.location.href, deps.queryParam);

        if (currentFile && currentFile.indexOf('/') !== -1) {
            currentFile = currentFile.split('/').pop();
        }

        let tutorialIndex = 0;

        for (let i = 0; i < deps.manifest.tutorials.length; i++) {
            let file = deps.manifest.tutorials[i].filename;

            if (file === currentFile) {
                tutorialIndex = i;
                break;
            }
        }

        let nextIndex = tutorialIndex + direction;

        if (nextIndex >= 0 && nextIndex < deps.manifest.tutorials.length) {
            changeTutorial(deps.manifest.tutorials[nextIndex].filename);
        }
    }

    function findSelectedTutorial(manifestFileContent, currentLab, position = 0) {
        let tutorials = manifestFileContent.tutorials;

        for (let i = 0; i < tutorials.length; i++) {
            if (currentLab === getMDFileName(tutorials[i].filename)) {
                return {
                    matched: true,
                    tutorial: tutorials[i + position]
                };
            }
        }

        return {
            matched: false,
            tutorial: tutorials[0 + position]
        };
    }

    function selectTutorial(manifestFileContent, position = 0) {
        let currentLab = deps.getParam(deps.queryParam);

        // Apply selected class
        $('#' + getLabNavID(currentLab)).addClass('selected');
        $('.selected').find('a').contents().unwrap();
        $('.selected').unbind('keydown');

        if (position === -2) return manifestFileContent.tutorials[0];
        if (position === 2) return manifestFileContent.tutorials[manifestFileContent.tutorials.length - 1];

        // Use helper
        let result = findSelectedTutorial(manifestFileContent, currentLab, position);

        if (result.matched) {
            return result.tutorial;
        }

        if (result.tutorial !== undefined) {
            return result.tutorial;
        }

        // old link fallback
        for (let i = 0; i < manifestFileContent.tutorials.length; i++) {
            if (currentLab === deps.createShortNameFromTitle(manifestFileContent.tutorials[i].title)) {
                changeTutorial(
                    getMDFileName(manifestFileContent.tutorials[i].filename),
                    window.location.hash.substr(1)
                );
                return;
            }
        }

        $('.hol-Nav-list').find('li:eq(0)').addClass("selected");
        return manifestFileContent.tutorials[0 + position];
    }

    function buildTutorialItem(tutorial) {
        let fileName = getMDFileName(tutorial.filename);
        let id = getLabNavID(fileName);

        return {
            fileName,
            id,
            title: tutorial.title
        };
    }
    function handleTutorialClick(fileName) {
        changeTutorial(fileName);
    }

    function renderTutorialNav(manifestFileContent) {
        let div = $(document.createElement('div')).attr('id', 'leftNav-toc');
        let ul = $(document.createElement('ul')).addClass('hol-Nav-list');

        $(manifestFileContent.tutorials).each(function (i, tutorial) {
            let file_name = getMDFileName(tutorial.filename);

            $(document.createElement('li')).each(function () {

                $(this).click(function (e) {
                    if (
                        !$(e.target).hasClass('arrow') &&
                        !$(e.target).hasClass('toc-item') &&
                        !$(e.target).hasClass('toc-item active')
                    ) {
                        if (
                            $(e.target).parent().parent().hasClass('selected') ||
                            $(e.target).hasClass('selected')
                        ) {
                            try {
                                $('.selected .arrow').click();
                            } catch (err) {}
                        } else {
                            changeTutorial(file_name);
                        }
                    }
                });

                $(this).attr('id', getLabNavID(file_name));

                $(this)
                    .text(tutorial.title)
                    .wrapInner(
                        "<a href=\"" +
                            unescape(
                                deps.setParam(
                                    window.location.href,
                                    deps.queryParam,
                                    file_name
                                )
                            ) +
                            "\"><div></div></a>"
                    );

                $(this).appendTo(ul);

                $(this).keydown(function (e) {
                    if (e.keyCode === 13 || e.keyCode === 32) {
                        e.preventDefault();
                        changeTutorial(file_name);
                    }
                });
            });
        });

        $(ul).appendTo(div);
        $(div).appendTo('#leftNav');

        return selectTutorial(manifestFileContent);
    }

    function buildTocItem(tutorial, manifestFileContent, markdownContent) {
        let h2_regex = new RegExp(/^##\s(.+)*/gm);
        let matches;
        let elements = [];

        do {
            matches = h2_regex.exec(markdownContent);

            if (matches !== null) {
                let ul = document.createElement('ul');

                $(ul).append(
                    $(document.createElement('li'))
                        .addClass('toc-item')
                        .text(matches[1].replace(/\**/g, '').replace(/\##/g, ''))
                        .attr('data-unique', deps.alphaNumOnly(matches[1]))
                );

                $(ul).click(function () {
                    if ($(this).parent().parent().parent().hasClass('selected')) {
                        location.hash = deps.alphaNumOnly($(this).text());
                        deps.expandSectionBasedOnHash(
                            $(this).find('li').attr('data-unique')
                        );
                    } else {
                        changeTutorial(
                            getMDFileName(tutorial.filename),
                            deps.alphaNumOnly($(this).text())
                        );
                    }
                });

                elements.push(ul);
            }

        } while (matches);

        return elements;
    }

    return {
        init: init,
        getMDFileName: getMDFileName,
        getLabNavID: getLabNavID,
        changeTutorial: changeTutorial,
        arrowClick: arrowClick,
        findSelectedTutorial: findSelectedTutorial,
        selectTutorial: selectTutorial,
        buildTutorialItem: buildTutorialItem,
        handleTutorialClick: handleTutorialClick,
        renderTutorialNav: renderTutorialNav,
        buildTocItem: buildTocItem
    };

})();