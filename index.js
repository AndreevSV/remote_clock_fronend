// const SERVER =
// 'https://remoteclockservercsharp20250502005837-a3gjeuc9engqf9ac.canadacentral-01.azurewebsites.net/';
const SERVER = 'http://localhost:5252';

let dateTimeDto;

let userId = localStorage.getItem('userId');
if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('userId', userId);

    localStorage.setItem('totalSeconds', '0');
    localStorage.setItem('startDateTime', '');
    localStorage.setItem('stopDateTime', '');
    localStorage.setItem('isTimerStarted', 'false');

    localStorage.setItem('isOfflineServer', 'false');
}

let timerDto = {
    totalSeconds: Number(localStorage.getItem('totalSeconds')) || 0,
    startDateTime: localStorage.getItem('startDateTime') || null,
    stopDateTime: localStorage.getItem('stopDateTime') || null,
    isTimerStarted: localStorage.getItem('isTimerStarted') === 'true',
};

let isOfflineServer = localStorage.getItem('isOfflineServer') === 'true';

let tickTackTimerIntervalId;
const SERVER_SYNC_INTERVAL = 5000;

window.onload = async function () {
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
        date: localDateTime.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }),
        hours: localDateTime.getHours(),
        minutes: localDateTime.getMinutes(),
        seconds: localDateTime.getSeconds(),
    };
}

// -------------- TIMER LOGIC ----------------------
function onClickStartStopTimer() {
    if (!timerDto.isTimerStarted) {
        startTimer();
    } else {
        stopTimer();
    }
}

function onClickResetTimer() {
    if (timerDto.totalSeconds !== 0) {
        resetTimer();
    }
}

async function startTimerLogic() {
    await getTimer();

    if (timerDto.isTimerStarted && timerDto.startDateTime) {
        const lastStart = new Date(timerDto.startDateTime);
        const now = new Date();
        const elapsed = Math.floor((now - lastStart) / 1000);
        timerDto.totalSeconds += elapsed;
        localStorage.setItem('totalSeconds', timerDto.totalSeconds);

        timerDto.startDateTime = now.toISOString();
        localStorage.setItem('startDateTime', timerDto.startDateTime);

        tickTackTimer();
    }

    displayTimer(timerDto.totalSeconds);
    displayTimerButtons(timerDto.isTimerStarted);
    displayTimerMode(isOfflineServer);
}

async function getTimer() {
    try {
        const response = await fetch(`${SERVER}/Timer/timer?userId=${userId}`);
        if (response.ok) {
            const { timerDto } = await response.json();
            refreshTimerClientLocalData(timerDto);

            localStorage.setItem('isOfflineServer', false);
            isOfflineServer = false;
        } else {
            throw new Error(
                `Response from Server is not OK (status: ${response.status})`
            );
        }
    } catch (error) {
        console.error('Error fetching /Timer/timer:', error.message);

        localStorage.setItem('isOfflineServer', true);
        isOfflineServer = true;

        if (isOfflineServer) {
            await tryToSyncTimer();
        }
    }
}

async function startTimer() {
    try {
        const response = await fetch(`${SERVER}/Timer/start?userId=${userId}`, {
            method: 'POST',
        });
        console.log('🚀 ~ startTimer ~ response:', response);

        if (response.ok) {
            const timerDto = await response.json();

            console.log('🚀 ~ startTimer ~ timerDto:', timerDto);
            refreshTimerClientLocalData(timerDto);

            localStorage.setItem('isOfflineServer', false);
            isOfflineServer = false;

            tickTackTimer();

            document.querySelector('.reset_button').disabled = false;
        } else {
            throw new Error(
                `Response from Server is not OK (status: ${response.status})`
            );
        }
    } catch (error) {
        console.error('Error fetching /Timer/start:', error.message);

        localStorage.setItem('isOfflineServer', true);
        isOfflineServer = true;

        if (isOfflineServer) {
            await tryToSyncTimer('startTimer');
        }
    }

    displayTimer(timerDto.totalSeconds);
    displayTimerButtons(timerDto.isTimerStarted);
    displayTimerMode(isOfflineServer);
}

