     * SECTION 3: MARKDOWN PROCESSING
     * ============================================
     */

    /**
     * Loads and renders a tutorial from markdown
     * @param {HTMLElement} articleElement - Container for rendered content
     * @param {Object} selectedTutorial - Tutorial object from manifest
     * @param {Object} manifestFileContent - Full manifest configuration
     * @param {Function} [callbackFunc=null] - Optional callback after load
     */
    const loadTutorial = function (articleElement, selectedTutorial, manifestFileContent, callbackFunc = null) {
        let tut_fname;

        // const currentDomain = window.location.origin; // e.g., "https://livelabs.oracle.com"
        // console.log("Current domain:", currentDomain);

        // Modify tut_fname based on the current domain
        if (selectedTutorial.filename.startsWith("/") && currentDomain.includes("livelabs.oracle.com")) {
            tut_fname = "/cdn/" + selectedTutorial.filename.replace(/^\/+/, ""); // Ensure correct path
        } else if (selectedTutorial.filename.startsWith("/") && currentDomain.includes("apexapps-stage.oracle.com")) {
            tut_fname = "/livelabs/cdn/" + selectedTutorial.filename.replace(/^\/+/, ""); // Ensure correct path
        } else {
            tut_fname = selectedTutorial.filename;
        }

        $.get(tut_fname, function (markdownContent) { //reading MD file in the manifest and storing content in markdownContent variable
            console.log(tut_fname + " loaded!");

            if (selectedTutorial.filename == 'preview' && markdownContent == "None") {
                markdownContent = window.localStorage.getItem("mdValue");
            }

            markdownContent = include(markdownContent, manifestFileContent.include); // added for include feature: [DBDOC-2434] Include any file inside of Markdown before rendering
            markdownContent = substituteVariables(markdownContent, manifestFileContent.variable_values); // added for variable feature
            markdownContent = calculateEstimatedTime(markdownContent); // calculates and replaces "Estimated Time: X" placeholder
            markdownContent = singlesource(markdownContent, selectedTutorial.type); // implement show/hide feature based on the if tag (DBDOC-2430)
            markdownContent = convertFreeSQLButtonTags(markdownContent); // converts <freesql-button> tags to actual FreeSQL buttons
            markdownContent = convertBracketInsideCopyCode(markdownContent); // converts <> tags inside copy tag to &lt; and &gt; (DBDOC-2404)
            markdownContent = addPathToImageSrc(markdownContent, tut_fname); //adding the path for the image based on the filename in manifest
            markdownContent = addPathToTypeHrefs(markdownContent); // if type is specified in the markdown, then add absolute path for it.
            markdownContent = convertSingleLineCode(markdownContent);
            markdownContent = convertQuizBlocks(markdownContent); // converts ```quiz blocks to interactive quiz HTML
            markdownContent = convertCodeBlocks(markdownContent); // codeblock with multiple breaks don't render correctly, so I convert to codeblock here itself

            $(articleElement).html(new showdown.Converter({
                tables: true, //allows tables to rendered
                parseImgDimensions: true, //allows image dimension to be specified in the markdown
                metadata: true, // allows metadata to be added between --- and --- tags at the top of the markdown
                simplifiedAutoLink: true, //transform http addresses automatically in to clickable URLs in HTML
                strikethrough: true //allow strikethrough formatting
            }).makeHtml(markdownContent)); //converting markdownContent to HTML by using showdown plugin

            articleElement = updateOpenCloseButtonText(articleElement, manifestFileContent); // in the manifest file, you can specify task_type to specify different text
            articleElement = showRightAndLeftArrow(articleElement, manifestFileContent);
            articleElement = renderVideoHubVideos(articleElement); //adds iframe to Oracle Video Hub videos
            articleElement = renderYouTubeVideos(articleElement); //adds iframe to YouTube videos
            articleElement = renderDirectVideos(articleElement); //adds HTML5 video element for direct video URLs
            articleElement = updateH1Title(articleElement); //adding the h1 title in the Tutorial before the container div and removing it from the articleElement
            articleElement = wrapSectionTag(articleElement); //adding each section within section tag
            articleElement = wrapImgWithFigure(articleElement); //Wrapping images with figure, adding figcaption to all those images that have title in the MD
            articleElement = addPathToAllRelativeHref(articleElement, tut_fname); //adding the path for all HREFs based on the filename in manifest
            articleElement = setH2Name(articleElement);
            articleElement = makeAnchorLinksWork(articleElement); //if there are links to anchors (for example: #hash-name), this function will enable it work
            articleElement = addTargetBlank(articleElement); //setting target for all ahrefs to _blank
            articleElement = allowCodeCopy(articleElement); //adds functionality to copy code from codeblocks
            articleElement = enableForceDownload(articleElement); // enables the force download feature (?download=1 must be mentioned at the end of the URL)
            articleElement = injectUtmParams(articleElement);
            articleElement = showTabs(articleElement, selectedTutorial.type); //show type options as tabs (DBDOC-2455)
            articleElement = highlightCodeBlock(articleElement); // highlights the code in the codeblock (DBDOC-2494)
            articleElement = addModalWindow(articleElement); // add modal window so that images open in full screen when clicked (DBDOC-2575)
            updateHeadContent(selectedTutorial, manifestFileContent.workshoptitle); //changing document head based on the manifest

            // adding link to the support forum URL in the footer if the manifest file contains it (DBDOC-2459 and DBDOC-2496)
            addGoToForumLink(manifestFileContent.support);
            // adding social media link to the header
            // addSocialMediaLink(manifestFileContent.help, manifestFileContent.workshoptitle);
            // adding link to the Neep Help URL in the header if the manifest file contains it (DBDOC-2496)
            
            // KP Translate 
            $(document).ready(function () {
                addTranslateIcon(manifestFileContent.help); 
            
                $(document).on('click', function (e) {
                    if (!$(e.target).closest('#translate_icon, #translate_popup').length) {
                        $('#translate_popup').hide();
                    }
                });
            });
            addNeedHelpLink(manifestFileContent.help);

            if (getParam("qa") == "true") {
                articleElement = performQA(articleElement, markdownContent, manifestFileContent);
            }
        }).done(function () {
            $("main").html(articleElement); //placing the article element inside the main tag of the Tutorial template
            setTimeout(function () {
                setupContentNav(manifestFileContent, articleElement);
            }, 0); //sets up the collapse/expand button and open/close section feature



            //FOllowing code will make sure that landmarks have a unique title (LLAPEX-401)
            document.getElementsByTagName("header")[0].setAttribute("title", "livelabs header");
            document.getElementsByTagName("main")[0].setAttribute("title", "livelabs main");
            document.getElementsByTagName("footer")[0].setAttribute("title", "livelabs footer");
            //END of fix for landmarks

            // Following code makes tables accessible (see LLAPEX-403)
            $("table").attr("role", "presentation"); //add role to table

            var i = 0;
            var tables = document.getElementsByTagName("table");
            let title = document.querySelector('title').innerText;
            let caption_start = '{: title="';

            for (i; i < tables.length; i++) {
                var table = tables[i];
                var capt = table.createCaption();
                let given_title = null;
                let next_element = $($(tables)[i]).find('tr').last();
                if (next_element.text().trim().startsWith(caption_start)) {
                    given_title = next_element.text().trim().replace(caption_start, "");
                    given_title = given_title.replace('"}', "");
                    $(next_element).remove();
                }
                var tit = capt.textContent = 'Table ' + (i + 1) + ': ' + (given_title || title);
                table.setAttribute("role", "presentation");
            };
            // END OF TABLE ACCESSIBILITY ENHANCEMENT

            if (selectedTutorial.filename == 'preview') {
                let uploaded_images = JSON.parse(window.localStorage.getItem("imagesValue"));

                // added for showing images in preview
                if (uploaded_images !== null) {
                    $('main').find('img').each(function (i, imageFile) {
                        for (let i = 0; i < uploaded_images.length; i++) {
                            if ($(imageFile).attr('src').indexOf(uploaded_images[i].filename) >= 0) {
                                $(imageFile).attr('src', uploaded_images[i].src);
                            }
                        }
                    });
                }
            }

            if (getParam("qa") == "true") {
                dragElement(document.getElementById("qa-report"));
            } else {
                collapseSection($("#module-content h2:not(:eq(0))"), "none"); //collapses all sections by default
            }

            if (callbackFunc)
                callbackFunc();

        }).fail(function () {
            console.log(selectedTutorial.filename + ' not found! Please check that the file is available in the location provided in the manifest file.');
        });
    }

    let convertSingleLineCode = function (markdown) {
        let regex_type = new RegExp(/`{3,4}(.*?)`{3,4}/g);
        let contentToReplace = [];

        let matches;
        do {
            matches = regex_type.exec(markdown);
            if (matches === null) {
                $(contentToReplace).each(function (index, value) {
                    markdown = markdown.replace(value.replace, value.with);
                });
                return markdown;
            }

            contentToReplace.push({
                "replace": matches[0],
                "with": '`' + matches[1] + '`'
            });

        } while (matches);
    }

    //DBDOC-2591: Code blocks break when line breaks (empty lines) are added
    let convertCodeBlocks = function (markdown) {
        let regex_type = new RegExp(/`{3,}(.*?)\n([\s\S|\n]*?)`{3,}/g);
        let matches, remove, remove_space_regex;
        let contentToReplace = [];

        do {
            let pre_tag = "<pre>";
            matches = regex_type.exec(markdown);
            if (matches === null) {
                $(contentToReplace).each(function (index, value) {
                    // replace using split because the string has regex
                    markdown = markdown.split(value.replace).join(value.with);
                });
                return markdown;
            }
            // else
            remove = matches[2].substring(0, matches[2].indexOf(matches[2].trim())).replace(/\t/g, '    ');
            // remove_space_regex = new RegExp("^" + remove, "gm");

            if (matches[1].trim().length !== 0) {
                pre_tag = '<pre class="' + matches[1].trim() + '">';
            }

            let replace_with = matches[2].replace(/\t/g, '    ').split('\n');

            for (let i = 0; i < replace_with.length; i++) {
                replace_with[i] = replace_with[i].replace(remove, '');
            }
            replace_with = replace_with.join('\n');

            contentToReplace.push({
                "replace": matches[0],
                "with": pre_tag + '<code>' + replace_with.trim() + '</code></pre>'
                // "with": pre_tag + '<code>' + matches[2].replace(/(?=[\r\n])\r?\n?/g,"\n") + '</code></pre>'
                // "with": pre_tag + '<code>' + matches[2].replace(remove_space_regex, '').trim().replace(/\t/g, '') + '</code></pre>'
            });
        } while (matches);
    }

    /**
     * Converts ```quiz-config blocks to store quiz scoring configuration
     * Syntax:
     *   passing: 80
     *   badge: images/badge.png
     */
    let convertQuizConfig = function (markdown) {
        let configRegex = /`{3,}quiz-config\s*\n([\s\S]*?)`{3,}/g;

        return markdown.replace(configRegex, function (match, content) {
            let config = {
                passing: 80,
                badge: null
            };

            let lines = content.trim().split('\n');
            lines.forEach(function (line) {
                // Allow optional whitespace at start of line
                let passingMatch = line.match(/^\s*passing:\s*(\d+)/i);
                let badgeMatch = line.match(/^\s*badge:\s*(.+)/i);

                if (passingMatch) {
                    config.passing = parseInt(passingMatch[1], 10);
                }
                if (badgeMatch) {
                    config.badge = badgeMatch[1].trim();
                }
            });

            // Return a hidden div with config data
            return '<div id="ll-quiz-config" data-passing="' + config.passing + '" data-badge="' + (config.badge || '') + '" style="display:none;"></div>';
        });
    }

    /**
     * Converts ```quiz code blocks to interactive quiz HTML
     * Syntax:
     *   Q: Question text here
     *   * Correct answer (asterisk marks correct)
     *   - Wrong answer (dash marks incorrect)
     *   > Optional explanation shown after answering
     *
     * Add 'score' after quiz to include in scoring: ```quiz score
     * Multiple correct answers = checkboxes, single correct = radio buttons
     */
    let convertQuizBlocks = function (markdown) {
        // First process quiz-config blocks
        markdown = convertQuizConfig(markdown);

        let quizRegex = /`{3,}quiz(\s+score)?\s*\n([\s\S]*?)`{3,}/g;
        let quizId = 0;
        let scoredQuizCount = 0;

        let result = markdown.replace(quizRegex, function (match, scoreFlag, content) {
            let html = '';
            let isScored = scoreFlag && scoreFlag.trim() === 'score';
            let lines = content.trim().split('\n');
            let currentQuestion = null;
            let questions = [];

            // Parse quiz content
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].trim();

                if (line.match(/^Q:\s*/i)) {
                    // New question
                    if (currentQuestion) {
                        questions.push(currentQuestion);
                    }
                    currentQuestion = {
                        text: line.replace(/^Q:\s*/i, ''),
                        options: [],
                        explanation: null
                    };
                } else if (line.match(/^\*\s+/)) {
                    // Correct answer
                    if (currentQuestion) {
                        currentQuestion.options.push({
                            text: line.replace(/^\*\s+/, ''),
                            correct: true
                        });
                    }
                } else if (line.match(/^-\s+/)) {
                    // Incorrect answer
                    if (currentQuestion) {
                        currentQuestion.options.push({
                            text: line.replace(/^-\s+/, ''),
                            correct: false
                        });
                    }
                } else if (line.match(/^>\s*/)) {
                    // Explanation
                    if (currentQuestion) {
                        currentQuestion.explanation = line.replace(/^>\s*/, '');
                    }
                }
            }

            // Don't forget the last question
            if (currentQuestion) {
                questions.push(currentQuestion);
            }

            // Generate HTML for each question
            questions.forEach(function (q, qIndex) {
                let qId = 'quiz-' + quizId + '-q' + qIndex;
                let correctCount = q.options.filter(o => o.correct).length;
                let inputType = correctCount > 1 ? 'checkbox' : 'radio';
                let inputName = qId + '-options';

                if (isScored) {
                    scoredQuizCount++;
                }

                html += '<div class="ll-quiz' + (isScored ? ' ll-quiz-scored' : '') + '" data-quiz-id="' + qId + '" data-scored="' + isScored + '" data-answered="false" data-correct="false">';

                // Add header with score display for scored quizzes
                if (isScored) {
                    html += '<div class="ll-quiz-header"><span class="ll-quiz-badge-label">Scored Quiz</span><span class="ll-quiz-score-display"></span></div>';
                }

                html += '<div class="ll-quiz-question">' + q.text + '</div>';
                html += '<div class="ll-quiz-options">';

                q.options.forEach(function (opt, optIndex) {
                    let optId = qId + '-opt' + optIndex;
                    html += '<label class="ll-quiz-option" data-correct="' + opt.correct + '">';
                    html += '<input type="' + inputType + '" name="' + inputName + '" id="' + optId + '" value="' + optIndex + '">';
                    html += '<span class="ll-quiz-option-text">' + opt.text + '</span>';
                    html += '<span class="ll-quiz-feedback"></span>';
                    html += '</label>';
                });

                html += '</div>';

                if (q.explanation) {
                    html += '<div class="ll-quiz-explanation" style="display:none;">' + q.explanation + '</div>';
                }

                html += '<button type="button" class="ll-quiz-check" onclick="checkQuizAnswer(\'' + qId + '\', ' + (inputType === 'checkbox') + ')">Check Answer</button>';
                html += '<button type="button" class="ll-quiz-retry" style="display:none;" onclick="retryQuiz(\'' + qId + '\')">Try Again</button>';
                html += '<div class="ll-quiz-result"></div>';
                html += '</div>';

                quizId++;
            });

            return html;
        });

        // If there are scored quizzes, add a hidden tracker for state and badge container
        if (scoredQuizCount > 0) {
            result += '<div id="ll-quiz-score-tracker" data-total="' + scoredQuizCount + '" data-correct="0" data-answered="0">';
            result += '<div class="ll-quiz-badge-container" style="display:none;"></div>';
            result += '</div>';
        }

        return result;
    }

    // DBDOC-2575: Add ability to expand images to full screen
    let addModalWindow = function (articleElement) {
        let modalClose = $(document.createElement('span')).attr('id', 'modalClose').html("&times;");
        let modalImg = $(document.createElement('img')).attr('id', 'modalImg');
        let modalCaption = $(document.createElement('div')).attr('id', 'modalCaption');
        let modalWindow = $(document.createElement('div')).attr('id', 'modalWindow');

        $(modalWindow).append([modalCaption, modalClose, modalImg]);
        $(articleElement).append(modalWindow);

        $(articleElement).find('img').click(function () {
            $(modalImg).attr({ src: this.src, alt: this.alt });
            $(modalWindow).addClass('show');
            $(modalCaption).text(this.alt);
        })
        $(modalWindow).click(function () {
            $(modalWindow).removeClass('show');
        })

        return articleElement;
    }

    // DBDOC-2455: Support for content selectable via tabs
    let showTabs = function (articleElement, type) {
        if ($.type(type) == "object") { // if true, it means select tab needs to be added
            let div = $(document.createElement('div')).addClass('selection_tabs');
            let tab = $(document.createElement('ul')).addClass('tab');

            if (getParam("type") == false) {
                window.history.pushState('', '', setParam(window.location.href, 'type', Object.keys(type)[0]));
            }

            $(Object.keys(type)).each(function (_, type_key) {
                let li = $(document.createElement('li')).addClass('btn_if_' + type_key);
                // $(li).html('<a href="' + setParam(window.location.href, 'type', type_key) + '">' + type[type_key] + '</a>');
                $(li).html('<a href="#">' + type[type_key] + '</a>');
                $(li).find('a').click(function () {
                    $(this).attr('href', setParam(window.location.href, 'type', type_key));
                });
                $(tab).append(li);

                if (type_key == getParam("type")) {
                    $(li).find('a').addClass('active');
                }
            });

            $(div).append(tab);
            $(articleElement).find('h2:not(:eq(0))').after(div);
            $(articleElement).find('h1').after(div);
            $(articleElement).find('.selection_tabs:not(:eq(0))').addClass('stick');
        }

        return articleElement;
    }
    // DBDOC-2494: added for syntax highlight feature. The syntax highlight feature uses the highlight.js plugin.
    let highlightCodeBlock = function (articleElement) {
        $(articleElement).find('pre:not(.nohighlighting) code').each(function (_, block) {
            hljs.highlightBlock(block);
        });
        return articleElement;
    }

    // DBDOC-2449: added for force download feature. To force download a file referenced in the link, append '?download=1' to the link.
    let enableForceDownload = function (articleElement) {
        $(articleElement).find('a[href$="?download=1"]').each(function () { // loop through each link that ends with ?download=1
            $(this).attr('download', ''); // set download attribute to the link
            $(this)[0].href = $(this)[0].href.replace('?download=1', ''); // removes ?download=1 from the link
        });
        return articleElement;
    }

    // added for include feature: [DBDOC-2434] Include any file inside of Markdown before rendering
    let include = function (markdown, include) {
        for (let short_name in include) {
            if (typeof include[short_name] !== 'object')
                continue;
            include[short_name]['content'] = addPathToImageSrc(include[short_name]['content'], include[short_name]['path']);
            // console.log("include function: " ,include[short_name]['path'] );
            markdown = markdown.split("[](include:" + short_name + ")").join(include[short_name]['content']);
        }
        return markdown;
    }

    // added for variable substitute feature
    let substituteVariables = function (markdown, all_variables) {
        for (let variable in all_variables) {
            markdown = markdown.split("[](var:" + variable + ")").join(all_variables[variable]);
        }
        return markdown;
    }

    /**
     * Calculates estimated reading time and replaces "Estimated Time: X" or "Estimated Time: x"
     * Only replaces if the pattern contains exactly X or x as placeholder
     * @param {string} markdown - The markdown content
     * @returns {string} - Markdown with calculated time replacing placeholder
     */
    let calculateEstimatedTime = function (markdown) {
        // Only match exactly "Estimated Time: X" or "Estimated Time: x"
        // Use [ \t]* instead of \s* to avoid consuming newlines
        const placeholderPattern = /Estimated Time:[ \t]*([Xx])[ \t]*(?:minutes?)?/;
        const match = markdown.match(placeholderPattern);

        // If no placeholder found, return unchanged
        if (!match) {
            return markdown;
        }

        // Extract code blocks first (to count separately)
        const codeBlockPattern = /```[\s\S]*?```/g;
        const codeBlocks = markdown.match(codeBlockPattern) || [];

        // Remove code blocks from markdown for regular word count
        let textContent = markdown.replace(codeBlockPattern, '');

        // Count images
        const imagePattern = /!\[.*?\]\(.*?\)/g;
        const imageCount = (markdown.match(imagePattern) || []).length;

        // Remove markdown syntax for cleaner word count
        textContent = textContent
            .replace(/!\[.*?\]\(.*?\)/g, '')           // Remove images
            .replace(/\[.*?\]\(.*?\)/g, '')            // Remove links
            .replace(/#{1,6}\s*/g, '')                 // Remove headers
            .replace(/[*_`~]/g, '')                    // Remove formatting
            .replace(/<[^>]+>/g, '')                   // Remove HTML tags
            .replace(/\|/g, ' ')                       // Replace table pipes
            .replace(/[-=]{3,}/g, '');                 // Remove horizontal rules

        // Count words in regular text
        const textWords = textContent.split(/\s+/).filter(word => word.length > 0).length;

        // Count words in code blocks
        let codeWords = 0;
        codeBlocks.forEach(block => {
            const codeContent = block.replace(/```\w*\n?/g, '').replace(/```/g, '');
            codeWords += codeContent.split(/\s+/).filter(word => word.length > 0).length;
        });

        // Calculate reading time
        // Text: 225 words per minute (middle of 200-250)
        // Code: 200 words per minute (10% slower)
        // Images: 12 seconds each
        const textMinutes = textWords / 225;
        const codeMinutes = codeWords / 200;
        const imageMinutes = (imageCount * 12) / 60;

        // Total time with 10% added for hands-on instructions
        let totalMinutes = (textMinutes + codeMinutes + imageMinutes) * 1.10;

        // Round up to next 5-minute increment
        totalMinutes = Math.ceil(totalMinutes / 5) * 5;

        // Ensure minimum of 5 minutes
        if (totalMinutes < 5) {
            totalMinutes = 5;
        }

        // Replace the placeholder with calculated time
        markdown = markdown.replace(placeholderPattern, 'Estimated Time: ' + totalMinutes + ' minutes');

        console.log('Estimated Time calculated:', totalMinutes, 'minutes (text:', textWords, 'words, code:', codeWords, 'words, images:', imageCount + ')');

        return markdown;
    }

    let addPathToTypeHrefs = function (markdown) {
        let regex_type = new RegExp(/\[(?:.+?)\]\((&type=(\S*?))\)/g);
        let matches;

        do {
            matches = regex_type.exec(markdown);
            if (matches !== null) {
                markdown = markdown.replace(matches[1], setParam(window.location.href, "type", matches[2]));
            }
        } while (matches);

        return markdown;
    }

    let arrowClick = function () {
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

    let setupRelatedSection = function (manifestFileContent) {
        // this part has been added for LLAPEX-448
        const max_related = 5;
        let related_li = [];
        if ('show_related' in manifestFileContent) {
            let related_content;
            let tut_titles = [];

            for (let i = 0; i < manifestFileContent.tutorials.length; i++) {
                tut_titles[i] = manifestFileContent.tutorials[i].title.toLowerCase();
            }

            for (let i = 0; i < manifestFileContent.show_related.length; i++) {
                if (!('filename' in manifestFileContent.show_related[i]) || !('tags' in manifestFileContent.show_related[i]) || !('title' in manifestFileContent.show_related[i])) {
                    continue;
                }
                $.getJSON(related_path + manifestFileContent.show_related[i]['filename'], function (content) {
                    related_content = content;
                }).done(function () {
                    related_li[i] = $(document.createElement('li')).attr('id', 'related-content-' + i).css({ 'border-bottom': '0px', 'padding-left': '36px', 'cursor': 'default', 'background-color': 'rgb(0,0,0,0.06)' });

                    let div_main = $(document.createElement('div'));
                    let a = $(document.createElement('a')).css('cursor', 'pointer');
                    let arrow, div;

                    $(a).click(function () {
                        $(this).prev().click();
                    });
                    $(a).append($(document.createElement('div')).text(manifestFileContent.show_related[i]['title']).css({ 'font-weight': '600' }));
                    $(div_main).append(a);
                    $(related_li[i]).append(div_main);
                    div = $(document.createElement('div')).attr('id', 'toc-related-' + i).addClass('toc');
                    $(div_main).append(div);

                    if ('state' in manifestFileContent.show_related[i] && manifestFileContent.show_related[i]['state'] === "collapsed") {
                        $(div).hide();
                        arrow = $(document.createElement('div')).addClass('arrow').text('+');
                    } else {
                        arrow = $(document.createElement('div')).addClass('arrow').text('-');
                    }

                    $(arrow).css('cursor', 'pointer').click(arrowClick);
                    $(div_main).prepend(arrow);
                    $("#leftNav-toc ul.hol-Nav-list:first-of-type").append(related_li[i]);

                    // for each related workshop
                    let related_workshops = {};
                    let tags = manifestFileContent.show_related[i]['tags'];
                    $(tags).each(function (_, tag) {
                        related_workshops = { ...related_workshops, ...related_content[tag] };
                    });

                    let filtered_workshops = {};

                    for (let j = 0; j < Object.keys(related_workshops).length; j++) {
                        if (manifestFileContent.workshoptitle.toLowerCase() === Object.keys(related_workshops)[j].toLowerCase()) continue;
                        if ($.inArray(Object.keys(related_workshops)[j].toLowerCase(), tut_titles) != -1) continue;

                        filtered_workshops[Object.keys(related_workshops)[j]] = related_workshops[Object.keys(related_workshops)[j]];
                    }

                    let filter = Object.keys(filtered_workshops).sort(() => Math.random() - Math.random()).slice(0, max_related);

                    $(filter).each(function (_, f) {
                        let ul = document.createElement('ul');
                        let li = $(document.createElement('li')).addClass('toc-item').text(f);
                        $(li).wrapInner('<a href="' + filtered_workshops[f] + '"></a>');
                        $(ul).append(li);
                        $(ul).appendTo(div);
                    });
                });
            }
        }
    }
    let prepareToc = function (manifestFileContent) {
        let h2_regex = new RegExp(/^##\s(.+)*/gm);
        let h2s_list = [];
        let matches;
        let tut_fname;

        // const currentDomain = window.location.origin; // e.g., "https://livelabs.oracle.com"

        $(manifestFileContent.tutorials).each(function (i, tutorial) {
            let ul;
            let div = document.createElement('div');
            $(div).attr('id', 'toc' + i).addClass('toc');

            // Modify tut_fname based on the current domain
            if (tutorial.filename.startsWith("/") && currentDomain.includes("livelabs.oracle.com")) {
                tut_fname = "/cdn/" + tutorial.filename.replace(/^\/+/, ""); // Ensure correct path
            } else if (tutorial.filename.startsWith("/") && currentDomain.includes("apexapps-stage.oracle.com")) {
                tut_fname = "/livelabs/cdn/" + tutorial.filename.replace(/^\/+/, ""); // Ensure correct path
            } else {
                tut_fname = tutorial.filename;
            }

            $.get(tut_fname, function (markdownContent) { //reading MD file in the manifest and storing content in markdownContent variable
                if (tutorial.filename == 'preview' && markdownContent == "None") {
                    markdownContent = window.localStorage.getItem("mdValue");
                }
                markdownContent = include(markdownContent, manifestFileContent.include);
                markdownContent = singlesource(markdownContent, tutorial.type);

                do {
                    matches = h2_regex.exec(markdownContent);

                    if (matches !== null) {
                        ul = document.createElement('ul');
                        $(ul).append($(document.createElement('li')).addClass('toc-item').text(matches[1].replace(/\**/g, '').replace(/\##/g, '')).attr('data-unique', alphaNumOnly(matches[1])));
                        $(ul).click(function () {
                            if ($(this).parent().parent().parent().hasClass('selected')) {
                                location.hash = alphaNumOnly($(this).text());
                                expandSectionBasedOnHash($(this).find('li').attr('data-unique'));
                            } else {
                                changeTutorial(getMDFileName(tutorial.filename), alphaNumOnly($(this).text()));
                            }

                        });

                        // fix added for LLAPEX-400
                        $(ul).each(function () {
                            if (tutorial !== selectTutorial(manifestFileContent)) {
                                let li = $(this).find('li')[0];
                                $(li).wrapInner('<a href="' + unescape(setParam(window.location.href, queryParam, getMDFileName(tutorial.filename))) + '#' + $(li).attr('data-unique') + '"></a>');
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
        $(".hol-Nav-list>li").wrapInner("<div></div>")

        $(".hol-Nav-list>li>div").prepend($(document.createElement('div')).addClass('arrow').text('+'));

        $('.hol-Nav-list > li > div .arrow').click(arrowClick);

        $('.selected div.arrow').text('-');
        $('.hol-Nav-list > li:not(.selected) .toc').hide();

    }

    let toggleTutorialNav = function () {
        let nav_param = getParam(nav_param_name);

        if (!nav_param || nav_param === 'open') {
            $('.hol-Nav-list > li:not(.selected)').attr('tabindex', '0');
            $('#leftNav-toc, #leftNav, #contentBox').addClass('open').removeClass('close');
        } else if (nav_param === 'close') {
            $('.hol-Nav-list > li:not(.selected)').attr('tabindex', '-1');
            $('#leftNav-toc, #leftNav, #contentBox').addClass('close').removeClass('open');
        }
        setTimeout(function () {
            $(window).scroll();
        }, 100);
    }

    /*
     * ============================================
