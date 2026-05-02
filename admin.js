const ADMIN_KEYS = {
    LOGS: 'g4s_logs',
    DAY_GUARDS: 'g4s_day_guards',
    NIGHT_GUARDS: 'g4s_night_guards',
    VISITORS: 'g4s_visitors',
    SUPERVISOR_REPORTS: 'g4s_supervisor_reports',
    ALL_POSTS: 'g4s_all_posts',
    CURRENT_USER: 'g4s_current_user'
};

let allLogs = [], dayGuards = [], nightGuards = [], visitors = [], supervisorReports = [], allPosts = [];
let currentFilter = { region: 'all', city: 'all', zone: 'all', post: 'all' };

function loadAdminData() {
    allLogs = JSON.parse(localStorage.getItem(ADMIN_KEYS.LOGS) || '[]');
    dayGuards = JSON.parse(localStorage.getItem(ADMIN_KEYS.DAY_GUARDS) || '[]');
    nightGuards = JSON.parse(localStorage.getItem(ADMIN_KEYS.NIGHT_GUARDS) || '[]');
    visitors = JSON.parse(localStorage.getItem(ADMIN_KEYS.VISITORS) || '[]');
    supervisorReports = JSON.parse(localStorage.getItem(ADMIN_KEYS.SUPERVISOR_REPORTS) || '[]');
    allPosts = JSON.parse(localStorage.getItem(ADMIN_KEYS.ALL_POSTS) || '[]');
    
    // If no posts in storage, use the registered post from current device
    const currentPost = JSON.parse(localStorage.getItem('g4s_current_post') || 'null');
    if (currentPost && allPosts.length === 0) {
        allPosts = [currentPost];
        localStorage.setItem(ADMIN_KEYS.ALL_POSTS, JSON.stringify(allPosts));
    }
    
    updateStats();
    populateFilters();
    renderHierarchy();
    renderAllPosts();
    renderDashboardStats();
    renderSyncStatus();
    renderAdminLogs();
    renderSupervisorReports();
    renderActiveGuards();
    renderIssuesAndAlerts();
}

function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const visitorsToday = allLogs.filter(l => l.type === 'VISITOR_IN' && l.dateOnly === today).length;
    const reportsToday = supervisorReports.filter(r => r.date?.includes(today)).length;
    const issues24h = allLogs.filter(l => l.confirmationStatus === 'issue' && new Date(l.timestamp) > new Date(Date.now() - 24*60*60*1000)).length;
    
    document.getElementById('statTotalLogs').innerText = allLogs.length;
    document.getElementById('statTotalPosts').innerText = allPosts.length;
    document.getElementById('statActiveGuards').innerText = dayGuards.length + nightGuards.length;
    document.getElementById('statVisitorsToday').innerText = visitorsToday;
    document.getElementById('statReportsToday').innerText = reportsToday;
    document.getElementById('statIssues').innerText = issues24h;
}

function populateFilters() {
    const regionSelect = document.getElementById('filterRegion');
    const citySelect = document.getElementById('filterCity');
    const zoneSelect = document.getElementById('filterZone');
    const postSelect = document.getElementById('filterPost');
    
    // Populate regions
    regionSelect.innerHTML = '<option value="all">All Regions</option>';
    const uniqueRegions = [...new Set(allPosts.map(p => p.region))];
    uniqueRegions.forEach(region => {
        regionSelect.innerHTML += `<option value="${region}">${region}</option>`;
    });
    
    regionSelect.onchange = () => {
        const selectedRegion = regionSelect.value;
        citySelect.innerHTML = '<option value="all">All Cities</option>';
        zoneSelect.innerHTML = '<option value="all">All Zones</option>';
        postSelect.innerHTML = '<option value="all">All Posts</option>';
        
        const cities = [...new Set(allPosts.filter(p => selectedRegion === 'all' || p.region === selectedRegion).map(p => p.city))];
        cities.forEach(city => {
            citySelect.innerHTML += `<option value="${city}">${city}</option>`;
        });
    };
    
    citySelect.onchange = () => {
        const selectedRegion = regionSelect.value;
        const selectedCity = citySelect.value;
        zoneSelect.innerHTML = '<option value="all">All Zones</option>';
        postSelect.innerHTML = '<option value="all">All Posts</option>';
        
        const zones = [...new Set(allPosts.filter(p => (selectedRegion === 'all' || p.region === selectedRegion) && (selectedCity === 'all' || p.city === selectedCity)).map(p => p.zone))];
        zones.forEach(zone => {
            zoneSelect.innerHTML += `<option value="${zone}">${zone}</option>`;
        });
    };
    
    zoneSelect.onchange = () => {
        const selectedRegion = regionSelect.value;
        const selectedCity = citySelect.value;
        const selectedZone = zoneSelect.value;
        postSelect.innerHTML = '<option value="all">All Posts</option>';
        
        const posts = allPosts.filter(p => (selectedRegion === 'all' || p.region === selectedRegion) && (selectedCity === 'all' || p.city === selectedCity) && (selectedZone === 'all' || p.zone === selectedZone));
        posts.forEach(post => {
            postSelect.innerHTML += `<option value="${post.postId}">${post.postName} (${post.zoneObNumber})</option>`;
        });
    };
}

