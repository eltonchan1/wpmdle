import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
    where
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBS-ZJD58Z3drrZvxc-yK4ogNuf7xfmbvU",
    authDomain: "wpmdle.firebaseapp.com",
    projectId: "wpmdle",
    storageBucket: "wpmdle.firebasestorage.app",
    messagingSenderId: "1039398055507",
    appId: "1:1039398055507:web:f45cbaf7d56c9e4f62e0a6"
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    "pack my box with five dozen liquor jugs",
    "sphinx of black quartz judge my vow",
    "how quickly daft jumping zebras vex",
    "bright vixens jump dozy fowl quack",
    "waltz bad nymph for quick jigs vex",
    "crazy fredrick bought many very exquisite opal jewels",
    "the sun rises above the quiet mountains every morning",
    "a small bird flies across the bright blue sky",
    "the ocean waves crash against the sandy shore",
    "trees grow tall when they receive enough sunlight",
    "the stars shine brightly in the night sky",
    "a gentle breeze moves through the green forest",
    "the river flows slowly between the rocky cliffs",
    "clouds drift peacefully across the endless sky",
    "practice makes progress when you challenge yourself every day",
    "typing faster requires accuracy patience and consistent practice",
    "small improvements can create amazing results over time",
    "learning new skills takes effort but becomes easier with practice",
    "every mistake is an opportunity to improve your abilities",
    "focus on accuracy before trying to increase your speed",
    "great achievements are built through many small steps",
    "javascript allows developers to create interactive websites",
    "computers process information using complex systems and algorithms",
    "technology continues to change the way people communicate",
    "programming requires creativity problem solving and logical thinking",
    "software engineers build tools that help people solve problems",
    "artificial intelligence is changing many industries around the world",
    "the internet connects billions of people across the planet",
    "the library was filled with books about science history and art",
    "the explorer traveled across the desert searching for ancient ruins",
    "the scientist carefully measured the results of the experiment",
    "the engineer designed a machine that could solve difficult tasks",
    "the artist painted a beautiful picture using many different colors",
    "the musician played a melody that filled the entire room",
    "never underestimate the power of curiosity and imagination",
    "a good question can lead to an incredible discovery",
    "knowledge grows when people share ideas with each other",
    "the future belongs to those who prepare for tomorrow",
    "success comes from dedication discipline and determination",
    "walking through the forest revealed many hidden wonders",
    "the mysterious castle stood beyond the ancient stone bridge",
    "the adventurous traveler explored unknown lands and discovered secrets",
    "the clever inventor created a useful device from simple materials",
    "the brave knight protected the kingdom from danger",
    "one two three four five six seven eight nine ten",
    "ten tiny turtles traveled toward the tropical river",
    "five friendly frogs found fresh flowers near the pond",
    "seven silent sailors sailed across the stormy sea",
    "sally sells seashells by the seashore",
    "peter piper picked a peck of pickled peppers",
    "how much wood would a woodchuck chuck if a woodchuck could chuck wood",
    "betty botter bought some butter but she said the butter was bitter so she bought some better butter"
]

let todaysPassage;
let targetWPM;
let mode = "daily";
let difficulty = "easy"
const cursor = document.getElementById("cursor");
let wpmHistory = [];
const popup = document.getElementById("info-popup");
const closePopup = document.getElementById("close-popup");
const infoBtn = document.getElementById("info-btn");
const creditsPopup = document.getElementById("credits-popup");
const creditsBtn = document.getElementById("credits-btn");
const closeCredits = document.getElementById("close-credits");
const settingsBtn = document.getElementById("settings-btn");
const settingsPopup = document.getElementById("settings-popup");
const closeSettings = document.getElementById("close-settings");

if (localStorage.getItem("seenInfo")) {
    popup.hidden = true;
}

closePopup.addEventListener("click", () => {
    popup.hidden = true;
    localStorage.setItem("seenInfo", "true");
})

infoBtn.addEventListener("click", () => {
    popup.hidden = false;
})

creditsBtn.addEventListener("click", () => {
    creditsPopup.hidden = false;
})

closeCredits.addEventListener("click", () => {
    creditsPopup.hidden = true;
})

settingsBtn.onclick = () => {
    settingsPopup.hidden = false;
}

closeSettings.onclick = () => {
    settingsPopup.hidden = true;
}

