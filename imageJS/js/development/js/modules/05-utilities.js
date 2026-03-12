     * SECTION 8: UTILITIES
     * ============================================
     */

    /**
     * Sets a query parameter value in a URL
     * @param {string} url - The URL to modify
     * @param {string} paramName - The parameter name
     * @param {string} paramValue - The parameter value
     * @returns {string} The modified URL
     */
    const setParam = function (url, paramName, paramValue) {
        let onlyUrl = (url.split('?')[0]).split('#')[0];
        let params = url.replace(onlyUrl, '').split('#')[0];
        let hashAnchors = url.replace(onlyUrl + params, '');
        hashAnchors = "";

        let existingParamValue = getParam(paramName);
        if (existingParamValue) {
            return onlyUrl + params.replace(paramName + '=' + existingParamValue, paramName + '=' + paramValue) + hashAnchors;
        } else {
            if (params.length === 0 || params.length === 1) {
                return onlyUrl + '?' + paramName + '=' + paramValue + hashAnchors;
            }
            return onlyUrl + params + '&' + paramName + '=' + paramValue + hashAnchors;
        }
    }
    /**
     * Gets a query parameter value from the current URL
     * @param {string} paramName - The parameter name to retrieve
     * @returns {string|boolean} The parameter value or false if not found
     */
    const getParam = function (paramName) {
        const params = window.location.search.substring(1).split('&');
        for (let i = 0; i < params.length; i++) {
            if (params[i].split('=')[0] == paramName) {
                // Fix for LLAPEX-595 to remove characters only before the first '='
                return params[i].split(/=(.*)/s)[1];
            }
        }
        return false;
    }

    /**
     * Creates a short name from a title for URL-friendly identifiers
     * @param {string} title - The title to convert
     * @returns {string} The short name
     */
    const createShortNameFromTitle = function (title) {
        if (!title) {
            console.log("The title in the manifest file cannot be blank!");
            return "ErrorTitle";
        }
        const removeFromTitle = ["-a-", "-in-", "-of-", "-the-", "-to-", "-an-", "-is-", "-your-", "-you-", "-and-", "-from-", "-with-"];
        const folderNameRestriction = ["<", ">", ":", "\"", "/", "\\\\", "|", "\\?", "\\*", "&", "\\.", ","];
        let shortname = title.toLowerCase().replace(/ /g, '-').trim().substr(0, 50);
        $.each(folderNameRestriction, function (i, value) {
            shortname = shortname.replace(new RegExp(value, 'g'), '');
        });
        $.each(removeFromTitle, function (i, value) {
            shortname = shortname.replace(new RegExp(value, 'g'), '-');
        });
        if (shortname.length > 40) {
            shortname = shortname.substr(0, shortname.lastIndexOf('-'));
        }
        return shortname;
    }


    let updateOpenCloseButtonText = function (articleElement, manifestFileContent) {
        let task_type = selectTutorial(manifestFileContent).task_type || manifestFileContent.task_type;
        if (task_type) {
            const default_task_type = "Tasks";
            task_type = task_type.trim();
            collapseText = collapseText.replace(default_task_type, task_type);
            expandText = expandText.replace(default_task_type, task_type);
        }
        return articleElement;
    }

    let showRightAndLeftArrow = function (articleElement, manifestFileContent) {
        let next_page = selectTutorial(manifestFileContent, extendedNav['#next']);
        let prev_page = selectTutorial(manifestFileContent, extendedNav['#prev']);


        if (next_page !== undefined) {
            $('.hol-Footer-rightLink').removeClass('hide').addClass('show').attr({ 'href': unescape(setParam(window.location.href, queryParam, getMDFileName(next_page.filename))), 'title': 'Next' }).text('Next');
        }
        if (prev_page !== undefined) {
            $('.hol-Footer-leftLink').removeClass('hide').addClass('show').attr({ 'href': unescape(setParam(window.location.href, queryParam, getMDFileName(prev_page.filename))), 'title': 'Previous' }).text('Previous');
        }
        return articleElement;
    }

    let setH2Name = function (articleElement) {

        $(articleElement).find('h2').each(function () {
            $(this).before($(document.createElement('div')).attr({
                'name': alphaNumOnly($(this).text()),
                'data-unique': alphaNumOnly($(this).text())
            }));
        });
        return articleElement;
    }

    /**
     * Returns only alphanumeric characters from text
     * @param {string} text - The input text
     * @returns {string} Text with only alphanumeric characters
     */
    const alphaNumOnly = function (text) { return text.replace(/[^[A-Za-z0-9:?\(\)]+?/g, ''); }

    /*
     * ============================================
