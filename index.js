const SERVER = 'https://remoteclockservercsharp20250502005837-a3gjeuc9engqf9ac.canadacentral-01.azurewebsites.net/';
// const SERVER = 'http://localhost:5252';

let totalSeconds = 0;
let intervalId;
let isTimerStarted = false;
let dateTimeDto; 

const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
};

window.onload = async function () {
    // -------------- DATE TIME LOGIC ------------------
    const dateTimeDto = await getDateTimeObject();
    displayDate(dateTimeDto.date);
    displayTime(dateTimeDto);
    tickTackDateTime(dateTimeDto);
    checkAnotherDayDate();

    // -------------- TIMER LOGIC ----------------------
    const { userId, timerDto } = await getTimerDto();
    console.log('🚀 ~ responseDto:', timerDto);

    localStorage.setItem('userId', userId);
    displayTimer(timerDto.totalSeconds);
    if (timerDto.isTimerStarted) {
        totalSeconds = timerDto.totalSeconds;
        tickTackTimer(timerDto.totalSeconds);
        isTimerStarted = timerDto.isTimerStarted;
    }
    displayTimerButtons(timerDto.isTimerStarted);
};

// -------------- DATE TIME LOGIC ------------------
async function getDateTimeObject() {
    let response;
    let dateTimeDto;
    try {
        response = await fetch(`${SERVER}/DateTime/datetime`);
        if (response.ok) {
            dateTimeDto = await response.json();
        }
        return dateTimeDto;
    } catch (error) {
        console.error('Error fetching date and time:', error);
        // toLocalDateTime();
    }
}

function displayDate(dateString) {
    try {
        document.getElementById('date').innerHTML = dateString;
    } catch (error) {
        console.error('Error occurred during displaying date', error);
    }
}

function displayTime(dateTimeDto) {
    let timeString = `${checkTime(dateTimeDto.hours)}:${checkTime(
        dateTimeDto.minutes
    )}:${checkTime(dateTimeDto.seconds)}`;
    document.getElementById('time').innerHTML = timeString;
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

function tickTackDateTime(dateTimeDto) {
    setInterval(() => {
        dateTimeDto.seconds++;
        
        if (dateTimeDto.seconds >= 60) {
            dateTimeDto.seconds = 0;
            dateTimeDto.minutes++;
        } 

        if (dateTimeDto.minutes >= 60) {
            dateTimeDto.minutes = 0;
            dateTimeDto.hours++;
        }

        if (dateTimeDto.hours >= 24) {
            dateTimeDto.hours = 0;
            dateTimeDto.hours++;
        }
        displayTime(dateTimeDto);
    }, 1000);
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

// -------------- TIMER LOGIC ----------------------
async function getTimerDto() {
    let response;
    let responseDto;
    const partOfUrl =
        localStorage.getItem('userId') === null
            ? ''
            : `?userId=${localStorage.getItem('userId')}`;

    console.log('🚀 ~ getTimerDto ~ partOfUrl:', partOfUrl);
    try {
        response = await fetch(`${SERVER}/Timer/timer${partOfUrl}`);

        if (response.ok) {
            responseDto = await response.json();
            return responseDto;
        }
    } catch (error) {
        console.error('Error fetching /Timer/timer:', error.message);
    }
}

function displayTimer(totalSeconds) {
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const timerString = `${days === 0 ? '' : days + ' day(-s) '} ${checkTime(
        hours
    )}:${checkTime(minutes)}:${checkTime(seconds)}`;
    document.getElementById('timer').innerHTML = timerString;
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
    let responseDto;
    try {
        response = await fetch(
            `${SERVER}/Timer/start?userId=${localStorage.getItem('userId')}`,
            {
                method: 'POST',
            }
        );
        if (response.ok) {
            responseDto = await response.json();
        }
    } catch (error) {
        console.error('Error fetching /Timer/start:', error.message);
    }

    totalSeconds = responseDto.totalSeconds;
    isTimerStarted = responseDto.isTimerStarted;
    displayTimerButtons(isTimerStarted);
    tickTackTimer();
}

function tickTackTimer() {
    intervalId = setInterval(() => {
        totalSeconds++;
        displayTimer(totalSeconds);
    }, 1000);
}

async function stopTimer() {
    let response;
    let responseDto;
    try {
        response = await fetch(
            `${SERVER}/Timer/stop?userId=${localStorage.getItem('userId')}`,
            {
                method: 'POST',
            }
        );
        if (response.ok) {
            responseDto = await response.json();
        }
    } catch (error) {
        console.error('Error fetching /Timer/stop:', error.message);
    }

    totalSeconds = responseDto.totalSeconds;
    console.log('🚀 ~ stopTimer ~ totalSeconds:', totalSeconds);

    isTimerStarted = responseDto.isTimerStarted;
    displayTimer(totalSeconds);
    clearInterval(intervalId);
    displayTimerButtons(isTimerStarted);
}

async function onClickResetTimer() {
    if (totalSeconds === 0) return;

    let response;
    let responseDto;
    try {
        response = await fetch(
            `${SERVER}/Timer/reset?userId=${localStorage.getItem('userId')}`,
            {
                method: 'POST',
            }
        );
        if (response.ok) {
            responseDto = await response.json();
        }
    } catch (error) {
        console.error('Error fetching /Timer/reset:', error.message);
    }

    totalSeconds = responseDto.totalSeconds;
    isTimerStarted = responseDto.isTimerStarted;
    displayTimer(totalSeconds);
    clearInterval(intervalId);
    displayTimerButtons(isTimerStarted);
}

// ----------------- PUBLIC RESOURCE
function checkTime(i) {
    if (i < 10) {
        i = '0' + i;
    }
    return i;
}