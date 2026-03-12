    });

    if (!anySelected) {
        resultDiv.textContent = 'Please select an answer.';
        resultDiv.className = 'll-quiz-result warning';
        // Re-enable inputs
        options.forEach(function (option) {
            option.querySelector('input').disabled = false;
        });
        return;
    }

    // Show result
    if (allCorrect) {
        resultDiv.textContent = 'Correct!';
        resultDiv.className = 'll-quiz-result success';
    } else {
        resultDiv.textContent = 'Not quite. The correct answer' + (isMultiple ? 's are' : ' is') + ' highlighted.';
        resultDiv.className = 'll-quiz-result error';
    }

    // Show explanation if present
    if (explanationDiv) {
        explanationDiv.style.display = 'block';
    }

    // Hide check button, show retry button
    checkBtn.style.display = 'none';
    if (retryBtn) {
        retryBtn.style.display = 'inline-block';
    }

    // Update quiz state
    quiz.setAttribute('data-answered', 'true');
    quiz.setAttribute('data-correct', allCorrect.toString());

    // Update score tracker if this is a scored quiz
    if (isScored) {
        updateQuizScore(wasAnswered, wasCorrect, allCorrect);
    }
}

/**
 * Reset a quiz to allow retry
 * @param {string} quizId - The quiz element's data-quiz-id
 */
function retryQuiz(quizId) {
    let quiz = document.querySelector('[data-quiz-id="' + quizId + '"]');
    if (!quiz) return;

    let options = quiz.querySelectorAll('.ll-quiz-option');
    let resultDiv = quiz.querySelector('.ll-quiz-result');
    let explanationDiv = quiz.querySelector('.ll-quiz-explanation');
    let checkBtn = quiz.querySelector('.ll-quiz-check');
    let retryBtn = quiz.querySelector('.ll-quiz-retry');
    let isScored = quiz.getAttribute('data-scored') === 'true';
    let wasCorrect = quiz.getAttribute('data-correct') === 'true';

    // Reset all options
    options.forEach(function (option) {
        let input = option.querySelector('input');
        let feedback = option.querySelector('.ll-quiz-feedback');

        option.classList.remove('correct', 'incorrect', 'missed');
        feedback.textContent = '';
        input.checked = false;
        input.disabled = false;
    });

    // Reset result and explanation
    resultDiv.textContent = '';
    resultDiv.className = 'll-quiz-result';
    if (explanationDiv) {
        explanationDiv.style.display = 'none';
    }

    // Show check button, hide retry button
    checkBtn.style.display = 'inline-block';
    if (retryBtn) {
        retryBtn.style.display = 'none';
    }

    // Update quiz state - mark as not answered for retry
    quiz.setAttribute('data-answered', 'false');
    quiz.setAttribute('data-correct', 'false');

    // Update score tracker if this is a scored quiz (remove from answered count)
    if (isScored) {
        updateQuizScore(true, wasCorrect, false, true);
    }
}

/**
 * Update the quiz score tracker and inline score displays
 * @param {boolean} wasAnswered - Whether quiz was previously answered
 * @param {boolean} wasCorrect - Whether quiz was previously correct
 * @param {boolean} isCorrect - Whether quiz is now correct
 * @param {boolean} isRetry - Whether this is a retry (removing answer)
 */
