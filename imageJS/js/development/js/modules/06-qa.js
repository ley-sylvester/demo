     * SECTION 7: QA VALIDATION
     * ============================================
     */

    /**
     * Performs QA validation on the article content
     * @param {HTMLElement} articleElement - The article element to validate
     * @param {string} markdownContent - The raw markdown content
     * @param {Object} manifestFileContent - The manifest file content
     * @returns {jQuery} The article element with QA report prepended
     */
    const performQA = function (articleElement, markdownContent, manifestFileContent) {
        let error_div = $(document.createElement('div')).attr('id', 'qa-report').html("<div id='qa-reportheader'></div><div id='qa-reportbody'><ol></ol></div>");
        const more_info = "Please see <a href='https://oracle-livelabs.github.io/common/sample-livelabs-templates/create-labs/labs/workshops/livelabs/?lab=4-labs-markdown-develop-content' target='_blank'>using the LiveLabs template</a> for more information.";

        let urlExists = function (url, callback) {
            $.ajax({
                type: 'HEAD',
                url: url,
                success: function () {
                    callback(true);
                },
                error: function () {
                    callback(false);
                }
            });
        }

        let add_issue = function (error_msg, error_type = "", follow_id = false) {
            if (follow_id) {
                $(error_div).find('ol').append("<li class=" + error_type + ">" + error_msg + " <small onclick=\"window.scrollTo({top:$('." + follow_id + "').offset().top - ($('header').outerHeight() + 10), behavior: 'smooth'});\">(show)</small></li>");
            } else {
                $(error_div).find('ol').append("<li class=" + error_type + ">" + error_msg + "</li>");
            }

        }

        let checkH1 = function (article) {
            if ($(article).find('h1').length !== 1) {
                add_issue("Only a single title is allowed, please edit your Markdown file and remove or recast other content tagged with a single #.", "major-error");
                $(article).find('h1').addClass('error');
            }
        }

        let checkForGerundInTitle = function (manifest) {
            // removed in 26.2
            return;
            if (manifest.workshoptitle.indexOf("ing ") !== -1) {
                //updated to specifiy what Imperative means
                add_issue("Your workshop title uses a gerund. Consider using an imperative verb workshop title, for example, 'Start' instead of 'Starting'.", "major-error")
                // add_issue("Please use an imperative workshop title instead of a gerund,(e.g 'Start' not 'Starting').", "major-error")
            }
        }

        let checkForGerundInLabTitle = function (manifest) {
            // removed in 26.2
            return;
            var i = 0;
            while (i < manifest.tutorials.length) {
                if (manifest.tutorials[i].title.indexOf("ing ") !== -1) {
                    //specifies where imperative issue location(s) within the Lab
                    add_issue("Your lab: '" + manifest.tutorials[i].title + "', uses a gerund. Consider using an imperative verb lab title instead of a gerund, for example, 'Start' instead of 'Starting'.", "major-error")
                }
                i++;
            }
        }


        let checkForHtmlTags = function (markdown) {
            let count = (markdown.match(new RegExp("<a href=", "g")) || []).length;
            if (count == 1)
                add_issue("There is " + count + " occurrence of HTML (for example: &lt;a href=...&gt;) in your Markdown. Please do not embed HTML in Markdown.");
            else if (count > 1)
                add_issue("There are " + count + " occurrences of HTML (for example: &lt;a href=...&gt;) in your Markdown. Please do not embed HTML in Markdown.");
        }

        let checkSecondH2Tag = function (article) {
            if ($(article).find('h2:eq(1)').text().substr(0, 4).indexOf("Task") !== 0) {
                $(article).find('h2:eq(1)').addClass(getFollowId());
                add_issue("The second H2 tag (##) of your Markdown file should be labeled with \"Task\".", "", getFollowId());
            }
        }

        let checkImages = function (article) {
            $(article).find('img').each(function () {
                // skip the modalImg img frame from QA check
                if ($(this).attr("id") === "modalImg") {
                    return;
                }
                try {
                    // if ($(this).attr('src').split('/')[$(this).attr('src').split('/').length - 2].indexOf("images") !== 0) {
                    if ($(this).attr('src').indexOf("/images/") <= 0) {
                        add_issue("Your images must be in an <strong>images</strong> folder. Please rename the folder and update your Markdown.");
                        return false; // to break the each loop
                    }
                } catch (e) {
                    add_issue("Your images must be in an <strong>images</strong> folder. Please rename the folder and update your Markdown.");
                    return false;
                };
            });
        }

        let checkImagesAltText = function (article) {
            $(article).find('img').each(function () {
                // if ($(this).attr("alt").length <1 || (!$(this).attr("alt")) || $(this).attr("alt") == '' || $(this).attr("alt") == undefined || $(this).attr("alt") == 0) {
                try {
                    if ($(this).attr('alt').length < 1 || (!$(this).attr("alt")) || $(this).attr("alt") == '' || $(this).attr("alt") == undefined || $(this).attr("alt") == 0) {
                        add_issue("Please make sure that all images contain alternate text.");
                        return false;
                    }

                } catch (e) {
                    return false;
                };
            })
        }


        let checkCodeBlockFormat = function (markdown) {
            let count = (markdown.match(/\````/g) || []).length;
            if (count == 1) {
                add_issue("Your Markdown file has " + count + " codeblock with 4 (````). This should be changed to 3 (```). Please review your Markdown and make the necessary changes.")
            } else if (count > 1) {
                add_issue("Your Markdown file has " + count + " codeblocks with 4 (````). This should be changed to 3 (```). Please review your Markdown and make the necessary changes.")
            }
        }

        let updateCount = function (article) {
            $(error_div).find('#qa-reportheader').html('Total Issues: ' + $(error_div).find('li').length);
            if (!$(error_div).find('li').length) {
                $(error_div).find('#qa-reportbody').hide();
            } else {
                $(error_div).find('#qa-reportbody').show();
                if ($(error_div).find('#qa-reportbody p').length === 0)
                    $(error_div).find('#qa-reportbody').append('<p>' + more_info + '</p>');
            }
        }

        let checkLinkExists = function (article) {
            $(article).find('a').each(function () {
                let url = $(this).attr('href');
                let url_text = $(this).text();
                urlExists(url, function (exists) {
                    if (!exists) {
                        $('a[href$="' + url + '"]').addClass('error ' + getFollowId());
                        add_issue("This URL may be broken: <a href='" + url + "' target='_blank'>" + url_text + "</a>", "major-error", getFollowId());
                        updateCount(article);
                    }
                });
            });
        }

        let checkImageExists = function (article) {
            $(article).find('img').each(function () {
                // skip the modalImg img frame from QA check
                if ($(this).attr("id") === "modalImg") {
                    return;
                }
                let url = $(this).attr('src');
                let url_text = $(this).attr('src').split('/')[$(this).attr('src').split('/').length - 1];
                urlExists(url, function (exists) {
                    if (!exists) {
                        ;
                        $('img[src$="' + url + '"]').addClass('error ' + getFollowId());
                        add_issue("The link to image <strong>" + url_text + "</strong> is broken.", "major-error", getFollowId())
                        updateCount(article);
                    }
                });
            });
        }

        let checkIfSectionExists = function (article, section_name) {
            if ($(article).find('div[name="' + alphaNumOnly(section_name) + '"]').length === 0)
                add_issue("You are missing <strong>" + section_name + "</strong> section.");
        }

        let checkIndentation = function (article) {
            $(article).find('section:not(:first-of-type)').each(function () {
                let tag_list = [];
                if ($(this).find('h2').text().toUpperCase().trim().indexOf("Task") == 0) {
                    $(this).children().each(function () {
                        tag_list.push($(this).prop('tagName'));
                    });

                    if ($.inArray("UL", tag_list) !== -1 & $.inArray("OL", tag_list) == -1) {
                        add_issue("In section <strong>" + $(this).find('h2').text() + "</strong>, your steps are not numbered. Numbered steps should follow your STEP element.", "minor-error");
                        $(this).find('h2').addClass('format-error');
                    }

                    if ($.inArray("PRE", tag_list) > $.inArray("OL", tag_list)) {
                        $(this).children('pre').addClass('format-error ' + getFollowId());
                        add_issue("Your codeblock is not indented correctly. Add spaces to indent your codeblock. Use one tab stop (4 spaces).", "minor-error", getFollowId());
                    }

                    $(this).find('img').each(function () {
                        if ($(this).parent().parent().prop('tagName').indexOf("LI") == -1 && $(this).parent().parent().prop('tagName').indexOf("OL") == -1 && $(this).parent().parent().prop('tagName').indexOf("UL") == -1) {
                            // $(this).parents('section').children('h2').addClass('format-error');
                            $(this).addClass('format-error ' + getFollowId());
                            add_issue("The image <strong>" + $(this).attr('src').split('/')[$(this).attr('src').split('/').length - 1] + "</strong> is not aligned with your text blocks. Add spaces to indent your image.", "minor-error", getFollowId());
                        }
                    });
                }
            });
        }

        let getFollowId = function () { return 'error_' + $(error_div).find('li').length; }

        checkH1(articleElement);
        checkForGerundInTitle(manifestFileContent);
        checkForGerundInLabTitle(manifestFileContent);
        checkForHtmlTags(markdownContent);
        checkImages(articleElement);
        checkImagesAltText(articleElement);
        checkCodeBlockFormat(markdownContent);
        checkSecondH2Tag(articleElement);
        if (!window.location.href.indexOf("localhost") && window.location.href.indexOf("127.0.0.1")) {
            checkLinkExists(articleElement);
        }
        checkImageExists(articleElement);
        checkIfSectionExists(articleElement, "Acknowledgements");
        // checkIfSectionExists(articleElement, "See an issue?");
        checkIndentation(articleElement);
        updateCount(articleElement);

        return $(articleElement).prepend(error_div);
    }

    // picked up as it is from: https://www.w3schools.com/howto/howto_js_draggable.asp
    function dragElement(elmnt) {
        var pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0;
        if (document.getElementById(elmnt.id + "header")) {
            // if present, the header is where you move the DIV from:
            document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;

            $('#qa-reportheader').dblclick(function () { // this line has been added to collapse qa report body
                $('#qa-reportbody').fadeToggle();
            });

        } else {
            // otherwise, move the DIV from anywhere inside the DIV:
            elmnt.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            // stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

}();

/**
 * Global function to check quiz answers
 * Called by quiz check buttons via onclick
 * @param {string} quizId - The quiz element's data-quiz-id
 * @param {boolean} isMultiple - Whether this is a multiple-answer quiz (checkboxes)
 */
function checkQuizAnswer(quizId, isMultiple) {
    let quiz = document.querySelector('[data-quiz-id="' + quizId + '"]');
    if (!quiz) return;

    let options = quiz.querySelectorAll('.ll-quiz-option');
    let resultDiv = quiz.querySelector('.ll-quiz-result');
    let explanationDiv = quiz.querySelector('.ll-quiz-explanation');
    let checkBtn = quiz.querySelector('.ll-quiz-check');
    let retryBtn = quiz.querySelector('.ll-quiz-retry');
    let allCorrect = true;
    let anySelected = false;
    let isScored = quiz.getAttribute('data-scored') === 'true';
    let wasAnswered = quiz.getAttribute('data-answered') === 'true';
    let wasCorrect = quiz.getAttribute('data-correct') === 'true';

    options.forEach(function (option) {
        let input = option.querySelector('input');
        let feedback = option.querySelector('.ll-quiz-feedback');
        let isCorrect = option.getAttribute('data-correct') === 'true';
        let isSelected = input.checked;

        if (isSelected) anySelected = true;

        // Reset previous state
        option.classList.remove('correct', 'incorrect', 'missed');
        feedback.textContent = '';

        if (isSelected && isCorrect) {
            option.classList.add('correct');
            feedback.textContent = '✓';
        } else if (isSelected && !isCorrect) {
            option.classList.add('incorrect');
            feedback.textContent = '✗';
            allCorrect = false;
        } else if (!isSelected && isCorrect) {
            option.classList.add('missed');
            allCorrect = false;
        }

        // Disable input after checking
        input.disabled = true;