async function generateTest() {
    let rng;
    if (mode === "daily") {
        rng = mulberry32(getDateSeed());
    } else {
        rng = mulberry32(Date.now());
    }
    if (difficulty === "hard") {
        todaysPassage = await getWikipediaPassage();
    }
    else {
        const passageIndex = Math.floor(rng() * PASSAGES.length);
        todaysPassage = PASSAGES[passageIndex];
    }
    targetWPM = Math.floor(1 + rng() * 79) // 1-80 wpm
    document.getElementById("target-display").textContent = `target: ${targetWPM} wpm`
}

const passage = document.getElementById("passage");

(async () => {
    await generateTest();
    loadPassage();
    checkDaily();
    updateDisplay();
    updateAttemptDisplay();
})();

function loadPassage() {
    passage.innerHTML = ""
    todaysPassage.split("").forEach(letter => {
        const span = document.createElement("span");
        span.textContent = letter;
        passage.appendChild(span);
    });
    passage.appendChild(cursor);
    spans = passage.querySelectorAll("span");
    updateCursor();
}

document.getElementById("target-display").textContent = `target: ${targetWPM} wpm`;

let typed = "";
let startTime = null;
let spans;
let finished = false;
let attempts = 0;
const maxAttempts = 5;
let resultHistory = [];
let accuracyHistory = [];
let currentWPM = 0;
let currentAccuracy = 0;
let keystrokeHistory = [];

document.addEventListener("keydown", e => {
    if (finished) return;
    if (e.altKey) return;
    if ((e.ctrlKey || e.metaKey) && e.key !== "Backspace") {
        return;
    }
    if (typed.length >= todaysPassage.length) return;
    if (e.key.length !== 1 && e.key !== "Backspace") return;
    if (startTime === null)
        startTime = Date.now();
    if (e.key === "Backspace") {
        e.preventDefault();
        if (typed.length === 0) return;
        if (e.ctrlKey || e.metaKey) {
            while (typed.endsWith(" ")) {
                typed = typed.slice(0, -1);
            }
            while (typed.length > 0 && !typed.endsWith(" ")) {
                typed = typed.slice(0, -1);
            }
        } else {
            typed = typed.slice(0, -1)
        }
        keystrokeHistory.length = typed.length;
        updateDisplay();
        return;
    }
    const normalizedKey = normalizeChar(e.key);
    keystrokeHistory.push({
        char: normalizedKey,
        position:typed.length
    });
    typed += normalizedKey
    updateDisplay();
    resetCursorBlink();
    if (typed.length === todaysPassage.length)
        finishTest();
})

function finishTest() {
    finished = true;
    const elapsed = Date.now() - startTime;
    const wpm = calculateWPM(
        keystrokeHistory.length,
        elapsed
    );
    const accuracy = calculateAccuracy();
    showResultsScreen(wpm, accuracy);
}

function showResultsScreen(wpm, accuracy) {
    currentWPM = wpm
    currentAccuracy = accuracy
    wpmHistory.push(wpm);
    const {emoji, direction, won } = getBand(wpm, targetWPM)
    resultHistory.push({
        emoji: emoji,
        direction: direction === "exact" ? "=" : direction[0],
        wpm: wpm,
        accuracy: accuracy
    })
    accuracyHistory.push(accuracy);
    document.getElementById("game").hidden = true;
    document.getElementById("results").hidden = false;
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = `
        <h2>attempt ${attempts + 1}</h2>
        <div class="result-layout">
            <div class="result-stats">
                <p>${wpm} wpm</p>
                <p>${accuracy}% accuracy</p>
                <p>${emoji} ${direction}</p>
            </div>
            <div class="chart-container">
                <canvas id="wpm-chart"></canvas>
            </div>
        </div>

        <hr>
        <h3>history</h3>
        ${resultHistory.map((result, i) => `
            <p>
            ${i + 1}. ${result.emoji} ${result.direction} ${result.wpm} wpm ${result.accuracy}%
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
    updateWPMChart();
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
    keystrokeHistory = [];
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
        title = "you win!";
        message = `you got within 1wpm of the target!`;
    }
    else {
        title = "finished";
        message = `you used up all ${maxAttempts} attempts :(`
    }
    let submitHTML = "";
    if (mode === "daily") {
        submitHTML = `
        <input id="username" placeholder="name">
        <p>please input a name</p>
        <button id="submit-score">
        submit
        </button>`;
    } else {
        submitHTML = `
        <p>unlimited mode scores are not submitted</p>`;
    }
    document.getElementById("results").innerHTML = `
    <h2>${title}</h2>
    <p>${message}</p>
    <hr>
    <div class="end-layout">
        <div class="history">
            <h3>history</h3>
            ${resultHistory.map((result, i) =>`
                <p>
                    ${i + 1}. ${result.emoji} ${result.direction} ${result.wpm} wpm ${result.accuracy}%
                </p>
            `).join("")}
            <p>
                average accuracy:
                ${Math.round(
                    accuracyHistory.reduce((a,b)=>a+b,0) 
                    / accuracyHistory.length
                )}%
            </p>
        </div>
        <div class="chart-container">
            <canvas id="wpm-chart"></canvas>
        </div>
    </div>
    <hr>
    ${submitHTML}`;
    document.getElementById("share-btn").hidden = false;
    showModeButtons(true);
    updateWPMChart();
    if (mode === "daily") {
        localStorage.setItem("dailyComplete", JSON.stringify({
            date:getToday(),
            results:resultHistory,
            accuracy:accuracyHistory,
            target:targetWPM
        }));
        document.getElementById("submit-score").onclick = uploadScore;
    }
}

