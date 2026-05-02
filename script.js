// ========== STORAGE KEYS ==========
const KEYS = {
    LOGS: 'g4s_logs',
    DAY_GUARDS: 'g4s_day_guards',
    NIGHT_GUARDS: 'g4s_night_guards',
    VISITORS: 'g4s_visitors',
    SUPERVISOR_REPORTS: 'g4s_supervisor_reports',
    OB_COUNTER: 'g4s_ob_counter',
    OB_MONTH: 'g4s_ob_month',
    CURRENT_USER: 'g4s_current_user',
    CURRENT_POST: 'g4s_current_post',
    ALL_POSTS: 'g4s_all_posts',
    SYNC_QUEUE: 'g4s_sync_queue'
};

// ========== GLOBAL STATE ==========
let allLogs = [];
let dayGuards = [];
let nightGuards = [];
let visitors = [];
let supervisorReports = [];
let currentUser = null;
let currentPost = null;
let allPosts = [];

// ========== SAFE INITIALIZATION ==========
function loadData() {
    allLogs = JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
    dayGuards = JSON.parse(localStorage.getItem(KEYS.DAY_GUARDS) || '[]');
    nightGuards = JSON.parse(localStorage.getItem(KEYS.NIGHT_GUARDS) || '[]');
    visitors = JSON.parse(localStorage.getItem(KEYS.VISITORS) || '[]');
    supervisorReports = JSON.parse(localStorage.getItem(KEYS.SUPERVISOR_REPORTS) || '[]');
    allPosts = JSON.parse(localStorage.getItem(KEYS.ALL_POSTS) || '[]');
}

function saveData() {
    localStorage.setItem(KEYS.LOGS, JSON.stringify(allLogs));
    localStorage.setItem(KEYS.DAY_GUARDS, JSON.stringify(dayGuards));
    localStorage.setItem(KEYS.NIGHT_GUARDS, JSON.stringify(nightGuards));
    localStorage.setItem(KEYS.VISITORS, JSON.stringify(visitors));
    localStorage.setItem(KEYS.SUPERVISOR_REPORTS, JSON.stringify(supervisorReports));
    localStorage.setItem(KEYS.ALL_POSTS, JSON.stringify(allPosts));
}

function loadPosts() {
    const savedPost = localStorage.getItem(KEYS.CURRENT_POST);
    if (savedPost) {
        currentPost = JSON.parse(savedPost);
    }
}

function checkExistingPost() {
    if (currentPost) {
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('mainScreen').classList.add('active');
        updatePostBadge();
        renderAll();
    }
}

function updatePostBadge() {
    const badge = document.getElementById('postInfoBadge');
    if (badge && currentPost) {
        badge.innerHTML = `📍 ${currentPost.zoneObNumber} | ${currentPost.postName} | ${currentPost.zone}`;
    }
}

// ========== POPULATE REGION/CITY/ZONE DROPDOWNS ==========
function populateRegionSelect() {
    const regionSelect = document.getElementById('regRegion');
    if (!regionSelect) return;
    
    regionSelect.innerHTML = '<option value="">-- Select Region --</option>';
    // Use a safe check: if CAMEROON_DATA doesn't exist, show empty
    if (typeof CAMEROON_DATA !== 'undefined' && CAMEROON_DATA.regions) {
        CAMEROON_DATA.regions.forEach(region => {
            regionSelect.innerHTML += `<option value="${region.name}">${region.name}</option>`;
        });
    }
    
    regionSelect.addEventListener('change', function() {
        populateCitySelect(this.value);
    });
}

function populateCitySelect(regionName) {
    const citySelect = document.getElementById('regCity');
    if (typeof CAMEROON_DATA === 'undefined') {
        citySelect.innerHTML = '<option value="">-- Select City --</option>';
        return;
    }
    const region = CAMEROON_DATA.regions.find(r => r.name === regionName);
    
    if (!region) {
        citySelect.innerHTML = '<option value="">-- Select City --</option>';
        return;
    }
    
    citySelect.innerHTML = '<option value="">-- Select City --</option>';
    region.cities.forEach(city => {
        citySelect.innerHTML += `<option value="${city}">${city}</option>`;
    });
    
    citySelect.addEventListener('change', function() {
        populateZoneSelect(this.value);
    });
}

