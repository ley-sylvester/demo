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

    return {
        init: init,
        getMDFileName: getMDFileName,
        getLabNavID: getLabNavID,
        changeTutorial: changeTutorial,
        arrowClick: arrowClick,
        findSelectedTutorial: findSelectedTutorial,
        selectTutorial: selectTutorial,
        buildTutorialItem: buildTutorialItem,
        handleTutorialClick: handleTutorialClick
    };
})();