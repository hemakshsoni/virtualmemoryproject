document.addEventListener('DOMContentLoaded', () => {

    // CONFIGURATION & STATE
    let pageRequestList = [];
    const TOTAL_PAGES = 10;
    const TOTAL_FRAMES = 3;

    let mainMemory;
    let usageStack; // Used for FIFO and LRU
    let requestIndex;
    let stats;

    // HTML ELEMENT REFERENCES
    const secondaryMemoryDiv = document.getElementById('secondary-memory');
    const mainMemoryDiv = document.getElementById('main-memory');
    const nextBtn = document.getElementById('next-step-btn');
    const resetBtn = document.getElementById('reset-btn');
    const infoBox = document.getElementById('info-box');
    const pageRequestInput = document.getElementById('page-request-input');
    const requestQueueBox = document.getElementById('request-queue-box');
    const accessCountSpan = document.getElementById('access-count');
    const faultCountSpan = document.getElementById('fault-count');
    const algoSelect = document.getElementById('algo-select');

    // INITIALIZATION
    function initialize() {
        const inputText = pageRequestInput.value;
        
        const allEntries = inputText.split(' ')
                                 .map(s => s.trim())
                                 .filter(s => s.length > 0);
        
        let isValid = true;
        let parsedList = [];

        if (allEntries.length === 0) {
            isValid = false;
        }

        for (const entry of allEntries) {
            const num = Number(entry);
            if (!Number.isInteger(num) || num < 0 || num >= TOTAL_PAGES) {
                isValid = false;
                break;
            }
            parsedList.push(num);
        }

        if (!isValid) {
            pageRequestList = [];
            updateInfo('Error: Input must be space-separated numbers between 0 and 9.', 'red');
            nextBtn.disabled = true;
            requestQueueBox.innerHTML = '<em>(No requests)</em>';
        
        } else {
            pageRequestList = parsedList;
            mainMemory = new Array(TOTAL_FRAMES).fill(null);
            usageStack = []; // Reset the stack
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
    }

    // --- 4. CORE SIMULATION LOGIC ---

    function handleNextStep() {
        if (requestIndex >= pageRequestList.length) {
            updateInfo('Simulation Complete!', 'green');
            nextBtn.disabled = true;
            return;
        }

        const pageToRequest = pageRequestList[requestIndex];
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

        if (requestIndex >= pageRequestList.length) {
            updateInfo('Simulation Complete!', 'green');
            nextBtn.disabled = true;
        }
    }

    function handlePageHit(pageNumber, frameIndex) {
        updateInfo(`Page ${pageNumber} is already in Frame ${frameIndex}. (Page Hit)`, 'green');
        
        const frameDiv = document.getElementById(`frame-${frameIndex}`);
        frameDiv.classList.add('highlight-hit');

        if (algoSelect.value === 'LRU') {
            const pageIndexInStack = usageStack.indexOf(pageNumber);
            if (pageIndexInStack > -1) {
                usageStack.splice(pageIndexInStack, 1);
            }
            usageStack.push(pageNumber);
        }
    }

    function handlePageFault(pageNumber) {
        stats.faults++;
        updateInfo(`Page ${pageNumber} not in RAM. (Page Fault)`, 'red');
        
        const algo = algoSelect.value;
        const emptyFrameIndex = mainMemory.indexOf(null);
        
        if (emptyFrameIndex !== -1) {
            // Case A: There is an empty frame
            loadPageIntoFrame(pageNumber, emptyFrameIndex);
            if (algo === 'FIFO' || algo === 'LRU') {
                usageStack.push(pageNumber); // Add to end of stack
            }
            
        } else {
            // RAM is full. Must evict.
            let victimPage;
            
            if (algo === 'FIFO' || algo === 'LRU') {
                victimPage = usageStack.shift(); 
            } else { // algo === 'OPT'
                victimPage = findOptimalVictim();
            }
            
            const victimFrameIndex = mainMemory.indexOf(victimPage);
            
            updateInfo(`RAM is full. Evicting Page ${victimPage} from Frame ${victimFrameIndex} (${algo}).`, 'orange');

            nextBtn.disabled = true;

            const victimFrameDiv = document.getElementById(`frame-${victimFrameIndex}`);
            victimFrameDiv.classList.add('highlight-evict');

            setTimeout(() => {
                loadPageIntoFrame(pageNumber, victimFrameIndex);
                if (algo === 'FIFO' || algo === 'LRU') {
                    usageStack.push(pageNumber); // Add new page to end
                }
                
                if (requestIndex < pageRequestList.length) {
                    nextBtn.disabled = false;
                }
            }, 1000);
        }
    }
    
    // NEW HELPER FUNCTION FOR OPT

    function findOptimalVictim() {
        // Get the "future" part of the request list
        const futureRequests = pageRequestList.slice(requestIndex + 1);
        let victimPage = -1;
        let farthestNextUse = -1;

        // Check each page currently in RAM
        for (const pageInRam of mainMemory) {
            
            // Find the next time this page is used
            const nextUseIndex = futureRequests.indexOf(pageInRam);

            // Case 1: Page is never used again. This is the perfect victim.
            if (nextUseIndex === -1) {
                victimPage = pageInRam;
                return victimPage; // Found the best, return immediately
            }

            // Case 2: Page is used again. Check if it's farther than the current victim.
            if (nextUseIndex > farthestNextUse) {
                farthestNextUse = nextUseIndex;
                victimPage = pageInRam;
            }
        }
        
        // After checking all pages, return the one that was used farthest in the future
        return victimPage;
    }

    //HELPER & UI FUNCTIONS

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
        const upcomingRequests = pageRequestList.slice(requestIndex);
        
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

    // START THE SIMULATION
    nextBtn.addEventListener('click', handleNextStep);
    resetBtn.addEventListener('click', initialize);
    algoSelect.addEventListener('change', initialize);
    
    initialize();
});