function populateZoneSelect(cityName) {
    const zoneSelect = document.getElementById('regZone');
    const preloadedZones = (typeof PRELOADED_ZONES !== 'undefined' && PRELOADED_ZONES[cityName]) ? PRELOADED_ZONES[cityName] : [];
    
    zoneSelect.innerHTML = '<option value="">-- Select existing zone --</option>';
    preloadedZones.forEach(zone => {
        zoneSelect.innerHTML += `<option value="${zone}">${zone}</option>`;
    });
}

// ========== REGISTER POST ==========
function registerPost() {
    const region = document.getElementById('regRegion').value;
    const city = document.getElementById('regCity').value;
    let zone = document.getElementById('regZone').value;
    const newZone = document.getElementById('regZoneNew').value.trim();
    const postName = document.getElementById('regPostName').value.trim();
    const zoneObNumber = document.getElementById('regZoneObNumber').value.trim();
    
    if (!region || !city || !postName || !zoneObNumber) {
        alert('Please fill all required fields: Region, City, Post Name, and Zone OB Number');
        return;
    }
    
    // Use new zone if entered, otherwise use selected zone
    if (newZone) {
        zone = newZone;
    }
    
    if (!zone) {
        alert('Please select or enter a zone');
        return;
    }
    
    currentPost = {
        postId: Date.now(),
        region: region,
        city: city,
        zone: zone,
        postName: postName,
        zoneObNumber: zoneObNumber,
        registeredAt: new Date().toISOString(),
        lastSync: new Date().toISOString()
    };
    
    // Save to all posts list (for admin)
    const existingPostIndex = allPosts.findIndex(p => p.zoneObNumber === zoneObNumber);
    if (existingPostIndex === -1) {
        allPosts.push(currentPost);
        saveData();
    }
    
    localStorage.setItem(KEYS.CURRENT_POST, JSON.stringify(currentPost));
    
    // Add registration log
    addLog('POST_REGISTRATION', {
        details: `Post registered: ${postName} (${zoneObNumber}) in ${zone}, ${city}, ${region}`
    });
    
    // Go to main screen
    document.getElementById('registerPostScreen').classList.remove('active');
    document.getElementById('mainScreen').classList.add('active');
    updatePostBadge();
    renderAll();
    alert(`Post registered successfully! Zone OB: ${zoneObNumber}`);
}

// ========== OB NUMBER MANAGEMENT ==========
function initOBCounter() {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const savedMonth = localStorage.getItem(KEYS.OB_MONTH);
    if (savedMonth !== yearMonth) {
        localStorage.setItem(KEYS.OB_MONTH, yearMonth);
        localStorage.setItem(KEYS.OB_COUNTER, '1');
    }
}

function getNextOB() {
    let counter = parseInt(localStorage.getItem(KEYS.OB_COUNTER) || '1');
    const obNumber = counter;
    counter++;
    localStorage.setItem(KEYS.OB_COUNTER, counter);
    return `OB-${obNumber.toString().padStart(4, '0')}`;
}

// ========== LOGIN VALIDATION ==========
function validateLogin(matric, otp) {
    if (matric === 'ADMIN123' && otp === '123456') return { success: true, role: 'admin', name: 'Administrator', matric: matric };
    if (matric === 'SUPER123' && otp === '123456') return { success: true, role: 'supervisor', name: 'Supervisor', matric: matric };
    if (otp === '123456') return { success: true, role: 'guard', name: matric, matric: matric };
    return { success: false };
}

// ========== ADD LOG ENTRY ==========
function addLog(type, data) {
    const now = new Date();
    const entry = {
        id: Date.now(),
        ob: getNextOB(),
        type: type,
        timestamp: now.toISOString(),
        dateDisplay: now.toLocaleString('en-CM', { hour12: false }),
        dateOnly: now.toISOString().split('T')[0],
        timeOnly: now.toLocaleTimeString('en-CM'),
        postInfo: currentPost ? {
            zoneObNumber: currentPost.zoneObNumber,
            postName: currentPost.postName,
            zone: currentPost.zone,
            city: currentPost.city,
            region: currentPost.region
        } : null,
        ...data
    };
    allLogs.unshift(entry);
    saveData();
    renderLogs();
    syncToServer(entry);
    return entry;
}

