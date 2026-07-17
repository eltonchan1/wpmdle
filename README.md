# wpmdle

a daily typing challenge inspired by wordle and monkeytype

wpmdle gives you a target wpm (words per minute) and challenges you to type a passage as close to that speed as possible

instead of trying to type as fast as possible, the goal is to be precise to match the target speed while keeping good accuracy


## features

### target wpm challenge
- each test generates a random target speed between 1-80 wpm
- your goal is to finish within 1 wpm of the target
- results are ranked using color-coded feedback:
    - 🟩 within 1 wpm
    - 🟨 within 5 wpm
    - 🟥 within 15 wpm
    - ⬛ too far from target

### daily mode
- a new challenge is generated every day
- everyone gets the same daily passage and target wpm
- each daily challenge allows up to 5 tries
- completed daily challenges are saved locally
- daily scores can be submitted to the leaderboard

### unlimited mode
- practice with unlimited access to challenges
- each test allows up to 5 tries
- generate new typing challenges whenever you want
- try different difficulties and improve your accuracy and target matching

## difficulty

### easy
- uses curate passages including:
    - pangrams
    - quotes
    - practice sentences
    - common typing phrases

### hard
- uses randomly selected wikipedia articles
- includes:
    - capitals
    - numbers
    - punctuation
    - harder vocabulary

### typing engine
- uses a monkeytype inspired typing systems
- real time character highlighting
- correct and incorrect character tracking
- backspace correction support
- custom cursor animation
- accuracy calculations based on typed characters

### results and statistics
after each attempt:
- wpm score
- accuracy percentage
- target comparison
- attempt history
- average accuracy
- wpm progress chart

### leaderboard
- daily leaderboard powered by firebase firestore
- players can submit their daily results
- rankings caluclated by using:
    - number of attempts used
    - accuracy
    - distance from target wpm

### themes
includes multiple themes:
- monkeytype
- light
- forest
- matrix

themes are saved using local storage

## technologies used
- html
- css
- javascript (es modules)
- firebase firestore
- chart.js
- wikipedia rest api

## how it works

1. a target wpm is generated using a seeded random number generator
2. a passage is selected based on the chosen difficulty
3. the player types the passage while the game tracks time, keystrokes, accuracy, and speed
4. the final score is compared against the target
5. results can be saved and compared on the leaderboard
