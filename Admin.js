const ADMIN_KEYS = {
    LOGS: 'g4s_logs',
    DAY_GUARDS: 'g4s_day_guards',
    NIGHT_GUARDS: 'g4s_night_guards',
    VISITORS: 'g4s_visitors',
    SUPERVISOR_REPORTS: 'g4s_supervisor_reports',
    DEVICES: 'g4s_devices',
    CURRENT_USER: 'g4s_current_user'
};

let allLogs = [], dayGuards = [], nightGuards = [], visitors = [], supervisorReports = [], devices = [];

function loadAdminData() {
    allLogs = JSON.parse(localStorage.getItem(ADMIN_KEYS.LOGS) || '[]');
    dayGuards = JSON.parse(localStorage.getItem(ADMIN_KEYS.DAY_GUARDS) || '[]');
    nightGuards = JSON.parse(localStorage.getItem(ADMIN_KEYS.NIGHT_GUARDS) || '[]');
    visitors = JSON.parse(localStorage.getItem(ADMIN_KEYS.VISITORS) || '[]');
    supervisorReports = JSON.parse(localStorage.getItem(ADMIN_KEYS.SUPERVISOR_REPORTS) || '[]');
    devices = JSON.parse(localStorage.getItem(ADMIN_KEYS.DEVICES) || '[]');
    updateStats();
}

function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const visitorsToday = allLogs.filter(l => l.type === 'VISITOR_IN' && l.dateOnly === today).length;
    document.getElementById('statTotalLogs').innerText = allLogs.length;
    document.getElementById('statActiveGuards').innerText = dayGuards.length + nightGuards.length;
    document.getElementById('statVisitorsToday').innerText = visitorsToday;
    document.getElementById('statSupervisorReports').innerText = supervisorReports.length;
    document.getElementById('statDevices').innerText = devices.length;
}

function renderAdminLogs() {
    const container = document.getElementById('adminLogsList');
    if (!container) return;
    const search = document.getElementById('adminSearch')?.value.toLowerCase() || '';
    const date = document.getElementById('adminDateFilter')?.value || '';
    let filtered = [...allLogs];
    if (search) filtered = filtered.filter(l => JSON.stringify(l).toLowerCase().includes(search));
    if (date) filtered = filtered.filter(l => l.dateOnly === date);
    if (filtered.length === 0) container.innerHTML = '<div style="padding:40px;text-align:center;">No logs found</div>';
    else container.innerHTML = filtered.slice(0, 200).map(l => `
        <div class="log-entry">
            <strong>[${l.ob}]</strong> ${l.dateDisplay} | ${l.type}<br>
            ${l.guardName ? `👤 ${l.guardName} (${l.matric || ''})<br>` : ''}
            ${l.visitorName ? `🚪 ${l.visitorName}<br>` : ''}
            📝 ${l.details?.substring(0, 100) || ''}
        </div>
    `).join('');
}

function renderAdminSupervisors() {
    const container = document.getElementById('adminSupervisorList');
    if (!container) return;
    if (supervisorReports.length === 0) container.innerHTML = '<div style="padding:40px;text-align:center;">No supervisor reports</div>';
    else container.innerHTML = supervisorReports.map(r => `
        <div class="log-entry">
            <strong>${r.date}</strong> | Supervisor: ${r.supervisorMatric}<br>
            📝 ${r.description}
        </div>
    `).join('');
}

function renderAdminActive() {
    const dayContainer = document.getElementById('adminDayGuards');
    const nightContainer = document.getElementById('adminNightGuards');
    const visitorContainer = document.getElementById('adminVisitors');
    
    if (dayContainer) {
        if (dayGuards.length === 0) dayContainer.innerHTML = '<div style="color:gray;padding:10px;">No day guards</div>';
        else dayContainer.innerHTML = dayGuards.map(g => `<div class="guard-item">${g.name} (${g.matric}) - Started: ${g.startTime}</div>`).join('');
    }
    if (nightContainer) {
        if (nightGuards.length === 0) nightContainer.innerHTML = '<div style="color:gray;padding:10px;">No night guards</div>';
        else nightContainer.innerHTML = nightGuards.map(g => `<div class="guard-item">${g.name} (${g.matric}) - Started: ${g.startTime}</div>`).join('');
    }
    if (visitorContainer) {
        if (visitors.length === 0) visitorContainer.innerHTML = '<div style="color:gray;padding:10px;">No visitors</div>';
        else visitorContainer.innerHTML = visitors.map(v => `<div class="guard-item">${v.name} - ${v.purpose} - IN: ${v.timeIn}</div>`).join('');
    }
}