function syncToServer(entry) {
    let syncQueue = JSON.parse(localStorage.getItem(KEYS.SYNC_QUEUE) || '[]');
    syncQueue.push(entry);
    localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(syncQueue));
    
    if (navigator.onLine) {
        performSync();
    }
}

function performSync() {
    let syncQueue = JSON.parse(localStorage.getItem(KEYS.SYNC_QUEUE) || '[]');
    if (syncQueue.length === 0) return;
    
    console.log(`Syncing ${syncQueue.length} entries to admin panel`);
    localStorage.setItem(KEYS.SYNC_QUEUE, '[]');
    if (currentPost) {
        currentPost.lastSync = new Date().toISOString();
        localStorage.setItem(KEYS.CURRENT_POST, JSON.stringify(currentPost));
        updatePostInAllPosts(currentPost);
    }
}

function updatePostInAllPosts(updatedPost) {
    const index = allPosts.findIndex(p => p.zoneObNumber === updatedPost.zoneObNumber);
    if (index !== -1) {
        allPosts[index] = updatedPost;
        saveData();
    }
}

// ========== GUARD FUNCTIONS ==========
function addDayGuard() {
    const name = document.getElementById('dayName').value.trim();
    const matric = document.getElementById('dayMatric').value.trim();
    if (!name || !matric) return alert('Enter name and matriculation');
    
    const startTime = new Date().toLocaleString('en-CM', { hour12: false });
    dayGuards.push({ id: Date.now(), name, matric, startTime });
    addLog('DAY_GUARD_START', { guardName: name, matric: matric, details: `Started shift at ${startTime}`, timeIn: startTime });
    
    document.getElementById('dayName').value = '';
    document.getElementById('dayMatric').value = '';
    saveData();
    renderDayGuards();
}

function addNightGuard() {
    const name = document.getElementById('nightName').value.trim();
    const matric = document.getElementById('nightMatric').value.trim();
    if (!name || !matric) return alert('Enter name and matriculation');
    
    const startTime = new Date().toLocaleString('en-CM', { hour12: false });
    nightGuards.push({ id: Date.now(), name, matric, startTime });
    addLog('NIGHT_GUARD_START', { guardName: name, matric: matric, details: `Started shift at ${startTime}`, timeIn: startTime });
    
    document.getElementById('nightName').value = '';
    document.getElementById('nightMatric').value = '';
    saveData();
    renderNightGuards();
}

function showDayHandover() {
    if (dayGuards.length === 0) return alert('No day guards on duty');
    document.getElementById('dayHandover').style.display = 'block';
}

function showNightHandover() {
    if (nightGuards.length === 0) return alert('No night guards on duty');
    document.getElementById('nightHandover').style.display = 'block';
}

function endDayShift(status) {
    const nightMatric = document.getElementById('nightConfirmMat').value.trim();
    if (!nightMatric) return alert('Enter night guard matriculation');
    
    const assets = document.getElementById('dayAssets').value.trim() || 'No assets reported';
    const incident = document.getElementById('dayIncident').value.trim() || 'No incidents';
    const endTime = new Date().toLocaleString('en-CM', { hour12: false });
    
    for (const guard of dayGuards) {
        addLog('DAY_GUARD_END', {
            guardName: guard.name,
            matric: guard.matric,
            details: `Assets: ${assets} | Incident: ${incident} | Night confirmation: ${status === 'good' ? 'ALL GOOD' : 'ISSUES FOUND'}`,
            timeIn: guard.startTime,
            timeOut: endTime,
            confirmedBy: nightMatric,
            confirmationStatus: status,
            assetsReport: assets,
            incidentReport: incident
        });
    }
    
    dayGuards = [];
    document.getElementById('dayHandover').style.display = 'none';
    document.getElementById('nightConfirmMat').value = '';
    document.getElementById('dayAssets').value = '';
    document.getElementById('dayIncident').value = '';
    saveData();
    renderDayGuards();
    alert(`Day shift ended. Confirmed by night guard: ${status === 'good' ? 'ALL GOOD' : 'ISSUES FOUND'}`);
}

