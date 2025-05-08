const SERVER =
'https://remoteclockservercsharp20250502005837-a3gjeuc9engqf9ac.canadacentral-01.azurewebsites.net/';
// const SERVER = 'http://localhost:5252';

let totalSeconds = 0;
let intervalId;
let isTimerStarted = false;
let dateTimeDto;

let isOfflineTimer = false;

const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
};

window.onload = async function () {
    if (!localStorage.getItem('userId')) {
        const userId = crypto.randomUUID();
        localStorage.setItem('userId', userId);
    }

    // -------------- DATE TIME LOGIC ------------------
    await startDateTimeLogic();

    // -------------- TIMER LOGIC ----------------------
    await startTimerLogic();
};

// -------------- DATE TIME LOGIC ------------------
async function startDateTimeLogic() {
    try {
        dateTimeDto = await getServerDateTimeDto();
    } catch {
        dateTimeDto = getLocalDateTimeDto();
    }

    try {
        displayDate(dateTimeDto.date);
        displayTime(dateTimeDto);
        tickTackDateTime(dateTimeDto);
        checkAnotherDayDate();
    } catch (error) {
        console.error('Error occurred during display date and time', error);
    }
}

async function getServerDateTimeDto() {
    const response = await fetch(`${SERVER}/DateTime/datetime`);
    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
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

    const timeout = next.getTime() - now.getTime();

    setTimeout(() => {
        getServerDateTimeDto();
        setInterval(getServerDateTimeDto, 60 * 60 * 1000);
    }, timeout);
}

function tickTackDateTime(dateTimeDto) {
    const clientTime = new Date();

    const serverTime = new Date();
    serverTime.setHours(dateTimeDto.hours);
    serverTime.setMinutes(dateTimeDto.minutes);
    serverTime.setSeconds(dateTimeDto.seconds);
    serverTime.setMilliseconds(0);

    const timeDifference = clientTime.getTime() - serverTime.getTime();

    setInterval(() => {
        const now = new Date();
        const actualTime = new Date(now.getTime() - timeDifference);

        displayTime({
            hours: actualTime.getHours(),
            minutes: actualTime.getMinutes(),
            seconds: actualTime.getSeconds(),
        });
    }, 1000);
}

function getLocalDateTimeDto() {
    const localDateTime = new Date();

    return {
        date: localDateTime.toLocaleDateString(undefined, options),
        hours: localDateTime.getHours(),
        minutes: localDateTime.getMinutes(),
        seconds: localDateTime.getSeconds(),
    };
}

// -------------- TIMER LOGIC ----------------------
async function startTimerLogic() {
    const result = await getTimerDto();

    if (!result || !result.userId || !result.timerDto) {
        const userId = localStorage.getItem('userId');
        const timerDto = {
            totalSeconds: Number(localStorage.getItem('totalSeconds') || 0),
            isTimerStarted: localStorage.getItem('isTimerStarted') === 'true',
        };

        displayTimer(timerDto.totalSeconds);
        if (timerDto.isTimerStarted) {
            totalSeconds = timerDto.totalSeconds;
            tickTackTimer();
            isTimerStarted = true;
        }

        displayTimerButtons(timerDto.isTimerStarted);
        return;
    }

    const { userId, timerDto } = result;

    setTimerToLocalStorage(userId, timerDto);

    displayTimer(timerDto.totalSeconds);
    if (timerDto.isTimerStarted) {
        totalSeconds = timerDto.totalSeconds;
        tickTackTimer();
        isTimerStarted = timerDto.isTimerStarted;
    }

    displayTimerButtons(timerDto.isTimerStarted);
}

function setTimerToLocalStorage(userId, timerDto) {
    localStorage.setItem('userId', userId);
    localStorage.setItem('totalSeconds', timerDto.totalSeconds);
    localStorage.setItem('startDateTime', timerDto.startDateTime);
    localStorage.setItem('stopDateTime', timerDto.stopDateTime);
    localStorage.setItem('isTimerStarted', timerDto.isTimerStarted);
}

