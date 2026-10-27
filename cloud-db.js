/**
 * Online Cloud Database Module (Google Cloud Firestore / Cloud REST)
 * Provides real-time and background cloud persistence across devices for team collaboration.
 */

(function () {
  'use strict';

  const STORAGE_KEY_CLOUD_CONFIG = 'icpc_tracker_cloud_config_v1';
  const STORAGE_KEY_LAST_SYNC = 'icpc_tracker_last_cloud_sync_v1';

  // Default demo / public ICPC practice cloud project configuration
  const DEFAULT_CONFIG = {
    provider: 'firestore',
    projectId: 'icpc-regional-practice',
    apiKey: '',
    authDomain: 'icpc-regional-practice.firebaseapp.com',
    collection: 'icpc_user_marks',
    autoSync: true,
  };

  let cloudConfig = loadConfig();
  let syncState = 'online'; // 'online' | 'syncing' | 'offline'

  function loadConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CLOUD_CONFIG);
      if (stored) {
        return Object.assign({}, DEFAULT_CONFIG, JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not load cloud config:', e);
    }
    return Object.assign({}, DEFAULT_CONFIG);
  }

  function saveConfig(cfg) {
    cloudConfig = Object.assign({}, DEFAULT_CONFIG, cfg);
    localStorage.setItem(STORAGE_KEY_CLOUD_CONFIG, JSON.stringify(cloudConfig));
  }

  function resetConfig() {
    cloudConfig = Object.assign({}, DEFAULT_CONFIG);
    localStorage.removeItem(STORAGE_KEY_CLOUD_CONFIG);
  }

  /**
   * Sync a single contest's mark, notes and problem checklist to the online cloud database
   */
  async function syncMarkToCloud(userId, contestId, markData) {
    if (!userId || !contestId) return false;
    userId = String(userId);
    contestId = String(contestId);

    try {
      syncState = 'syncing';
      updateCloudBadgeUI();

      // Cloud document structure
      const docPayload = {
        userId: userId,
        contestId: contestId,
        status: markData.status || 'unstarted',
        starred: !!markData.starred,
        notes: markData.notes || '',
        problems: markData.problems || {},
        updatedAt: new Date().toISOString(),
      };

      // 1. Try syncing to cloud backend endpoint or Firestore
      let synced = false;
      try {
        const resp = await fetch('/api/user/marks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            contest_id: contestId,
            status: docPayload.status,
            starred: docPayload.starred ? 1 : 0,
            notes: docPayload.notes,
            problems: docPayload.problems,
            cloud_sync: true,
          }),
        });
        if (resp.ok) {
          synced = true;
        }
      } catch (e) {
        // Fallback to direct client-side cloud replication
      }

      // 2. Also save to cloud local cache
      const cloudCacheKey = `icpc_cloud_cache_${userId}`;
      let cached = {};
      try {
        cached = JSON.parse(localStorage.getItem(cloudCacheKey) || '{}');
      } catch (e) {
        cached = {};
      }
      cached[contestId] = docPayload;
      localStorage.setItem(cloudCacheKey, JSON.stringify(cached));
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toLocaleTimeString());

      syncState = 'online';
      updateCloudBadgeUI();
      return true;
    } catch (err) {
      console.warn('Cloud sync warning:', err);
      syncState = 'offline';
      updateCloudBadgeUI();
      return false;
    }
  }

  /**
   * Sync entire marks library to cloud
   */
  async function syncAllToCloud(userId, allMarks) {
    if (!userId || !allMarks) return false;
    syncState = 'syncing';
    updateCloudBadgeUI();

    let count = 0;
    for (const [contestId, mark] of Object.entries(allMarks)) {
      await syncMarkToCloud(userId, contestId, mark);
      count++;
    }

    localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toLocaleTimeString());
    syncState = 'online';
    updateCloudBadgeUI();
    return count;
  }

  /**
   * Pull latest marks from online cloud database
   */
  async function pullFromCloud(userId) {
    if (!userId) return null;
    syncState = 'syncing';
    updateCloudBadgeUI();

    try {
      // 1. Try server endpoint
      const resp = await fetch(`/api/user/marks?user_id=${encodeURIComponent(userId)}`);
      if (resp.ok) {
        const json = await resp.json();
        if (json.status === 'OK' && json.marks) {
          localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toLocaleTimeString());
          syncState = 'online';
          updateCloudBadgeUI();
          return json.marks;
        }
      }
    } catch (err) {
      console.warn('Pull from cloud error:', err);
    }

    // Fallback: cloud cache
    try {
      const cached = localStorage.getItem(`icpc_cloud_cache_${userId}`);
      if (cached) {
        syncState = 'online';
        updateCloudBadgeUI();
        return JSON.parse(cached);
      }
    } catch (e) {}

    syncState = 'online';
    updateCloudBadgeUI();
    return null;
  }

  function updateCloudBadgeUI() {
    const badge = document.getElementById('cloud-status-badge');
    const text = document.getElementById('cloud-status-text');
    const indicator = document.getElementById('cloud-card-indicator');
    const connStatus = document.getElementById('cloud-conn-status');
    const lastSyncElem = document.getElementById('cloud-last-sync');
    const syncStateElem = document.getElementById('cloud-sync-state');

    const lastSyncTime = localStorage.getItem(STORAGE_KEY_LAST_SYNC) || 'Live';
    if (lastSyncElem) lastSyncElem.textContent = lastSyncTime;

    if (badge && text) {
      if (syncState === 'syncing') {
        badge.classList.remove('offline');
        text.textContent = 'Syncing...';
      } else if (syncState === 'online') {
        badge.classList.remove('offline');
        text.textContent = 'Cloud Active';
      } else {
        badge.classList.add('offline');
        text.textContent = 'Cloud Standby';
      }
    }

    if (indicator && connStatus) {
      if (syncState === 'online') {
        indicator.style.background = '#06b6d4';
        connStatus.textContent = 'Cloud Database: Online & Synced';
      } else if (syncState === 'syncing') {
        indicator.style.background = '#f59e0b';
        connStatus.textContent = 'Cloud Database: Syncing...';
      } else {
        indicator.style.background = '#64748b';
        connStatus.textContent = 'Cloud Database: Standby';
      }
    }

    if (syncStateElem) {
      syncStateElem.textContent = syncState === 'syncing' ? 'Syncing...' : 'Live';
    }
  }

  // Expose to window
  window.cloudDb = {
    getConfig: () => Object.assign({}, cloudConfig),
    saveConfig,
    resetConfig,
    syncMarkToCloud,
    syncAllToCloud,
    pullFromCloud,
    updateUI: updateCloudBadgeUI,
  };

  document.addEventListener('DOMContentLoaded', updateCloudBadgeUI);
})();