function endNightShift(status) {
    const dayMatric = document.getElementById('dayConfirmMat').value.trim();
    if (!dayMatric) return alert('Enter day guard matriculation');
    
    const assets = document.getElementById('nightAssets').value.trim() || 'No assets verified';
    const incident = document.getElementById('nightIncident').value.trim() || 'No incidents';
    const endTime = new Date().toLocaleString('en-CM', { hour12: false });
    
    for (const guard of nightGuards) {
        addLog('NIGHT_GUARD_END', {
            guardName: guard.name,
            matric: guard.matric,
            details: `Assets: ${assets} | Incident: ${incident} | Day confirmation: ${status === 'good' ? 'ALL GOOD' : 'ISSUES FOUND'}`,
            timeIn: guard.startTime,
            timeOut: endTime,
            confirmedBy: dayMatric,
            confirmationStatus: status,
            assetsReport: assets,
            incidentReport: incident
        });
    }
    
    nightGuards = [];
    document.getElementById('nightHandover').style.display = 'none';
    document.getElementById('dayConfirmMat').value = '';
    document.getElementById('nightAssets').value = '';
    document.getElementById('nightIncident').value = '';
    saveData();
    renderNightGuards();
    alert(`Night shift ended. Confirmed by day guard: ${status === 'good' ? 'ALL GOOD' : 'ISSUES FOUND'}`);
}

// ========== VISITOR FUNCTIONS ==========
function visitorIn() {
    const name = document.getElementById('visName').value.trim();
    const phone = document.getElementById('visPhone').value.trim();
    const idNumber = document.getElementById('visId').value.trim();
    const purpose = document.getElementById('visPurpose').value;
    const host = document.getElementById('visHost').value.trim();
    
    if (!name || !phone || !idNumber) return alert('Fill name, phone, and ID number');
    
    const timeIn = new Date().toLocaleString('en-CM', { hour12: false });
    const obIn = getNextOB();
    const visitorData = { id: Date.now(), name, phone, idNumber, purpose, host, timeIn, obIn: obIn };
    visitors.push(visitorData);
    
    addLog('VISITOR_IN', {
        visitorName: name,
        phone: phone,
        idNumber: idNumber,
        purpose: purpose,
        host: host,
        details: `IN: ${name} (ID: ${idNumber}) - ${purpose} to see ${host || 'N/A'}`,
        timeIn: timeIn,
        obIn: obIn
    });
    
    document.getElementById('visName').value = '';
    document.getElementById('visPhone').value = '';
    document.getElementById('visId').value = '';
    document.getElementById('visHost').value = '';
    saveData();
    renderVisitors();
    alert(`Visitor IN recorded. OB#: ${obIn}`);
}

function visitorOut() {
    if (visitors.length === 0) return alert('No visitors on site');
    const name = document.getElementById('visName').value.trim();
    if (!name) return alert('Enter visitor name to check out');
    
    const index = visitors.findIndex(v => v.name.toLowerCase() === name.toLowerCase());
    if (index === -1) return alert(`Visitor "${name}" not found`);
    
    const visitor = visitors[index];
    const timeOut = new Date().toLocaleString('en-CM', { hour12: false });
    const obOut = getNextOB();
    
    addLog('VISITOR_OUT', {
        visitorName: visitor.name,
        phone: visitor.phone,
        idNumber: visitor.idNumber,
        details: `OUT: ${visitor.name} - Time in: ${visitor.timeIn}, Time out: ${timeOut}`,
        timeIn: visitor.timeIn,
        timeOut: timeOut,
        obOut: obOut,
        relatedInOB: visitor.obIn
    });
    
    visitors.splice(index, 1);
    saveData();
    renderVisitors();
    document.getElementById('visName').value = '';
    alert(`Visitor ${visitor.name} checked out`);
}

// ========== SUPERVISOR FUNCTIONS ==========
function submitSupervisorReport() {
    const description = document.getElementById('supervisorDesc').value.trim();
    const matric = document.getElementById('supervisorMat').value.trim();
    if (!description || !matric) return alert('Enter description and your matriculation');
    
    const report = {
        id: Date.now(),
        date: new Date().toLocaleString('en-CM', { hour12: false }),
        description: description,
        supervisorMatric: matric,
        postInfo: currentPost
    };
    supervisorReports.unshift(report);
    
    addLog('SUPERVISOR_INSPECTION', {
        details: `Supervisor ${matric} inspected post: ${description.substring(0, 100)}`,
        supervisorMatric: matric,
        fullDescription: description
    });
    
    document.getElementById('supervisorDesc').value = '';
    document.getElementById('supervisorMat').value = '';
    saveData();
    renderSupervisorHistory();
    alert('Supervisor report submitted');
}