async function stopTimer() {
    if (timerDto.totalSeconds === 0) return;

    clearInterval(tickTackTimerIntervalId);

    try {
        const response = await fetch(`${SERVER}/Timer/stop?userId=${userId}`, {
            method: 'POST',
        });

        if (response.ok) {
            const timerDto = await response.json();
            refreshTimerClientLocalData(timerDto);

            localStorage.setItem('isOfflineServer', false);
            isOfflineServer = false;
        } else {
            throw new Error(
                `Response from Server is not OK (status: ${response.status})`
            );
        }
    } catch (error) {
        console.error('Error fetching /Timer/stop:', error.message);

        localStorage.setItem('isOfflineServer', true);
        isOfflineServer = true;

        // If server can't stop timer we stop it locally
        // and try to send locally formed timerDto to server
        // until it is online
        timerDto.isTimerStarted = false;
        timerDto.stopDateTime = calculateStopDateTime();

        localStorage.setItem('stopDateTime', timerDto.stopDateTime);
        localStorage.setItem('isTimerStarted', false);

        console.log('🚀 ~ stopTimer ~ stopDateTime:', timerDto.stopDateTime);

        if (isOfflineServer) {
            await tryToSyncTimer('stopTimer', timerDto);
        }
        displayTimerButtons(timerDto.isTimerStarted);
        displayTimerMode(isOfflineServer);
    }

    displayTimer(timerDto.totalSeconds);
    displayTimerButtons(timerDto.isTimerStarted);
    displayTimerMode(isOfflineServer);
}

async function resetTimer() {
    if (timerDto.totalSeconds === 0) return;

    clearInterval(tickTackTimerIntervalId);

    try {
        const response = await fetch(`${SERVER}/Timer/reset?userId=${userId}`, {
            method: 'POST',
        });
        if (response.ok) {
            const timerDto = await response.json();
            refreshTimerClientLocalData(timerDto);

            localStorage.setItem('isOfflineServer', false);
            isOfflineServer = false;
        } else {
            throw new Error(
                `Response from Server is not OK (status: ${response.status})`
            );
        }
    } catch (error) {
        console.error('Error fetching /Timer/reset:', error.message);

        localStorage.setItem('isOfflineServer', true);
        isOfflineServer = true;

        // If server can't reset timer we reset it locally
        // and try to send locally formed timerDto to server
        // until it is online
        const newTimerDto = {
            stopDateTime: calculateStopDateTime(),
            totalSeconds: 0,
            startDateTime: null,
            isTimerStarted: false,
        };

        refreshTimerClientLocalData(newTimerDto);

        if (isOfflineServer) {
            await tryToSyncTimer('resetTimer', timerDto);
        }
    }

    displayTimer(timerDto.totalSeconds);
    displayTimerButtons(timerDto.isTimerStarted);
    displayTimerMode(isOfflineServer);
}

async function tryToSyncTimer(typeOfSync, newTimerDto = null) {
    const syncIntervalId = setInterval(async () => {
        if (!isOfflineServer) {
            clearInterval(syncIntervalId);
            return;
        }

        const dtoToSync = newTimerDto || { ...timerDto };

        try {
            const response = await fetch(
                `${SERVER}/Timer/sync?userId=${userId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dtoToSync),
                }
            );

            if (response.ok) {
                console.log(
                    `Timer was synchronized with server successfully (${typeOfSync})`
                );
                const result = await response.json();

                refreshTimerClientLocalData(result);

                isOfflineServer = false;
                localStorage.setItem('isOfflineServer', false);

                displayTimerButtons(timerDto.isTimerStarted);
                displayTimerMode(isOfflineServer);

                clearInterval(syncIntervalId);
            } else {
                console.error(
                    `Timer was NOT synchronized with server (${typeOfSync}). Status: ${response.status})`
                );
            }
        } catch (error) {
            console.error(
                `Error occurred during timer synchronization (${typeOfSync}):`,
                error.message
            );
        }
    }, SERVER_SYNC_INTERVAL);
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
    document.querySelector('.start_stop_button').disabled = isOfflineServer;
    if (timerDto.totalSeconds === 0 && !timerDto.isTimerStarted) {
        document.querySelector('.reset_button').disabled = true;
    } else {
        document.querySelector('.reset_button').disabled = false;
    }
}

function displayTimerMode(isOfflineServer) {
    const mode = isOfflineServer ? 'SERVER OFFLINE' : 'SERVER ONLINE';
    const color = isOfflineServer ? 'red' : 'white';

    document.getElementById('timer_status').innerHTML = mode;
    document.getElementById('timer_status').style.color = color;
}

function tickTackTimer() {
    tickTackTimerIntervalId = setInterval(() => {
        timerDto.totalSeconds++;
        displayTimer(timerDto.totalSeconds);
        localStorage.setItem('totalSeconds', timerDto.totalSeconds);
    }, 1000);
}

function refreshTimerClientLocalData(newTimerDto) {
    Object.entries(newTimerDto).forEach(([key, value]) => {
        localStorage.setItem(key, value);
    });

    timerDto = { ...timerDto, ...newTimerDto };
}

// Calculate stopDateTime based on startDateTime and totalSeconds if server is not responding
function calculateStopDateTime() {
    const startDateTime = new Date(timerDto.startDateTime);
    const stopDateTime = new Date(
        startDateTime.getTime() + timerDto.totalSeconds * 1000
    );
    return stopDateTime.toISOString();
}

// ----------------- PUBLIC RESOURCE
function checkTime(i) {
    if (i < 10) {
        i = '0' + i;
    }
    return i;
}