function calculateWPM(characters, elapsedMs) {
    const minutes = elapsedMs / 1000 / 60;
    return Math.round((characters / 5) / minutes);
}

function calculateAccuracy() {
    if (typed.length === 0) return 0;
    let correct = 0;
    keystrokeHistory.forEach(key => {
        if (normalizeChar(key.char) === normalizeChar(todaysPassage[key.position])) {
            correct++;
        }
    })
    return Math.round((correct / keystrokeHistory.length) * 100);
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
    document.getElementById("mode-display")
        .textContent = `${mode} mode (${difficulty})`;
    if (mode === "unlimited") {
        document.getElementById("attempt-display")
            .textContent = "unlimited mode";
    } else {
        document.getElementById("attempt-display")
            .textContent = `attempt ${attempts + 1} / ${maxAttempts}`;
    }
}

document.getElementById("share-btn").addEventListener("click", async () => {
    const results = resultHistory.map(result => {
        return `${result.emoji} ${result.direction}`;
    })
    const title = 
        mode === "daily"
            ? `wpmdle ${getToday()}`
            : "wpmdle unlimited";
    const shareText = 
`${title} ${difficulty}
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
            if (normalizeChar(typed[i]) === normalizeChar(todaysPassage[i]))
                span.classList.add("correct")
            else
                span.classList.add("incorrect")
        }
        else if (i === typed.length) {
            span.classList.add("current")
        }
    });
    updateCursor();
}

document.getElementById("daily-btn").addEventListener("click", async () => {
    const saved = JSON.parse(
        localStorage.getItem("dailyComplete")
    );
    const today = getToday()
    if (saved && saved.date === today) {
        checkDaily();
        return;
    }
    mode = "daily";
    attempts = 0;
    resultHistory = [];
    accuracyHistory = [];
    await generateTest();
    loadPassage();
    document.getElementById("share-btn").hidden = true
    resetGame();
})

function showModeButtons(show) {
    document.getElementById("unlimited-btn").hidden = !show;
    document.getElementById("daily-btn").hidden = !show;
    document.getElementById("easy-btn").hidden = !show;
    document.getElementById("hard-btn").hidden = !show;
}

function checkDaily() {
    const saved = JSON.parse(
        localStorage.getItem("dailyComplete")
    );
    if (!saved) return;
    const today = getToday();
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
            <p>${i+1}. ${r.emoji} ${r.direction} ${r.wpm} wpm ${saved.accuracy[i]}%</p>
            `).join("")}
        <p>
            average accuracy:
            ${Math.round(saved.accuracy.reduce((a,b)=>a+b,0) / saved.accuracy.length)}%
        </p>`;
}

async function startUnlimited() {
    mode = "unlimited";
    attempts = 0;
    resultHistory = [];
    accuracyHistory = [];
    wpmHistory = [];
    document.getElementById("share-btn").hidden = true;
    await generateTest();
    loadPassage();
    resetGame();
}

document.getElementById("unlimited-btn").addEventListener("click", startUnlimited);

document.getElementById("easy-btn").onclick = async () => {
    await startGame("easy");
    await loadLeaderboard();
}

document.getElementById("hard-btn").onclick = async () => {
    await startGame("hard");
    await loadLeaderboard();
}

async function getWikipediaPassage() {
    const url = "https://en.wikipedia.org/api/rest_v1/page/random/summary"
    const response = await fetch(url);
    const data = await response.json();
    return cleanWikipediaText(data.extract);
}

function cleanWikipediaText(text) {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\n/g, " ")
        .replace(/\s/g, " ")
        .replace(/[–—]/g, "-")
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/…/g, "...") 
        .replace(/[^\x20-\x7E]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 250)
}

function normalizeChar(char) {
    return char
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[–—]/g, "-")
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
}

function updateModeDisplay() {
    document.getElementById("mode-display").textContent = `${mode} mode (${difficulty})`
}

async function startGame(newDifficulty) {
    difficulty = newDifficulty
    const saved = JSON.parse(
        localStorage.getItem("dailyComplete")
    )
    const today = new Date()
        .toISOString()
        .slice(0,10);
    if (saved && saved.date === today) {
        mode = "unlimited";
    } else {
        mode = "daily";
    }
    attempts = 0;
    resultHistory = [];
    accuracyHistory = [];
    keystrokeHistory = [];
    wpmHistory = [];
    typed = "";
    startTime = null;
    finished = false;
    document.getElementById("share-btn").hidden = true;
    await generateTest();
    loadPassage();
    document.body.focus()
    document.getElementById("results").hidden = true;
    document.getElementById("game").hidden = false;
    showModeButtons(false);
    updateAttemptDisplay();
}

function getToday() {
    return new Date().toISOString().slice(0,10);
}

function calculateRankScore(
    attempts,
    results,
    accuracy
){
    let score = 0
    score += (6-attempts) * 100000
    results.forEach(result=>{
        if (result.emoji === "🟩")
            score += 1000;
        else if (result.emoji === "🟨")
            score += 500
        else if (result.emoji === "🟥")
            score += 100
        else
            score += 10
    });
    score += accuracy;
    return score;
}

async function uploadScore() {
    const name = document.getElementById("username").value;
    const avgAccuracy = Math.round(accuracyHistory.reduce((a,b)=>a+b,0) / accuracyHistory.length);
    const rankScore = calculateRankScore(
        attempts,
        resultHistory,
        avgAccuracy
    );
    try {
        await addDoc(
            collection(db, "dailyScores"),
            {
                name:name,
                date:new Date().toISOString().slice(0,10),
                difficulty:difficulty,
                attempts:attempts,
                results:resultHistory,
                accuracy:avgAccuracy,
                score:rankScore
            }
        );
        console.log("uploaded");
    } catch(e) {
        console.error("upload failed:", e)
    }
    alert("submitted")
    loadLeaderboard();
}

async function loadLeaderboard() {
    console.log("loading leaderboard for:", difficulty);
    const q=query(
        collection(db,"dailyScores"),
        where("difficulty", "==", difficulty),
        where("date", "==", getToday()),
        orderBy("score","desc"),
        limit(100)
    );
    const snapshot = await getDocs(q);
    console.log("documents:", snapshot.size);
    let html = "<h2>leaderboard</h2>";
    let rank = 1;
    snapshot.forEach(doc=>{
        const data=doc.data();
        const cleanResults = data.results.map(result => {
            const parts = result.split(" ")
            if (result.includes("too fast")) {
                return result.split(" ")[0] + result.split(" ")[1] + " ";
            }
            if (result.includes("too slow")) {
                return result.split(" ")[0] + result.split(" ")[1] + " ";
            }
            if (result.includes("exact")) {
                return result.split(" ")[0] + "="
            }
            return `${parts[0]}${parts[1]} `;
        })
        html+=`
        <p>
        ${rank}.
        ${data.name}
        ${cleanResults.join("")}
        ${data.accuracy}%
        </p>
        `;
        rank++;
    });
    document.getElementById("leaderboard").innerHTML = html;
}

loadLeaderboard();

function updateCursor() {
    if (finished || !spans[typed.length]) return;
    const current = spans[typed.length];
    const rect = current.getBoundingClientRect();
    const parentRect = passage.getBoundingClientRect();
    cursor.style.left = `${rect.left - parentRect.left}px`;
    cursor.style.top = `${rect.top - parentRect.top}px`;
    cursor.style.height = `${rect.height}px`;
}

let cursorTimeout;

function resetCursorBlink() {
    cursor.classList.remove("blink");
    clearTimeout(cursorTimeout);
    cursorTimeout = setTimeout(() => {
        cursor.classList.add("blink");
    }, 1000);
}

function getCSSVariable(name) {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
}

let wpmChart;

function updateWPMChart() {
    const ctx = document.getElementById("wpm-chart");
    let chartData = [...wpmHistory];
    if (chartData.length === 1) {
        chartData.push(wpmHistory[0]);
    }
    let chartLabels = wpmHistory.map((_, i) => `attempt ${i + 1}`);
    if (chartLabels.length === 1) {
        chartLabels.push("");
    }
    if (wpmChart) {
        wpmChart.destroy();
    }
    wpmChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: chartLabels,
            datasets: [{
                label: "wpm",
                data: chartData,
                borderColor: getCSSVariable("--accent"),
                backgroundColor: "transparent",
                tension: 0.3,
                pointRadius: 5
            },
            {
                label: "Target",
                data: chartData.map(() => targetWPM),
                borderColor: getCSSVariable("--error"),
                borderDash: [8, 8],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false,
                    labels: {
                        color: getCSSVariable("--text"),
                        font: {
                            family: "JetBrains Mono",
                            size: 16
                        }
                    }
                },
                tooltip: {
                    titleFont: {
                        family: "JetBrains Mono"
                    },
                    bodyFont: {
                        family: "JetBrains Mono"
                    },
                    titleColor: getCSSVariable("--text"),
                    bodyColor: getCSSVariable("--text"),
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: getCSSVariable("--text"),
                        font: {
                            family: "JetBrains Mono",
                            size: 16
                        }
                    },
                    grid: {
                        color: getCSSVariable("--secondary"),
                    }
                },
                y: {
                    ticks: {
                        color: getCSSVariable("--text"),
                        font: {
                            family: "JetBrains Mono",
                            size: 16
                        }
                    },
                    grid: {
                        color: getCSSVariable("--secondary"),
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

document.getElementById("monkeytype-theme").onclick = () => setTheme("monkeytype");
document.getElementById("light-theme").onclick = () => setTheme("light");
document.getElementById("forest-theme").onclick = () => setTheme("forest");
document.getElementById("matrix-theme").onclick = () => setTheme("matrix");

function setTheme(theme) {
    localStorage.setItem("theme", theme)
    const root = document.documentElement;
    if (theme === "monkeytype") {
        root.style.setProperty("--bg", "#323437");
        root.style.setProperty("--text", "#d1d0c5");
        root.style.setProperty("--accent", "#e2b714");
        root.style.setProperty("--secondary", "#646669");
        root.style.setProperty("--button", "#44464a");
        root.style.setProperty("--error", "#ca4754");
    }
    if (theme === "light") {
        root.style.setProperty("--bg", "#ffffff");
        root.style.setProperty("--text", "#323437");
        root.style.setProperty("--accent", "#6dbb45");
        root.style.setProperty("--secondary", "#8a9f8a");
        root.style.setProperty("--button", "#dcdcdcdc");
        root.style.setProperty("--error", "#d9534f");
    }
    if (theme === "forest") {
        root.style.setProperty("--bg", "#1b2b1b");
        root.style.setProperty("--text", "#d8e8d8");
        root.style.setProperty("--accent", "#6dbb45");
        root.style.setProperty("--secondary", "#8a9f8a");
        root.style.setProperty("--button", "#304830");
        root.style.setProperty("--error", "#d9534f");
    }
    if (theme === "matrix") {
        root.style.setProperty("--bg", "#000000");
        root.style.setProperty("--text", "#00ff66");
        root.style.setProperty("--accent", "#00ff66");
        root.style.setProperty("--secondary", "#009933");
        root.style.setProperty("--button", "#003311");
        root.style.setProperty("--error", "#ff3333");
    }
}

const savedTheme = localStorage.getItem("theme");

if (savedTheme) {
    setTheme(savedTheme);
}

/* emojis here for future use
    if (diff <= 1) emoji = "🟩"
    else if (diff <= 5) emoji = "🟨"
    else if (diff <= 15) emoji = "🟥"
    else emoji = "⬛"
*/
/*
    if (theme === "default") {
        root.style.setProperty("--bg", "#323437");
        root.style.setProperty("--text", "#d1d0c5");
        root.style.setProperty("--accent", "#e2b714");
        root.style.setProperty("--secondary", "#646669");
        root.style.setProperty("--button", "#44464a");
        root.style.setProperty("--error", "#ca4754");
    }
*/