(function (global) {
    "use strict";

    function resolveRelativeAssetPath(assetPath, sourceUrl) {
        if (!assetPath || assetPath.startsWith("http") || assetPath.startsWith("/")) {
            return assetPath;
        }

        if (!sourceUrl || sourceUrl.indexOf("/") === -1) {
            return assetPath;
        }

        return sourceUrl.replace(/\/[^\/]+$/, "/") + assetPath;
    }

    function convertQuizConfig(markdown, sourceUrl) {
        const configRegex = /`{3,}quiz-config\s*\n([\s\S]*?)`{3,}/g;

        return markdown.replace(configRegex, function (_match, content) {
            const config = {
                passing: 80,
                badge: null
            };

            const lines = content.trim().split("\n");
            lines.forEach(function (line) {
                const passingMatch = line.match(/^\s*passing:\s*(\d+)/i);
                const badgeMatch = line.match(/^\s*badge:\s*(.+)/i);

                if (passingMatch) {
                    config.passing = parseInt(passingMatch[1], 10);
                }
                if (badgeMatch) {
                    config.badge = resolveRelativeAssetPath(badgeMatch[1].trim(), sourceUrl);
                }
            });

            return '<div id="ll-quiz-config" data-passing="' + config.passing + '" data-badge="' + (config.badge || "") + '" style="display:none;"></div>';
        });
    }

    function convertQuizBlocks(markdown, sourceUrl) {
        const moduleSource = sourceUrl || "";
        let processed = convertQuizConfig(markdown, moduleSource);

        const quizRegex = /`{3,}quiz(\s+score)?\s*\n([\s\S]*?)`{3,}/g;
        let quizId = 0;
        let scoredQuizCount = 0;

        processed = processed.replace(quizRegex, function (_match, scoreFlag, content) {
            let html = "";
            const isScored = scoreFlag && scoreFlag.trim() === "score";
            const lines = content.trim().split("\n");
            let currentQuestion = null;
            const questions = [];

            lines.forEach(function (rawLine) {
                const line = rawLine.trim();

                if (/^Q:\s*/i.test(line)) {
                    if (currentQuestion) {
                        questions.push(currentQuestion);
                    }
                    currentQuestion = {
                        text: line.replace(/^Q:\s*/i, ""),
                        options: [],
                        explanation: null
                    };
                } else if (/^\*\s+/.test(line)) {
                    if (currentQuestion) {
                        currentQuestion.options.push({
                            text: line.replace(/^\*\s+/, ""),
                            correct: true
                        });
                    }
                } else if (/^-\s+/.test(line)) {
                    if (currentQuestion) {
                        currentQuestion.options.push({
                            text: line.replace(/^-\s+/, ""),
                            correct: false
                        });
                    }
                } else if (/^>\s*/.test(line)) {
                    if (currentQuestion) {
                        currentQuestion.explanation = line.replace(/^>\s*/, "");
                    }
                }
            });

            if (currentQuestion) {
                questions.push(currentQuestion);
            }

            questions.forEach(function (question, qIndex) {
                const qId = "quiz-" + quizId + "-q" + qIndex;
                const correctCount = question.options.filter(function (opt) { return opt.correct; }).length;
                const inputType = correctCount > 1 ? "checkbox" : "radio";
                const inputName = qId + "-options";

                if (isScored) {
                    scoredQuizCount++;
                }

                html += '<div class="ll-quiz' + (isScored ? ' ll-quiz-scored' : '') + '" data-quiz-id="' + qId + '" data-scored="' + isScored + '" data-answered="false" data-correct="false">';

                if (isScored) {
                    html += '<div class="ll-quiz-header"><span class="ll-quiz-badge-label">Scored Quiz</span><span class="ll-quiz-score-display"></span></div>';
                }

                html += '<div class="ll-quiz-question">' + question.text + '</div>';
                html += '<div class="ll-quiz-options">';

                question.options.forEach(function (opt, optIndex) {
                    const optId = qId + "-opt" + optIndex;
                    html += '<label class="ll-quiz-option" data-correct="' + opt.correct + '">';
                    html += '<input type="' + inputType + '" name="' + inputName + '" id="' + optId + '" value="' + optIndex + '">';
                    html += '<span class="ll-quiz-option-text">' + opt.text + '</span>';
                    html += '<span class="ll-quiz-feedback"></span>';
                    html += "</label>";
                });

                html += "</div>";

                if (question.explanation) {
                    html += '<div class="ll-quiz-explanation" style="display:none;">' + question.explanation + "</div>";
                }

                html += '<button type="button" class="ll-quiz-check" onclick="checkQuizAnswer(\'' + qId + '\', ' + (inputType === "checkbox") + ')">Check Answer</button>';
                html += '<button type="button" class="ll-quiz-retry" style="display:none;" onclick="retryQuiz(\'' + qId + '\')">Try Again</button>';
                html += '<div class="ll-quiz-result"></div>';
                html += "</div>";

                quizId++;
            });

            return html;
        });

        if (scoredQuizCount > 0) {
            processed += '<div id="ll-quiz-score-tracker" data-total="' + scoredQuizCount + '" data-correct="0" data-answered="0">';
            processed += '<div class="ll-quiz-badge-container" style="display:none;"></div>';
            processed += "</div>";
        }

        return processed;
    }

    function checkQuizAnswer(quizId, isMultiple) {
        const quiz = document.querySelector('[data-quiz-id="' + quizId + '"]');
        if (!quiz) {
            return;
        }

        const options = quiz.querySelectorAll(".ll-quiz-option");
        const resultDiv = quiz.querySelector(".ll-quiz-result");
        const explanationDiv = quiz.querySelector(".ll-quiz-explanation");
        const checkBtn = quiz.querySelector(".ll-quiz-check");
        const retryBtn = quiz.querySelector(".ll-quiz-retry");
        let allCorrect = true;
        let anySelected = false;
        const isScored = quiz.getAttribute("data-scored") === "true";
        const wasAnswered = quiz.getAttribute("data-answered") === "true";
        const wasCorrect = quiz.getAttribute("data-correct") === "true";

        options.forEach(function (option) {
            const input = option.querySelector("input");
            const feedback = option.querySelector(".ll-quiz-feedback");
            const isCorrect = option.getAttribute("data-correct") === "true";
            const isSelected = input.checked;

            if (isSelected) {
                anySelected = true;
            }

            option.classList.remove("correct", "incorrect", "missed");
            feedback.textContent = "";

            if (isSelected && isCorrect) {
                option.classList.add("correct");
                feedback.textContent = "\u2713";
            } else if (isSelected && !isCorrect) {
                option.classList.add("incorrect");
                feedback.textContent = "\u2717";
                allCorrect = false;
            } else if (!isSelected && isCorrect) {
                option.classList.add("missed");
                allCorrect = false;
            }

            input.disabled = true;
        });

        if (!anySelected) {
            resultDiv.textContent = "Please select an answer.";
            resultDiv.className = "ll-quiz-result warning";
            options.forEach(function (option) {
                option.querySelector("input").disabled = false;
            });
            return;
        }

        if (allCorrect) {
            resultDiv.textContent = "Correct!";
            resultDiv.className = "ll-quiz-result success";
        } else {
            resultDiv.textContent = "Not quite. The correct answer" + (isMultiple ? "s are" : " is") + " highlighted.";
            resultDiv.className = "ll-quiz-result error";
        }

        if (explanationDiv) {
            explanationDiv.style.display = "block";
        }

        checkBtn.style.display = "none";
        if (retryBtn) {
            retryBtn.style.display = "inline-block";
        }

        quiz.setAttribute("data-answered", "true");
        quiz.setAttribute("data-correct", allCorrect.toString());

        if (isScored) {
            updateQuizScore(wasAnswered, wasCorrect, allCorrect);
        }
    }

    function retryQuiz(quizId) {
        const quiz = document.querySelector('[data-quiz-id="' + quizId + '"]');
        if (!quiz) {
            return;
        }

        const options = quiz.querySelectorAll(".ll-quiz-option");
        const resultDiv = quiz.querySelector(".ll-quiz-result");
        const explanationDiv = quiz.querySelector(".ll-quiz-explanation");
        const checkBtn = quiz.querySelector(".ll-quiz-check");
        const retryBtn = quiz.querySelector(".ll-quiz-retry");
        const isScored = quiz.getAttribute("data-scored") === "true";
        const wasCorrect = quiz.getAttribute("data-correct") === "true";

        options.forEach(function (option) {
            const input = option.querySelector("input");
            const feedback = option.querySelector(".ll-quiz-feedback");

            option.classList.remove("correct", "incorrect", "missed");
            feedback.textContent = "";
            input.checked = false;
            input.disabled = false;
        });

        resultDiv.textContent = "";
        resultDiv.className = "ll-quiz-result";
        if (explanationDiv) {
            explanationDiv.style.display = "none";
        }

        checkBtn.style.display = "inline-block";
        if (retryBtn) {
            retryBtn.style.display = "none";
        }

        quiz.setAttribute("data-answered", "false");
        quiz.setAttribute("data-correct", "false");

        if (isScored) {
            updateQuizScore(true, wasCorrect, false, true);
        }
    }

    function updateQuizScore(wasAnswered, wasCorrect, isCorrect, isRetry) {
        const tracker = document.getElementById("ll-quiz-score-tracker");
        if (!tracker) {
            return;
        }

        const total = parseInt(tracker.getAttribute("data-total"), 10);
        let correct = parseInt(tracker.getAttribute("data-correct"), 10);
        let answered = parseInt(tracker.getAttribute("data-answered"), 10);

        if (isRetry) {
            answered--;
            if (wasCorrect) {
                correct--;
            }
        } else if (wasAnswered) {
            if (wasCorrect && !isCorrect) {
                correct--;
            } else if (!wasCorrect && isCorrect) {
                correct++;
            }
        } else {
            answered++;
            if (isCorrect) {
                correct++;
            }
        }

        tracker.setAttribute("data-correct", correct);
        tracker.setAttribute("data-answered", answered);

        const percentage = answered > 0 ? Math.round((correct / total) * 100) : 0;
        const scoreDisplays = document.querySelectorAll(".ll-quiz-score-display");
        let scoreText = "";

        if (answered < total) {
            scoreText = correct + "/" + total + " correct (" + percentage + "%) - " + (total - answered) + " remaining";
        } else {
            scoreText = correct + "/" + total + " correct (" + percentage + "%)";
        }

        scoreDisplays.forEach(function (display) {
            display.textContent = scoreText;
            display.classList.remove("passing", "failing");

            if (answered === total) {
                const config = document.getElementById("ll-quiz-config");
                const passingScore = config ? parseInt(config.getAttribute("data-passing"), 10) : 80;
                if (percentage >= passingScore) {
                    display.classList.add("passing");
                } else {
                    display.classList.add("failing");
                }
            }
        });

        const badgeContainer = tracker.querySelector(".ll-quiz-badge-container");
        if (!badgeContainer) {
            return;
        }

        if (answered >= total) {
            const config = document.getElementById("ll-quiz-config");
            const passingScore = config ? parseInt(config.getAttribute("data-passing"), 10) : 80;
            const badgePath = config ? config.getAttribute("data-badge") : null;

            if (percentage >= passingScore && badgePath) {
                const fullBadgePath = badgePath;
                badgeContainer.innerHTML = '<div class="ll-quiz-badge-message">Congratulations! You passed with ' + percentage + '%!</div>' +
                    '<div class="ll-quiz-badge-content">' +
                    '<img src="' + fullBadgePath + '" alt="Achievement Badge" class="ll-quiz-badge-preview">' +
                    '<a href="' + fullBadgePath + '" download class="ll-quiz-badge-download">Download Your Badge</a>' +
                    '</div>' +
                    '<p class="ll-quiz-badge-disclaimer">Disclaimer: This badge is not an official Oracle Certification. We do not track or store any user data.</p>';
                badgeContainer.style.display = "block";

                const scoredQuizzes = document.querySelectorAll(".ll-quiz-scored");
                if (scoredQuizzes.length > 0) {
                    const lastScoredQuiz = scoredQuizzes[scoredQuizzes.length - 1];
                    lastScoredQuiz.parentNode.insertBefore(badgeContainer, lastScoredQuiz.nextSibling);
                }

                setTimeout(function () {
                    badgeContainer.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 300);
            } else if (percentage < passingScore) {
                badgeContainer.innerHTML = '<div class="ll-quiz-badge-message ll-quiz-not-passed">Score: ' + percentage + '%. You need ' + passingScore + '% to pass. Click "Try Again" on any quiz to retry.</div>';
                badgeContainer.style.display = "block";

                const scoredQuizzes = document.querySelectorAll(".ll-quiz-scored");
                if (scoredQuizzes.length > 0) {
                    const lastScoredQuiz = scoredQuizzes[scoredQuizzes.length - 1];
                    lastScoredQuiz.parentNode.insertBefore(badgeContainer, lastScoredQuiz.nextSibling);
                }

                setTimeout(function () {
                    badgeContainer.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 300);
            } else {
                badgeContainer.style.display = "none";
            }
        } else {
            badgeContainer.style.display = "none";
        }
    }

    function initQuiz() {
        global.checkQuizAnswer = checkQuizAnswer;
        global.retryQuiz = retryQuiz;
        global.updateQuizScore = updateQuizScore;

        return {
            convertMarkdown: convertQuizBlocks
        };
    }

    global.initQuiz = initQuiz;
})(typeof window !== "undefined" ? window : globalThis);
