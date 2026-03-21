"use strict";

window.LiveLabsNavigation = (function () {
    let deps = {};

    function init(config) {
        deps = config || {};
    }

    function getMDFileName(url) {
        return url.split('/').pop().replace('.md', '');
    }

    function getLabNavID(file_name) {
        return file_name.replace(".md", "").replace(/\./g, "");
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

    function arrowClick(element, direction, manifest) {
        let tutorialIndex = 0;

        for (let i = 0; i < manifest.tutorials.length; i++) {
            if (manifest.tutorials[i].filename === deps.getParam(window.location.href, deps.queryParam)) {
                tutorialIndex = i;
                break;
            }
        }

        let nextIndex = tutorialIndex + direction;

        if (nextIndex >= 0 && nextIndex < manifest.tutorials.length) {
            changeTutorial(manifest.tutorials[nextIndex].filename);
        }
    }

    return {
        init: init,
        getMDFileName: getMDFileName,
        getLabNavID: getLabNavID,
        changeTutorial: changeTutorial,
        arrowClick: arrowClick
    };
})();