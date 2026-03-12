/*
 * ============================================
 * Oracle LiveLabs Workshop Framework
 * Version: 26.2
 * ============================================
 *
 * Version     Date             Author          Summary
 * ---------------------------------------------------------
 * 21.9        Feb-14-22       Kevin Lazarz    Added fix for LLAPEX-403 (accessible html tables)
 * 22.0        Feb-14-22       Kevin Lazarz    Added alt-text fix - add alt attribute to all images which do not have alt
 * 22.1        Feb-15-22       Kevin Lazarz    Added fix for landmark issue (LLAPEX-401) and list issue (LLAPEX-400)
 * 22.2        Feb-17-22       Kevin Lazarz    Role back LLAPEX-400 due issues in some workshops
 * 22.3        Mar-08-22       Kevin Lazarz    Temp fix for list issues LLAPEX-400, added QA check for images missing alt-text, changed numbering for table header
 * 22.4        Mar-30-22       Ashwin Agarwal  Added alt-text for modal images (LLAPEX-431)
 * 22.5        Apr-1-22        Ashwin Agarwal  Created global main.js (merge main.js * main.sprint.js) - LLAPEX-440
 * 22.6        Apr-18-22       Ashwin Agarwal  Accessibility bugs in JavaScript - anchor not in <li> - LLAPEX-400
 * 22.7        Apr-20-22       Ashwin Agarwal  Add a static header for sprints - LLAPEX-448
 * 22.8        May-09-22       Ashwin Agarwal  Single sourcing does not work for included files - LLAPEX-477
 * 22.9        Jun-01-22       Ashwin Agarwal  Remove header, custom table caption (LLAPEX-418), hide expand/collapse button (LLAPEX-465), variables (LLAPEX-487), object storage URL changes (LLAPEX-488)
 * 22.10       Jun-01-22       Ashwin Agarwal  Remove feature where the expand/collapse button disappears when there are less than or equal to 2 h2 sections
 * 22.11       Jun-15-22       Ashwin Agarwal  Relative path incorrect for included files (LLAPEX-480)
 * 22.12       Jul-15-22       Kevin Lazarz    Replace object storage links with github.io link
 * 23.0        Aug-24-22       Kevin Lazarz    Added code to allow embedding videos from Oracle Video Hub (LLAPEX-559)
 * 23.1        Sep-21-22       Kevin Lazarz    Fix for LLAPEX-595
 * 23.2        Nov-10-22       Kevin Lazarz    Added LLAPEX-637 & LLAPEX-642
 * 23.3        Mar-13-23       Dan Williams    Provided an example of imperative text (eg.'Start' not 'Starting) (LLAPEX-699)
 * 23.4        Mar-17-23       Dan Williams    Updated imperative text ( eg. 'Start' not 'Starting') to include where issue is within Lab (LLAPEX-701)
 * 23.4.1      Oct-24-24       Kevin Lazarz    Fixed Lintchecker
 * 23.5        Oct-24-24       Kaylien Phan    Fixing "includes" functionality to accommodate for CDN
 * 23.6        Mar-20-25       Brianna Ambler  Adding support for LiveSQL integration with LiveLabs sprints
 * 23.7        Jan-06-26       Brianna Ambler  Renaming LiveSQL to FreeSQL
 * 23.8        Jan-22-26       Kevin Lazarz     Modernization: Clipboard API, error handling, code organization, JSDoc
 * 24.0        Jan-22-26       Kevin Lazarz     Added lazy loading images
 * 24.1        Jan-22-26       Kevin Lazarz     Added interactive quiz feature
 * 24.2        Jan-22-26       Kevin Lazarz     Added quiz scoring with badge download
 * 24.3        Jan-22-26       Kevin Lazarz     Enhanced badge UI with preview and disclaimer
 * 24.4        Jan-23-26       Kevin Lazarz     Auto-calculate estimated reading time for "Estimated Time: X" placeholder
 * 24.5        Jan-23-26       Kevin Lazarz     Added direct video file embedding support [](video:URL)
 * 25.0        Jan-28-26       Kevin Lazarz     SQL copy-to-clipboard: added trailing newline for ```sql blocks so last statement executes
 * 26.2        Feb-06-26       ChatGPT Agent     QA parity: removed gerund checks, synced script behavior
 */

/*
 * ============================================
 * SECTION 1: CONFIGURATION & GLOBALS
 * ============================================
 */
"use strict";

var showdown = "https://oracle-livelabs.github.io/common/redwood-hol/js/showdown.min.js";
var highlight = "https://oracle-livelabs.github.io/common/redwood-hol/js/highlight.min.js";

/** @constant {string} Base path for related workshops content */
const related_path = "https://oracle-livelabs.github.io/common/related/";

