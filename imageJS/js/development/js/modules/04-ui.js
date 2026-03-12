     * SECTION 5: UI COMPONENTS
     * ============================================
     */

    /**
     * Enables collapse/expand feature for the steps
     * @param {Object} manifestFileContent - The manifest file content
     * @param {HTMLElement} articleElement - The article element
     */
    const setupContentNav = function (manifestFileContent, articleElement) {
        //adds the expand collapse button before the second h2 element
        $("#module-content h2:eq(1)")
            .before('<button id="btn_toggle" class="hol-ToggleRegions plus">' + expandText + '</button>')
            .prev().on('click', function (e) {
                ($(this).text() === expandText) ? expandSection($("#module-content h2:not(:eq(0))"), "show") : collapseSection($("#module-content h2:not(:eq(0))"), "hide");
                changeButtonState(); //enables the expand all parts and collapse all parts button

            });
        //enables the feature that allows expand collapse of sections
        $("#module-content h2:not(:eq(0))").click(function (e) {
            ($(this).hasClass('plus')) ? expandSection(this, "fade") : collapseSection(this, "fade");
            changeButtonState();
        });
        /* for accessibility */
        $("#module-content h2:not(:eq(0))").attr('tabindex', '0');
        $('#module-content h2:not(:eq(0))').keydown(function (e) {
            if (e.keyCode === 13 || e.keyCode === 32) { //means enter and space
                e.preventDefault();
                if ($(this).hasClass('plus'))
                    expandSection($(this), "fade");
                else
                    collapseSection($(this), "fade");
            }
        });
        /* accessibility code ends here */

        // code to hide expand/collapse button
        let hide_expand_button = selectTutorial(manifestFileContent).hide_button || manifestFileContent.hide_button;
        if (hide_expand_button == "true" || hide_expand_button == "yes") {
            $('#btn_toggle').hide();
        }

        window.scrollTo(0, 0);
    }

    /**
     * Expands a collapsible section
     * @param {HTMLElement|jQuery} anchorElement - The anchor element (h2) to expand
     * @param {string} effect - Animation effect: "show", "fade", or "none"
     */
    const expandSection = function (anchorElement, effect) {
        if (effect === "show") {
            $(anchorElement).nextUntil("#module-content h1, #module-content h2").show('fast', function () {
                $(window).scroll();
            });
        } else if (effect === "fade") {
            $(anchorElement).nextUntil("#module-content h1, #module-content h2").fadeIn('fast', function () {
                $(window).scroll();
            });
        }
        $(anchorElement).addClass("minus");
        $(anchorElement).removeClass("plus");
    }

    /**
     * Collapses a collapsible section
     * @param {HTMLElement|jQuery} anchorElement - The anchor element (h2) to collapse
     * @param {string} effect - Animation effect: "hide", "fade", or "none"
     */
    const collapseSection = function (anchorElement, effect) {
        if (effect === "hide") {
            $(anchorElement).nextUntil("#module-content h1, #module-content h2").hide('fast', function () {
                $(window).scroll();
            });
        } else if (effect === "fade") {
            $(anchorElement).nextUntil("#module-content h1, #module-content h2").fadeOut('fast', function () {
                $(window).scroll();
            });
        } else if (effect === "none") {
            $(anchorElement).nextUntil("#module-content h1, #module-content h2").attr('style', 'display:none;');
        }
        $(anchorElement).addClass('plus');
        $(anchorElement).removeClass('minus');
    }

    /**
     * Detects and updates the state of the collapse/expand button
     */
    const changeButtonState = function () {
        if ($("#module-content h2.minus").length <= $("#module-content h2.plus").length) {
            $('#btn_toggle').text(expandText);
            $("#btn_toggle").addClass('plus');
            $("#btn_toggle").removeClass('minus');
        } else {
            $('#btn_toggle').text(collapseText);
            $("#btn_toggle").addClass('minus');
            $("#btn_toggle").removeClass('plus');
        }
    }
    /* Expands section on page load based on the hash. Expands section when the leftnav item is clicked */
    let expandSectionBasedOnHash = function (itemName) {
        let anchorElement = $('div[name="' + itemName + '"]').next(); //anchor element is always the next of div (eg. h2 or h3)
        if ($(anchorElement).hasClass('hol-ToggleRegions')) //if the next element is the collpase/expand button
            anchorElement = $(anchorElement).next();
        try {
            if (anchorElement[0].tagName !== 'H2') {
                anchorElement = $(anchorElement).siblings('h2');
            }

            if ($(anchorElement).hasClass('minus') || $(anchorElement).hasClass('plus'))
                expandSection(anchorElement, "fade");
            $(anchorElement)[0].scrollIntoView();
            window.scrollTo(0, window.scrollY - $('.hol-Header').height());
            changeButtonState();
        } catch (e) { console.debug('Section expand error:', e); }
    }

    // this function higlights the text when the copy button is clicked
    // let selectElement = function(elements) {
    //     let sel, range, el = elements;
    //     if (window.getSelection && document.createRange) { //Browser compatibility
    //         sel = window.getSelection();
    //         window.setTimeout(function(){
    //             range = document.createRange(); //range object
    //             range.selectNodeContents(el); //sets Range
    //             sel.removeAllRanges(); //remove all ranges from selection
    //             sel.addRange(range); //add Range to a Selection.
    //         }, 1);

    //         window.setTimeout(function() {
    //             sel.removeAllRanges();
    //         }, 4000);
    //     }
    // }

    /**
     * Highlights code elements when the copy button is clicked
     * @param {jQuery} elements - The elements to highlight
     */
    const selectElement = function (elements) {
        $(elements).addClass('code-highlight');

        window.setTimeout(function () {
            $(elements).removeClass('code-highlight');
        }, 2000);
    }

    /**
     * Copies text to clipboard using modern Clipboard API with fallback
     * @param {string} text - The text to copy to clipboard
     * @param {jQuery} buttonElement - The button element for animation feedback
     * @private
     */
    const copyToClipboard = function (text, buttonElement) {
        const animateSuccess = () => {
            $(buttonElement).parent().animate({
                opacity: 0.2
            }).animate({
                opacity: 1
            });
        };

        // Modern Clipboard API (preferred)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(animateSuccess)
                .catch((err) => {
                    console.debug('Clipboard API failed, using fallback:', err);
                    // Fallback to execCommand for older browsers
                    fallbackCopyToClipboard(text, buttonElement, animateSuccess);
                });
        } else {
            // Fallback for browsers without Clipboard API
            fallbackCopyToClipboard(text, buttonElement, animateSuccess);
        }
    };

    /**
     * Fallback clipboard copy using deprecated execCommand (for older browsers)
     * @param {string} text - The text to copy
     * @param {jQuery} buttonElement - The button element
     * @param {Function} onSuccess - Callback on successful copy
     * @private
     */
    const fallbackCopyToClipboard = function (text, buttonElement, onSuccess) {
        const dummy = $('<textarea>').val(text).appendTo(buttonElement).select();
        document.execCommand('copy');
        $(dummy).remove();
        onSuccess();
    };

    /**
     * Adds code copy functionality in codeblocks
     * The code that needs to be copied must be wrapped in <copy></copy> tags
     * @param {HTMLElement} articleElement - The article element containing code blocks
     * @returns {HTMLElement} The modified article element
     */
    const allowCodeCopy = function (articleElement) {
        $(articleElement).find('pre code').each(function () {
            if ($(this).text().indexOf('<copy>') >= 0) {
                const code = $(document.createElement('code')).html($(this).text());
                $(this).html($(code).html());
            }

            if ($(this).has('copy').length >= 1) {
                $(this).find('copy').contents().unwrap().wrap('<span class="copy-code">');
                $(this).before('<button class="copy-button" title="Copy text to clipboard">' + copyButtonText + '</button>');
            }
        });

        $(articleElement).find('.copy-button').click(function () {
            selectElement($(this).next().find('.copy-code'));

            const codeElement = $(this).next();
            const preElement = $(this).parent();  // The <pre> element has the language class
            // Check if code block is SQL (supports sql, plsql, and language-* variants)
            const isSql = preElement.hasClass('sql') ||
                          preElement.hasClass('language-sql') ||
                          preElement.hasClass('plsql') ||
                          preElement.hasClass('language-plsql');

            let copyText = codeElement.find('.copy-code').map(function () {
                return $(this).text().trim();
            }).get().join('\n');

            // Add trailing newline only for SQL code blocks so last statement executes when pasted
            if (isSql) {
                copyText += '\n';
            }

            copyToClipboard(copyText, this);
        });

        return articleElement;
    }

    /* adds iframe to YouTube videos so that it renders in the same page.
    The MD code should be in the format [](youtube:<enter_video_id>) for it to render as iframe. */
    let renderYouTubeVideos = function (articleElement) {
        $(articleElement).find('a[href^="youtube:"]').each(function () {
            $(this).after('<div class="video-container' + '-' + $(this).attr("href").split(":")[2] + '"><iframe title="video iframe" src="https://www.youtube.com/embed/' + $(this).attr('href').split(":")[1] + '" frameborder="0" allowfullscreen></div>');
            $(this).remove();
        });
        return articleElement;
    }

    /* adds iframe to Oracle Video Hub videos so that it renders in the same page.
    The MD code should be in the format [](videohub:<enter_video_id>) for it to render as iframe. */
    let renderVideoHubVideos = function (articleElement) {
        $(articleElement).find('a[href^="videohub:"]').each(function () {
            $(this).after('<div class="video-container' + '-' + $(this).attr("href").split(":")[2] + '"><iframe id="kaltura_player" title="video iframe" src="https://cdnapisec.kaltura.com/p/2171811/sp/217181100/embedIframeJs/uiconf_id/35965902/partner_id/2171811?iframeembed=true&playerId=kaltura_player&entry_id=' + $(this).attr('href').split(":")[1] + '&flashvars[streamerType]=auto" frameborder="0" allowfullscreen></div>');
            $(this).remove();
        });
        return articleElement;
    }

    /* adds HTML5 video element for direct video file URLs.
    The MD code should be in the format [](video:<enter_video_url>) or [](video:<enter_video_url>:size) for it to render as video.
    Supported sizes: small, medium, large (default: small)
    Supported formats: mp4, webm, ogg/ogv */
    let renderDirectVideos = function (articleElement) {
        $(articleElement).find('a[href^="video:"]').each(function () {
            let href = $(this).attr('href');
            // Remove the 'video:' prefix
            let videoPath = href.substring(6);
            let size = 'small'; // default size

            // Check if size is specified at the end (e.g., :small, :medium, :large)
            let sizeMatch = videoPath.match(/:(small|medium|large)$/);
            if (sizeMatch) {
                size = sizeMatch[1];
                videoPath = videoPath.replace(/:(small|medium|large)$/, '');
            }

            // Determine video type from extension
            let videoType = 'video/mp4'; // default
            if (videoPath.endsWith('.webm')) {
                videoType = 'video/webm';
            } else if (videoPath.endsWith('.ogg') || videoPath.endsWith('.ogv')) {
                videoType = 'video/ogg';
            }

            $(this).after('<div class="video-container-' + size + '"><video controls preload="metadata" title="video"><source src="' + videoPath + '" type="' + videoType + '">Your browser does not support the video tag.</video></div>');
            $(this).remove();
        });
        return articleElement;
    }

    /* remove all content that is not of type specified in the manifest file. Then remove all if tags.*/
    let singlesource = function (markdownContent, type) {
        let ifTagRegExp = new RegExp(/<\s*if type="([^>]*)">([\s\S|\n]*?)<\/\s*if>/gm);
        let contentToReplace = []; // content that needs to be replaced

        if (getParam("type") !== false) {
            type = getParam("type");
        } else if ($.type(type) == 'object') {
            type = Object.keys(type)[0];
        }

        if ($.type(type) !== 'array')
            type = Array(type);

        let matches;
        do {
            matches = ifTagRegExp.exec(markdownContent);
            if (matches === null) {
                $(contentToReplace).each(function (index, value) {
                    markdownContent = markdownContent.replace(value.replace, value.with);
                });
                return markdownContent;
            }
            // convert if type to array
            let all_types = matches[1].split(' '),
                matchFound = false;

            for (let i = 0; i < all_types.length && !matchFound; i++) {
                if ($.inArray(all_types[i], type) >= 0) { // check if type specified matches content
                    matchFound = true;
                }
            }

            // replace with blank if type doesn't match
            // replace with text without if tag (if any if type matches)
            (!matchFound) ?
                contentToReplace.push({ "replace": matches[0], "with": '' }) :
                contentToReplace.push({ "replace": matches[0], "with": matches[2] });

        } while (matches);
    }
    /* converts < > symbols inside the copy tag to &lt; and &gt; */
    let convertBracketInsideCopyCode = function (markdownContent) {
        let copyRegExp = new RegExp(/<copy>([\s\S|\n]*?)<\/copy>/gm);

        markdownContent = markdownContent.replace(copyRegExp, function (code) {
            code = code.replace('<copy>', '');
            code = code.replace('</copy>', '');
            code = code.replace(/</g, '&lt;');
            code = code.replace(/>/g, '&gt;');
            return '<copy>' + code.trim() + '</copy>';
        });

        return markdownContent;
    }
    // Defines the FreeSQL Buttons for Sprints
    let convertFreeSQLButtonTags = function (markdownContent) {
        let sqlCode = "";
        let link = "";

        // If the markdown includes a FreeSQL button...
        if (markdownContent.includes('<freesql-button')) {
            console.log('<freesql-button> tag detected. Now replacing it with the real button.');
            
            // and the author is using a tutorial...
            if (markdownContent.includes('<freesql-button src=')) {
                console.log("<freesql-button> tag includes a source. Using the provided url as the button's link.");
                
                // extract the tutorial link
                markdownContent = markdownContent.replace(new RegExp(/<freesql-button src="([\s\S|\n]*?)">/gm), function (code) {
                    link = code;
                    link = link.replace('<freesql-button src="',"");
                    link = link.replace('">',"");
                    return code;});
                console.log("Tutorial Link: " + link);

            // and the author is using a worksheet...
            } else if (markdownContent.includes('<freesql-button>')) {
                console.log("<freesql-button> tag does not include a source. Building a FreeSQL worksheet link.");
                let worksheetRegExp = new RegExp(/<freesql>([\s\S|\n]*?)<\/freesql>/gm); // Finds all content between the freesql tag. 
    
                // find all code wrapped in <freesql>, concatenate it and...
                markdownContent = markdownContent.replace(worksheetRegExp, function (code){
                    code = code.replace('<freesql>', '');
                    code = code.replace('</freesql>', '');
                    sqlCode += code;
                    return code;
                });

                // create the worksheet's link using the encoded SQL.
                link = 'https://freesql.com/next/worksheet?code=' + encodeURIComponent(sqlCode);
                console.log('Worksheet Link: ' + link);
            } else {console.log('FreeSQL button is not properly formatted.')};
        

            // Replace <freesql-button> with the actual button.
            markdownContent = markdownContent.replace(new RegExp(/<freesql-button([\s\S|\n]*?)>/gm), function (code) {
                code = code.replace(code, '<a href="' + link + 
                    '" target = "_blank"> <button class="freesql-button">Try It Now w/ FreeSQL</button></br></a>');
                console.log("The Free SQL button is now added.")
                return code;
            });
        } else {console.log('No <freesql-button> tag detected');}
        
        return markdownContent; 
    }

    /* injects tracking code into links specified in the utmParams variable */
    let injectUtmParams = function (articleElement) {
        let currentUrl = window.location.href;
        $(utmParams).each(function (index, item) {
            let inParamValue = getParam(item.inParam);
            if (inParamValue) {
                $(articleElement).find('a[href*="' + item.url + '"]').each(function () {
                    let targetUrl = $(this).attr('href');
                    $(this).attr('href', unescape(setParam(targetUrl, item.outParam, inParamValue)));
                });
            }
        });

        /* hack for manual links like this ?lab=xx. Should be removed later. */
        $(utmParams).each(function (index, item) {
            let inParamValue = getParam(item.inParam);
            if (inParamValue) {
                $(articleElement).find('a[href*="?' + queryParam + '="]').each(function () {
                    let targetUrl = $(this).attr('href') + '&' + item.inParam + '=' + inParamValue;
                    $(this).attr('href', unescape(targetUrl));
                });
            }
        });
        /* remove till here */
        return articleElement;
    }

    /*
     * ============================================
