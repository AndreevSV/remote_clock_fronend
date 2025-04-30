const SERVER = 'https://remoteclockservernode.azurewebsites.net/';

let totalSeconds = 0;

let timerObject = {
    hours: 0,
    minutes: 0,
    seconds: 0,
};

let timeoutId;

window.onload = function () {
    displayDate();
    displayTime();
    displayTimer();
};

function displayDate() {
    // TODO: add cron to change date at 00:00:00
    const today = new Date();
    const date = today.toLocaleDateString(undefined, options);
    document.getElementById('date').innerHTML = date;
}

function displayTime() {
    const today = new Date();
    let hours = today.getHours();
    let minutes = today.getMinutes();
    let seconds = today.getSeconds();

    minutes = checkTime(minutes);
    seconds = checkTime(seconds);

    let timeToDisplay = `${hours}:${minutes}:${seconds}`;

    document.getElementById('time').innerHTML = timeToDisplay;
    setTimeout(displayTime, 1000);
}

function checkTime(i) {
    if (i < 10) {
        i = '0' + i;
    }
    return i;
}

function displayTimer() {
    let { hours, minutes, seconds } = parseTimer();

    hours = checkTime(hours);
    minutes = checkTime(minutes);
    seconds = checkTime(seconds);

    let timer = `${hours}:${minutes}:${seconds}`;
    document.getElementById('timer').innerHTML = timer;
    setTimeout(displayTimer, 1000);
}

let isTimerStarted = false;

function onClickStartStopTimer() {
    if (isTimerStarted === false) {
        startTimer();
        isTimerStarted = true;
        document.querySelector('.start_stop_button').innerHTML = 'Stop';
    } else {
        stopTimer();
        isTimerStarted = false;
        document.querySelector('.start_stop_button').innerHTML = 'Start';
    }
}

function startTimer() {
    totalSeconds++;
    console.log('🚀 ~ startStopTimer ~ totalSeconds:', totalSeconds);
    timeoutId = setTimeout(startTimer, 1000);
}

function stopTimer() {
    clearTimeout(timeoutId);
}

function onClickResetTimer() {
    timerObject = {
        hours: 0,
        minutes: 0,
        seconds: 0,
    };
    totalSeconds = 0;
    clearTimeout(timeoutId);
}

function parseTimer() {
    if (totalSeconds < 60) {
        return { ...timerObject, seconds: totalSeconds };
    } else if (totalSeconds >= 60 && totalSeconds < 60 * 60) {
        return {
            ...timerObject,
            minutes: Math.floor(totalSeconds / 60),
            seconds: totalSeconds % 60,
        };
    } else {
        return {
            ...timerObject,
            hours: Math.floor(totalSeconds / (60 * 60)),
            minutes: Math.floor((totalSeconds % (60 * 60)) / 60),
            seconds: totalSeconds % 60,
        };
    }
}

function fetchServerDateTime() {
    fetch('');
}