let main = function () {
    // Internal configuration
    let manifestFileName = "manifest.json";
    let expandText = "Expand All Tasks";
    let collapseText = "Collapse All Tasks";

    /** @constant {string} Current domain origin */
    const currentDomain = window.location.origin;
    console.log("Current domain:", currentDomain);

    /** @constant {string} Text displayed on copy buttons */
    const copyButtonText = "Copy";

    /** @constant {string} Query parameter name for lab selection */
    const queryParam = "lab";

    /** @constant {Array<Object>} UTM tracking parameter configurations */
    const utmParams = [
        {
            "url": "https://signup.cloud.oracle.com",
            "inParam": "customTrackingParam",
            "outParam": "sourceType"
        },
        {
            "url": "https://myservices.us.oraclecloud.com/mycloud/signup",
            "inParam": "customTrackingParam",
            "outParam": "sourceType"
        },
        {
            "url": "https://myservices.oraclecloud.com/mycloud/signup",
            "inParam": "customTrackingParam",
            "outParam": "sourceType"
        },
        {
            "url": "https://cloud.oracle.com",
            "inParam": "customTrackingParam",
            "outParam": "sourceType"
        }
    ];

    /** @constant {string} Query parameter name for navigation state */
    const nav_param_name = 'nav';

    /** @constant {string} Query parameter name for header visibility */
    const header_param_name = 'header';

    /** @constant {Object} Extended navigation hash mappings */
    const extendedNav = { '#last': 2, '#next': 1, '#prev': -1, "#first": -2 };

    $.ajaxSetup({ cache: true });

    /** @type {Object|null} Global manifest file reference */
    let manifest_global;

    /*
     * ============================================
     * SECTION 2: INITIALIZATION
     * ============================================
     */
    $(document).ready(function () {
        let manifestFileContent;
        if (getParam("manifest")) {
            manifestFileName = getParam("manifest");
        }
        $.when(
            $.getScript(showdown, function () {
                console.log("Showdown library loaded!");
            }),
            $.getJSON(manifestFileName, function (manifestFile) {
                if (manifestFile.workshoptitle !== undefined) { // if manifest file contains a field for workshop title
                    document.getElementsByClassName("hol-Header-logo")[0].innerText = manifestFile.workshoptitle; // set title in the HTML output (DBDOC-2392)
                }
                console.log("Manifest file loaded!");


                if (getParam("manifest")) {
                    $(manifestFile.tutorials).each(function () {
                        if ($(this)[0].filename.indexOf("http") == -1 && $(this)[0].filename[0] !== "/") {
                            $(this)[0].filename = manifestFileName.substring(0, manifestFileName.lastIndexOf("/") + 1) + $(this)[0].filename;
                        }
                    });
                }

                // const currentDomain = window.location.origin; // e.g., "https://livelabs.oracle.com"
                // console.log("Current domain:", currentDomain);

                // Added for include feature: [DBDOC-2434] Include any file inside of Markdown before rendering
                for (let short_name in manifestFile.include) {
                    let include_fname = manifestFile.include[short_name];

                    if (include_fname.indexOf("http") === -1 && include_fname[0] !== "/") { // If the link is relative
                        include_fname = manifestFileName.substring(0, manifestFileName.lastIndexOf("/") + 1) + include_fname;
                    }

                    // Modify include_fname based on the current domain
                    if (include_fname.startsWith("/") && currentDomain.includes("livelabs.oracle.com")) {
                        include_fname = "/cdn/" + include_fname.replace(/^\/+/, ""); // Ensure correct path
                    } else if (include_fname.startsWith("/") && currentDomain.includes("apexapps-stage.oracle.com")) {
                        include_fname = "/livelabs/cdn/" + include_fname.replace(/^\/+/, ""); // Ensure correct path
                    }

                    console.log("Fetching:", include_fname);

                    $.get(include_fname, function (included_file_content) {
                        manifestFile.include[short_name] = {
                            'path': include_fname,
                            'content': included_file_content
                        };
                    }).fail(function () {
                        console.error("Failed to load:", include_fname);
                    });
                }

                if (manifestFile.variables) {
                    if (!Array.isArray(manifestFile.variables)) {
                        manifestFile['variables'] = Array(manifestFile.variables);
                    }
                    $(manifestFile.variables).each(function (_, i) {
                        let include_fname = i;
                        // console.log("Variables:" , include_fname);

                        // Modify include_fname based on the current domain
                        if (include_fname.startsWith("/") && currentDomain.includes("livelabs.oracle.com")) {
                            include_fname = "/cdn/" + include_fname.replace(/^\/+/, ""); // Ensure correct path
                        } else if (include_fname.startsWith("/") && currentDomain.includes("apexapps-stage.oracle.com")) {
                            include_fname = "/livelabs/cdn/" + include_fname.replace(/^\/+/, ""); // Ensure correct path
                        }
                        console.log("Variables:" , include_fname);

                        $.getJSON(include_fname, function (variables) {
                            if (!manifestFile['variable_values']) {
                                manifestFile['variable_values'] = {};
                            }
                            $.extend(manifestFile['variable_values'], variables);
                        });
                    })
                }

                manifest_global = manifestFileContent = manifestFile; //reading the manifest file and storing content in manifestFileContent variable                
            }),
            $.getScript(highlight, function () {
                console.log("Highlight.js loaded!");
            })
        ).done(function () {
            init();
            let selectedTutorial = setupTutorialNav(manifestFileContent); //populate side navigation based on content in the manifestFile            
            let articleElement = document.createElement('article'); //creating an article that would contain MD to HTML converted content

            loadTutorial(articleElement, selectedTutorial, manifestFileContent, toggleTutorialNav);

            prepareToc(manifestFileContent);
            setupRelatedSection(manifestFileContent);

            setTimeout(function () {
                if (location.hash.slice(1))
                    expandSectionBasedOnHash($("li[data-unique='" + location.hash.slice(1) + "']"));

                if ($('#leftNav-toc').hasClass('scroll'))
                    $('.selected')[0].scrollIntoView(true);
            }, 1000);
        });
    });

    // specifies when to do when window is scrolled
    $(window).scroll(function () {
        // if ($('#contentBox').height() > $('#leftNav-toc').height() || ($('#leftNav-toc').height() + $('header').height()) > $(window).height()) {
        if (($('#contentBox').outerHeight() + $('header').outerHeight() + $('footer').outerHeight()) > $(window).outerHeight()) {
            $('#leftNav-toc').addClass("scroll");

            if (($(window).scrollTop() + $(window).height()) > $('footer').offset().top) { //if footer is seen
                $('#leftNav-toc').css('max-height', $('footer').offset().top - $('#leftNav-toc').offset().top);
            } else {
                $('#leftNav-toc').css('max-height', $(window).height() - $('header').height());
            }
        } else {
            $('#leftNav-toc').removeClass("scroll");
        }

        try {
            if ((document.querySelector('.selected .active').getBoundingClientRect().y + document.querySelector('.selected .active').clientHeight) > $(window).height() && $('#leftNav-toc').hasClass("scroll"))
                $('.selected .active')[0].scrollIntoView(false);
        } catch (e) { console.debug('TOC scroll error:', e); }

        let active = $('#contentBox').find('[data-unique]').first();
        $('#contentBox').find('[data-unique]').each(function () {
            if (($(this).offset().top - $(window).scrollTop() - $('header').height()) < Math.abs($(active).offset().top - $(window).scrollTop())) {
                active = $(this);
            }
        });
        $('.selected .toc .toc-item').removeClass('active');
        $('.selected .toc').find('[data-unique="' + $(active).attr('data-unique') + '"]').addClass('active');
    });

    $(window).on('hashchange load', function (e) {
        try { // if next or previous is not available then it raises exception
            let position = extendedNav[e.target.location.hash]
            if (position !== undefined)
                changeTutorial(getMDFileName(selectTutorial(manifest_global, position).filename));

            setTimeout(function () {
                // Cause a subtle change in the parent page to trigger Google Translate
                // if (window.parent && window.parent.document) {
                    let body = window.parent.document.body;
            
                    // Find or create a subtle trigger element
                    let triggerElement = window.parent.document.getElementById("translation-trigger");
                    if (!triggerElement) {
                        triggerElement = window.parent.document.createElement("span");
                        triggerElement.id = "translation-trigger";
                        triggerElement.style.display = "none"; // Keep it invisible
                        body.appendChild(triggerElement);
                    }
            
                    // Toggle text content to force translation detection
                    triggerElement.textContent = triggerElement.textContent === "." ? " " : ".";
                    console.log("Translation trigger updated:", triggerElement);
                // }
            }, 500); // Adjust delay as needed
        } catch (e) { console.debug('Hash change error:', e); }
    });

    let init = function () {
        // hide header if the url contains header=hide
        let header_param = getParam(header_param_name);
        if (header_param == 'hide') {
            $('header').hide();
            $('body').css("padding-top", "0px");
        }
        // $('.hol-Header-actions').prependTo('.hol-Header-wrap').show();
        $('.hol-Header-actions').prependTo('.hol-Header-wrap');
        $('<div id="tutorial-title"></div>').appendTo(".hol-Header-logo")[0];

        $('#openNav').click(function () {
            let nav_param = getParam(nav_param_name);
            if (!nav_param || nav_param === 'open') {
                window.history.pushState('', '', setParam(window.location.href, nav_param_name, 'close'));
            } else if (nav_param === 'close') {
                window.history.pushState('', '', setParam(window.location.href, nav_param_name, 'open'));
            }
            toggleTutorialNav();
        });

        $('.hol-Footer-topLink').after($(document.createElement('a')).addClass('hol-Footer-rightLink hide'));
        $('.hol-Footer-topLink').before($(document.createElement('a')).addClass('hol-Footer-leftLink hide'));
        $('#contentBox').css('min-height', $(window).height() - $('header').outerHeight() - $('footer').outerHeight());
        $('.hol-Header-actions').show('slide');
    }

    /*
     * ============================================
