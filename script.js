document.addEventListener('DOMContentLoaded', () => {

    const PAGE_REQUEST_LIST = [0, 1, 2, 3, 4, 5, 0, 6, 7, 1, 8, 2, 9, 3, 0, 1];
    const TOTAL_PAGES = 10;
    const TOTAL_FRAMES = 3;

    let mainMemory;
    let fifoQueue;
    let requestIndex;
    let stats;

    const secondaryMemoryDiv = document.getElementById('secondary-memory');
    const mainMemoryDiv = document.getElementById('main-memory');
    const nextBtn = document.getElementById('next-step-btn');
    const resetBtn = document.getElementById('reset-btn');
    const infoBox = document.getElementById('info-box');
    const requestQueueBox = document.getElementById('request-queue-box');
    const accessCountSpan = document.getElementById('access-count');
    const faultCountSpan = document.getElementById('fault-count');

    function initialize() {
        mainMemory = new Array(TOTAL_FRAMES).fill(null);
        fifoQueue = [];
        requestIndex = 0;
        stats = { accesses: 0, faults: 0 };

        secondaryMemoryDiv.innerHTML = '';
        for (let i = 0; i < TOTAL_PAGES; i++) {
            const page = document.createElement('div');
            page.className = 'page';
            page.id = `page-${i}`;
            page.innerText = `P${i}`;
            secondaryMemoryDiv.appendChild(page);
        }

        mainMemoryDiv.innerHTML = '';
        for (let i = 0; i < TOTAL_FRAMES; i++) {
            const frame = document.createElement('div');
            frame.className = 'frame empty';
            frame.id = `frame-${i}`;
            frame.innerText = `Frame ${i}`;
            mainMemoryDiv.appendChild(frame);
        }
        
        updateInfo('Simulation reset. Click "Next Step" to begin.', 'gray');
        updateRequestQueueDisplay();
        updateStats();
        nextBtn.disabled = false;
    }

    function handleNextStep() {
        if (requestIndex >= PAGE_REQUEST_LIST.length) {
            updateInfo('Simulation Complete!', 'green');
            nextBtn.disabled = true;
            return;
        }

        const pageToRequest = PAGE_REQUEST_LIST[requestIndex];
        stats.accesses++;
        
        clearHighlights();
        
        const frameIndex = mainMemory.indexOf(pageToRequest);
        
        if (frameIndex !== -1) {
            handlePageHit(pageToRequest, frameIndex);
        } else {
            handlePageFault(pageToRequest);
        }
        
        requestIndex++;
        updateRequestQueueDisplay();
        updateStats();
    }

    function handlePageHit(pageNumber, frameIndex) {
        updateInfo(`Page ${pageNumber} is already in Frame ${frameIndex}. (Page Hit)`, 'green');
        
        const frameDiv = document.getElementById(`frame-${frameIndex}`);
        frameDiv.classList.add('highlight-hit');
    }

    function handlePageFault(pageNumber) {
        stats.faults++;
        updateInfo(`Page ${pageNumber} not in RAM. (Page Fault)`, 'red');

        const emptyFrameIndex = mainMemory.indexOf(null);
        
        if (emptyFrameIndex !== -1) {
            loadPageIntoFrame(pageNumber, emptyFrameIndex);
            fifoQueue.push(pageNumber);
            
        } else {
            const victimPage = fifoQueue.shift();
            const victimFrameIndex = mainMemory.indexOf(victimPage);

            updateInfo(`RAM is full. Evicting Page ${victimPage} from Frame ${victimFrameIndex} (FIFO).`, 'orange');

            const victimFrameDiv = document.getElementById(`frame-${victimFrameIndex}`);
            victimFrameDiv.classList.add('highlight-evict');

            setTimeout(() => {
                loadPageIntoFrame(pageNumber, victimFrameIndex);
                fifoQueue.push(pageNumber);
            }, 1000);
        }
    }
    
    function loadPageIntoFrame(pageNumber, frameIndex) {
        mainMemory[frameIndex] = pageNumber;
        
        const frameDiv = document.getElementById(`frame-${frameIndex}`);
        frameDiv.className = 'frame';
        frameDiv.innerText = `P${pageNumber}`;
        frameDiv.classList.add('highlight-fault');
    }

    function updateInfo(message, color) {
        infoBox.innerText = message;
        infoBox.style.backgroundColor = 
            color === 'green' ? '#d4edda' :
            color === 'red' ? '#f8d7da' :
            color === 'orange' ? '#fff3cd' : '#eee';
    }

    function updateStats() {
        accessCountSpan.innerText = stats.accesses;
        faultCountSpan.innerText = stats.faults;
    }
    
    function updateRequestQueueDisplay() {
        const upcomingRequests = PAGE_REQUEST_LIST.slice(requestIndex);
        
        if (upcomingRequests.length === 0) {
            requestQueueBox.innerHTML = '<em>(End of queue)</em>';
            return;
        }

        requestQueueBox.innerHTML = 
            `<span style="font-weight:bold; color:red; font-size: 1.2em;">${upcomingRequests[0]}</span>` +
            `&nbsp; ${upcomingRequests.slice(1).join(' ')}`;
    }

    function clearHighlights() {
        document.querySelectorAll('.frame').forEach(frame => {
            frame.classList.remove('highlight-hit', 'highlight-fault', 'highlight-evict');
        });
    }

    nextBtn.addEventListener('click', handleNextStep);
    resetBtn.addEventListener('click', initialize);
    
    initialize();
});