function renderAdminDevices() {
    const container = document.getElementById('adminDevicesList');
    if (!container) return;
    if (devices.length === 0) container.innerHTML = '<div style="padding:40px;text-align:center;">No registered devices</div>';
    else container.innerHTML = devices.map(d => `
        <div class="guard-item">
            <div><strong>Device:</strong> ${d.deviceId}</div>
            <div><strong>Matric:</strong> ${d.matric}</div>
            <div><strong>Role:</strong> ${d.role}</div>
            <div><strong>Registered:</strong> ${d.registeredAt}</div>
            <button class="btn-sm btn-danger" onclick="removeDevice('${d.deviceId}')">Remove</button>
        </div>
    `).join('');
}

function addDevice() {
    const deviceId = prompt('Device ID:', 'dev_' + Date.now());
    const matric = prompt('Matriculation number:');
    const role = prompt('Role (guard/supervisor/admin):', 'guard');
    if (matric) {
        devices.push({
            deviceId: deviceId || 'dev_' + Date.now(),
            matric: matric,
            role: role,
            registeredAt: new Date().toLocaleString(),
            lastSeen: new Date().toLocaleString()
        });
        localStorage.setItem(ADMIN_KEYS.DEVICES, JSON.stringify(devices));
        renderAdminDevices();
        updateStats();
        alert('Device added');
    }
}

function removeDevice(deviceId) {
    if (confirm('Remove this device?')) {
        devices = devices.filter(d => d.deviceId !== deviceId);
        localStorage.setItem(ADMIN_KEYS.DEVICES, JSON.stringify(devices));
        renderAdminDevices();
        updateStats();
    }
}

function exportAllCSV() {
    const rows = [['OB', 'Date', 'Type', 'Person', 'Matric/ID', 'Details', 'TimeIn', 'TimeOut']];
    allLogs.forEach(l => rows.push([l.ob, l.dateDisplay, l.type, l.guardName || l.visitorName || '', l.matric || l.idNumber || '', l.details || '', l.timeIn || '', l.timeOut || '']));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `G4S_ALL_DATA_${new Date().toISOString().slice(0,19)}.csv`;
    link.click();
}

function resetAllData() {
    if (confirm('⚠️ DELETE ALL DATA? This cannot be undone.')) {
        localStorage.clear();
        alert('All data cleared. Page will reload.');
        window.location.reload();
    }
}

function setupAdminListeners() {
    document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem(ADMIN_KEYS.CURRENT_USER);
        window.location.href = 'index.html';
    });
    document.getElementById('refreshAdminBtn')?.addEventListener('click', () => { loadAdminData(); renderAdminLogs(); renderAdminSupervisors(); renderAdminActive(); renderAdminDevices(); alert('Refreshed'); });
    document.getElementById('exportAllBtn')?.addEventListener('click', exportAllCSV);
    document.getElementById('resetAllBtn')?.addEventListener('click', resetAllData);
    document.getElementById('addDeviceBtn')?.addEventListener('click', addDevice);
    document.getElementById('adminSearch')?.addEventListener('input', () => renderAdminLogs());
    document.getElementById('adminDateFilter')?.addEventListener('change', () => renderAdminLogs());
    document.getElementById('clearAdminSearch')?.addEventListener('click', () => {
        if (document.getElementById('adminSearch')) document.getElementById('adminSearch').value = '';
        if (document.getElementById('adminDateFilter')) document.getElementById('adminDateFilter').value = '';
        renderAdminLogs();
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.getElementById(`admin-tab-${tabId}`)?.classList.add('active');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (tabId === 'logs') renderAdminLogs();
            if (tabId === 'supervisors') renderAdminSupervisors();
            if (tabId === 'active') renderAdminActive();
            if (tabId === 'devices') renderAdminDevices();
        });
    });
}

// Check admin access
const savedUser = localStorage.getItem(ADMIN_KEYS.CURRENT_USER);
if (savedUser) {
    const user = JSON.parse(savedUser);
    if (user.role !== 'admin') window.location.href = 'index.html';
} else {
    window.location.href = 'index.html';
}

loadAdminData();
setupAdminListeners();
renderAdminLogs();
renderAdminSupervisors();
renderAdminActive();
renderAdminDevices();