// ========== RENDER FUNCTIONS ==========
function renderDayGuards() {
    const container = document.getElementById('dayGuardList');
    const countSpan = document.getElementById('dayCount');
    if (!container) return;
    
    if (dayGuards.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:gray;padding:20px;">No day guards on duty</div>';
        if (countSpan) countSpan.innerText = '0';
    } else {
        container.innerHTML = dayGuards.map(g => `
            <div class="guard-item">
                <span><strong>${g.name}</strong> (${g.matric})</span>
                <span>Started: ${g.startTime}</span>
            </div>
        `).join('');
        if (countSpan) countSpan.innerText = dayGuards.length;
    }
}

function renderNightGuards() {
    const container = document.getElementById('nightGuardList');
    const countSpan = document.getElementById('nightCount');
    if (!container) return;
    
    if (nightGuards.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:gray;padding:20px;">No night guards on duty</div>';
        if (countSpan) countSpan.innerText = '0';
    } else {
        container.innerHTML = nightGuards.map(g => `
            <div class="guard-item">
                <span><strong>${g.name}</strong> (${g.matric})</span>
                <span>Started: ${g.startTime}</span>
            </div>
        `).join('');
        if (countSpan) countSpan.innerText = nightGuards.length;
    }
}

function renderVisitors() {
    const container = document.getElementById('visitorList');
    if (!container) return;
    
    if (visitors.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:gray;padding:20px;">✅ No visitors inside</div>';
    } else {
        container.innerHTML = visitors.map(v => `
            <div class="guard-item">
                <div><strong>${v.name}</strong> - ${v.purpose}</div>
                <div>📞 ${v.phone} | 🆔 ${v.idNumber}</div>
                <div>🎯 To: ${v.host || 'N/A'} | IN: ${v.timeIn}</div>
                <div>🔢 OB: ${v.obIn}</div>
            </div>
        `).join('');
    }
}

function renderLogs() {
    const container = document.getElementById('logList');
    if (!container) return;
    
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const searchDate = document.getElementById('searchDateFilter')?.value || '';
    
    let filtered = [...allLogs];
    if (searchTerm) {
        filtered = filtered.filter(l => 
            l.ob?.toLowerCase().includes(searchTerm) ||
            l.guardName?.toLowerCase().includes(searchTerm) ||
            l.visitorName?.toLowerCase().includes(searchTerm) ||
            l.matric?.toLowerCase().includes(searchTerm) ||
            l.idNumber?.toLowerCase().includes(searchTerm) ||
            l.details?.toLowerCase().includes(searchTerm)
        );
    }
    if (searchDate) {
        filtered = filtered.filter(l => l.dateOnly === searchDate);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:gray;padding:40px;">📭 No records found</div>';
    } else {
        container.innerHTML = filtered.map(l => `
            <div class="log-entry">
                <strong>[${l.ob}]</strong> ${l.dateDisplay} | <strong>${l.type.replace(/_/g, ' ')}</strong><br>
                ${l.guardName ? `👤 Guard: ${l.guardName} (${l.matric || ''})<br>` : ''}
                ${l.visitorName ? `🚪 Visitor: ${l.visitorName} | 📞 ${l.phone || ''} | 🆔 ${l.idNumber || ''}<br>` : ''}
                📝 ${l.details || '—'}<br>
                ${l.timeIn ? `⏱️ IN: ${l.timeIn}` : ''} ${l.timeOut ? ` OUT: ${l.timeOut}` : ''}
                ${l.confirmationStatus ? `<br><span style="color:#e67e22;">🔔 ${l.confirmationStatus === 'good' ? '✅ ALL GOOD' : '⚠️ ISSUES FOUND'}</span>` : ''}
                ${l.postInfo ? `<br><span style="color:#666; font-size:10px;">📍 ${l.postInfo.zoneObNumber} | ${l.postInfo.postName}</span>` : ''}
            </div>
        `).join('');
    }
}

