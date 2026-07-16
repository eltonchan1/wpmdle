function mulberry32(seed) {
    return function() {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function getDateSeed() {
    const dateStr = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        hash = (hash << 5) - hash + dateStr.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}

const PASSAGES = [
    "the quick brown fox jumps over the lazy dog",
]

const rng = mulberry32(getDateSeed());
const passageIndex = Math.floor(rng() * PASSAGES.length);
const todaysPassage = PASSAGES[passageIndex];
const targetWPM = Math.floor(1 + rng() * 79); // 1 to 80

const passage = document.getElementById("passage");
todaysPassage.split("").forEach(letter => {
    const span = document.createElement("span")
    span.textContent = letter;
    passage.appendChild(span);
});

document.getElementById("target-display").textContent = `target: ${targetWPM} wpm`;

let typed = "";
let startTime = null;
const spans = passage.querySelectorAll("span");
let finished = false;
let attempts = 0;
const maxAttempts = 5;

updateDisplay();

document.addEventListener("keydown", e => {
    if (finished) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (typed.length >= todaysPassage.length) return;
    if (e.key.length !== 1 && e.key !== "Backspace") return;
    if (startTime === null)
        startTime = Date.now();
    if (e.key === "Backspace") {
        if (typed.length > 0) {
            typed = typed.slice(0, -1);
            updateDisplay();
        }
        return;
    }
    typed += e.key
    updateDisplay();
    if (typed.length === todaysPassage.length)
        finishTest();
});

function finishTest() {
    finished = true;
    const elapsed = Date.now() - startTime;
    const wpm = calculateWPM(
        todaysPassage.length,
        elapsed
    );
    showResultsScreen(wpm);
}

function showResultsScreen(wpm) {
    const { emoji, direction, won } = getBand(wpm, targetWPM)
    document.getElementById("game").hidden = true;
    document.getElementById("results").hidden = false;
    document.getElementById("wpm-result").textContent = `${wpm} wpm`;
    document.getElementById("emoji-result").textContent = `${emoji} ${direction}`;
    resultHistory.push(emoji);
    attempts++;
    const nextButton = document.getElementById("next-btn");
    if (won) {
        nextButton.textContent = "done";
        nextButton.disabled = true;
    }
    else if (attempts >= maxAttempts) {
        nextButton.textContent = "finish";
        nextButton.disabled = true;
    }
}

function calculateWPM(characters, elapsedMs) {
    const minutes = elapsedMs / 1000 / 60;
    return Math.round((characters / 5) / minutes);
}

function getBand(wpm, target) {
    const diff = Math.abs(wpm - target)
    const direction = wpm > target ? "↑ too fast" : wpm < target ? "↓ too slow" : "exact";
    let emoji;
    if (diff <= 1) emoji = "🟩"
    else if (diff <= 5) emoji = "🟨"
    else if (diff <= 15) emoji = "🟥"
    else emoji = "⬛"
    return { emoji, direction, diff, won: diff <= 1 };
}

function showResult(wpm, target, attemptNum) {
    const { emoji, direction, won } = getBand(wpm, target);
    resultHistory.push(emoji);
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML += `<p>${emoji} attempt ${attemptNum}: ${wpm} wpm (${direction})</p>`
    if (won) {
        resultsDiv.innerHTML += `<p>wow yay you did it</p>`
    }
    else if (attemptNum >= maxAttempts) {
        resultsDiv.innerHTML += `<p>you ran out of tries :(</p>`
    }
}

let resultHistory = []

document.getElementById("share-btn").addEventListener("click", async () => {
    const shareText = `wpmdle ${new Date().toISOString().slice(0,10)}\ntarget: ${targetWPM} wpm\n${resultHistory.join(" ")}`;
    navigator.clipboard.writeText(shareText);
    alert("copied to clipboard");
})

function updateDisplay() {
    spans.forEach((span, i) => {
        span.className = "";
        if (i < typed.length) {
            if (typed[i] === todaysPassage[i])
                span.classList.add("correct")
            else
                span.classList.add("incorrect")
        }
        else if (i === typed.length) {
            span.classList.add("current")
        }
    })
}