function applyFilter() {
    currentFilter = {
        region: document.getElementById('filterRegion').value,
        city: document.getElementById('filterCity').value,
        zone: document.getElementById('filterZone').value,
        post: document.getElementById('filterPost').value
    };
    renderAdminLogs();
    renderHierarchy();
}

function renderHierarchy() {
    const container = document.getElementById('hierarchyTree');
    if (!container) return;
    
    // Group posts by region -> city -> zone
    const hierarchy = {};
    allPosts.forEach(post => {
        if (!hierarchy[post.region]) hierarchy[post.region] = {};
        if (!hierarchy[post.region][post.city]) hierarchy[post.region][post.city] = {};
        if (!hierarchy[post.region][post.city][post.zone]) hierarchy[post.region][post.city][post.zone] = [];
        hierarchy[post.region][post.city][post.zone].push(post);
    });
    
    let html = '<div class="tree">';
    for (const region in hierarchy) {
        html += `<div class="tree-region"><strong>🌍 ${region}</strong>`;
        for (const city in hierarchy[region]) {
            html += `<div class="tree-city" style="margin-left:20px;"><strong>🏙️ ${city}</strong>`;
            for (const zone in hierarchy[region][city]) {
                html += `<div class="tree-zone" style="margin-left:20px;"><strong>📍 ${zone}</strong>`;
                hierarchy[region][city][zone].forEach(post => {
                    html += `<div class="tree-post" style="margin-left:20px;">📌 ${post.postName} <span class="ob-badge">${post.zoneObNumber}</span></div>`;
                });
                html += `</div>`;
            }
            html += `</div>`;
        }
        html += `</div>`;
    }
    html += '</div>';
    container.innerHTML = html;
}

function renderAllPosts() {
    const container = document.getElementById('allPostsList');
    if (!container) return;
    
    if (allPosts.length === 0) {
        container.innerHTML = '<div style="padding:40px;text-align:center;">No posts registered yet</div>';
        return;
    }
    
    container.innerHTML = allPosts.map(post => `
        <div class="post-card">
            <div class="post-header">
                <strong>${post.postName}</strong>
                <span class="ob-badge">${post.zoneObNumber}</span>
            </div>
            <div class="post-details">
                📍 ${post.zone}, ${post.city}, ${post.region}<br>
                📅 Registered: ${new Date(post.registeredAt).toLocaleString()}<br>
                🔄 Last Sync: ${post.lastSync ? new Date(post.lastSync).toLocaleString() : 'Never'}
            </div>
        </div>
    `).join('');
}

