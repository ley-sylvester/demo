     * SECTION 4: NAVIGATION
     * ============================================
     */

    /**
     * Creates and populates the tutorial navigation sidebar
     * @param {Object} manifestFileContent - The manifest file content
     * @returns {Object} The selected tutorial object
     */
    const setupTutorialNav = function (manifestFileContent) {
        let div = $(document.createElement('div')).attr('id', 'leftNav-toc');
        let ul = $(document.createElement('ul')).addClass('hol-Nav-list');

        $(manifestFileContent.tutorials).each(function (i, tutorial) {
            let file_name = getMDFileName(tutorial.filename);

            $(document.createElement('li')).each(function () {
                $(this).click(function (e) {
                    if (!$(e.target).hasClass('arrow') && !$(e.target).hasClass('toc-item') && !$(e.target).hasClass('toc-item active')) {
                        if ($(e.target).parent().parent().hasClass('selected') || $(e.target).hasClass('selected')) {
                            try {
                                $('.selected .arrow').click();
                            } catch (err) { console.debug('Nav click error:', err); }
                        } else {
                            changeTutorial(file_name);
                        }
                    }
                });
                $(this).attr('id', getLabNavID(file_name));
                //The title specified in the manifest appears in the side nav as navigation
                // $(this).text(tutorial.title).wrapInner("<span></span>");
                $(this).text(tutorial.title).wrapInner("<a href=\"" + unescape(setParam(window.location.href, queryParam, getMDFileName(tutorial.filename))) + "\"><div></div></a>");
                $(this).appendTo(ul);

                /* for accessibility */
                $(this).keydown(function (e) {
                    if (e.keyCode === 13 || e.keyCode === 32) { //means enter and space
                        e.preventDefault();
                        changeTutorial(file_name);
                    }
                });
                /* accessibility code ends here */
            });
        });

        $(ul).appendTo(div);
        $(div).appendTo('#leftNav');
        return selectTutorial(manifestFileContent);
    }

    let getMDFileName = function (file_name) {
        return file_name.split('/')[file_name.split('/').length - 1].replace('.md', '');
    }

    let getLabNavID = function (file_name, prefix = 'tut-') {
        return prefix + getMDFileName(file_name.toString()).replace(/[\(\)]+?/g, '').replace('.md', '');
    }

    let selectTutorial = function (manifestFileContent, position = 0) {
        $('#' + getLabNavID(getParam(queryParam))).addClass('selected'); //add class selected to the tutorial that is selected by using the ID
        $('.selected').find('a').contents().unwrap(); // remove hyperlink from "selected" lab
        $('.selected').unbind('keydown');

        if (position === -2) return manifestFileContent.tutorials[0];
        if (position === 2) return manifestFileContent.tutorials[manifestFileContent.tutorials.length - 1];

        //find which tutorial in the manifest file is selected
        for (var i = 0; i < manifestFileContent.tutorials.length; i++) {
            if (getParam(queryParam) === getMDFileName(manifestFileContent.tutorials[i].filename))
                return manifestFileContent.tutorials[i + position];
        }

        // if old link style URL is used (for example: ?labs=short-tutorial-title)
        // remove this condition after old style link is removed
        for (var i = 0; i < manifestFileContent.tutorials.length; i++) {
            if (getParam(queryParam) === createShortNameFromTitle(manifestFileContent.tutorials[i].title)) {
                changeTutorial(getMDFileName(manifestFileContent.tutorials[i].filename), window.location.hash.substr(1));
                return;
            }
        }
        // until here

        //if no title has selected class, selected class is added to the first class
        $('.hol-Nav-list').find('li:eq(0)').addClass("selected");
        return manifestFileContent.tutorials[0 + position]; //return the first tutorial is no tutorial is matches
    }

    /* Setup toc navigation and tocify */
    let setupTocNav = function () {
        $(".hol-Nav-list .selected").wrapInner("<div tabindex='0'></div>")
        $(".hol-Nav-list .selected div").prepend($(document.createElement('div')).addClass('arrow').text('+'));
        $(".hol-Nav-list .selected").unbind('click');

        $(".hol-Nav-list .selected > div").click(function (e) {
            if ($('.selected div.arrow').text() === '-') {
                $('#toc').fadeOut('fast');
                $('.selected div.arrow').text('+');
            } else {
                $('#toc').fadeIn('fast');
                $('.selected div.arrow').text('-');
            }
        });

        /* for accessibility */
        $(".hol-Nav-list .selected > div").keydown(function (e) {
            if (e.keyCode === 13 || e.keyCode === 32) { //means enter and space
                e.preventDefault();
                $(this).click()
            }
        });
        /* accessibility code ends here */

        $(window).scroll();
        $('#toc').appendTo(".hol-Nav-list .selected");
        $('.selected div.arrow').click();
    }
    
    /* The following function performs the event that must happen when the lab links in the navigation is clicked */
    let changeTutorial = function (file_name, anchor = "") {

        if (anchor !== "") anchor = '#' + anchor;
        location.href = unescape(setParam(window.location.href, queryParam, file_name) + anchor);
    }

    /*the following function changes the path of images as per the path of the MD file.
    This ensures that the images are picked up from the same location as the MD file.
    The manifest file can be in any location.*/
    let addPathToImageSrc = function (markdownContent, myUrl) {
        let imagesRegExp = new RegExp(/!\[.*?\]\((.*?)\)/g);
        let contentToReplace = []; // content that needs to be replaced
        let matches;

        myUrl = myUrl.substring(0, myUrl.lastIndexOf('/') + 1); //removing filename from the url

        do {
            matches = imagesRegExp.exec(markdownContent);
            // console.log(matches);
            if (matches === null) {
                $(contentToReplace).each(function (index, value) {
                    markdownContent = markdownContent.replace(value.replace, value.with);
                });
                return markdownContent;
            }

            // if (myUrl.indexOf("/") !== 1) {
            matches[1] = matches[1].split(' ')[0];
            let origImg = matches[1].trim();
            if (matches[1].indexOf("http") === -1 && matches[1][0] !== "/") {
                contentToReplace.push({
                    "replace": '(' + matches[1],
                    /* "with": '(' + myUrl + matches[1] TMM: changed 10/6/20*/
                    "with": '(' + myUrl + matches[1].trim()
                });
            }

            if (["livelabs.oracle.com", "apexapps-stage.oracle.com"].some(domain => currentDomain.includes(domain))
            && !origImg.startsWith("/cdn/") && !origImg.startsWith("/livelabs/cdn/") && origImg.startsWith("/")) {
                let replaceImg = origImg; // Default to the original path
            
                if (currentDomain.includes("livelabs.oracle.com")) {
                    replaceImg = "/cdn" + origImg;
                } else if (currentDomain.includes("apexapps-stage.oracle.com")) {
                    replaceImg = "/livelabs/cdn" + origImg;
                }
                    
                contentToReplace.push({
                    replace: `(${origImg}`,
                    with: `(${replaceImg}`
                });
                
            }
            
        } while (matches);
    }
    /* The following function adds the h1 title before the container div. It picks up the h1 value from the MD file. */
    let updateH1Title = function (articleElement) {
        $('#tutorial-title').text("\t\t›\t\t" + $(articleElement).find('h1').text());
        // $(articleElement).find('h1').remove(); //Removing h1 from the articleElement as it has been added to the HTML file already
        return articleElement;
    }
    /* This function picks up the entire converted content in HTML, and break them into sections. */
    let wrapSectionTag = function (articleElement) {
        $(articleElement).find('h2').each(function () {
            $(this).nextUntil('h2').andSelf().wrapAll('<section></section>');
        });
        return articleElement;
    }
    /* Wrapping all images in the article element with Title in the MD, with figure tags, and adding figcaption dynamically.
    The figcaption is in the format Description of illustration [filename].
    The image description files must be added inside the files folder in the same location as the MD file.*/
    let wrapImgWithFigure = function (articleElement) {
        // Add lazy loading attribute to images
        // First image loads eagerly (above the fold), rest load lazily
        let isFirstImage = true;
        $(articleElement).find("img").each(function () {
            if (isFirstImage) {
                isFirstImage = false;
                $(this).attr('loading', 'eager');
            } else {
                $(this).attr('loading', 'lazy');
            }
        });

        $(articleElement).find("img").on('load', function () {
            if ($(this)[0].width > 100 || $(this)[0].height > 100 || $(this).attr("title") !== undefined) { // only images with title or width or height > 100 get wrapped (DBDOC-2397)
                $(this).wrap("<figure></figure>"); //wrapping image tags with figure tags

            }

            //Add role attribute to all images that do not have an alt attribute
            if ($(this).attr("alt").length < 1 || (!$(this).attr("alt")) || $(this).attr("alt") == '' || $(this).attr("alt") == undefined || $(this).attr("alt") == 0) {
                // $(this).attr("role","presentation"); ALternative solution
                $(this).attr("alt", "The content is described above.");
            }

        });
        return articleElement;
    }
    /*the following function changes the path of the HREFs based on the absolute path of the MD file.
    This ensures that the files are linked correctly from the same location as the MD file.
    The manifest file can be in any location.*/
    let addPathToAllRelativeHref = function (articleElement, myUrl) {
        if (myUrl.indexOf("/") !== -1) {
            myUrl = myUrl.replace(/\/[^\/]+$/, "/"); //removing filename from the url
            $(articleElement).find('a').each(function () {
                if ($(this).attr("href").indexOf("http") === -1 && $(this).attr("href")[0] !== "/" && $(this).attr("href").indexOf("?") !== 0 && $(this).attr("href").indexOf("#") !== 0) {
                    $(this).attr("href", myUrl + $(this).attr("href"));
                }
            });
        }
        return articleElement;
    }
    /* the following function makes anchor links work by adding an event to all href="#...." */
    let makeAnchorLinksWork = function (articleElement) {
        $(articleElement).find('a[href^="#"]').each(function () {
            let href = $(this).attr('href');
            if (href !== "#") { //eliminating all plain # links
                $(this).click(function () {
                    expandSectionBasedOnHash(href.split('#')[1]);
                });
            }
        });
        return articleElement;
    }
    /*the following function sets target for all HREFs to _blank */
    let addTargetBlank = function (articleElement) {
        $(articleElement).find('a').each(function () {
            if ($(this).attr('href').indexOf("http") === 0 && $(this).attr('href').indexOf("&type=") == -1) //ignoring # hrefs
                $(this).attr('target', '_blank'); //setting target for ahrefs to _blank
        });
        return articleElement;
    }
    /* Sets the title, contentid, description, partnumber, and publisheddate attributes in the HTML page.
    The content is picked up from the manifest file entry*/
    let updateHeadContent = function (tutorialEntryInManifest, workshoptitle) {
        (workshoptitle !== undefined) ?
            document.title = workshoptitle + " | " + tutorialEntryInManifest.title :
            document.title = tutorialEntryInManifest.title;

        const metaProperties = [{
            name: "contentid",
            content: tutorialEntryInManifest.contentid
        }, {
            name: "description",
            content: tutorialEntryInManifest.description
        }, {
            name: "partnumber",
            content: tutorialEntryInManifest.partnumber
        }, {
            name: "publisheddate",
            content: tutorialEntryInManifest.publisheddate
        }];
        $(metaProperties).each(function (i, metaProp) {
            if (metaProp.content) {
                let metaTag = document.createElement('meta');
                $(metaTag).attr(metaProp).prependTo('head');
            }
        });
    }

    /* Add the Go to forum link in the footer (DBDOC-2459 and DBDOC-2496) */
    let addGoToForumLink = function (support) {
        const support_text = "Go to forum";
        if (support !== undefined) {
            // the Need Help? URL is taken from the manifest file (key is support)
            let need_help = $(document.createElement('li')).append($(document.createElement('a')).attr({ 'href': support, 'target': '_blank' }).text(support_text));
            $('.footer-links').append(need_help);
        }
    }

    /* Add the Need Help link in the header (DBDOC-2459 and DBDOC-2496) */
    let addNeedHelpLink = function (help, wtitle) {
        const subject = "Question about workshop: " + wtitle;
        const help_text = "Need help? Send us an email.";
        if (help !== undefined) {
            // the Need Help? URL is taken from the manifest file (key is help)
            let need_help = $(document.createElement('a')).attr({ 'href': 'mailto:' + help + '?subject=' + subject, 'title': help_text, 'id': 'need_help', 'tabindex': '0' }).text('?').addClass('header-icon');
            $('header .hol-Header-wrap').append(need_help);

            // let need_help_div = $(document.createElement('div')).attr({ 'href': 'mailto:' + help + '?subject=' + subject, 'title': help_text, 'id': 'need_help', 'tabindex': '0' }).text('?');
            // $('div#container').append(need_help_div);
        }
    }
    let addTranslateIcon = function (help) {
        const help_text = "Need another language? Learn how to translate this page?";
    
        if (help !== undefined) {
            let translate_icon = $('<a>', {
                href: '#',
                title: help_text,
                id: 'translate_icon',
                tabindex: '0'
            }).html(`
                <svg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 512 511.997"><path fill="#fff" fill-rule="nonzero" d="M456.103 372.929c.76 0 1.503.076 2.221.22 18.883-32.877 29.294-67.765 30.989-105.931h-70.387c-1.273 35.725-11.943 70.959-31.822 105.711h68.999zm-12.274 22.439h-70.885c-21.522 31.176-50.508 61.962-86.825 92.362 62.484-7.736 120.355-41.731 157.71-92.362zM225.876 487.73c-36.317-30.401-65.302-61.187-86.824-92.362H68.171c37.351 50.625 95.219 84.622 157.705 92.362zM53.549 372.929h71.343c-19.881-34.752-30.548-69.986-31.822-105.711H22.687c1.692 38.09 12.06 72.896 30.862 105.711zM22.687 244.778h70.82c2.607-35.001 14.22-70.236 35.03-105.71H53.549c-18.805 32.824-29.17 67.626-30.862 105.71zm45.484-128.15h74.743c21.286-30.671 49.426-61.521 84.54-92.551-63.108 7.382-121.587 41.459-159.283 92.551zM284.54 24.077c35.114 31.03 63.256 61.878 84.542 92.551h74.746c-37.692-51.087-96.176-85.172-159.288-92.551zm173.91 114.991h-74.99c20.812 35.473 32.424 70.709 35.03 105.71h70.823c-1.692-38.095-12.061-72.891-30.863-105.71zM256 0c85.059 0 164.712 41.638 212.305 112.556C497.103 155.464 512 203.909 512 256c0 52.06-14.832 100.437-43.695 143.441C420.677 470.412 341.002 511.997 256 511.997c-85.06 0-164.713-41.638-212.306-112.556C14.897 356.535 0 308.089 0 256c0-52.063 14.83-100.439 43.694-143.444C91.322 41.585 170.997 0 256 0zm11.218 38.617v78.011h74.275c-19.514-25.73-44.246-51.733-74.275-78.011zm0 100.451v105.71h128.845c-2.917-34.714-15.788-69.947-38.83-105.71h-90.015zm0 128.15v105.711h93.793c22.204-34.986 34.125-70.221 35.547-105.711h-129.34zm0 128.15v78.971c31.859-26.182 57.931-52.505 78.111-78.971h-78.111zm-22.439 78.976v-78.976h-78.112c20.182 26.467 46.25 52.792 78.112 78.976zm0-101.415V267.218h-129.34c1.421 35.49 13.34 70.725 35.547 105.711h93.793zm0-128.151v-105.71h-90.015c-23.04 35.763-35.913 70.996-38.83 105.71h128.845zm0-128.15V38.609c-30.032 26.281-54.763 52.286-74.275 78.019h74.275z"/></svg>
                `)                
                .addClass('header-icon');
    
            translate_icon.on('click', function (e) {
                e.preventDefault();
                $('#translate_popup').toggle();
            });

            // Detect browser
            let userAgent = navigator.userAgent.toLowerCase();
            let defaultTab = 'chrome'; // fallback
            if (userAgent.includes('edg')) {
                defaultTab = 'edge';
            } else if (userAgent.includes('firefox')) {
                defaultTab = 'firefox';
            } else if (userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('edg')) {
                defaultTab = 'safari';
            } else if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
                defaultTab = 'chrome';
            }
    
            let popupContent = `<div class="translation-popup-content">
    <h2>How to Translate This Page</h2>
    <p>You must be on the <strong>livelabs.oracle.com</strong> domain to use translations.<br>
       They are not available on <em>apexapps.oracle.com</em>.</p>
    <p>For the best translation experience, we recommend <strong>Google Chrome</strong>.</p>

    <!-- Tabs -->
    <div class="translation-tabs">
        <button class="tab active" data-tab="chrome">Google Chrome</button>
        <button class="tab" data-tab="safari">Safari</button>
        <button class="tab" data-tab="edge">Microsoft Edge</button>
        <button class="tab" data-tab="firefox">Firefox</button>
    </div>

    <!-- Chrome Instructions -->
    <div class="tab-content" id="chrome">
        <ol>            
            <li><strong>Right-click</strong> anywhere on the page and choose <em>“Translate to <br>[Your Language]”</em>.</li>
            <li>If that option doesn’t appear, click the <strong>⋮ three-dot menu</strong> in the <br> top-right corner of Chrome.</li>
            <li>Select <em>“Translate”</em> from the dropdown.</li>
            <li>
                Then, click the <strong>translate icon</strong>
                <img 
                    src="https://livelabs.oracle.com/cdn/common/redwood-hol/img/translate-icon-chrome.png" 
                    alt="Translate icon" 
                    style="height: 30px; vertical-align: middle; margin-left: 4px;" 
                    referrerpolicy="no-referrer"
                > in the address bar.
            </li>
            <li>If needed, click the <strong>⋮ three-dot menu</strong> within the Google <br>Translate popup and choose your preferred language.</li>
        </ol>
    </div>

    <!-- Safari Instructions -->
    <div class="tab-content" id="safari" style="display: none;">
        <ol>
            <li>
                Click the <strong>translate icon</strong>
                <img 
                    src="https://livelabs.oracle.com/cdn/common/redwood-hol/img/translate-icon-safari.png" 
                    alt="Translate icon" 
                    style="height: 30px; vertical-align: middle; margin-left: 4px;" 
                    referrerpolicy="no-referrer"
                > in the Safari address bar.
            </li>
            <li>If the icon doesn’t appear, use the menu bar at the top of your <br> screen (next to the Apple  icon).</li>
            <li>Select <strong>View</strong> → <strong>Translation</strong> → <br><em>“Translate to [Your Language]”</em>.</li>
            <li>
                If no translation languages are available, click <strong>Preferred <br>Languages</strong> in the prompt and follow these steps:
                <ol type="a">
                    <li>System Settings will open to <strong>Language & Region</strong>.</li>
                    <li>Click the <strong>+</strong> button under Preferred Languages, <br>add your desired language, and close Settings.</li>
                    <li>Return to Safari and repeat step 2 to translate the page.</li>
                </ol>
            </li>
        </ol>
    </div>

    <!-- Edge Instructions -->
    <div class="tab-content" id="edge" style="display: none;">
        <ol>
            <li><a href="${window.location.href}" target="_blank">Click here to open this workshop in a new tab.</a></li>
            <li>Right-click anywhere on the page and select <em>“Translate to [Your<br> Language]”</em>.</li>
            <li>
                If necessary, click the <strong>translate icon</strong>
                <img 
                    src="https://livelabs.oracle.com/cdn/common/redwood-hol/img/translate-icon-edge.jpg" 
                    alt="Translate icon" 
                    style="height: 30px; vertical-align: middle; margin-left: 4px;" 
                    referrerpolicy="no-referrer"
                > in the Edge address<br> bar and select the desired language.
            </li>
            <li> Click the Translate button.</li>
            <li>If you navigate to a new lab and the translation disappears, <br> repeat steps 1 through 4 to re-enable it.</li>
        </ol>
    </div>

    <!-- Firefox Instructions -->
    <div class="tab-content" id="firefox" style="display: none;">
        <ol>
            Firefox Translations is still in beta and may not work on all pages.<br> For the most consistent experience, we recommend using <br>Chrome, Safari, or Edge.
        </ol>
    </div>
</div>
            `;



            // <div class="tab-content" id="firefox" style="display: none;">
            //     <ol>
            //         <li><a href="${window.location.href}" target="_blank">Click here to open this workshop in a new tab.</a></li>
            //         <li>In the new tab, click the <strong>☰ menu</strong> (three horizontal lines) in the<br> upper-right corner of Firefox.</li>
            //         <li>Select <em>“Translate Page”</em> from the dropdown menu.</li>
            //         <li>Then, choose the language you want to translate the page into.</li>
            //     </ol>
            //     <p><em>Note: Translation is only available in Firefox version 118 and above.<br> If you don’t see this option, make sure your browser is up to date.</em></p>
            // </div>
            // </div>

            let popup = $('<div>', {
                id: 'translate_popup'
            }).html(popupContent);
    
            $('header .hol-Header-wrap').append(translate_icon);
            $('body').append(popup);
    
            // After popup is appended, activate the default tab
            $(document).ready(function () {
                // Set default active tab
                $('.translation-tabs .tab').removeClass('active');
                $('.translation-tabs .tab[data-tab="' + defaultTab + '"]').addClass('active');
    
                $('.tab-content').hide();
                $('#' + defaultTab).show();
            });
    
            // Tab click behavior
            $(document).on('click', '.translation-tabs .tab', function () {
                const selectedTab = $(this).data('tab');
                $('.translation-tabs .tab').removeClass('active');
                $(this).addClass('active');
                $('.tab-content').hide();
                $('#' + selectedTab).show();
            });
        }
    };
    
    
    
    

    /* Add the Social Media link in the header */
    // let addSocialMediaLink = function(help, wtitle) {   
    //     let url_to_share = (window.location != window.parent.location) ? document.referrer: document.location.href; 
    //     console.log(url_to_share);
    //     console.log(window.parent.location);
    //     // Share Workshop on Facebook
    //     let fb = $(document.createElement('a')).attr({ 
    //         'href': 'https://facebook.com', 
    //         'title': "Share on Facebook", 
    //         'target': '_blank', 
    //         'id': 'need_help', 
    //         'tabindex': '1' 
    //     }).text('F');        
    //     $('header .hol-Header-wrap').append(fb);

    //     let linkedin = $(document.createElement('a')).attr({ 
    //         'href': 'https://linkedin.com', 
    //         'title': "Share on LinkedIn", 
    //         'target': '_blank', 
    //         'id': 'need_help', 
    //         'tabindex': '2' 
    //     }).text('I');        
    //     $('header .hol-Header-wrap').append(linkedin);

    //     let twitter = $(document.createElement('a')).attr({ 
    //         'href': 'https://twitter.com', 
    //         'title': "Share on Twitter", 
    //         'target': '_blank', 
    //         'id': 'need_help', 
    //         'tabindex': '2' 
    //     }).text('T');
    //     $('header .hol-Header-wrap').append(twitter);
    // }

    /*
     * ============================================
