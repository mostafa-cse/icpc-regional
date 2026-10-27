/**
 * ICPC Regional Hub - Application Logic & State Management
 * Connects with Codeforces Gym, organizes contests, manages marks, notes, and local storage.
 */

(function () {
  'use strict';

  // -------------------------------------------------------------
  // State & Storage Keys
  // -------------------------------------------------------------
  const STORAGE_KEY_MARKS = 'icpc_tracker_marks_v1';
  const STORAGE_KEY_CONTESTS = 'icpc_tracker_custom_contests_v1';
  const STORAGE_KEY_VIEW = 'icpc_tracker_view_mode';
  const STORAGE_KEY_USER = 'icpc_tracker_current_user_v1';
  const STORAGE_KEY_CLIENT_ID = 'icpc_tracker_google_client_id_v1';

  let allContests = [];
  let userMarks = {}; // id -> { status, starred, notes, problems: {A: 1, B: 2...} }
  let currentUser = null; // { id, name, email, picture, provider: 'google' }
  let googleClientId = localStorage.getItem(STORAGE_KEY_CLIENT_ID) || '';

  let currentFilter = {
    year: 'target-all', // 'target-all' (2023-2026), '2026', '2025', '2024', '2023', 'archive', 'all'
    region: 'all',
    status: 'all',
    type: 'all',
    search: '',
    sort: 'year-desc',
  };
  let currentViewMode = 'grid'; // 'grid' | 'table'

  // Modal active contest
  let activeModalContestId = null;
  let activeModalProblems = {};

  // 5-hour Stopwatch Timer
  let timerInterval = null;
  let timerRemainingSeconds = 5 * 3600; // 18000s = 5 hours
  let timerRunning = false;

  // DOM Elements
  const elements = {
    // Stats
    statTotal: document.getElementById('stat-total-count'),
    statSolved: document.getElementById('stat-solved-count'),
    statSolvedPercent: document.getElementById('stat-solved-percent'),
    statUpsolving: document.getElementById('stat-upsolving-count'),
    statStarred: document.getElementById('stat-starred-count'),
    
    // Year Progress
    prog2026Bar: document.getElementById('prog-2026-bar'),
    prog2026Ratio: document.getElementById('prog-2026-ratio'),
    prog2025Bar: document.getElementById('prog-2025-bar'),
    prog2025Ratio: document.getElementById('prog-2025-ratio'),
    prog2024Bar: document.getElementById('prog-2024-bar'),
    prog2024Ratio: document.getElementById('prog-2024-ratio'),
    prog2023Bar: document.getElementById('prog-2023-bar'),
    prog2023Ratio: document.getElementById('prog-2023-ratio'),

    // Year tabs & counts
    yearTabsGroup: document.getElementById('year-tabs-group'),
    countTabTarget: document.getElementById('count-tab-target'),
    countTab2026: document.getElementById('count-tab-2026'),
    countTab2025: document.getElementById('count-tab-2025'),
    countTab2024: document.getElementById('count-tab-2024'),
    countTab2023: document.getElementById('count-tab-2023'),
    countTabArchive: document.getElementById('count-tab-archive'),
    countTabAll: document.getElementById('count-tab-all'),

    // Controls
    inputSearch: document.getElementById('input-search'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    filterRegion: document.getElementById('filter-region'),
    filterStatus: document.getElementById('filter-status'),
    filterType: document.getElementById('filter-type'),
    selectSort: document.getElementById('select-sort'),
    btnViewGrid: document.getElementById('view-mode-grid'),
    btnViewTable: document.getElementById('view-mode-table'),

    // Containers
    showingCount: document.getElementById('showing-count'),
    activeFilterTags: document.getElementById('active-filter-tags'),
    contestsGrid: document.getElementById('contests-grid'),
    contestsTableContainer: document.getElementById('contests-table-container'),
    contestsTableBody: document.getElementById('contests-table-body'),
    emptyState: document.getElementById('empty-state'),
    btnResetFilters: document.getElementById('btn-reset-filters'),
    btnQuickExportList: document.getElementById('btn-quick-export-list'),

    // Nav actions
    btnSyncCF: document.getElementById('btn-sync-cf'),
    syncIcon: document.getElementById('sync-icon'),
    btnExportData: document.getElementById('btn-export-data'),
    importFileInput: document.getElementById('import-file-input'),
    btnResetData: document.getElementById('btn-reset-data'),

    // Google Auth & User Profile
    btnGoogleLogin: document.getElementById('btn-google-login'),
    userProfileChip: document.getElementById('user-profile-chip'),
    userAvatarImg: document.getElementById('user-avatar-img'),
    userAvatarInitial: document.getElementById('user-avatar-initial'),
    userDisplayName: document.getElementById('user-display-name'),
    userDropdownMenu: document.getElementById('user-dropdown-menu'),
    dropdownUserName: document.getElementById('dropdown-user-name'),
    dropdownUserEmail: document.getElementById('dropdown-user-email'),
    userSolvedCount: document.getElementById('user-solved-count'),
    userUpsolvedCount: document.getElementById('user-upsolved-count'),
    userStarredCount: document.getElementById('user-starred-count'),
    btnOauthSettings: document.getElementById('btn-oauth-settings'),
    btnUserLogout: document.getElementById('btn-user-logout'),

    // Google Auth Modal
    googleAuthModal: document.getElementById('google-auth-modal'),
    btnCloseAuthModal: document.getElementById('btn-close-auth-modal'),
    googleSigninBtnContainer: document.getElementById('google-signin-btn-container'),
    quickUserName: document.getElementById('quick-user-name'),
    quickUserEmail: document.getElementById('quick-user-email'),
    btnQuickGoogleSignin: document.getElementById('btn-quick-google-signin'),
    inputGoogleClientId: document.getElementById('input-google-client-id'),
    btnSaveClientId: document.getElementById('btn-save-client-id'),

    // Modal
    contestModal: document.getElementById('contest-modal'),
    modalContestTitle: document.getElementById('modal-contest-title'),
    modalBadgeId: document.getElementById('modal-badge-id'),
    modalBadgeYear: document.getElementById('modal-badge-year'),
    modalBadgeRegion: document.getElementById('modal-badge-region'),
    modalBadgeType: document.getElementById('modal-badge-type'),
    modalLinkGym: document.getElementById('modal-link-gym'),
    modalLinkStandings: document.getElementById('modal-link-standings'),
    btnModalCopyLink: document.getElementById('btn-modal-copy-link'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    modalTimerDisplay: document.getElementById('modal-timer-display'),
    btnTimerStart: document.getElementById('btn-timer-start'),
    btnTimerPause: document.getElementById('btn-timer-pause'),
    btnTimerReset: document.getElementById('btn-timer-reset'),
    modalProblemsContainer: document.getElementById('modal-problems-container'),
    modalSolvedRatio: document.getElementById('modal-solved-ratio'),
    modalNotesInput: document.getElementById('modal-notes-input'),
    btnModalSave: document.getElementById('btn-modal-save'),

    // DB Status
    dbStatusBadge: document.getElementById('db-status-badge'),
    dbStatusText: document.getElementById('db-status-text'),

    // Cloud DB Elements
    btnOpenCloudDb: document.getElementById('btn-open-cloud-db'),
    cloudStatusBadge: document.getElementById('cloud-status-badge'),
    cloudStatusText: document.getElementById('cloud-status-text'),
    cloudDbModal: document.getElementById('cloud-db-modal'),
    btnCloseCloudModal: document.getElementById('btn-close-cloud-modal'),
    btnCloudSyncNow: document.getElementById('btn-cloud-sync-now'),
    btnCloudPullNow: document.getElementById('btn-cloud-pull-now'),
    inputFbProjectId: document.getElementById('input-fb-project-id'),
    inputFbApiKey: document.getElementById('input-fb-api-key'),
    inputFbAuthDomain: document.getElementById('input-fb-auth-domain'),
    btnSaveCloudConfig: document.getElementById('btn-save-cloud-config'),
    btnResetCloudConfig: document.getElementById('btn-reset-cloud-config'),
    cloudRecordsSynced: document.getElementById('cloud-records-synced'),

    // Toast
    toastContainer: document.getElementById('toast-container'),
  };

  let isDatabaseConnected = false;

  // -------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------
  async function init() {
    await checkDatabaseHealth();
    loadCurrentUser();
    await loadUserMarks();
    loadViewMode();
    await loadContestData();
    setupEventListeners();
    initGoogleAuth();
    updateTabCounts();
    render();
  }

  async function checkDatabaseHealth() {
    try {
      const resp = await fetch('/api/health');
      if (resp.ok) {
        const data = await resp.json();
        if (data.status === 'online') {
          isDatabaseConnected = true;
          updateDbStatusBadge(true, `SQLite (${data.total_contests})`);
          return true;
        }
      }
    } catch (e) {
      // Server might be running on static http.server or file://
    }
    isDatabaseConnected = false;
    updateDbStatusBadge(false, 'Local Cache');
    return false;
  }

  function updateDbStatusBadge(connected, text) {
    if (!elements.dbStatusBadge || !elements.dbStatusText) return;
    if (connected) {
      elements.dbStatusBadge.classList.remove('offline');
      elements.dbStatusText.textContent = text || 'SQLite Connected';
      elements.dbStatusBadge.title = 'SQLite database active (/database/icpc.db)';
    } else {
      elements.dbStatusBadge.classList.add('offline');
      elements.dbStatusText.textContent = text || 'Offline';
      elements.dbStatusBadge.title = 'Using browser offline storage';
    }
  }

  function getMarksStorageKey() {
    if (currentUser && currentUser.email) {
      const sanitized = currentUser.email.replace(/[^a-zA-Z0-9]/g, '_');
      return `icpc_tracker_marks_user_${sanitized}`;
    }
    return STORAGE_KEY_MARKS;
  }

  function loadCurrentUser() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      if (stored) {
        currentUser = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading current user:', e);
      currentUser = null;
    }
    updateUserNavUI();
  }

  function updateUserNavUI() {
    if (currentUser) {
      elements.btnGoogleLogin.style.display = 'none';
      elements.userProfileChip.style.display = 'inline-flex';
      elements.userDisplayName.textContent = currentUser.name || 'Contestant';
      elements.dropdownUserName.textContent = currentUser.name || 'Contestant';
      elements.dropdownUserEmail.textContent = currentUser.email || 'user@gmail.com';

      if (currentUser.picture) {
        elements.userAvatarImg.src = currentUser.picture;
        elements.userAvatarImg.style.display = 'block';
        elements.userAvatarInitial.style.display = 'none';
      } else {
        const initial = (currentUser.name || 'U').charAt(0).toUpperCase();
        elements.userAvatarInitial.textContent = initial;
        elements.userAvatarInitial.style.display = 'flex';
        elements.userAvatarImg.style.display = 'none';
      }
    } else {
      elements.btnGoogleLogin.style.display = 'inline-flex';
      elements.userProfileChip.style.display = 'none';
      elements.userDropdownMenu.style.display = 'none';
    }
  }

  async function loadUserMarks() {
    const userId = currentUser ? currentUser.id : 'guest';

    // 1. If SQLite Database is available, fetch from DB
    if (isDatabaseConnected) {
      try {
        const resp = await fetch(`/api/user/marks?user_id=${encodeURIComponent(userId)}`);
        if (resp.ok) {
          const json = await resp.json();
          if (json.status === 'OK' && json.marks) {
            userMarks = json.marks;
            // Cache in localStorage for offline availability
            localStorage.setItem(getMarksStorageKey(), JSON.stringify(userMarks));
            updateStats();
            return;
          }
        }
      } catch (e) {
        console.warn('Fetching marks from DB failed, using local storage cache', e);
      }
    }

    // 2. Fallback to localStorage
    try {
      const key = getMarksStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        userMarks = JSON.parse(stored);
      } else {
        userMarks = {};
      }
    } catch (e) {
      console.warn('Error reading user marks from localStorage:', e);
      userMarks = {};
    }
    updateStats();
  }

  function saveUserMarks(contestIdToSync = null) {
    try {
      const key = getMarksStorageKey();
      localStorage.setItem(key, JSON.stringify(userMarks));
    } catch (e) {
      console.error('Error saving user marks:', e);
    }
    updateStats();

    // Sync to SQLite Database
    if (isDatabaseConnected && contestIdToSync) {
      const userId = currentUser ? currentUser.id : 'guest';
      const m = userMarks[contestIdToSync] || {};
      fetch('/api/user/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          contest_id: contestIdToSync,
          status: m.status || 'unstarted',
          starred: m.starred ? 1 : 0,
          notes: m.notes || '',
          problems: m.problems || {},
        }),
      }).catch(err => console.warn('SQLite DB sync error:', err));
    }

    // Sync to Online Cloud Database (Firestore / Cloud REST)
    if (window.cloudDb && contestIdToSync) {
      const userId = currentUser ? currentUser.id : 'guest';
      const m = userMarks[contestIdToSync] || {};
      window.cloudDb.syncMarkToCloud(userId, contestIdToSync, m);
    }
  }

  function loadViewMode() {
    const saved = localStorage.getItem(STORAGE_KEY_VIEW);
    if (saved === 'table' || saved === 'grid') {
      currentViewMode = saved;
    }
    updateViewModeButtons();
  }

  async function loadContestData() {
    // 1. Try SQLite database API
    try {
      const resp = await fetch('/api/contests');
      if (resp.ok) {
        const json = await resp.json();
        if (json.status === 'OK' && Array.isArray(json.result) && json.result.length > 0) {
          allContests = json.result;
          isDatabaseConnected = true;
          updateDbStatusBadge(true, `SQLite (${allContests.length})`);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend API /api/contests not reached, trying static fallback', e);
    }

    // 2. Check if user has cached custom / synced contests
    const cached = localStorage.getItem(STORAGE_KEY_CONTESTS);
    if (cached) {
      try {
        allContests = JSON.parse(cached);
      } catch (e) {
        console.warn('Could not parse cached contests', e);
      }
    }

    // 2. If empty, check window.INITIAL_CONTESTS (from data/contests.js)
    if (!allContests || allContests.length === 0) {
      if (window.INITIAL_CONTESTS && Array.isArray(window.INITIAL_CONTESTS)) {
        allContests = window.INITIAL_CONTESTS;
      }
    }

    // 3. Fallback: Try fetch data/contests.json
    if (!allContests || allContests.length === 0) {
      try {
        const resp = await fetch('data/contests.json');
        if (resp.ok) {
          allContests = await resp.json();
        }
      } catch (err) {
        console.warn('Fetch data/contests.json error:', err);
      }
    }

    if (!allContests || allContests.length === 0) {
      showToast('No contest data loaded. Click "Sync Codeforces" to fetch.', 'warning');
      allContests = [];
    }
  }

  // -------------------------------------------------------------
  // Event Listeners
  // -------------------------------------------------------------
  function setupEventListeners() {
    // Year Tabs
    elements.yearTabsGroup.addEventListener('click', (e) => {
      const tab = e.target.closest('.year-tab');
      if (!tab) return;
      const year = tab.dataset.year;
      elements.yearTabsGroup.querySelectorAll('.year-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter.year = year;
      render();
    });

    // Search Input
    elements.inputSearch.addEventListener('input', (e) => {
      currentFilter.search = e.target.value.trim().toLowerCase();
      elements.btnClearSearch.style.display = currentFilter.search ? 'block' : 'none';
      render();
    });

    elements.btnClearSearch.addEventListener('click', () => {
      elements.inputSearch.value = '';
      currentFilter.search = '';
      elements.btnClearSearch.style.display = 'none';
      render();
    });

    // Select Filters
    elements.filterRegion.addEventListener('change', (e) => {
      currentFilter.region = e.target.value;
      render();
    });

    elements.filterStatus.addEventListener('change', (e) => {
      currentFilter.status = e.target.value;
      render();
    });

    elements.filterType.addEventListener('change', (e) => {
      currentFilter.type = e.target.value;
      render();
    });

    elements.selectSort.addEventListener('change', (e) => {
      currentFilter.sort = e.target.value;
      render();
    });

    // View Mode Toggle
    elements.btnViewGrid.addEventListener('click', () => setViewMode('grid'));
    elements.btnViewTable.addEventListener('click', () => setViewMode('table'));

    // Reset Filters
    elements.btnResetFilters.addEventListener('click', resetFilters);

    // Sync Codeforces
    elements.btnSyncCF.addEventListener('click', syncCodeforcesGym);

    // Export & Import
    elements.btnExportData.addEventListener('click', exportProgressData);
    elements.importFileInput.addEventListener('change', importProgressData);
    elements.btnResetData.addEventListener('click', resetAllProgress);

    // Quick Copy Summary
    elements.btnQuickExportList.addEventListener('click', copySummaryToClipboard);

    // Modal
    elements.btnCloseModal.addEventListener('click', closeModal);
    elements.contestModal.addEventListener('click', (e) => {
      if (e.target === elements.contestModal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.contestModal.style.display !== 'none') {
        closeModal();
      }
    });

    elements.btnModalSave.addEventListener('click', saveModalChanges);
    elements.btnModalCopyLink.addEventListener('click', () => {
      if (!activeModalContestId) return;
      const url = `https://codeforces.com/gym/${activeModalContestId}`;
      navigator.clipboard.writeText(url).then(() => {
        showToast('Gym URL copied to clipboard!', 'success');
      });
    });

    // Timer controls
    elements.btnTimerStart.addEventListener('click', startTimer);
    elements.btnTimerPause.addEventListener('click', pauseTimer);
    elements.btnTimerReset.addEventListener('click', resetTimer);

    // Google Auth & User Profile Listeners
    elements.btnGoogleLogin.addEventListener('click', () => openAuthModal(false));
    elements.btnCloseAuthModal.addEventListener('click', closeAuthModal);
    elements.googleAuthModal.addEventListener('click', (e) => {
      if (e.target === elements.googleAuthModal) closeAuthModal();
    });

    elements.userProfileChip.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleUserDropdown();
    });

    document.addEventListener('click', (e) => {
      if (!elements.userProfileChip.contains(e.target)) {
        closeDropdown();
      }
    });

    elements.btnQuickGoogleSignin.addEventListener('click', handleQuickGoogleLogin);
    elements.btnSaveClientId.addEventListener('click', handleSaveClientId);
    elements.btnOauthSettings.addEventListener('click', () => {
      closeDropdown();
      openAuthModal(true);
    });
    elements.btnUserLogout.addEventListener('click', handleUserLogout);

    // Online Cloud Database Listeners
    if (elements.btnOpenCloudDb) {
      elements.btnOpenCloudDb.addEventListener('click', openCloudModal);
    }
    if (elements.cloudStatusBadge) {
      elements.cloudStatusBadge.addEventListener('click', openCloudModal);
    }
    if (elements.btnCloseCloudModal) {
      elements.btnCloseCloudModal.addEventListener('click', closeCloudModal);
    }
    if (elements.cloudDbModal) {
      elements.cloudDbModal.addEventListener('click', (e) => {
        if (e.target === elements.cloudDbModal) closeCloudModal();
      });
    }
    if (elements.btnCloudSyncNow) {
      elements.btnCloudSyncNow.addEventListener('click', handleCloudSyncNow);
    }
    if (elements.btnCloudPullNow) {
      elements.btnCloudPullNow.addEventListener('click', handleCloudPullNow);
    }
    if (elements.btnSaveCloudConfig) {
      elements.btnSaveCloudConfig.addEventListener('click', handleSaveCloudConfig);
    }
    if (elements.btnResetCloudConfig) {
      elements.btnResetCloudConfig.addEventListener('click', handleResetCloudConfig);
    }
  }

  // -------------------------------------------------------------
  // Online Cloud Database Modal & Sync Handlers
  // -------------------------------------------------------------
  function openCloudModal() {
    if (!elements.cloudDbModal) return;
    if (window.cloudDb) {
      const cfg = window.cloudDb.getConfig();
      if (elements.inputFbProjectId) elements.inputFbProjectId.value = cfg.projectId || '';
      if (elements.inputFbApiKey) elements.inputFbApiKey.value = cfg.apiKey || '';
      if (elements.inputFbAuthDomain) elements.inputFbAuthDomain.value = cfg.authDomain || '';
      window.cloudDb.updateUI();
    }
    if (elements.cloudRecordsSynced) {
      elements.cloudRecordsSynced.textContent = Object.keys(userMarks).length || allContests.length;
    }
    elements.cloudDbModal.style.display = 'flex';
  }

  function closeCloudModal() {
    if (elements.cloudDbModal) {
      elements.cloudDbModal.style.display = 'none';
    }
  }

  async function handleCloudSyncNow() {
    const userId = currentUser ? currentUser.id : 'guest';
    if (!window.cloudDb) return;

    showToast('Syncing all marks to Google Cloud Firestore...', 'info');
    const syncedCount = await window.cloudDb.syncAllToCloud(userId, userMarks);
    showToast(`Online Cloud Sync complete! (${syncedCount} records synced)`, 'success');
  }

  async function handleCloudPullNow() {
    const userId = currentUser ? currentUser.id : 'guest';
    if (!window.cloudDb) return;

    showToast('Pulling latest marks from Online Cloud Database...', 'info');
    const cloudMarks = await window.cloudDb.pullFromCloud(userId);
    if (cloudMarks && Object.keys(cloudMarks).length > 0) {
      userMarks = Object.assign({}, userMarks, cloudMarks);
      saveUserMarks();
      render();
      showToast('Successfully merged latest records from Cloud Database! 🎉', 'success');
    } else {
      showToast('Cloud database is already up to date.', 'info');
    }
  }

  function handleSaveCloudConfig() {
    if (!window.cloudDb) return;
    const projectId = elements.inputFbProjectId.value.trim();
    const apiKey = elements.inputFbApiKey.value.trim();
    const authDomain = elements.inputFbAuthDomain.value.trim();

    window.cloudDb.saveConfig({
      projectId,
      apiKey,
      authDomain,
    });
    showToast('Cloud Database configuration saved!', 'success');
    window.cloudDb.updateUI();
  }

  function handleResetCloudConfig() {
    if (!window.cloudDb) return;
    window.cloudDb.resetConfig();
    const cfg = window.cloudDb.getConfig();
    if (elements.inputFbProjectId) elements.inputFbProjectId.value = cfg.projectId;
    if (elements.inputFbApiKey) elements.inputFbApiKey.value = cfg.apiKey;
    if (elements.inputFbAuthDomain) elements.inputFbAuthDomain.value = cfg.authDomain;
    window.cloudDb.updateUI();
    showToast('Cloud Database config reset to default.', 'info');
  }

  // -------------------------------------------------------------
  // Google Auth & User Management Logic
  // -------------------------------------------------------------
  function initGoogleAuth() {
    if (elements.inputGoogleClientId) {
      elements.inputGoogleClientId.value = googleClientId;
    }

    // Initialize GIS if window.google is ready
    setupGsiClient();
  }

  function setupGsiClient() {
    if (typeof window.google === 'undefined' || !window.google.accounts || !window.google.accounts.id) {
      setTimeout(setupGsiClient, 500);
      return;
    }

    if (!googleClientId || googleClientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
      if (elements.googleSigninBtnContainer) {
        elements.googleSigninBtnContainer.innerHTML = `
          <div style="font-size: 0.82rem; color: #94a3b8; text-align: center; padding: 10px 14px; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.12); border-radius: 8px;">
            <p style="margin: 0 0 6px 0; color: #cbd5e1;">💡 <strong>Google OAuth Popup requires a Client ID</strong></p>
            <p style="margin: 0;">Use the <strong>Direct Sign-In</strong> button above for instant 1-click access without API keys, or add your Google Cloud Client ID in settings below.</p>
          </div>
        `;
      }
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: window.handleGoogleCredentialResponse,
        auto_select: false,
      });

      if (elements.googleSigninBtnContainer) {
        elements.googleSigninBtnContainer.innerHTML = '';
        window.google.accounts.id.renderButton(
          elements.googleSigninBtnContainer,
          {
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            text: 'continue_with',
            width: 280,
          }
        );
      }
    } catch (err) {
      console.warn('Google GSI initialization notice:', err);
    }
  }

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  window.handleGoogleCredentialResponse = function (response) {
    if (!response || !response.credential) return;
    const payload = parseJwt(response.credential);
    if (payload) {
      loginUser({
        id: payload.sub,
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        picture: payload.picture || '',
        provider: 'google',
      });
      closeAuthModal();
    }
  };

  function openAuthModal(openSettings = false) {
    elements.googleAuthModal.style.display = 'flex';
    const accordion = elements.googleAuthModal.querySelector('.oauth-settings-accordion');
    if (accordion) {
      accordion.open = !!openSettings;
    }
    setupGsiClient();
  }

  function closeAuthModal() {
    elements.googleAuthModal.style.display = 'none';
  }

  function toggleUserDropdown() {
    const isVisible = elements.userDropdownMenu.style.display === 'block';
    if (isVisible) {
      closeDropdown();
    } else {
      elements.userDropdownMenu.style.display = 'block';
      elements.userProfileChip.classList.add('menu-open');
    }
  }

  function closeDropdown() {
    elements.userDropdownMenu.style.display = 'none';
    elements.userProfileChip.classList.remove('menu-open');
  }

  function handleQuickGoogleLogin() {
    const name = elements.quickUserName.value.trim() || 'ICPC Contestant';
    const email = elements.quickUserEmail.value.trim();

    if (!email || !email.includes('@')) {
      showToast('Please enter a valid Google email address', 'warning');
      return;
    }

    loginUser({
      id: 'g_' + btoa(email).replace(/[^a-zA-Z0-9]/g, ''),
      name: name,
      email: email,
      picture: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`,
      provider: 'google',
    });

    closeAuthModal();
  }

  function handleSaveClientId() {
    const newId = elements.inputGoogleClientId.value.trim();
    googleClientId = newId;
    localStorage.setItem(STORAGE_KEY_CLIENT_ID, newId);
    setupGsiClient();
    showToast('Google OAuth Client ID saved!', 'success');
  }

  async function loginUser(userData) {
    currentUser = userData;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
    updateUserNavUI();

    if (isDatabaseConnected) {
      try {
        await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });
      } catch (err) {
        console.warn('Could not sync user with DB:', err);
      }
    }

    await loadUserMarks();
    render();
    showToast(`Welcome, ${currentUser.name}! Solving progress synced to SQLite Database.`, 'success');
  }

  function handleUserLogout() {
    closeDropdown();
    const prevName = currentUser ? currentUser.name : 'User';
    currentUser = null;
    localStorage.removeItem(STORAGE_KEY_USER);
    updateUserNavUI();
    loadUserMarks();
    render();
    showToast(`Signed out (${prevName}). Switched to local guest profile.`, 'info');
  }

  function setViewMode(mode) {
    currentViewMode = mode;
    localStorage.setItem(STORAGE_KEY_VIEW, mode);
    updateViewModeButtons();
    renderContestList();
  }

  function updateViewModeButtons() {
    if (currentViewMode === 'grid') {
      elements.btnViewGrid.classList.add('active');
      elements.btnViewTable.classList.remove('active');
      elements.contestsGrid.style.display = 'grid';
      elements.contestsTableContainer.style.display = 'none';
    } else {
      elements.btnViewGrid.classList.remove('active');
      elements.btnViewTable.classList.add('active');
      elements.contestsGrid.style.display = 'none';
      elements.contestsTableContainer.style.display = 'block';
    }
  }

  function resetFilters() {
    currentFilter.year = 'target-all';
    currentFilter.region = 'all';
    currentFilter.status = 'all';
    currentFilter.type = 'all';
    currentFilter.search = '';
    currentFilter.sort = 'year-desc';

    elements.inputSearch.value = '';
    elements.btnClearSearch.style.display = 'none';
    elements.filterRegion.value = 'all';
    elements.filterStatus.value = 'all';
    elements.filterType.value = 'all';
    elements.selectSort.value = 'year-desc';

    elements.yearTabsGroup.querySelectorAll('.year-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.year === 'target-all');
    });

    render();
    showToast('Filters reset to default (2023-2026)', 'info');
  }

  // -------------------------------------------------------------
  // Filter & Sort Logic
  // -------------------------------------------------------------
  function getFilteredContests() {
    return allContests.filter((c) => {
      // 1. Year Filter
      const y = parseInt(c.year, 10);
      if (currentFilter.year === 'target-all') {
        // Target years: 2023, 2024, 2025, 2026 (or newer)
        if (isNaN(y) || y < 2023) return false;
      } else if (currentFilter.year === '2026') {
        if (c.year !== '2026' && !c.name.includes('2026') && !c.season.includes('2026')) return false;
      } else if (currentFilter.year === '2025') {
        if (c.year !== '2025' && !c.name.includes('2025') && !c.season.includes('2025')) return false;
      } else if (currentFilter.year === '2024') {
        if (c.year !== '2024' && !c.name.includes('2024') && !c.season.includes('2024')) return false;
      } else if (currentFilter.year === '2023') {
        if (c.year !== '2023' && !c.name.includes('2023') && !c.season.includes('2023')) return false;
      } else if (currentFilter.year === 'archive') {
        if (!isNaN(y) && y >= 2023) return false;
      }

      // 2. Region Filter
      if (currentFilter.region !== 'all') {
        if (c.region !== currentFilter.region) return false;
      }

      // 3. Status Filter
      const mark = userMarks[c.id] || {};
      const status = mark.status || 'unstarted';
      if (currentFilter.status === 'solved' && status !== 'solved') return false;
      if (currentFilter.status === 'upsolving' && status !== 'upsolving') return false;
      if (currentFilter.status === 'todo' && status !== 'todo') return false;
      if (currentFilter.status === 'starred' && !mark.starred) return false;
      if (currentFilter.status === 'unstarted' && status !== 'unstarted') return false;

      // 4. Type Filter
      if (currentFilter.type !== 'all') {
        if (c.type !== currentFilter.type) return false;
      }

      // 5. Search Filter
      if (currentFilter.search) {
        const query = currentFilter.search;
        const matchesName = c.name.toLowerCase().includes(query);
        const matchesId = String(c.id).includes(query);
        const matchesRegion = c.region.toLowerCase().includes(query);
        const matchesSeason = (c.season || '').toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesRegion && !matchesSeason) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const yearA = parseInt(a.year, 10) || 0;
      const yearB = parseInt(b.year, 10) || 0;

      switch (currentFilter.sort) {
        case 'year-desc':
          if (yearB !== yearA) return yearB - yearA;
          return b.id - a.id;
        case 'year-asc':
          if (yearA !== yearB) return yearA - yearB;
          return a.id - b.id;
        case 'id-desc':
          return b.id - a.id;
        case 'id-asc':
          return a.id - b.id;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        default:
          return b.id - a.id;
      }
    });
  }

  // -------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------
  function render() {
    updateStats();
    renderContestList();
  }

  function updateTabCounts() {
    let countTarget = 0;
    let count2026 = 0;
    let count2025 = 0;
    let count2024 = 0;
    let count2023 = 0;
    let countArchive = 0;

    allContests.forEach((c) => {
      const y = parseInt(c.year, 10);
      if (!isNaN(y) && y >= 2023) countTarget++;
      if (c.year === '2026' || c.season.includes('2026')) count2026++;
      if (c.year === '2025' || c.season.includes('2025')) count2025++;
      if (c.year === '2024' || c.season.includes('2024')) count2024++;
      if (c.year === '2023' || c.season.includes('2023')) count2023++;
      if (isNaN(y) || y < 2023) countArchive++;
    });

    elements.countTabTarget.textContent = countTarget;
    elements.countTab2026.textContent = count2026;
    elements.countTab2025.textContent = count2025;
    elements.countTab2024.textContent = count2024;
    elements.countTab2023.textContent = count2023;
    elements.countTabArchive.textContent = countArchive;
    elements.countTabAll.textContent = allContests.length;
  }

  function updateStats() {
    const total = allContests.length;
    let solved = 0;
    let upsolving = 0;
    let starred = 0;

    // Year-specific tracking
    const yearStats = {
      '2026': { total: 0, done: 0 },
      '2025': { total: 0, done: 0 },
      '2024': { total: 0, done: 0 },
      '2023': { total: 0, done: 0 },
    };

    allContests.forEach((c) => {
      const m = userMarks[c.id] || {};
      const status = m.status || 'unstarted';

      if (status === 'solved') solved++;
      else if (status === 'upsolving') upsolving++;

      if (m.starred) starred++;

      const y = c.year;
      if (yearStats[y]) {
        yearStats[y].total++;
        if (status === 'solved') yearStats[y].done++;
      }
    });

    elements.statTotal.textContent = total;
    elements.statSolved.textContent = solved;
    elements.statUpsolving.textContent = upsolving;
    elements.statStarred.textContent = starred;

    if (elements.userSolvedCount) elements.userSolvedCount.textContent = solved;
    if (elements.userUpsolvedCount) elements.userUpsolvedCount.textContent = upsolving;
    if (elements.userStarredCount) elements.userStarredCount.textContent = starred;

    const percent = total > 0 ? Math.round((solved / total) * 100) : 0;
    elements.statSolvedPercent.textContent = `${percent}%`;

    // Update Year Progress Bars
    ['2026', '2025', '2024', '2023'].forEach((yr) => {
      const stat = yearStats[yr];
      const barElem = elements[`prog${yr}Bar`];
      const ratioElem = elements[`prog${yr}Ratio`];
      if (barElem && ratioElem) {
        ratioElem.textContent = `${stat.done} / ${stat.total}`;
        const pct = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
        barElem.style.width = `${pct}%`;
      }
    });
  }

  function renderContestList() {
    const filtered = getFilteredContests();
    elements.showingCount.textContent = filtered.length;

    // Render active filter tags
    renderFilterTags();

    if (filtered.length === 0) {
      elements.emptyState.style.display = 'block';
      elements.contestsGrid.innerHTML = '';
      elements.contestsTableBody.innerHTML = '';
      return;
    }

    elements.emptyState.style.display = 'none';

    if (currentViewMode === 'grid') {
      renderCards(filtered);
    } else {
      renderTable(filtered);
    }
  }

  function renderFilterTags() {
    const tags = [];
    if (currentFilter.year !== 'all') {
      tags.push(`Year: ${currentFilter.year.replace('target-all', '2023-2026')}`);
    }
    if (currentFilter.region !== 'all') {
      tags.push(currentFilter.region);
    }
    if (currentFilter.status !== 'all') {
      tags.push(`Status: ${currentFilter.status}`);
    }
    if (currentFilter.type !== 'all') {
      tags.push(currentFilter.type);
    }

    elements.activeFilterTags.innerHTML = tags
      .map(t => `<span class="filter-pill-tag">${escapeHtml(t)}</span>`)
      .join('');
  }

  function getContestProgressInfo(contestId) {
    const m = userMarks[contestId] || {};
    const status = m.status || 'unstarted';
    const problems = m.problems || {};
    
    // Count solved (1) and upsolved (2)
    let solvedProblems = 0;
    let upsolvedProblems = 0;
    Object.values(problems).forEach(val => {
      if (val === 1) solvedProblems++;
      else if (val === 2) upsolvedProblems++;
    });

    return {
      status,
      starred: !!m.starred,
      notes: m.notes || '',
      solvedProblems,
      upsolvedProblems,
      totalMarked: solvedProblems + upsolvedProblems,
    };
  }

  function renderCards(contests) {
    elements.contestsGrid.innerHTML = contests
      .map((c) => {
        const info = getContestProgressInfo(c.id);
        const regionClass = c.region.includes('Dhaka') ? 'badge-region dhaka' : 'badge-region';
        const yearBadgeClass = `badge-${c.year}` in { 'badge-2026': 1, 'badge-2025': 1, 'badge-2024': 1, 'badge-2023': 1 }
          ? `badge-${c.year}`
          : 'badge-gym-id';

        const statusClass = `status-${info.status}`;

        return `
          <div class="contest-card ${statusClass}" data-id="${c.id}">
            <div>
              <div class="card-top">
                <div class="badges-group">
                  <span class="badge badge-gym-id" title="Click to copy Gym ID" onclick="window.icpcApp.copyGymId(${c.id})">
                    Gym #${c.id}
                  </span>
                  <span class="badge ${yearBadgeClass}">${c.season || c.year}</span>
                  <span class="badge ${regionClass}">${escapeHtml(c.region)}</span>
                  <span class="badge badge-type">${escapeHtml(c.type)}</span>
                </div>
                <button class="star-btn ${info.starred ? 'starred' : ''}" 
                        onclick="window.icpcApp.toggleStar(${c.id})" 
                        title="${info.starred ? 'Unstar contest' : 'Star for practice'}">
                  ${info.starred ? '★' : '☆'}
                </button>
              </div>

              <div class="contest-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</div>
            </div>

            <div>
              <div class="card-stats-bar">
                <div class="card-status-indicator">
                  <span class="status-dot dot-${info.status}"></span>
                  <span>${formatStatus(info.status)}</span>
                </div>
                <div class="card-progress-ratio" title="Problems Solved / Upsolved">
                  ${info.totalMarked > 0 ? `🎯 ${info.solvedProblems} solved${info.upsolvedProblems > 0 ? ` + ${info.upsolvedProblems} upsolved` : ''}` : 'No problems marked'}
                </div>
              </div>

              <div class="card-actions">
                <a href="${c.gymUrl}" target="_blank" rel="noopener noreferrer" class="btn-open-gym">
                  <span>Gym Contest</span>
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>

                <select class="quick-status-select" onchange="window.icpcApp.updateQuickStatus(${c.id}, this.value)">
                  <option value="unstarted" ${info.status === 'unstarted' ? 'selected' : ''}>⚪ Not Started</option>
                  <option value="todo" ${info.status === 'todo' ? 'selected' : ''}>📌 To Do</option>
                  <option value="upsolving" ${info.status === 'upsolving' ? 'selected' : ''}>⏳ Upsolving</option>
                  <option value="solved" ${info.status === 'solved' ? 'selected' : ''}>✅ Solved</option>
                </select>

                <button class="btn-practice-modal" onclick="window.icpcApp.openModal(${c.id})" title="Checklist, notes & timer">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Practice</span>
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  function renderTable(contests) {
    elements.contestsTableBody.innerHTML = contests
      .map((c) => {
        const info = getContestProgressInfo(c.id);
        const regionClass = c.region.includes('Dhaka') ? 'badge-region dhaka' : 'badge-region';

        return `
          <tr data-id="${c.id}">
            <td style="text-align: center;">
              <button class="star-btn ${info.starred ? 'starred' : ''}" onclick="window.icpcApp.toggleStar(${c.id})">
                ${info.starred ? '★' : '☆'}
              </button>
            </td>
            <td>
              <span class="badge badge-gym-id" onclick="window.icpcApp.copyGymId(${c.id})">${c.id}</span>
            </td>
            <td>
              <span class="badge badge-${c.year}">${c.season || c.year}</span>
            </td>
            <td>
              <span class="badge ${regionClass}">${escapeHtml(c.region)}</span>
            </td>
            <td>
              <div class="table-contest-title">${escapeHtml(c.name)}</div>
            </td>
            <td>
              <select class="quick-status-select" onchange="window.icpcApp.updateQuickStatus(${c.id}, this.value)">
                <option value="unstarted" ${info.status === 'unstarted' ? 'selected' : ''}>⚪ Not Started</option>
                <option value="todo" ${info.status === 'todo' ? 'selected' : ''}>📌 To Do</option>
                <option value="upsolving" ${info.status === 'upsolving' ? 'selected' : ''}>⏳ Upsolving</option>
                <option value="solved" ${info.status === 'solved' ? 'selected' : ''}>✅ Solved</option>
              </select>
            </td>
            <td>
              <span class="card-progress-ratio">
                ${info.totalMarked > 0 ? `${info.solvedProblems}S + ${info.upsolvedProblems}U` : '0/13'}
              </span>
            </td>
            <td>
              <div class="table-actions-cell">
                <a href="${c.gymUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary">
                  Gym ↗
                </a>
                <button class="btn btn-sm btn-ghost" onclick="window.icpcApp.openModal(${c.id})">
                  Notes
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  function formatStatus(status) {
    switch (status) {
      case 'solved': return 'Completed';
      case 'upsolving': return 'In Progress';
      case 'todo': return 'To Do';
      default: return 'Not Started';
    }
  }

  // -------------------------------------------------------------
  // Quick Mark & Star Actions
  // -------------------------------------------------------------
  function toggleStar(contestId) {
    if (!userMarks[contestId]) {
      userMarks[contestId] = {};
    }
    userMarks[contestId].starred = !userMarks[contestId].starred;
    saveUserMarks(contestId);
    renderContestList();
    showToast(userMarks[contestId].starred ? 'Contest Starred ⭐' : 'Contest Unstarred', 'info');
  }

  function updateQuickStatus(contestId, newStatus) {
    if (!userMarks[contestId]) {
      userMarks[contestId] = {};
    }
    userMarks[contestId].status = newStatus;
    saveUserMarks(contestId);
    render();
    showToast(`Status updated to ${formatStatus(newStatus)}`, 'success');
  }

  function copyGymId(contestId) {
    navigator.clipboard.writeText(String(contestId)).then(() => {
      showToast(`Copied Gym #${contestId} to clipboard!`, 'info');
    });
  }

  // -------------------------------------------------------------
  // Modal & Practice Details
  // -------------------------------------------------------------
  function openModal(contestId) {
    const contest = allContests.find(c => c.id === contestId);
    if (!contest) return;

    activeModalContestId = contestId;
    const m = userMarks[contestId] || {};
    activeModalProblems = Object.assign({}, m.problems || {});

    // Set Header Info
    elements.modalContestTitle.textContent = contest.name;
    elements.modalBadgeId.textContent = `Gym #${contest.id}`;
    elements.modalBadgeYear.textContent = contest.season || contest.year;
    elements.modalBadgeRegion.textContent = contest.region;
    elements.modalBadgeType.textContent = contest.type;

    elements.modalLinkGym.href = contest.gymUrl;
    elements.modalLinkStandings.href = contest.standingsUrl;

    // Status Radio
    const currentStatus = m.status || 'unstarted';
    const statusRadio = elements.contestModal.querySelector(`input[name="modal-status"][value="${currentStatus}"]`);
    if (statusRadio) statusRadio.checked = true;

    // Notes
    elements.modalNotesInput.value = m.notes || '';

    // Render Problems Grid A to M
    renderModalProblems();

    // Show modal
    elements.contestModal.style.display = 'flex';
  }

  function renderModalProblems() {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
    let solvedCount = 0;

    elements.modalProblemsContainer.innerHTML = letters
      .map((letter) => {
        const state = activeModalProblems[letter] || 0; // 0=unsolved, 1=solved, 2=upsolved
        let stateClass = '';
        let titleHint = `${letter}: Unsolved (Click to cycle)`;

        if (state === 1) {
          stateClass = 'problem-solved';
          titleHint = `${letter}: Solved in contest (Click to cycle)`;
          solvedCount++;
        } else if (state === 2) {
          stateClass = 'problem-upsolved';
          titleHint = `${letter}: Upsolved after contest (Click to cycle)`;
          solvedCount++;
        }

        return `
          <button type="button" class="problem-pill-btn ${stateClass}" 
                  onclick="window.icpcApp.cycleProblemState('${letter}')" 
                  title="${titleHint}">
            ${letter}
          </button>
        `;
      })
      .join('');

    elements.modalSolvedRatio.textContent = `${solvedCount} / ${letters.length} Solved`;
  }

  function cycleProblemState(letter) {
    const current = activeModalProblems[letter] || 0;
    // Cycle: 0 -> 1 (Solved) -> 2 (Upsolved) -> 0 (Reset)
    const next = (current + 1) % 3;
    if (next === 0) {
      delete activeModalProblems[letter];
    } else {
      activeModalProblems[letter] = next;
    }
    renderModalProblems();
  }

  function saveModalChanges() {
    if (!activeModalContestId) return;

    if (!userMarks[activeModalContestId]) {
      userMarks[activeModalContestId] = {};
    }

    const selectedRadio = elements.contestModal.querySelector('input[name="modal-status"]:checked');
    const newStatus = selectedRadio ? selectedRadio.value : 'unstarted';

    userMarks[activeModalContestId].status = newStatus;
    userMarks[activeModalContestId].problems = Object.assign({}, activeModalProblems);
    userMarks[activeModalContestId].notes = elements.modalNotesInput.value.trim();

    saveUserMarks(activeModalContestId);
    closeModal();
    render();
    showToast('Contest practice details saved & synced to SQLite!', 'success');
  }

  function closeModal() {
    elements.contestModal.style.display = 'none';
    activeModalContestId = null;
  }

  // -------------------------------------------------------------
  // 5-Hour Virtual Contest Stopwatch
  // -------------------------------------------------------------
  function formatTimerSeconds(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    elements.btnTimerStart.style.display = 'none';
    elements.btnTimerPause.style.display = 'inline-flex';

    timerInterval = setInterval(() => {
      if (timerRemainingSeconds > 0) {
        timerRemainingSeconds--;
        elements.modalTimerDisplay.textContent = formatTimerSeconds(timerRemainingSeconds);
      } else {
        clearInterval(timerInterval);
        timerRunning = false;
        elements.btnTimerStart.style.display = 'inline-flex';
        elements.btnTimerPause.style.display = 'none';
        showToast('⏰ Contest Time is UP! Stop coding and submit.', 'warning');
      }
    }, 1000);
  }

  function pauseTimer() {
    if (!timerRunning) return;
    clearInterval(timerInterval);
    timerRunning = false;
    elements.btnTimerStart.style.display = 'inline-flex';
    elements.btnTimerPause.style.display = 'none';
    showToast('Timer paused', 'info');
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerRemainingSeconds = 5 * 3600;
    elements.modalTimerDisplay.textContent = '05:00:00';
    elements.btnTimerStart.style.display = 'inline-flex';
    elements.btnTimerPause.style.display = 'none';
  }

  // -------------------------------------------------------------
  // Codeforces Gym Live Sync
  // -------------------------------------------------------------
  async function syncCodeforcesGym() {
    elements.syncIcon.classList.add('spinning');
    elements.btnSyncCF.disabled = true;
    showToast('Fetching latest Gym contests from Codeforces API...', 'info');

    try {
      const resp = await fetch('https://codeforces.com/api/contest.list?gym=true');
      if (!resp.ok) {
        throw new Error(`HTTP error ${resp.status}`);
      }

      const json = await resp.json();
      if (json.status !== 'OK') {
        throw new Error(json.comment || 'API did not return OK');
      }

      const rawContests = json.result || [];
      const existingIds = new Set(allContests.map(c => c.id));
      let addedCount = 0;

      rawContests.forEach((c) => {
        const name = (c.name || '').trim();
        const lower = name.lower ? name.lower() : name.toLowerCase();

        // ICPC filter
        let isIcpc = false;
        if (['icpc', 'acm-icpc', 'cerc', 'nwerc', 'swerc', 'seerc', 'nerc', 'neerc', 'euc', 'acpc'].some(k => lower.includes(k))) {
          isIcpc = true;
        } else if (lower.includes('regional') && (lower.includes('contest') || lower.includes('programming'))) {
          isIcpc = true;
        }

        if (!isIcpc) return;

        if (!existingIds.has(c.id)) {
          // Parse season and year
          const seasonMatch = name.match(/\b(20[0-2]\d)\s*[-–/]\s*(20[0-2]\d)\b/);
          let season = 'Other';
          let year = 'Other';

          if (seasonMatch) {
            const y1 = parseInt(seasonMatch[1], 10);
            const y2 = parseInt(seasonMatch[2], 10);
            season = `${y1}-${y2}`;
            year = String(Math.max(y1, y2));
          } else {
            const single = name.match(/\b(20[0-2]\d)\b/);
            if (single) {
              season = single[1];
              year = single[1];
            }
          }

          // Region
          let region = 'Global / Other Region';
          if (lower.includes('dhaka') || lower.includes('bangladesh')) region = 'Asia Dhaka';
          else if (['nwerc', 'swerc', 'cerc', 'seerc', 'euc', 'european', 'nerc', 'neerc'].some(k => lower.includes(k))) region = 'Europe Region';
          else if (['brazil', 'mexico', 'colombia', 'latin', 'south america'].some(k => lower.includes(k))) region = 'Latin America';
          else if (['north america', 'nac', 'mid-atlantic', 'northeastern', 'greater ny'].some(k => lower.includes(k))) region = 'North America';
          else if (['acpc', 'arab', 'egypt', 'africa'].some(k => lower.includes(k))) region = 'Africa & Arab (ACPC)';
          else if (lower.includes('asia')) region = 'Asia Region';

          // Type
          let ctype = 'Regional Contest';
          if (lower.includes('preliminary') || lower.includes('qualifier')) ctype = 'Preliminary / Qualifier';
          else if (lower.includes('subregional')) ctype = 'Subregional';
          else if (lower.includes('championship') || lower.includes('final')) ctype = 'Championship / Super-Regional';

          allContests.unshift({
            id: c.id,
            name: name,
            season: season,
            year: year,
            region: region,
            type: ctype,
            difficulty: c.difficulty || 0,
            duration: c.durationSeconds || 18000,
            startTime: c.startTimeSeconds || 0,
            gymUrl: `https://codeforces.com/gym/${c.id}`,
            standingsUrl: `https://codeforces.com/gym/${c.id}/standings`,
          });

          existingIds.add(c.id);
          addedCount++;
        }
      });

      // Save updated contests to localStorage
      localStorage.setItem(STORAGE_KEY_CONTESTS, JSON.stringify(allContests));

      updateTabCounts();
      render();

      if (addedCount > 0) {
        showToast(`Sync successful! Added ${addedCount} new ICPC contests.`, 'success');
      } else {
        showToast(`Sync complete. You already have all latest contests!`, 'success');
      }
    } catch (err) {
      console.error('Codeforces sync failed:', err);
      showToast(`Sync failed (${err.message}). Using stored contests.`, 'warning');
    } finally {
      elements.syncIcon.classList.remove('spinning');
      elements.btnSyncCF.disabled = false;
    }
  }

  // -------------------------------------------------------------
  // Data Backup / Restore & Copy Summary
  // -------------------------------------------------------------
  function exportProgressData() {
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      user: currentUser ? { name: currentUser.name, email: currentUser.email } : null,
      userMarks: userMarks,
      totalContests: allContests.length,
    };

    const userTag = currentUser && currentUser.email ? currentUser.email.split('@')[0] : 'backup';
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icpc_practice_${userTag}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Progress backup exported successfully! 💾', 'success');
  }

  function importProgressData(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported && imported.userMarks) {
          userMarks = Object.assign({}, userMarks, imported.userMarks);
          saveUserMarks();
          render();
          showToast('Progress successfully imported & restored! 🎉', 'success');
        } else {
          throw new Error('Invalid file structure');
        }
      } catch (err) {
        console.error('Import error:', err);
        showToast('Failed to import backup file. Invalid format.', 'warning');
      }
      elements.importFileInput.value = '';
    };
    reader.readAsText(file);
  }

  function resetAllProgress() {
    const confirmReset = confirm('Are you sure you want to reset all contest marks, problem checklists, and notes? This cannot be undone unless you have an exported backup.');
    if (!confirmReset) return;

    userMarks = {};
    saveUserMarks();

    if (isDatabaseConnected) {
      const userId = currentUser ? currentUser.id : 'guest';
      fetch('/api/user/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      }).catch(err => console.warn('Could not reset DB marks:', err));
    }

    render();
    showToast('All practice marks and notes cleared from local & SQLite database.', 'info');
  }

  function copySummaryToClipboard() {
    const filtered = getFilteredContests();
    if (filtered.length === 0) {
      showToast('No contests to copy.', 'warning');
      return;
    }

    const lines = [
      `### ICPC Practice Contests Plan (${filtered.length} Contests)`,
      `Generated from ICPC Regional Tracker on ${new Date().toLocaleDateString()}`,
      '',
      '| Gym ID | Season / Year | Region | Contest Name | Status | Link |',
      '|---|---|---|---|---|---|',
    ];

    filtered.forEach((c) => {
      const info = getContestProgressInfo(c.id);
      const statusIcon = info.status === 'solved' ? '✅ Solved' : info.status === 'upsolving' ? '⏳ Upsolving' : info.status === 'todo' ? '📌 To Do' : '⚪ Not Started';
      lines.push(`| ${c.id} | ${c.season || c.year} | ${c.region} | ${c.name} | ${statusIcon} | [Open Gym](${c.gymUrl}) |`);
    });

    const markdown = lines.join('\n');
    navigator.clipboard.writeText(markdown).then(() => {
      showToast(`Copied Markdown table of ${filtered.length} contests to clipboard!`, 'success');
    });
  }

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Expose methods for inline handlers
  window.icpcApp = {
    toggleStar,
    updateQuickStatus,
    openModal,
    cycleProblemState,
    copyGymId,
  };

  // Launch
  document.addEventListener('DOMContentLoaded', init);
})();
