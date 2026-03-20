"use strict";

window.LiveLabsQuiz = (function () {
    let resolveRelativeAssetPath = function (assetPath, sourceUrl) {
        if (!assetPath || assetPath.startsWith('http') || assetPath.startsWith('/')) {
            return assetPath;
        }

        if (!sourceUrl || sourceUrl.indexOf("/") === -1) {
            return assetPath;
        }

        return sourceUrl.replace(/\/[^\/]+$/, "/") + assetPath;
    }

    let convertQuizConfig = function (markdown, sourceUrl = "") {
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
                    config.badge = resolveRelativeAssetPath(badgeMatch[1].trim(), sourceUrl);
                }
            });

            // Return a hidden div with config data
            return '<div id="ll-quiz-config" data-passing="' + config.passing + '" data-badge="' + (config.badge || '') + '" style="display:none;"></div>';
        });
    }

    let convertQuizBlocks = function (markdown, sourceUrl = "") {
        // First process quiz-config blocks
        markdown = convertQuizConfig(markdown, sourceUrl);

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
                let fullBadgePath = badgePath;
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

    window.checkQuizAnswer = checkQuizAnswer;
    window.retryQuiz = retryQuiz;
    window.updateQuizScore = updateQuizScore;

    return {
        convertQuizBlocks: convertQuizBlocks
    };
})();