function renderDashboardStats() {
    const container = document.getElementById('dashboardStats');
    if (!container) return;
    
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    });
    
    const logsByDay = last7Days.map(date => ({
        date: date,
        count: allLogs.filter(l => l.dateOnly === date).length
    }));
    
    container.innerHTML = `
        <div class="chart-container">
            <h4>Last 7 Days Activity</h4>
            <div class="bar-chart">
                ${logsByDay.reverse().map(day => `
                    <div class="bar-item">
                        <div class="bar" style="height: ${Math.min(day.count * 3, 100)}px; width: 30px;"></div>
                        <span>${day.date.substring(5)}</span>
                        <span>${day.count}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderSyncStatus() {
    const container = document.getElementById('syncStatusList');
    if (!container) return;
    
    const now = new Date();
    container.innerHTML = allPosts.map(post => {
        const lastSync = post.lastSync ? new Date(post.lastSync) : null;
        const hoursSinceSync = lastSync ? Math.floor((now - lastSync) / (1000 * 60 * 60)) : 999;
        const status = hoursSinceSync < 24 ? '✅ Synced' : hoursSinceSync < 72 ? '⚠️ Delayed' : '🔴 Offline';
        const statusClass = hoursSinceSync < 24 ? 'status-good' : hoursSinceSync < 72 ? 'status-warning' : 'status-danger';
        
        return `
            <div class="sync-item">
                <span><strong>${post.postName}</strong> (${post.zoneObNumber})</span>
                <span class="${statusClass}">${status}</span>
                <span>Last: ${lastSync ? lastSync.toLocaleString() : 'Never'}</span>
            </div>
        `;
    }).join('');
}

function renderAdminLogs() {
    const container = document.getElementById('adminLogsList');
    if (!container) return;
    
    const search = document.getElementById('adminSearch')?.value.toLowerCase() || '';
    const date = document.getElementById('adminDateFilter')?.value || '';
    
    let filtered = [...allLogs];
    
    // Apply post filter
    if (currentFilter.post !== 'all') {
        filtered = filtered.filter(l => l.postInfo?.postId == currentFilter.post);
    } else if (currentFilter.zone !== 'all') {
        filtered = filtered.filter(l => l.postInfo?.zone === currentFilter.zone);
    } else if (currentFilter.city !== 'all') {
        filtered = filtered.filter(l => l.postInfo?.city === currentFilter.city);
    } else if (currentFilter.region !== 'all') {
        filtered = filtered.filter(l => l.postInfo?.region === currentFilter.region);
    }
    
    if (search) filtered = filtered.filter(l => JSON.stringify(l).toLowerCase().includes(search));
    if (date) filtered = filtered.filter(l => l.dateOnly === date);
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding:40px;text-align:center;">No logs found</div>';
        return;
    }
    
    container.innerHTML = filtered.slice(0, 200).map(l => `
        <div class="log-entry">
            <strong>[${l.ob}]</strong> ${l.dateDisplay} | ${l.type}<br>
            ${l.guardName ? `👤 ${l.guardName} (${l.matric || ''})<br>` : ''}
            ${l.visitorName ? `🚪 ${l.visitorName}<br>` : ''}
            📝 ${l.details?.substring(0, 100) || ''}<br>
            ${l.postInfo ? `<span style="color:#666; font-size:11px;">📍 ${l.postInfo.zoneObNumber} | ${l.postInfo.postName}</span>` : ''}
            ${l.confirmationStatus === 'issue' ? '<span style="color:#c62828;">⚠️ ISSUE REPORTED</span>' : ''}
        </div>
    `).join('');
}

function renderSupervisorReports() {
    const container = document.getElementById('adminSupervisorList');
    if (!container) return;
    
    let filtered = [...supervisorReports];
    if (currentFilter.post !== 'all') {
        filtered = filtered.filter(r => r.postInfo?.postId == currentFilter.post);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding:40px;text-align:center;">No supervisor reports</div>';
        return;
    }
    
    container.innerHTML = filtered.map(r => `
        <div class="log-entry">
            <strong>${r.date}</strong> | Supervisor: ${r.supervisorMatric}<br>
            📍 ${r.postInfo?.postName || 'Unknown Post'} (${r.postInfo?.zoneObNumber || ''})<br>
            📝 ${r.description}
        </div>
    `).join('');
}

