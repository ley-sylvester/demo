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

                let newIndex = i + position;

                // 🔒 boundary protection
                if (newIndex < 0 || newIndex >= tutorials.length) {
                    return tutorials[i]; // stay on current
                }

                return tutorials[newIndex];
            }
        }

        return tutorials[0]; // safe fallback
    }

    return {
        init: init,
        getMDFileName: getMDFileName,
        getLabNavID: getLabNavID,
        changeTutorial: changeTutorial,
        arrowClick: arrowClick,
        findSelectedTutorial: findSelectedTutorial
    };
})();