function renderSupervisorHistory() {
    const container = document.getElementById('supervisorHistoryList');
    if (!container) return;
    
    if (supervisorReports.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:gray;padding:20px;">No supervisor reports yet</div>';
    } else {
        container.innerHTML = supervisorReports.slice(0, 10).map(r => `
            <div class="log-entry">
                <strong>${r.date}</strong> - ${r.supervisorMatric}<br>
                📝 ${r.description}
            </div>
        `).join('');
    }
}

function renderAll() {
    renderDayGuards();
    renderNightGuards();
    renderVisitors();
    renderLogs();
    renderSupervisorHistory();
}

// ========== EXPORT FUNCTIONS ==========
function exportToPDF() {
    const startDate = document.getElementById('reportStart').value;
    const endDate = document.getElementById('reportEnd').value;
    
    let filtered = [...allLogs];
    if (startDate) filtered = filtered.filter(l => l.dateOnly >= startDate);
    if (endDate) filtered = filtered.filter(l => l.dateOnly <= endDate);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html><head><title>G4S Report - ${currentPost?.postName || 'Unknown Post'}</title>
        <style>
            body{font-family:Arial;padding:20px;}
            h1{color:#0a3d35;}
            .post-info{background:#f5f5f5;padding:10px;border-radius:8px;margin:10px 0;}
            table{width:100%;border-collapse:collapse;margin-top:20px;}
            th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px;}
            th{background:#0a3d35;color:white;}
        </style>
        </head><body>
        <h1>G4S Cameroon - Security Report</h1>
        <div class="post-info">
            <strong>Post:</strong> ${currentPost?.postName || 'N/A'}<br>
            <strong>Zone OB:</strong> ${currentPost?.zoneObNumber || 'N/A'}<br>
            <strong>Location:</strong> ${currentPost?.zone || 'N/A'}, ${currentPost?.city || 'N/A'}, ${currentPost?.region || 'N/A'}
        </div>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Period:</strong> ${startDate || 'Start'} to ${endDate || 'End'}</p>
        <p><strong>Total Records:</strong> ${filtered.length}</p>
        <table>
            <tr><th>OB#</th><th>Date</th><th>Type</th><th>Person</th><th>Details</th></tr>
            ${filtered.map(l => `<tr><td>${l.ob}</td><td>${l.dateDisplay}</td><td>${l.type}</td><td>${l.guardName || l.visitorName || ''}</td><td>${(l.details || '').substring(0, 80)}</td></tr>`).join('')}
        </table>
        <p style="margin-top:30px;">Official G4S System Report</p>
        </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function exportToCSV() {
    const rows = [['OB', 'Date', 'Type', 'Person', 'Matric/ID', 'Details', 'TimeIn', 'TimeOut', 'Post']];
    allLogs.forEach(l => {
        rows.push([
            l.ob, l.dateDisplay, l.type,
            l.guardName || l.visitorName || '',
            l.matric || l.idNumber || '',
            l.details || '',
            l.timeIn || '',
            l.timeOut || '',
            currentPost?.zoneObNumber || ''
        ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `G4S_Report_${currentPost?.zoneObNumber || 'post'}_${new Date().toISOString().slice(0,19)}.csv`;
    link.click();
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    // Login
    document.getElementById('loginBtn')?.addEventListener('click', () => {
        const matric = document.getElementById('loginMatric').value.trim();
        const otp = document.getElementById('loginOtp').value.trim();
        const result = validateLogin(matric, otp);
        
        if (result.success) {
            currentUser = result;
            localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(currentUser));
            
            if (result.role === 'admin') {
                window.location.href = 'admin.html';
                return;
            }
            
            if (currentPost) {
                document.getElementById('loginScreen').classList.remove('active');
                document.getElementById('mainScreen').classList.add('active');
                document.getElementById('userNameDisplay').innerText = result.name;
                document.getElementById('userRoleBadge').innerText = result.role === 'supervisor' ? '👔 Supervisor' : '🛡️ Guard';
                if (result.role === 'supervisor') {
                    document.querySelectorAll('.supervisor-tab').forEach(el => el.style.display = 'block');
                }
                updatePostBadge();
                renderAll();
            } else {
                document.getElementById('loginScreen').classList.remove('active');
                document.getElementById('registerPostScreen').classList.add('active');
                document.getElementById('userNameDisplay').innerText = result.name;
                document.getElementById('userRoleBadge').innerText = result.role === 'supervisor' ? '👔 Supervisor' : '🛡️ Guard';
            }
        } else {
            alert('Invalid credentials. Use GUARD123/123456, SUPER123/123456, or ADMIN123/123456');
        }
    });
    
    // Register Post
    document.getElementById('registerPostBtn')?.addEventListener('click', registerPost);
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(`tab-${tabId}`)?.classList.add('active');
            btn.classList.add('active');
            if (tabId === 'logbook') renderLogs();
            if (tabId === 'supervisor') renderSupervisorHistory();
        });
    });
    
    // Guard buttons
    document.getElementById('addDayBtn')?.addEventListener('click', addDayGuard);
    document.getElementById('addNightBtn')?.addEventListener('click', addNightGuard);
    document.getElementById('endDayBtn')?.addEventListener('click', showDayHandover);
    document.getElementById('endNightBtn')?.addEventListener('click', showNightHandover);
    document.getElementById('nightConfirmGood')?.addEventListener('click', () => endDayShift('good'));
    document.getElementById('nightConfirmIssue')?.addEventListener('click', () => endDayShift('issue'));
    document.getElementById('dayConfirmGood')?.addEventListener('click', () => endNightShift('good'));
    document.getElementById('dayConfirmIssue')?.addEventListener('click', () => endNightShift('issue'));
    
    // Visitor buttons
    document.getElementById('visitorInBtn')?.addEventListener('click', visitorIn);
    document.getElementById('visitorOutBtn')?.addEventListener('click', visitorOut);
    
    // Search
    document.getElementById('searchInput')?.addEventListener('input', () => renderLogs());
    document.getElementById('searchDateFilter')?.addEventListener('change', () => renderLogs());
    document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
        if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
        if (document.getElementById('searchDateFilter')) document.getElementById('searchDateFilter').value = '';
        renderLogs();
    });
    
    // Export
    document.getElementById('exportPdfBtn')?.addEventListener('click', exportToPDF);
    document.getElementById('exportCsvBtn')?.addEventListener('click', exportToCSV);
    
    // Supervisor
    document.getElementById('submitSupervisorBtn')?.addEventListener('click', submitSupervisorReport);
    
    // Offline detection
    window.addEventListener('online', () => {
        const banner = document.getElementById('offlineBanner');
        if (banner) banner.style.display = 'none';
        performSync();
    });
    window.addEventListener('offline', () => {
        const banner = document.getElementById('offlineBanner');
        if (banner) banner.style.display = 'block';
    });
}