async function getTimerDto() {
    let response;
    let responseDto;
    const partOfUrl =
        localStorage.getItem('userId') === null
            ? ''
            : `?userId=${localStorage.getItem('userId')}`;

    try {
        response = await fetch(`${SERVER}/Timer/timer${partOfUrl}`);

        if (response.ok) {
            responseDto = await response.json();
            return responseDto;
        } else {
            throw new Error('Response is not OK');
        }
    } catch (error) {
        console.error('Error fetching /Timer/timer:', error.message);
        isOfflineTimer = true;
        displayTimerMode();
        return null;
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

function displayTimerMode() {
    const result = isOfflineTimer ? 'CLIENT MODE TIMER' : 'SERVER MODE TIMER' ;
    console.log('🚀 ~ displayTimerError ~ result:', result)
    
    document.getElementById('timer_status').innerHTML = result;
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
        } else {
            throw new Error('Response from server is not OK');
        }
    } catch (error) {
        console.error('Error fetching /Timer/start:', error.message);
        isOfflineTimer = true;
        displayTimerMode();
        responseDto = {
            totalSeconds: Number(localStorage.getItem('totalSeconds') || 0),
            isTimerStarted: true,
        };
    }

    totalSeconds = responseDto.totalSeconds;
    isTimerStarted = responseDto.isTimerStarted;

    localStorage.setItem('totalSeconds', responseDto.totalSeconds);
    localStorage.setItem('isTimerStarted', responseDto.isTimerStarted);

    tickTackTimer();
    displayTimerButtons(isTimerStarted);

    if (isOfflineTimer) {
        tryToSyncTimer();
    }
}

function tickTackTimer() {
    intervalId = setInterval(() => {
        totalSeconds++;
        displayTimer(totalSeconds);
        localStorage.setItem('totalSeconds', totalSeconds);
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
        } else {
            throw new Error('Response from server is not OK');
        }
    } catch (error) {
        console.error('Error fetching /Timer/stop:', error.message);
        isOfflineTimer = true;
        displayTimerMode();
        responseDto = {
            totalSeconds,
            isTimerStarted: false,
        };
    }

    totalSeconds = responseDto.totalSeconds;
    isTimerStarted = responseDto.isTimerStarted;

    localStorage.setItem('totalSeconds', totalSeconds);
    localStorage.setItem('isTimerStarted', isTimerStarted);

    displayTimer(totalSeconds);
    clearInterval(intervalId);
    displayTimerButtons(isTimerStarted);

    if (isOfflineTimer) {
        tryToSyncTimer();
    }
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
        } else {
            throw new Error('Response from server is not OK');
        }
    } catch (error) {
        console.error('Error fetching /Timer/reset:', error.message);
        isOfflineTimer = true;
        displayTimerMode();
        responseDto = {
            totalSeconds: 0,
            isTimerStarted: false,
        };
    }

    totalSeconds = responseDto.totalSeconds;
    isTimerStarted = responseDto.isTimerStarted;

    localStorage.setItem('totalSeconds', totalSeconds);
    localStorage.setItem('isTimerStarted', isTimerStarted);

    displayTimer(totalSeconds);
    clearInterval(intervalId);
    displayTimerButtons(isTimerStarted);

    if (isOfflineTimer) {
        tryToSyncTimer();
    }
}

async function tryToSyncTimer() {
    const userId = localStorage.getItem('userId');

    const syncInterval = setInterval(async () => {
        if (!isOfflineTimer) {
            clearInterval(syncInterval);
            return;
        }

        try {
            const response = await fetch(
                `${SERVER}/Timer/sync?userId=${userId}&totalSeconds=${totalSeconds}`,
                { method: 'POST' }
            );

            if (response.ok) {
                console.log('Timer was synchronized with server');
                isOfflineTimer = false;
                clearInterval(syncInterval);
            }
        } catch (error) {
            console.error('Server is offline');
        }
    }, 5000);
}

// ----------------- PUBLIC RESOURCE
function checkTime(i) {
    if (i < 10) {
        i = '0' + i;
    }
    return i;
}
