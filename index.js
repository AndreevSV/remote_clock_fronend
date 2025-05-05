// const SERVER = 'https://remoteclockservercsharp20250502005837-a3gjeuc9engqf9ac.canadacentral-01.azurewebsites.net/';
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

window.onload = async function () {
    // const dateTimeDto = await getDateTimeObject();
    // displayDate(dateTimeDto.date);
    // displayTime(dateTimeDto);

    // checkAnotherDayDate();

    const timerDto = await getTimerDto();
    displayTimer(timerDto.totalSeconds);
    if (timerDto.isTimerStarted) {
        totalSeconds = timerDto.totalSeconds;  
        tickTackTimer(timerDto.totalSeconds);
        isTimerStarted = timerDto.isTimerStarted;
    }
    displayTimerButtons(timerDto.isTimerStarted);
};

async function getTimerDto() {
    try {
        const response = await fetch(`${SERVER}/Timer/timer`);
        const timerDto = await response.json();
        return timerDto;
    } catch (error) {
        console.error('Error fetching /Timer/timer:', error.message);
    }
}

function displayTimer(totalSeconds) {
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const timerString = `${days === 0 ? '' : days + ' day(-s) '} ${checkTime(hours)}:${checkTime(minutes)}:${checkTime(seconds)}`;
    document.getElementById('timer').innerHTML = timerString;
}

function checkTime(i) {
    if (i < 10) {
        i = '0' + i;
    }
    return i;
}

function displayTimerButtons(isTimerStarted) {
    const result = isTimerStarted ? 'Stop' : 'Start';
    document.querySelector('.start_stop_button').innerHTML = result;
}

function onClickStartStopTimer() {
    if (isTimerStarted === false) {
        startTimer();
    } else {
        stopTimer();        
    }
}

async function startTimer() {
    let response;
    let timerDto;
    try {
        response = await fetch(`${SERVER}/Timer/start`, { method: 'POST' });
        timerDto = await response.json();
    } catch (error) {
        console.error('Error fetching /Timer/start:', error.message);
    }

    totalSeconds = timerDto.totalSeconds;
    isTimerStarted = timerDto.isTimerStarted;
    displayTimerButtons(isTimerStarted);
    tickTackTimer();
}

function tickTackTimer() {
    // Should send to server - intervalId?
    intervalId = setInterval(() => {
        totalSeconds++;
        displayTimer(totalSeconds);
    }, 1000);
    console.log('🚀 ~ intervalId=setInterval ~ intervalId:', intervalId)
}

async function stopTimer() {
    let response;
    let timerDto;
    try {
        response = await fetch(`${SERVER}/Timer/stop`, { method: 'POST' });
        timerDto = await response.json();
    } catch (error) {
        console.error('Error fetching /Timer/stop:', error.message);
    }

    totalSeconds = timerDto.totalSeconds;
    isTimerStarted = timerDto.isTimerStarted;
    displayTimer(totalSeconds);
    clearInterval(intervalId);
    displayTimerButtons(isTimerStarted);
}

async function onClickResetTimer() {
    if (totalSeconds === 0) return;

    let response;
    let timerDto;
    try {
        response = await fetch(`${SERVER}/Timer/reset`, { method: 'POST' });
        timerDto = await response.json();
    } catch (error) {
        console.error('Error fetching /Timer/reset:', error.message);
    }

    totalSeconds = timerDto.totalSeconds;
    isTimerStarted = timerDto.isTimerStarted;
    displayTimer(totalSeconds);
    clearInterval(intervalId);
    displayTimerButtons(isTimerStarted);
}

// async function getDateTimeObject() {
//     try {
//         const response = await fetch(`${SERVER}/DateTime/datetime`);
//         const dateTimeObject = await response.json();
//         return dateTimeObject;
//     } catch (error) {
//         console.error('Error fetching date and time:', error);
//         // toLocalDateTime();
//     }
// }

// function displayDate(dateString) {
//     try {
//         document.getElementById('date').innerHTML = dateString;
//     } catch (error) {
//         console.error('Error occurred during displaying date', error);
//     }
// }

// function displayTime(dateTimeDto) {
//     let timeString = `${checkTime(dateTimeDto.hours)}:${checkTime(
//         dateTimeDto.minutes
//     )}:${checkTime(dateTimeDto.seconds)}`;
//     document.getElementById('time').innerHTML = timeString;
//     // setInterval(() => {
//     //     const now = new Date();
//     //     const timeString = `${checkTime(now.getHours())}:${checkTime(now.getMinutes())}:${checkTime(now.getSeconds())}`;
//     //     displayTime(timeString);
//     // }, 1000);
// }

// function checkAnotherDayDate() {
//     const now = new Date();
//     const next = new Date();

//     next.setHours(now.getHours() + 1);
//     next.setMinutes(0);
//     next.setSeconds(1);
//     next.setMilliseconds(0);

//     const timeout = next.getTime() - now.getTime();

//     setTimeout(() => {
//         getDateTimeObject();
//         setInterval(getDateTimeObject, 60 * 60 * 1000);
//     }, timeout);
// }

// function toLocalDateTime() {
//     const today = new Date();
//     displayDate(today.toLocaleDateString(undefined, options));
//     displayTime(convertTodayToTime(today));
// }

// function convertTodayToTime(today) {
//     let hours = today.getHours();
//     let minutes = today.getMinutes();
//     let seconds = today.getSeconds();

//     minutes = checkTime(minutes);
//     seconds = checkTime(seconds);

//     return `${hours}:${minutes}:${seconds}`;
// }


// function displayTimer() {
//     let { hours, minutes, seconds } = parseTimer();

//     hours = checkTime(hours);
//     minutes = checkTime(minutes);
//     seconds = checkTime(seconds);

//     let timer = `${hours}:${minutes}:${seconds}`;
//     document.getElementById('timer').innerHTML = timer;
// }

// function parseTimer(totalSeconds) {
//     const days = Math.floor(totalSeconds / (60 * 60 * 24));
//     const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
//     const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
//     const seconds = totalSeconds % 60;
//     return { days, hours, minutes, seconds };
// }