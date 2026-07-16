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
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
]

let todaysPassage;
let targetWPM;
let mode = "daily";

function generateTest() {
    let rng;
    if (mode === "daily") {
        rng = mulberry32(getDateSeed());
    } else {
        rng = mulberry32(Date.now());
    }
    const passageIndex = Math.floor(rng() * PASSAGES.length);
    todaysPassage = PASSAGES[passageIndex]
    targetWPM = Math.floor(1 + rng() * 79) // 1-80 wpm
    document.getElementById("target-display").textContent = `target: ${targetWPM} wpm`
}

generateTest();
checkDaily();

const passage = document.getElementById("passage");

function loadPassage() {
    passage.innerHTML = ""
    todaysPassage.split("").forEach(letter => {
        const span = document.createElement("span");
        span.textContent = letter;
        passage.appendChild(span);
    });
    spans = passage.querySelectorAll("span");
}

document.getElementById("target-display").textContent = `target: ${targetWPM} wpm`;

let typed = "";
let startTime = null;
let spans;
let finished = false;
let attempts = 0;
const maxAttempts = 5;
let resultHistory = []
let accuracyHistory = []
let currentWPM = 0;
let currentAccuracy = 0

loadPassage();
updateDisplay();
updateAttemptDisplay();

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
})

function finishTest() {
    finished = true;
    const elapsed = Date.now() - startTime;
    const wpm = calculateWPM(
        todaysPassage.length,
        elapsed
    );
    const accuracy = calculateAccuracy();
    showResultsScreen(wpm, accuracy);
}

function showResultsScreen(wpm, accuracy) {
    currentWPM = wpm
    currentAccuracy = accuracy
    const {emoji, direction, won } = getBand(wpm, targetWPM)
    resultHistory.push(`${emoji} ${direction}`)
    accuracyHistory.push(accuracy);
    document.getElementById("game").hidden = true;
    document.getElementById("results").hidden = false;
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = `
        <h2>attempt ${attempts + 1}</h2>
        <p>${wpm} wpm</p>
        <p>${accuracy}% accuracy</p>
        <p>${emoji} ${direction}</p>
        <hr>
        <h3>history</h3>
        ${resultHistory.map((result, i) => `
            <p>
            ${i + 1}. ${result}
            ${accuracyHistory[i]}%
            </p>
        `).join("")}
        <hr>
        <p>
        average accuracy:
        ${Math.round(
            accuracyHistory.reduce((a,b)=>a+b,0)
            / accuracyHistory.length
        )}%
        </p>
        <button id="next-btn">next attempt</button>`;
    attempts++
    updateAttemptDisplay();
    const nextButton = document.getElementById("next-btn");
    if (won) {
        nextButton.textContent = "finish";
    }
    else if (attempts >= maxAttempts) {
        nextButton.textContent = "finish";
    }
    else {
        nextButton.textContent = "next attempt"
    }
}

document.addEventListener("click", e => {
    if (!e.target.matches("#next-btn")) return;
    if(getBand(currentWPM, targetWPM).won) {
        showEndScreen("win");
        return;
    }
    if (attempts >= maxAttempts) {
        showEndScreen("lose");
        return;
    }
    resetGame();
})

function resetGame() {
    showModeButtons(false);
    typed = "";
    startTime = null;
    finished = false;
    document.getElementById("results").hidden = true;
    document.getElementById("game").hidden = false;
    document.getElementById("game").hidden = false;
    updateDisplay();
    updateAttemptDisplay();
}

function showEndScreen(reason) {
    let title;
    let message;
    if (reason === "win") {
        title = "you win!"
        message = `you got within 1 wpm of the target!`
    }
    else {
        title = "finished"
        message = `you used up all ${maxAttempts} attempts :(`
    }
    document.getElementById("results").innerHTML = `
    <h2>${title}</h2>
    <p>${message}</p>
    <p>${resultHistory.map((result, i) => `
        <p>
            ${i + 1}. ${result} ${accuracyHistory[i]}%
        </p>
    `).join("")}
    <p>
        average accuracy:
        ${Math.round(accuracyHistory.reduce((a,b)=>a+b,0) / accuracyHistory.length)}%
    </p>`;
    document.getElementById("share-btn").hidden = false
    showModeButtons(true);
    if (mode === "daily") {
        localStorage.setItem("dailyComplete", JSON.stringify({
            date: new Date().toISOString().slice(0,10),
            results: resultHistory,
            accuracy: accuracyHistory,
            target: targetWPM
        }));
    }
}

function calculateWPM(characters, elapsedMs) {
    const minutes = elapsedMs / 1000 / 60;
    return Math.round((characters / 5) / minutes);
}

function calculateAccuracy() {
    if (typed.length === 0) return 0;
    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
        if (typed[i] === todaysPassage[i]) {
            correct++;
        }
    }
    return Math.round((correct/typed.length) * 100);
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

function updateAttemptDisplay() {
    if (mode === "unlimited") {
        document.getElementById("attempt-display").textContent = `unlimited mode`
    } else {
    document.getElementById("attempt-display").textContent = 
        `attempt: ${attempts + 1} / ${maxAttempts}`;
    }
}

document.getElementById("share-btn").addEventListener("click", async () => {
    const results = resultHistory.map(result => {
        const parts = result.split(" ");
        return `${parts[0]} ${parts[1]}`;
    })
    const title = 
        mode === "daily"
            ? `wpmdle ${new Date().toISOString().slice(0,10)}`
            : "wpmdle unlimited";
    const shareText = 
`${title}
target: ${targetWPM} wpm
${results.join(" ")}
average accuracy: ${Math.round(accuracyHistory.reduce((a,b)=>a+b,0) / accuracyHistory.length)}%`
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

document.getElementById("daily-btn").addEventListener("click", () => {
    const saved = JSON.parse(
        localStorage.getItem("dailyComplete")
    );
    const today = new Date().toISOString().slice(0,10)
    if (saved && saved.date === today) {
        checkDaily();
        return;
    }
    mode = "daily";
    attempts = 0;
    resultHistory = [];
    accuracyHistory = [];
    generateTest();
    loadPassage();
    document.getElementById("share-btn").hidden = true
    resetGame();
})

function showModeButtons(show) {
    document.getElementById("unlimited-btn").hidden = !show;
    document.getElementById("daily-btn").hidden = !show;
}

function checkDaily() {
    const saved = JSON.parse(
        localStorage.getItem("dailyComplete")
    );
    if (!saved) return;
    const today = new Date().toISOString().slice(0,10);
    if (saved.date !== today) {
        localStorage.removeItem("dailyComplete");
        return;
    }
    mode = "daily"
    document.getElementById("game").hidden = true;
    document.getElementById("results").hidden = false;
    document.getElementById("results").innerHTML = `
        <h2>daily completed</h2>
        <p>target: ${saved.target} wpm</p>
        ${saved.results.map((r,i)=>`
            <p>${i+1}. ${r} ${saved.accuracy[i]}%</p>
            `).join("")}
        <p>
            average accuracy:
            ${Math.round(saved.accuracy.reduce((a,b)=>a+b,0) / saved.accuracy.length)}%
        </p>`;
}

function startUnlimited() {
    mode = "unlimited";
    attempts = 0;
    resultHistory = [];
    accuracyHistory = [];
    document.getElementById("share-btn").hidden = true;
    generateTest();
    loadPassage();
    resetGame();
}

document.getElementById("unlimited-btn").addEventListener("click", startUnlimited);