// ========== LOGOUT (Fixed - works even if init fails) ==========
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear user session
            localStorage.removeItem(KEYS.CURRENT_USER);
            // Optionally keep post data, but force re-login
            // Reload to go back to login screen
            window.location.reload();
        });
    }
}

// ========== INITIALIZATION ==========
function init() {
    // Try to load data, but don't crash if data.js missing
    try {
        loadData();
        initOBCounter();
        loadPosts();
        populateRegionSelect();
        checkExistingPost();
        setupEventListeners();
    } catch (e) {
        console.error("Initialization error (some features may be limited):", e);
        // Still set up what we can
        setupEventListeners();
    }
    // Logout always gets set up (even if the catch above misses it)
    setupLogout();
}

// Check for saved user and post (runs before init)
try {
    const savedUser = localStorage.getItem(KEYS.CURRENT_USER);
    const savedPost = localStorage.getItem(KEYS.CURRENT_POST);

    if (savedUser && !window.location.pathname.includes('admin.html')) {
        currentUser = JSON.parse(savedUser);
        if (currentUser.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            currentPost = savedPost ? JSON.parse(savedPost) : null;
            if (currentPost) {
                document.getElementById('loginScreen').classList.remove('active');
                document.getElementById('mainScreen').classList.add('active');
                document.getElementById('userNameDisplay').innerText = currentUser.name;
                document.getElementById('userRoleBadge').innerText = currentUser.role === 'supervisor' ? '👔 Supervisor' : '🛡️ Guard';
                if (currentUser.role === 'supervisor') {
                    document.querySelectorAll('.supervisor-tab').forEach(el => el.style.display = 'block');
                }
                updatePostBadge();
            }
        }
    }
} catch(e) {
    console.error("Auto-login check error:", e);
}

// Start everything
init();