function updateQuizScore(wasAnswered, wasCorrect, isCorrect, isRetry) {
    let tracker = document.getElementById('ll-quiz-score-tracker');
    if (!tracker) return;

    let total = parseInt(tracker.getAttribute('data-total'), 10);
    let correct = parseInt(tracker.getAttribute('data-correct'), 10);
    let answered = parseInt(tracker.getAttribute('data-answered'), 10);

    if (isRetry) {
        // Removing an answer (retry)
        answered--;
        if (wasCorrect) correct--;
    } else if (wasAnswered) {
        // Updating an existing answer
        if (wasCorrect && !isCorrect) correct--;
        else if (!wasCorrect && isCorrect) correct++;
    } else {
        // New answer
        answered++;
        if (isCorrect) correct++;
    }

    tracker.setAttribute('data-correct', correct);
    tracker.setAttribute('data-answered', answered);

    // Calculate percentage
    let percentage = answered > 0 ? Math.round((correct / total) * 100) : 0;

    // Update all inline score displays next to "Scored Quiz" labels
    let scoreDisplays = document.querySelectorAll('.ll-quiz-score-display');
    let scoreText = '';

    if (answered < total) {
        scoreText = correct + '/' + total + ' correct (' + percentage + '%) - ' + (total - answered) + ' remaining';
    } else {
        scoreText = correct + '/' + total + ' correct (' + percentage + '%)';
    }

    scoreDisplays.forEach(function (display) {
        display.textContent = scoreText;

        // Update styling based on current performance
        display.classList.remove('passing', 'failing');
        if (answered === total) {
            let config = document.getElementById('ll-quiz-config');
            let passingScore = config ? parseInt(config.getAttribute('data-passing'), 10) : 80;
            if (percentage >= passingScore) {
                display.classList.add('passing');
            } else {
                display.classList.add('failing');
            }
        }
    });

    // Handle badge container when all answered
    let badgeContainer = tracker.querySelector('.ll-quiz-badge-container');

    if (answered >= total) {
        let config = document.getElementById('ll-quiz-config');
        let passingScore = config ? parseInt(config.getAttribute('data-passing'), 10) : 80;
        let badgePath = config ? config.getAttribute('data-badge') : null;

        if (percentage >= passingScore && badgePath) {
            // Get the base path from an existing image in the article, or construct from URL
            let fullBadgePath = badgePath;
            if (!badgePath.startsWith('http') && !badgePath.startsWith('/')) {
                // Relative path - need to prepend base path
                let existingImg = document.querySelector('#module-content img');
                if (existingImg && existingImg.src) {
                    // Extract base path from existing image src
                    let imgSrc = existingImg.src;
                    let basePath = imgSrc.substring(0, imgSrc.lastIndexOf('/') + 1);
                    // Remove 'images/' from base path if badge path starts with 'images/'
                    if (badgePath.startsWith('images/') && basePath.endsWith('images/')) {
                        basePath = basePath.slice(0, -7); // remove trailing 'images/'
                    }
                    fullBadgePath = basePath + badgePath;
                } else {
                    // Fallback: try to construct path from current lab URL
                    // Look for lab path in selected nav item or URL hash
                    let selectedNav = document.querySelector('.selected a');
                    if (selectedNav && selectedNav.href) {
                        let labPath = selectedNav.href;
                        // Extract directory from lab path
                        let baseDir = labPath.substring(0, labPath.lastIndexOf('/') + 1);
                        fullBadgePath = baseDir + badgePath;
                    }
                }
            }
            badgeContainer.innerHTML = '<div class="ll-quiz-badge-message">Congratulations! You passed with ' + percentage + '%!</div>' +
                '<div class="ll-quiz-badge-content">' +
                '<img src="' + fullBadgePath + '" alt="Achievement Badge" class="ll-quiz-badge-preview">' +
                '<a href="' + fullBadgePath + '" download class="ll-quiz-badge-download">Download Your Badge</a>' +
                '</div>' +
                '<p class="ll-quiz-badge-disclaimer">Disclaimer: This badge is not an official Oracle Certification. We do not track or store any user data.</p>';
            badgeContainer.style.display = 'block';
            // Move badge container to appear right after the last scored quiz
            let scoredQuizzes = document.querySelectorAll('.ll-quiz-scored');
            if (scoredQuizzes.length > 0) {
                let lastScoredQuiz = scoredQuizzes[scoredQuizzes.length - 1];
                lastScoredQuiz.parentNode.insertBefore(badgeContainer, lastScoredQuiz.nextSibling);
            }
            // Scroll badge into view with smooth animation
            setTimeout(function() {
                badgeContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        } else if (percentage < passingScore) {
            badgeContainer.innerHTML = '<div class="ll-quiz-badge-message ll-quiz-not-passed">Score: ' + percentage + '%. You need ' + passingScore + '% to pass. Click "Try Again" on any quiz to retry.</div>';
            badgeContainer.style.display = 'block';
            // Move badge container to appear right after the last scored quiz
            let scoredQuizzes = document.querySelectorAll('.ll-quiz-scored');
            if (scoredQuizzes.length > 0) {
                let lastScoredQuiz = scoredQuizzes[scoredQuizzes.length - 1];
                lastScoredQuiz.parentNode.insertBefore(badgeContainer, lastScoredQuiz.nextSibling);
            }
            // Scroll into view so user sees they didn't pass
            setTimeout(function() {
                badgeContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        } else {
            badgeContainer.style.display = 'none';
        }
    } else {
        badgeContainer.style.display = 'none';
    }
}

let download = function () {

    //enables download of files
    let download_file = function (filename, text) {
        let pom = document.createElement('a');
        pom.setAttribute('href', 'data:html/plain;charset=utf-8,' + encodeURIComponent(text));
        pom.setAttribute('download', filename);
        if (document.createEvent) {
            let event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        } else {
            pom.click();
        }
    }

    $.when($('img').each(function () {
        $(this).css('max-width', '75%');
        if ($(this).attr('src').indexOf('http') == -1)
            $(this).attr('src', location.protocol + '//' + location.host + location.pathname + $(this).attr('src'));
    }),
        $('pre button').remove(),
        $('pre').attr('style', 'white-space: pre-wrap; white-space: -moz-pre-wrap; white-space: -pre-wrap; white-space: -o-pre-wrap; word-wrap: break-word; max-width: 80%;'),
        $("#module-content h2:not(:eq(0))").nextAll().show('fast'),
        $('h2').removeClass('plus minus'),
        $('#btn_toggle').remove()).done(function () {
            download_file($('.selected span').text().replace(/[^[A-Za-z0-9:?]+?/g, '') + '.html', '<html><head><link rel="stylesheet" href="https://oracle-livelabs.github.io/common/redwood-hol/img/favicon.ico" /></head><body style="padding-top: 0px;">' + $('#contentBox')[0].outerHTML + '</body></html>');
        });
}

/*!
######################################################
# ORA_APEX.JS
######################################################
*/
if (location.hostname.includes("livelabs.oracle.com")) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://www.oracle.com/us/assets/metrics/ora_apex.js";
    document.head.appendChild(script); 
  }
  