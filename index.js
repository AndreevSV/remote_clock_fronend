// const SERVER = 'https://remoteclockservernode.azurewebsites.net/';
const SERVER = 'http://localhost:5252';

let totalSeconds = 0;
let intervalId;
let isTimerStarted = false;

const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
};

window.onload = function () {
    getDateTimeObject();
    getTimerObject();

    setInterval(() => {
        const now = new Date();
        const timeString = `${checkTime(now.getHours())}:${checkTime(
            now.getMinutes()
        )}:${checkTime(now.getSeconds())}`;
        displayTime(timeString);
    }, 1000);

    checkAnotherDayDate();
};

async function getDateTimeObject() {
    try {
        const response = await fetch(`${SERVER}/DateTime/datetime`);
        if (response.ok) {
            const dateTimeObject = await response.json();
            displayDate(dateTimeObject.date);
            displayTime(
                `${dateTimeObject.Hours}:${dateTimeObject.Minutes}:${dateTimeObject.Seconds}`
            );
        } else {
            toLocalDateTime();
        }
    } catch (error) {
        console.error('Error fetching date and time:', error);
        toLocalDateTime();
    }
}

async function getTimerObject() {
    try {
        const response = await fetch(`${SERVER}/Timer/timer`);
        if (response.ok) {
            const timerObject = await response.json();
            totalSeconds = Math.floor(timerObject.totalSeconds);
            displayTimerFromServer(timerObject);
        } else {
            console.error('Error fetching timer');
        }
    } catch (error) {
        console.error(error);
    }
}

function checkAnotherDayDate() {
    const now = new Date();
    const next = new Date();

    next.setHours(now.getHours() + 1);
    next.setMinutes(0);
    next.setSeconds(1);
    next.setMilliseconds(0);

    const timeout = next.getTime() - now.getTime();

    setTimeout(() => {
        getDateTimeObject();
        setInterval(getDateTimeObject, 60 * 60 * 1000);
    }, timeout);
}

function toLocalDateTime() {
    const today = new Date();
    displayDate(today.toLocaleDateString(undefined, options));
    displayTime(convertTodayToTime(today));
}

function convertTodayToTime(today) {
    let hours = today.getHours();
    let minutes = today.getMinutes();
    let seconds = today.getSeconds();

    minutes = checkTime(minutes);
    seconds = checkTime(seconds);

    return `${hours}:${minutes}:${seconds}`;
}

function displayTimerFromServer(timerDto) {
    let days = timerDto.days;
    let hours = checkTime(timerDto.hours);
    let minutes = checkTime(timerDto.minutes);
    let seconds = checkTime(timerDto.seconds);

    const timerString = `${
        days === 0 ? '' : days + ' day(-s) '
    } ${hours}:${minutes}:${seconds}`;
    console.log(timerString);
    document.getElementById('timer').innerHTML = timerString;
}

function displayDate(dateString) {
    try {
        document.getElementById('date').innerHTML = dateString;
    } catch (error) {
        console.error('Error occurred during displaying date', error);
    }
}

function displayTime(timeString) {
    document.getElementById('time').innerHTML = timeString;
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
}

function onClickStartStopTimer() {
    if (isTimerStarted === false) {
        startTimer();
        document.querySelector('.start_stop_button').innerHTML = 'Stop';
    } else {
        stopTimer();
        isTimerStarted = false;
        document.querySelector('.start_stop_button').innerHTML = 'Start';
    }
}

async function startTimer() {
    if (isTimerStarted) {
        return;
    }

    try {
        await fetch(`${SERVER}/Timer/start`, { method: 'POST' });
    } catch (error) {
        console.warn('Server not available, timer starts locally');
    }

    isTimerStarted = true;
    document.querySelector('.start_stop_button').innerHTML = 'Stop';

    intervalId = setInterval(() => {
        totalSeconds++;
        displayTimer();
    }, 1000);
}

async function stopTimer() {
    clearInterval(intervalId);
    await fetch(`${SERVER}/Timer/stop`, { method: 'POST' });
}

async function onClickResetTimer() {
    if (totalSeconds === 0) return; 
    await fetch(`${SERVER}/Timer/reset`, { method: 'POST' });
    totalSeconds = 0;
    displayTimer();
    clearInterval(intervalId);
    isTimerStarted = false;
    document.querySelector('.start_stop_button').innerHTML = 'Start';
}

function parseTimer() {
    const hours = Math.floor(totalSeconds / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
}