function renderActiveGuards() {
    const container = document.getElementById('adminActiveGuardsList');
    if (!container) return;
    
    // Group active guards by post (from logs)
    const activeByPost = {};
    
    const recentLogs = allLogs.filter(l => l.type.includes('START') && new Date(l.timestamp) > new Date(Date.now() - 24*60*60*1000));
    recentLogs.forEach(log => {
        if (log.postInfo) {
            const key = log.postInfo.zoneObNumber;
            if (!activeByPost[key]) activeByPost[key] = { postName: log.postInfo.postName, guards: [] };
            if (log.guardName && !activeByPost[key].guards.includes(log.guardName)) {
                activeByPost[key].guards.push(log.guardName);
            }
        }
    });
    
    if (Object.keys(activeByPost).length === 0) {
        container.innerHTML = '<div style="padding:40px;text-align:center;">No active guards in last 24h</div>';
        return;
    }
    
    container.innerHTML = Object.values(activeByPost).map(post => `
        <div class="post-card">
            <div class="post-header"><strong>${post.postName}</strong></div>
            <div>👥 Active Guards: ${post.guards.join(', ') || 'None'}</div>
        </div>
    `).join('');
}

function renderIssuesAndAlerts() {
    const issuesContainer = document.getElementById('issuesList');
    const syncDelayContainer = document.getElementById('syncDelayList');
    
    const issues24h = allLogs.filter(l => l.confirmationStatus === 'issue' && new Date(l.timestamp) > new Date(Date.now() - 24*60*60*1000));
    issuesContainer.innerHTML = issues24h.length === 0 ? '<div style="padding:20px;text-align:center;">No issues in last 24h ✅</div>' : issues24h.map(l => `
        <div class="issue-item">
            <strong>[${l.postInfo?.zoneObNumber}] ${l.postInfo?.postName}</strong><br>
            ${l.dateDisplay}<br>
            📝 ${l.details?.substring(0, 100)}
        </div>
    `).join('');
    
    const now = new Date();
    const delayedPosts = allPosts.filter(p => {
        if (!p.lastSync) return true;
        const hoursSinceSync = (now - new Date(p.lastSync)) / (1000 * 60 * 60);
        return hoursSinceSync > 24;
    });
    syncDelayContainer.innerHTML = delayedPosts.length === 0 ? '<div style="padding:20px;text-align:center;">All posts synced recently ✅</div>' : delayedPosts.map(p => `
        <div class="sync-item">
            <span><strong>${p.postName}</strong> (${p.zoneObNumber})</span>
            <span>Last sync: ${p.lastSync ? new Date(p.lastSync).toLocaleString() : 'Never'}</span>
        </div>
    `).join('');
}

function exportAllLogs() {
    const rows = [['OB', 'Date', 'Type', 'Person', 'Matric/ID', 'Details', 'TimeIn', 'TimeOut', 'Post', 'ZoneOB']];
    allLogs.forEach(l => {
        rows.push([
            l.ob, l.dateDisplay, l.type,
            l.guardName || l.visitorName || '',
            l.matric || l.idNumber || '',
            l.details || '',
            l.timeIn || '',
            l.timeOut || '',
            l.postInfo?.postName || '',
            l.postInfo?.zoneObNumber || ''
        ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `G4S_ALL_POSTS_LOGS_${new Date().toISOString().slice(0,19)}.csv`;
    link.click();
}

function setupAdminListeners() {
    document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem(ADMIN_KEYS.CURRENT_USER);
        window.location.href = 'index.html';
    });
    document.getElementById('refreshAdminBtn')?.addEventListener('click', () => {
        loadAdminData();
        alert('Data refreshed');
    });
    document.getElementById('applyFilterBtn')?.addEventListener('click', applyFilter);
    document.getElementById('exportAllLogsBtn')?.addEventListener('click', exportAllLogs);
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
            if (tabId === 'supervisors') renderSupervisorReports();
            if (tabId === 'active') renderActiveGuards();
            if (tabId === 'alerts') renderIssuesAndAlerts();
        });
    });
}

const savedUser = localStorage.getItem(ADMIN_KEYS.CURRENT_USER);
if (savedUser) {
    const user = JSON.parse(savedUser);
    if (user.role !== 'admin') window.location.href = 'index.html';
} else {
    window.location.href = 'index.html';
}

loadAdminData();
setupAdminListeners();
setInterval(() => {
    loadAdminData();
}, 30000);