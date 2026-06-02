import './style.css';

let API_BASE = 'http://localhost:3001/api';

// ============================================================
// STATE
// ============================================================
const state = {
  activeView: 'changes',
  activeRepoPath: '',
  activeRepoName: '',
  activeProfile: '',
  activeBranch: 'main',
  branches: [],

  // Remote status
  remoteStatus: { ahead: 0, behind: 0, hasRemote: false },
  remoteActionMode: 'fetch', // 'fetch' | 'pull' | 'push'

  config: { profiles: {}, folderProfiles: [], defaultProfile: '' },

  repoData: { commits: [], changes: [] },

  selectedChangeFile: null,
  selectedCommitId: '',
  selectedProfileId: '',

  stagedFiles: new Set(),

  doctorFixing: false,

  preferences: {
    theme: 'system',
    osMode: 'auto',
    autoCollapse: true,
  },
};

// ============================================================
// DOM ELEMENTS
// ============================================================
const $ = (id) => document.getElementById(id);

const els = {
  // Topbar pickers
  repoPicker:        $('repo-picker-btn'),
  repoMenu:          $('repo-menu'),
  repoSearchInput:   $('repo-search-input'),
  repoList:          $('repo-list'),
  profilePicker:     $('profile-picker-btn'),
  profileMenu:       $('profile-menu'),
  currentRepoName:   $('current-repo-name'),
  currentProfileName:$('current-profile-name'),
  topbarProfileAvatar:$('topbar-profile-avatar'),

  // Tab buttons
  tabChanges:        $('tab-changes'),
  tabHistory:        $('tab-history'),
  tabProfiles:       $('tab-profiles'),
  changesBadge:      $('changes-count-badge'),

  // Views
  viewChanges:       $('view-changes'),
  viewHistory:       $('view-history'),
  viewProfiles:      $('view-profiles'),

  // Changes view
  changesList:       $('changes-list'),
  changesEmpty:      $('changes-empty'),
  refreshChangesBtn: $('refresh-changes-btn'),
  commitTitle:       $('commit-title'),
  commitDesc:        $('commit-description'),
  commitBtn:         $('commit-btn'),
  commitAvatar:      $('commit-avatar-initials'),
  commitBranchName:  $('commit-branch-name'),
  currentBranchName: $('current-branch-name'),
  diffFilename:      $('diff-filename'),
  diffFilepath:      $('diff-filepath'),
  diffStats:         $('diff-stats'),
  diffContent:       $('diff-content'),
  diffPlaceholder:   $('diff-placeholder'),

  // Remote action
  remoteActionBtn:   $('remote-action-btn'),
  remoteActionText:  $('remote-action-text'),
  remoteActionMeta:  $('remote-action-meta'),
  remoteActionIcon:  $('remote-action-icon'),

  // History view
  historyList:            $('history-list'),
  historyFilesList:       $('history-files-list'),
  historyFilesCount:      $('history-files-count'),
  historyDiffFilename:    $('history-diff-filename'),
  historyDiffFilepath:    $('history-diff-filepath'),
  historyDiffStats:       $('history-diff-stats'),
  historyDiffContent:     $('history-diff-content'),

  // Profiles view
  profilesList:              $('profiles-list'),
  profileInspectorName:      $('profile-inspector-name'),
  profileInspectorEmail:     $('profile-inspector-email'),
  profileInspectorActions:   $('profile-inspector-actions'),
  profileInspectorContent:   $('profile-inspector-content'),
  addProfileBtn:             $('add-profile-btn'),

  // Header buttons
  doctorBtn:         $('doctor-btn'),
  syncBtn:           $('sync-btn'),
  linkRepoBtn:       $('link-repo-btn'),
  cloneRepoBtn:      $('clone-repo-btn'),

  // Doctor modal
  doctorModal:       $('doctor-modal'),
  closeDoctorBtn:    $('close-doctor-btn'),
  doctorCancelBtn:   $('doctor-cancel-btn'),
  doctorFixBtn:      $('doctor-fix-btn'),
  doctorCheckItems:  $('doctor-check-items'),

  // New Profile modal
  newProfileModal:   $('new-profile-modal'),
  closeNewProfileBtn:$('close-new-profile-btn'),
  newProfileForm:    $('new-profile-form'),
  newProfileCancel:  $('new-profile-cancel'),

  // Link repo modal
  linkRepoModal:     $('link-repo-modal'),
  linkRepoForm:      $('link-repo-form'),
  linkRepoCancel:    $('link-repo-cancel'),
  closeLinkRepoBtn:  $('close-link-repo-btn'),
  linkRepoProfile:   $('link-profile'),
  browseLinkPath:    $('browse-link-path-btn'),

  // Clone repo modal
  cloneRepoModal:    $('clone-repo-modal'),
  cloneRepoForm:     $('clone-repo-form'),
  cloneRepoCancel:   $('clone-repo-cancel'),
  closeCloneRepoBtn: $('close-clone-repo-btn'),
  cloneRepoProfile:  $('clone-profile'),
  cloneSubmitBtn:    $('clone-submit-btn'),
  browseClonePath:   $('browse-clone-path-btn'),

  // Drag overlay
  dragOverlay:       $('drag-overlay'),

  // Branch picker
  branchPicker:             $('branch-picker-btn'),
  branchMenu:               $('branch-menu'),
  branchSearchInput:        $('branch-search-input'),
  branchList:               $('branch-list'),

  // Switch branch modal
  switchBranchModal:        $('switch-branch-modal'),
  closeSwitchBranchBtn:     $('close-switch-branch-btn'),
  switchBranchCancel:       $('switch-branch-cancel'),
  switchBranchSubmit:       $('switch-branch-submit'),
  switchTargetBranchName:   $('switch-target-branch-name'),
  switchTargetBranchName2:  $('switch-target-branch-name-2'),
  switchCurrentBranchName1: $('switch-current-branch-name-1'),
  optionLeaveChanges:       $('option-leave-changes'),
  optionBringChanges:       $('option-bring-changes'),
  optionLeaveLabel:         $('option-leave-label'),
  optionBringLabel:         $('option-bring-label'),

  // Merge modal
  mergeTriggerBtn:          $('merge-trigger-btn'),
  mergeModal:               $('merge-modal'),
  closeMergeBtn:            $('close-merge-btn'),
  mergeCancel:              $('merge-cancel'),
  mergeSubmit:              $('merge-submit'),
  mergeActiveBranchTitle:   $('merge-active-branch-title'),
  mergeActiveBranchBody:    $('merge-active-branch-body'),
  mergeBranchSearch:        $('merge-branch-search'),
  mergeBranchList:          $('merge-branch-list'),
  mergePreviewCard:         $('merge-preview-card'),

  // Amend & Undo
  commitAmendCheckbox:      $('commit-amend-checkbox'),
  undoBanner:               $('undo-banner'),
  undoCommitBtn:            $('undo-commit-btn'),
  stashBanner:              $('stash-banner'),
  stashViewBtn:             $('stash-view-btn'),
  stashRestoreBtn:          $('stash-restore-btn'),
  stashDiscardBtn:          $('stash-discard-btn'),

  // Toast container
  toastContainer:    $('toast-container'),

  // Preferences / Ajustes elements
  preferencesBtn:    $('preferences-btn'),
  preferencesModal:  $('preferences-modal'),
  closePreferencesBtn:$('close-preferences-btn'),
  preferencesSaveBtn:$('preferences-save-btn'),
  prefTheme:         $('pref-theme'),
  prefOS:            $('pref-os'),
  prefAutoCollapse:  $('pref-auto-collapse'),
  sidebarToggleBtn:  $('sidebar-toggle-btn'),
};

// ============================================================
// TOAST SYSTEM
// ============================================================
function showToast(type, title, msg = '', duration = 3500) {
  const icons = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>`,
    error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
    </div>
  `;
  els.toastContainer.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// ============================================================
// PREFERENCES & THEMES SYSTEM
// ============================================================
let wasCollapsedByResize = false;
const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');

function detectOS() {
  const ua = navigator.userAgent;
  if (ua.indexOf('Mac') !== -1) return 'macos';
  if (ua.indexOf('Win') !== -1) return 'windows';
  if (ua.indexOf('Linux') !== -1) return 'linux';
  return 'linux';
}

function applyTheme(theme) {
  // Remove all theme classes first
  document.body.classList.remove('theme-light', 'theme-dark', 'theme-cyberpunk', 'theme-high-contrast', 'theme-system-light', 'theme-system-dark');
  
  if (theme === 'system') {
    if (themeMedia.matches) {
      document.body.classList.add('theme-system-dark');
    } else {
      document.body.classList.add('theme-system-light');
    }
  } else {
    document.body.classList.add(`theme-${theme}`);
  }
}

function applyOSMode(osMode) {
  // Remove all os classes first
  document.body.classList.remove('os-macos', 'os-windows', 'os-linux');
  
  const resolvedOS = osMode === 'auto' ? detectOS() : osMode;
  document.body.classList.add(`os-${resolvedOS}`);
}

function handleAutoCollapse() {
  if (state.preferences.autoCollapse) {
    if (window.innerWidth < 900) {
      if (!document.body.classList.contains('sidebar-collapsed')) {
        document.body.classList.add('sidebar-collapsed');
        wasCollapsedByResize = true;
      }
    } else {
      if (wasCollapsedByResize && document.body.classList.contains('sidebar-collapsed')) {
        document.body.classList.remove('sidebar-collapsed');
        wasCollapsedByResize = false;
      }
    }
  }
}

function applyPreferences() {
  applyTheme(state.preferences.theme);
  applyOSMode(state.preferences.osMode);
  handleAutoCollapse();
}

function initPreferences() {
  // Load preferences from localStorage
  const savedTheme = localStorage.getItem('gitx-pref-theme') || 'system';
  const savedOS = localStorage.getItem('gitx-pref-os') || 'auto';
  const savedAutoCollapse = localStorage.getItem('gitx-pref-auto-collapse') !== 'false'; // default true
  
  state.preferences = {
    theme: savedTheme,
    osMode: savedOS,
    autoCollapse: savedAutoCollapse,
  };
  
  // Set UI inputs to match loaded state
  if (els.prefTheme) els.prefTheme.value = savedTheme;
  if (els.prefOS) els.prefOS.value = savedOS;
  if (els.prefAutoCollapse) els.prefAutoCollapse.checked = savedAutoCollapse;
  
  applyPreferences();
  
  // Event listener for media scheme changes
  themeMedia.addEventListener('change', () => {
    if (state.preferences.theme === 'system') {
      applyTheme('system');
    }
  });
  
  // Event listener for window resize
  window.addEventListener('resize', handleAutoCollapse);
}

function savePreferences() {
  if (els.prefTheme) {
    state.preferences.theme = els.prefTheme.value;
    localStorage.setItem('gitx-pref-theme', state.preferences.theme);
  }
  if (els.prefOS) {
    state.preferences.osMode = els.prefOS.value;
    localStorage.setItem('gitx-pref-os', state.preferences.osMode);
  }
  if (els.prefAutoCollapse) {
    state.preferences.autoCollapse = els.prefAutoCollapse.checked;
    localStorage.setItem('gitx-pref-auto-collapse', state.preferences.autoCollapse);
  }
  
  applyPreferences();
  showToast('success', 'Preferencias guardadas', 'Los cambios de diseño y comportamiento se han aplicado correctamente.');
}

// ============================================================
// UTILITIES
// ============================================================
function getBasename(p) { return p.split(/[/\\]/).pop(); }

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getStatusLetter(status) {
  if (status === 'added') return 'A';
  if (status === 'deleted') return 'D';
  if (status === 'renamed') return 'R';
  return 'M';
}

// ============================================================
// API
// ============================================================
async function fetchConfig() {
  try {
    const res = await fetch(`${API_BASE}/config`);
    if (!res.ok) throw new Error('Server error');
    state.config = await res.json();
    return state.config;
  } catch (e) {
    showToast('error', 'Sin conexión al servidor', 'Asegúrate de correr: npm run dev');
    return null;
  }
}

async function fetchRepoData(repoPath) {
  try {
    const res = await fetch(`${API_BASE}/repo-status?path=${encodeURIComponent(repoPath)}`);
    if (!res.ok) throw new Error(await res.text());
    state.repoData = await res.json();

    // Staged files set matches actual git index status
    state.stagedFiles = new Set(
      state.repoData.changes
        .filter(c => c.stagingState === 'staged' || c.stagingState === 'partially-staged')
        .map(c => c.id)
    );
    return state.repoData;
  } catch (e) {
    console.error('fetchRepoData error:', e);
    state.repoData = { commits: [], changes: [] };
    state.stagedFiles = new Set();
  }
}

async function fetchFileDiff(filePath, status) {
  try {
    const res = await fetch(`${API_BASE}/repo-diff?path=${encodeURIComponent(state.activeRepoPath)}&file=${encodeURIComponent(filePath)}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { diff: data.diff || '', lines: data.lines || [] };
  } catch (e) {
    return { diff: `Error al obtener el diff: ${e.message}`, lines: [] };
  }
}

async function fetchCommitDiff(hash) {
  try {
    const res = await fetch(`${API_BASE}/commit-diff?path=${encodeURIComponent(state.activeRepoPath)}&commit=${hash}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.diff || '';
  } catch (e) {
    return `Error al obtener el diff del commit: ${e.message}`;
  }
}

async function fetchBranchName(repoPath) {
  try {
    const res = await fetch(`${API_BASE}/repo-branch?path=${encodeURIComponent(repoPath)}`);
    if (!res.ok) return 'main';
    const data = await res.json();
    return data.branch || 'main';
  } catch (e) {
    return 'main';
  }
}

async function fetchRemoteStatus(repoPath, skipFetch = false) {
  try {
    const url = `${API_BASE}/git/remote-status?path=${encodeURIComponent(repoPath)}${skipFetch ? '&skipFetch=true' : ''}`;
    const res = await fetch(url);
    if (!res.ok) return { ahead: 0, behind: 0, hasRemote: false };
    return await res.json();
  } catch (e) {
    return { ahead: 0, behind: 0, hasRemote: false };
  }
}

function updateRemoteButton(status) {
  const btn  = els.remoteActionBtn;
  const text = els.remoteActionText;
  const meta = els.remoteActionMeta;
  const icon = els.remoteActionIcon;
  if (!btn) return;

  const { ahead, behind, hasRemote } = status;

  const fetchSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>`;
  const pullSVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
  const pushSVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;

  btn.disabled = false;
  btn.classList.remove('pull', 'push');

  if (!hasRemote) {
    btn.disabled = true;
    icon.innerHTML = fetchSVG;
    text.textContent = 'Sin remoto';
    meta.textContent = '';
    state.remoteActionMode = 'none';
  } else if (behind > 0) {
    btn.classList.add('pull');
    icon.innerHTML = pullSVG;
    text.textContent = 'Pull origin';
    meta.textContent = behind;
    state.remoteActionMode = 'pull';
  } else if (ahead > 0) {
    btn.classList.add('push');
    icon.innerHTML = pushSVG;
    text.textContent = 'Push origin';
    meta.textContent = ahead;
    state.remoteActionMode = 'push';
  } else {
    icon.innerHTML = fetchSVG;
    text.textContent = 'Fetch origin';
    meta.textContent = '';
    state.remoteActionMode = 'fetch';
  }
}

async function handleRemoteAction() {
  if (!state.activeRepoPath) return;
  const mode = state.remoteActionMode;
  if (mode === 'none') return;

  const btn = els.remoteActionBtn;
  const icon = els.remoteActionIcon;
  const text = els.remoteActionText;
  const meta = els.remoteActionMeta;

  if (!btn || !icon || !text || !meta) return;

  btn.disabled = true;

  // Guardamos el estado original para restaurar en caso de error
  const origIconHtml = icon.innerHTML;
  const origTextContent = text.textContent;
  const origMetaContent = meta.textContent;

  icon.innerHTML = `<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;
  text.textContent = mode === 'pull' ? 'Bajando...' : mode === 'push' ? 'Subiendo...' : 'Actualizando...';
  meta.textContent = '';

  const endpoint = mode === 'pull' ? 'pull' : mode === 'push' ? 'push' : 'fetch';

  try {
    const res = await fetch(`${API_BASE}/git/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath: state.activeRepoPath })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error desconocido');

    const actionName = mode === 'pull' ? 'Pull' : mode === 'push' ? 'Push' : 'Fetch';
    showToast('success', `${actionName} completado`, data.output || '');

    // Refresh repo data and remote status after action
    if (mode === 'pull') {
      await fetchRepoData(state.activeRepoPath);
      renderChanges();
      updateChangesBadge();
    }

    const newStatus = await fetchRemoteStatus(state.activeRepoPath);
    state.remoteStatus = newStatus;
    updateRemoteButton(newStatus);
  } catch (e) {
    showToast('error', 'Error en operación remota', e.message);
    icon.innerHTML = origIconHtml;
    text.textContent = origTextContent;
    meta.textContent = origMetaContent;
    btn.disabled = false;
  }
}

// ============================================================
// VIEW SWITCHING
// ============================================================
function switchView(view) {
  state.activeView = view;

  els.viewChanges.classList.toggle('hidden', view !== 'changes');
  els.viewHistory.classList.toggle('hidden', view !== 'history');
  els.viewProfiles.classList.toggle('hidden', view !== 'profiles');

  els.tabChanges.classList.toggle('active', view === 'changes');
  els.tabChanges.setAttribute('aria-selected', view === 'changes');
  els.tabHistory.classList.toggle('active', view === 'history');
  els.tabHistory.setAttribute('aria-selected', view === 'history');
  els.tabProfiles.classList.toggle('active', view === 'profiles');
  els.tabProfiles.setAttribute('aria-selected', view === 'profiles');

  if (view === 'history') {
    renderHistoryList();
    if (state.repoData.commits.length > 0 && !state.selectedCommitId) {
      state.selectedCommitId = state.repoData.commits[0].id;
      renderHistoryList();
      selectCommit(state.repoData.commits[0]);
    }
  } else if (view === 'profiles') {
    renderProfilesList();
  }
}

// ============================================================
// REPOSITORY SELECTION
// ============================================================
async function selectRepository(repoPath) {
  if (els.undoBanner) els.undoBanner.style.display = 'none';
  if (els.commitAmendCheckbox) els.commitAmendCheckbox.checked = false;

  state.selectedCommitId = null;
  state.selectedCommitFile = null;
  if (els.historyFilesList) {
    els.historyFilesList.innerHTML = `
      <div class="empty-state">
        <p style="font-size:11px; color:var(--text-muted);">Selecciona un commit para ver sus archivos</p>
      </div>`;
  }
  if (els.historyFilesCount) {
    els.historyFilesCount.textContent = 'Selecciona un commit';
  }
  if (els.historyDiffFilename) els.historyDiffFilename.textContent = 'Selecciona un archivo';
  if (els.historyDiffFilepath) els.historyDiffFilepath.textContent = '';
  if (els.historyDiffStats) els.historyDiffStats.textContent = '';
  if (els.historyDiffContent) {
    els.historyDiffContent.innerHTML = `
      <div class="diff-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>Selecciona un archivo para ver sus diferencias</p>
      </div>`;
  }

  state.activeRepoPath = repoPath;
  state.activeRepoName = getBasename(repoPath);
  els.currentRepoName.textContent = state.activeRepoName;
  localStorage.setItem('gitx-active-repo-path', repoPath);

  // Resolve active profile for this repo
  let resolvedProfile = state.config.defaultProfile || '';
  let maxLen = 0;
  state.config.folderProfiles.forEach(fp => {
    if (repoPath.startsWith(fp.path) && fp.path.length > maxLen) {
      resolvedProfile = fp.profile;
      maxLen = fp.path.length;
    }
  });
  state.activeProfile = resolvedProfile;
  state.selectedProfileId = resolvedProfile;
  els.currentProfileName.textContent = resolvedProfile || '—';
  if (els.topbarProfileAvatar) {
    els.topbarProfileAvatar.textContent = resolvedProfile ? resolvedProfile.charAt(0).toUpperCase() : '—';
  }

  // Update active items in menus
  els.repoList.querySelectorAll('.picker-item').forEach(el => {
    el.classList.toggle('active', el.dataset.path === repoPath);
  });
  els.profileMenu.querySelectorAll('.picker-item').forEach(el => {
    el.classList.toggle('active', el.dataset.profile === resolvedProfile);
  });

  // Set commit avatar
  if (resolvedProfile) {
    els.commitAvatar.textContent = resolvedProfile.charAt(0).toUpperCase();
  }

  // Load repo data
  await fetchRepoData(repoPath);

  // Branch name
  state.activeBranch = await fetchBranchName(repoPath);
  if (els.commitBranchName) els.commitBranchName.textContent = state.activeBranch;
  if (els.currentBranchName) els.currentBranchName.textContent = state.activeBranch;

  // Remote status (async, don't block render)
  fetchRemoteStatus(repoPath).then(status => {
    state.remoteStatus = status;
    updateRemoteButton(status);
  });

  // Render
  renderChanges();
  updateChangesBadge();
  updateCommitBtn();

  // Switch to changes view
  if (state.activeView === 'changes') {
    // already on changes, just refresh diff if something is selected
    if (state.selectedChangeFile) {
      const found = state.repoData.changes.find(c => c.id === state.selectedChangeFile.id);
      if (found) {
        loadFileDiff(found);
      } else {
        state.selectedChangeFile = null;
        showDiffPlaceholder();
      }
    } else {
      showDiffPlaceholder();
    }
  }
}

async function selectActiveProfile(profileKey) {
  state.activeProfile = profileKey;
  state.selectedProfileId = profileKey;
  els.currentProfileName.textContent = profileKey;
  if (els.topbarProfileAvatar) {
    els.topbarProfileAvatar.textContent = profileKey ? profileKey.charAt(0).toUpperCase() : '—';
  }

  // Update profile menu
  els.profileMenu.querySelectorAll('.picker-item').forEach(el => {
    el.classList.toggle('active', el.dataset.profile === profileKey);
  });

  // Set commit avatar
  els.commitAvatar.textContent = profileKey.charAt(0).toUpperCase();

  try {
    const res = await fetch(`${API_BASE}/profile/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileName: profileKey, repoPath: state.activeRepoPath, global: false })
    });
    if (!res.ok) throw new Error(await res.text());
    showToast('success', `Perfil activado: ${profileKey}`, 'La identidad se aplicó en este repositorio.');
  } catch (e) {
    showToast('error', 'Error al activar perfil', e.message);
  }

  await fetchConfig();
  if (state.activeView === 'profiles') {
    renderProfilesList();
    renderProfileInspector(profileKey);
  }
}

// ============================================================
// CHANGES VIEW
// ============================================================
function renderChanges() {
  els.changesList.innerHTML = '';

  // Handle Stash Banner
  if (els.stashBanner) {
    if (state.repoData && state.repoData.stashedChanges) {
      const descEl = els.stashBanner.querySelector('.stash-banner-desc');
      if (descEl) {
        descEl.textContent = `Tienes cambios guardados en stash para la rama ${state.repoData.stashedChanges.branch}.`;
      }
      els.stashBanner.style.display = 'block';
    } else {
      els.stashBanner.style.display = 'none';
    }
  }

  // Update main workspace placeholder if no local changes
  if (state.repoData && state.repoData.changes.length === 0) {
    showDiffPlaceholder();
  }

  if (!state.repoData || state.repoData.changes.length === 0) {
    els.changesList.appendChild(createEmptyState(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>`,
      'Sin cambios locales',
      'El directorio de trabajo está limpio'
    ));
    return;
  }

  state.repoData.changes.forEach(file => {
    const isSelected = state.selectedChangeFile?.id === file.id;
    const isChecked = file.stagingState === 'staged' || file.stagingState === 'partially-staged';
    const isIndeterminate = file.stagingState === 'partially-staged';
    const statusLetter = getStatusLetter(file.status);
    const dotClass = file.status === 'added' ? 'added' : file.status === 'deleted' ? 'deleted' : 'modified';

    const item = document.createElement('div');
    item.className = `change-item${isSelected ? ' selected' : ''}`;
    item.dataset.fileId = file.id;
    item.innerHTML = `
      <input type="checkbox" class="change-checkbox" ${isChecked ? 'checked' : ''} title="Incluir en commit" />
      <span class="change-status-dot ${dotClass}"></span>
      <span class="change-name" title="${escapeHTML(file.path)}">${escapeHTML(file.name)}</span>
      <span class="change-status-badge ${statusLetter}">${statusLetter}</span>
    `;

    // Checkbox toggles staged state
    const checkbox = item.querySelector('.change-checkbox');
    if (isIndeterminate) {
      checkbox.indeterminate = true;
    }

    checkbox.addEventListener('change', async (e) => {
      e.stopPropagation();
      const targetChecked = e.target.checked;
      checkbox.disabled = true;
      try {
        if (targetChecked) {
          await fetch(`${API_BASE}/git/stage-file`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repoPath: state.activeRepoPath, filePath: file.path })
          });
          state.stagedFiles.add(file.id);
        } else {
          await fetch(`${API_BASE}/git/unstage-file`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repoPath: state.activeRepoPath, filePath: file.path })
          });
          state.stagedFiles.delete(file.id);
        }
        await fetchRepoData(state.activeRepoPath);
        renderChanges();
        updateChangesBadge();
      } catch (err) {
        showToast('error', 'Error de Staging', err.message);
        checkbox.checked = !targetChecked;
      } finally {
        checkbox.disabled = false;
      }
    });

    // Clicking row selects file for diff view
    item.addEventListener('click', (e) => {
      if (e.target === checkbox) return;
      selectChangeFile(file);
    });

    els.changesList.appendChild(item);
  });
}

function selectChangeFile(file) {
  state.selectedChangeFile = file;

  // Update selected state in list
  els.changesList.querySelectorAll('.change-item').forEach(el => {
    el.classList.toggle('selected', el.dataset.fileId === file.id);
  });

  loadFileDiff(file);
}

async function loadFileDiff(file) {
  // Update topbar
  els.diffFilename.textContent = file.name;
  els.diffFilepath.textContent = file.path;
  els.diffStats.innerHTML = `
    <span class="stat-additions">+${file.additions}</span>
    <span class="stat-deletions">-${file.deletions}</span>
  `;

  // Show loading
  els.diffContent.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;gap:10px;color:var(--text-muted);font-size:12px;">
      <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Cargando diferencias...
    </div>`;

  const diffData = await fetchFileDiff(file.path, file.status);
  state.currentDiffText = diffData.diff;
  renderDiffViewer(diffData, els.diffContent, true, file.path);
}

function showDiffPlaceholder() {
  els.diffFilename.textContent = 'Selecciona un archivo';
  els.diffFilepath.textContent = '';
  els.diffStats.innerHTML = '';

  if (state.repoData && state.repoData.stashedChanges && (!state.repoData.changes || state.repoData.changes.length === 0)) {
    els.diffFilename.textContent = 'Cambios en Stash';
    els.diffContent.innerHTML = `
      <div class="diff-placeholder" style="padding: 40px; text-align: center;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="color:var(--accent); width:56px; height:56px; margin-bottom:16px; opacity:0.8;">
          <polyline points="21 8 21 21 3 21 3 8"></polyline>
          <rect x="1" y="3" width="22" height="5"></rect>
          <line x1="10" y1="12" x2="14" y2="12"></line>
        </svg>
        <h3 style="font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0 0 8px 0;">Tienes cambios en stash</h3>
        <p style="max-width: 440px; text-align: center; color: var(--text-muted); margin: 0 auto 24px auto; font-size: 13px; line-height: 1.6;">
          Tienes cambios temporales guardados en stash para la rama activa <strong>${escapeHTML(state.repoData.stashedChanges.branch)}</strong>. Puedes ver qué archivos cambiaron, restaurarlos para continuar trabajando en ellos o eliminarlos permanentemente.
        </p>
        <div style="display:flex; justify-content:center; gap:12px;">
          <button class="gx-btn secondary" id="stash-main-view-btn" style="padding: 7px 16px; font-size:12px;">Ver archivos</button>
          <button class="gx-btn primary" id="stash-main-restore-btn" style="padding: 7px 16px; font-size:12px;">Restaurar cambios</button>
          <button class="gx-btn secondary" id="stash-main-discard-btn" style="padding: 7px 16px; font-size:12px;">Descartar stash</button>
        </div>
      </div>`;

    // Redirigir clics a los botones del sidebar correspondientes
    document.getElementById('stash-main-view-btn')?.addEventListener('click', () => {
      inspectStash(state.repoData.stashedChanges.id);
    });
    document.getElementById('stash-main-restore-btn')?.addEventListener('click', () => {
      els.stashRestoreBtn?.click();
    });
    document.getElementById('stash-main-discard-btn')?.addEventListener('click', () => {
      els.stashDiscardBtn?.click();
    });
    return;
  }

  els.diffContent.innerHTML = `
    <div class="diff-placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <p>Selecciona un archivo de la lista de cambios para ver sus diferencias</p>
    </div>`;
}

async function inspectStash(stashId) {
  if (!state.activeRepoPath) return;

  els.diffFilename.textContent = 'Inspeccionando Stash';
  els.diffFilepath.textContent = '';
  els.diffStats.innerHTML = '';
  
  // Mostrar loading
  els.diffContent.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;gap:10px;color:var(--text-muted);font-size:12px;">
      <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Cargando archivos del stash...
    </div>`;

  try {
    const res = await fetch(`${API_BASE}/git/commit-files?path=${encodeURIComponent(state.activeRepoPath)}&commit=${encodeURIComponent(stashId)}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const files = data.files || [];

    if (files.length === 0) {
      els.diffContent.innerHTML = `<div class="empty-state"><p>El stash está vacío</p></div>`;
      return;
    }

    // Renderizar layout de visualizador de stash de 2 columnas
    els.diffContent.innerHTML = `
      <div class="stash-inspector-container" style="display:flex; flex-direction:column; height:100%; width:100%;">
        <div class="stash-inspector-topbar" style="display:flex; justify-content:space-between; align-items:center; padding: 10px 16px; border-bottom:1px solid var(--border); background:var(--bg-1); flex-shrink:0;">
          <div>
            <h3 style="margin:0; font-size:13px; font-weight:600; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; color:var(--accent);"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect></svg>
              Archivos guardados en Stash
            </h3>
            <span style="font-size:11px; color:var(--text-muted);">Stash activo en la rama <strong>${escapeHTML(state.repoData.stashedChanges.branch)}</strong></span>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="gx-btn secondary sm" id="stash-inspect-discard-btn">Descartar</button>
            <button class="gx-btn primary sm" id="stash-inspect-restore-btn">Restaurar cambios</button>
          </div>
        </div>
        <div class="stash-inspector-body" style="display:flex; flex:1; min-height:0;">
          <div class="stash-inspector-sidebar" style="width: 240px; border-right: 1px solid var(--border); background: var(--bg-1); display: flex; flex-direction: column; flex-shrink: 0; overflow-y:auto; padding: 6px 0;">
            <div class="stash-inspect-files-list"></div>
          </div>
          <div class="stash-inspector-diff" id="stash-inspect-diff-container" style="flex: 1; min-width: 0; background: var(--bg-0); overflow: auto;">
            <div class="diff-placeholder" style="height:100%; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:12px;">
              Selecciona un archivo para ver sus diferencias
            </div>
          </div>
        </div>
      </div>`;

    // Redirigir clics
    document.getElementById('stash-inspect-restore-btn')?.addEventListener('click', () => {
      els.stashRestoreBtn?.click();
    });
    document.getElementById('stash-inspect-discard-btn')?.addEventListener('click', () => {
      els.stashDiscardBtn?.click();
    });

    const listContainer = els.diffContent.querySelector('.stash-inspect-files-list');
    const diffContainer = document.getElementById('stash-inspect-diff-container');

    // Dibujar elementos de lista
    files.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'picker-item';
      item.style.padding = '8px 12px';
      item.style.borderBottom = '1px solid var(--border-subtle)';
      item.style.cursor = 'pointer';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.justifyContent = 'space-between';
      item.style.fontSize = '12px';

      const statusLetter = getStatusLetter(file.status);

      item.innerHTML = `
        <div style="display:flex; flex-direction:column; min-width:0; flex:1; padding-right:8px;">
          <span style="font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHTML(file.name)}">${escapeHTML(file.name)}</span>
          <span style="font-size:10px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHTML(file.path)}">${escapeHTML(file.path)}</span>
        </div>
        <span class="change-status-badge ${statusLetter}" style="font-size: 9px; font-weight:700; width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center; border-radius:3px;">${statusLetter}</span>
      `;

      item.addEventListener('click', async () => {
        // Estilo seleccionado
        listContainer.querySelectorAll('.picker-item').forEach(el => {
          el.style.background = '';
        });
        item.style.background = 'var(--bg-3)';

        // Cargar diff
        diffContainer.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;gap:10px;color:var(--text-muted);font-size:12px;">
            <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Cargando diferencias de ${escapeHTML(file.name)}...
          </div>`;

        try {
          const diffRes = await fetch(`${API_BASE}/commit-diff?path=${encodeURIComponent(state.activeRepoPath)}&commit=${encodeURIComponent(stashId)}&file=${encodeURIComponent(file.path)}`);
          if (!diffRes.ok) throw new Error(await diffRes.text());
          const diffData = await diffRes.json();

          // Renderizar diff
          const parsed = parseDiffLines(diffData.diff);
          renderDiffViewer({ diff: diffData.diff, lines: parsed }, diffContainer, false, file.path);
        } catch (e) {
          diffContainer.innerHTML = `<div class="empty-state"><p style="color:var(--red);">Error al cargar diff: ${escapeHTML(e.message)}</p></div>`;
        }
      });

      listContainer.appendChild(item);

      // Clic automático al primer archivo para mostrar diff al instante
      if (index === 0) {
        item.click();
      }
    });

  } catch (err) {
    els.diffContent.innerHTML = `<div class="empty-state"><p style="color:var(--red);">Error al cargar stash: ${escapeHTML(err.message)}</p></div>`;
  }
}

function updateChangesBadge() {
  const count = state.repoData.changes.length;
  if (count > 0) {
    els.changesBadge.textContent = count;
    els.changesBadge.style.display = 'inline-flex';
  } else {
    els.changesBadge.style.display = 'none';
  }
}

function updateCommitBtn() {
  const hasTitle = els.commitTitle.value.trim().length > 0;
  const isAmend = els.commitAmendCheckbox && els.commitAmendCheckbox.checked;
  const hasStagedFiles = state.stagedFiles.size > 0;
  
  if (els.commitBtn) {
    els.commitBtn.disabled = !(hasTitle && (hasStagedFiles || isAmend));
    
    // Update button text accordingly
    const btnSpan = els.commitBtn.querySelector('span');
    if (btnSpan) {
      if (isAmend) {
        btnSpan.innerHTML = `Enmendar último commit`;
      } else {
        btnSpan.innerHTML = `Commit to <strong id="commit-branch-name">${state.activeBranch}</strong>`;
      }
    }
  }
}

// ============================================================
// HISTORY VIEW
// ============================================================
function renderHistoryList() {
  els.historyList.innerHTML = '';

  if (state.repoData.commits.length === 0) {
    els.historyList.appendChild(createEmptyState(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>`,
      'Sin historial',
      'No hay commits en este repositorio'
    ));
    return;
  }

  state.repoData.commits.forEach(commit => {
    const isSelected = commit.id === state.selectedCommitId;
    const row = document.createElement('div');
    row.className = `commit-row${isSelected ? ' selected' : ''}`;
    row.dataset.commitId = commit.id;
    row.innerHTML = `
      <div class="commit-row-title" title="${escapeHTML(commit.title)}">${escapeHTML(commit.title)}</div>
      <div class="commit-row-meta">
        <span>${escapeHTML(commit.author)} · ${escapeHTML(commit.date)}</span>
        <span class="commit-row-hash">${commit.hash}</span>
      </div>
    `;
    row.addEventListener('click', () => {
      state.selectedCommitId = commit.id;
      renderHistoryList();
      selectCommit(commit);
    });
    els.historyList.appendChild(row);
  });
}

async function selectCommit(commit) {
  state.selectedCommitId = commit.id;
  state.selectedCommitFile = null;

  els.historyDiffFilename.textContent = 'Selecciona un archivo';
  els.historyDiffFilepath.textContent = `${commit.author} · ${commit.date} · ${commit.hash}`;
  if (els.historyDiffStats) els.historyDiffStats.textContent = '';
  
  els.historyDiffContent.innerHTML = `
    <div class="diff-placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <p>Selecciona un archivo de la lista de cambios para ver sus diferencias</p>
    </div>`;

  els.historyFilesCount.textContent = 'Cargando archivos...';
  els.historyFilesList.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;padding:24px;gap:8px;color:var(--text-muted);font-size:11px;">
      <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Cargando archivos...
    </div>`;

  try {
    const res = await fetch(`${API_BASE}/git/commit-files?path=${encodeURIComponent(state.activeRepoPath)}&commit=${encodeURIComponent(commit.hash)}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const files = data.files || [];

    const filesCount = files.length;
    els.historyFilesCount.textContent = filesCount === 1 ? '1 archivo modificado' : `${filesCount} archivos modificados`;

    renderCommitFilesList(commit, files);
  } catch (err) {
    showToast('error', 'Error al cargar archivos del commit', err.message);
    els.historyFilesCount.textContent = 'Error';
    els.historyFilesList.innerHTML = `<div class="picker-empty">${escapeHTML(err.message)}</div>`;
  }
}

function renderCommitFilesList(commit, files) {
  els.historyFilesList.innerHTML = '';
  if (files.length === 0) {
    els.historyFilesList.innerHTML = `<div class="picker-empty">Sin archivos modificados</div>`;
    return;
  }

  files.forEach(file => {
    const isSelected = state.selectedCommitFile === file.path;
    const statusLetter = getStatusLetter(file.status);
    const dotClass = file.status === 'added' ? 'added' : file.status === 'deleted' ? 'deleted' : 'modified';

    const item = document.createElement('div');
    item.className = `change-item${isSelected ? ' selected' : ''}`;
    item.dataset.filePath = file.path;
    item.innerHTML = `
      <span class="change-status-dot ${dotClass}"></span>
      <span class="change-name" title="${escapeHTML(file.path)}">${escapeHTML(file.path)}</span>
      <span class="change-status-badge ${statusLetter}">${statusLetter}</span>
    `;

    item.addEventListener('click', () => {
      els.historyFilesList.querySelectorAll('.change-item').forEach(el => {
        el.classList.toggle('selected', el.dataset.filePath === file.path);
      });
      state.selectedCommitFile = file.path;
      
      loadFileDiffInCommit(commit, file);
    });

    els.historyFilesList.appendChild(item);
  });
}

async function loadFileDiffInCommit(commit, file) {
  els.historyDiffFilename.textContent = file.name;
  els.historyDiffFilepath.textContent = file.path;
  if (els.historyDiffStats) els.historyDiffStats.textContent = '';

  els.historyDiffContent.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;gap:10px;color:var(--text-muted);font-size:12px;">
      <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Cargando diferencias de ${escapeHTML(file.name)}...
    </div>`;

  try {
    const res = await fetch(`${API_BASE}/commit-diff?path=${encodeURIComponent(state.activeRepoPath)}&commit=${encodeURIComponent(commit.hash)}&file=${encodeURIComponent(file.path)}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    
    renderDiffViewer(data.diff || '', els.historyDiffContent);
  } catch (err) {
    showToast('error', 'Error al cargar diferencias', err.message);
    els.historyDiffContent.innerHTML = `<div class="picker-empty">${escapeHTML(err.message)}</div>`;
  }
}

// ============================================================
// PROFILES VIEW
// ============================================================
function renderProfilesList() {
  els.profilesList.innerHTML = '';

  const profileKeys = Object.keys(state.config.profiles);
  if (profileKeys.length === 0) {
    els.profilesList.appendChild(createEmptyState(
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      'Sin perfiles',
      'Crea un perfil para empezar'
    ));
    return;
  }

  profileKeys.forEach(key => {
    const profile = state.config.profiles[key];
    const isActive = key === state.activeProfile;
    const isSelected = key === state.selectedProfileId;

    const row = document.createElement('div');
    row.className = `profile-row${isSelected ? ' selected' : ''}`;
    row.dataset.profileKey = key;
    row.innerHTML = `
      <div class="profile-avatar${isActive ? ' active-avatar' : ''}">${key.charAt(0).toUpperCase()}</div>
      <div class="profile-row-info">
        <span class="profile-row-name">${escapeHTML(key)}</span>
        <span class="profile-row-email">${escapeHTML(profile.email)}</span>
      </div>
      ${isActive
        ? `<span class="profile-active-badge">Activo</span>`
        : `<button class="profile-activate-btn" data-profile="${key}">Activar</button>`
      }
    `;

    // Click row → select & inspect
    row.addEventListener('click', (e) => {
      if (e.target.matches('.profile-activate-btn')) return;
      state.selectedProfileId = key;
      renderProfilesList();
      renderProfileInspector(key);
    });

    // Activate button
    const activateBtn = row.querySelector('.profile-activate-btn');
    if (activateBtn) {
      activateBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await selectActiveProfile(key);
      });
    }

    els.profilesList.appendChild(row);
  });
}

function renderProfileInspector(profileKey) {
  const profile = state.config.profiles[profileKey];
  if (!profile) return;

  const isActive = profileKey === state.activeProfile;

  els.profileInspectorName.textContent = profileKey;
  els.profileInspectorEmail.textContent = profile.email;

  if (!isActive) {
    els.profileInspectorActions.innerHTML = `
      <button class="gx-btn primary" id="inspector-activate-btn" style="font-size:11px;padding:4px 12px;">
        Activar en este Repo
      </button>`;
    document.getElementById('inspector-activate-btn')?.addEventListener('click', () => {
      selectActiveProfile(profileKey);
    });
  } else {
    els.profileInspectorActions.innerHTML = `<span style="font-size:11px;color:var(--green);font-weight:600;">✓ Perfil activo</span>`;
  }

  const defaultSshKey = profile.sshKey || `~/.ssh/id_ed25519_${profileKey}`;

  els.profileInspectorContent.innerHTML = `
    <div class="profile-detail">
      <div class="profile-hero">
        <div class="profile-hero-avatar">${profileKey.charAt(0).toUpperCase()}</div>
        <div class="profile-hero-info">
          <h3>${escapeHTML(profileKey)}</h3>
          <p>${escapeHTML(profile.name)} &lt;${escapeHTML(profile.email)}&gt;</p>
        </div>
      </div>

      <div class="activation-banner ${isActive ? 'ok' : 'warn'}">
        <svg class="banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${isActive
            ? `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`
            : `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`
          }
        </svg>
        <div class="banner-body">
          <strong>${isActive ? 'Perfil activo en este repositorio' : 'Perfil inactivo'}</strong>
          <p>${isActive
            ? 'Los commits se registrarán con esta identidad.'
            : `Tus commits usarán el perfil activo: <strong>${state.activeProfile}</strong>.`
          }</p>
        </div>
      </div>

      <div class="profile-section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Identidad Git
        </div>
        <div class="config-grid">
          <div class="config-card">
            <span class="lbl">user.name</span>
            <span class="val">${escapeHTML(profile.name)}</span>
          </div>
          <div class="config-card">
            <span class="lbl">user.email</span>
            <span class="val">${escapeHTML(profile.email)}</span>
          </div>
        </div>
      </div>

      <div class="profile-section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Clave SSH
        </div>
        <div class="config-card" style="grid-column: span 2;">
          <span class="lbl">IdentityFile</span>
          <span class="val" style="font-family:var(--font-mono);font-size:11px;color:var(--text-link);">${escapeHTML(defaultSshKey)}</span>
        </div>
      </div>

      ${profile.signingKey ? `
      <div class="profile-section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Firma GPG
        </div>
        <div class="config-grid">
          <div class="config-card">
            <span class="lbl">commit.gpgsign</span>
            <span class="val">true</span>
          </div>
          <div class="config-card">
            <span class="lbl">user.signingkey</span>
            <span class="val">${escapeHTML(profile.signingKey)}</span>
          </div>
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

// ============================================================
// DIFF RENDERER
// ============================================================
// Helper to parse diff text client-side if a raw string is passed (e.g. from commit history)
function parseDiffLines(diffText) {
  if (!diffText || !diffText.trim()) return [];
  const lines = diffText.split('\n');
  const parsed = [];
  let lnL = 0, lnR = 0;
  let inHunk = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    let type = 'context';
    let numL = '';
    let numR = '';
    let marker = ' ';
    let code = rawLine;

    if (rawLine.startsWith('@@')) {
      type = 'info';
      marker = '@@';
      inHunk = true;
      const m = rawLine.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (m) {
        lnL = parseInt(m[1]);
        lnR = parseInt(m[2]);
      }
      parsed.push({ type, content: rawLine, numL: '', numR: '' });
    } else if (!inHunk) {
      type = 'info';
      parsed.push({ type, content: rawLine, numL: '', numR: '' });
    } else if (rawLine.startsWith('-')) {
      type = 'deletion';
      marker = '-';
      code = rawLine.slice(1);
      numL = lnL++;
      parsed.push({ type, content: rawLine, numL, numR: '', code, marker });
    } else if (rawLine.startsWith('+')) {
      type = 'addition';
      marker = '+';
      code = rawLine.slice(1);
      numR = lnR++;
      parsed.push({ type, content: rawLine, numL: '', numR, code, marker });
    } else if (rawLine.startsWith('\\')) {
      type = 'info';
      parsed.push({ type, content: rawLine, numL: '', numR: '' });
    } else {
      type = 'context';
      numL = lnL++;
      numR = lnR++;
      parsed.push({ type, content: rawLine, numL, numR });
    }
  }
  return parsed;
}

function renderDiffViewer(diffTextOrObj, container, showCheckboxes = false, filePath = '') {
  let rawDiff = '';
  let lines = [];
  
  if (diffTextOrObj && typeof diffTextOrObj === 'object') {
    rawDiff = diffTextOrObj.diff;
    lines = diffTextOrObj.lines || [];
  } else {
    rawDiff = diffTextOrObj || '';
    lines = parseDiffLines(rawDiff);
  }

  if (!rawDiff || !rawDiff.trim()) {
    container.innerHTML = `
      <div class="diff-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
        <p>Sin diferencias detectadas o archivo nuevo sin contenido.</p>
      </div>`;
    return;
  }

  const viewer = document.createElement('div');
  viewer.className = 'diff-viewer';

  lines.forEach(line => {
    const lineEl = document.createElement('div');
    lineEl.className = `diff-line ${line.type}`;
    
    // Checkbox column
    let checkboxHtml = '';
    if (showCheckboxes) {
      if (line.type === 'addition' || line.type === 'deletion') {
        checkboxHtml = `
          <label class="diff-line-stage-container">
            <input type="checkbox" class="diff-line-checkbox" data-index="${line.changeIndex}" ${line.staged ? 'checked' : ''} title="Preparar esta línea" />
          </label>
        `;
      } else {
        checkboxHtml = `<div class="diff-line-stage-container"></div>`;
      }
    }

    const numL = line.numL !== undefined ? line.numL : '';
    const numR = line.numR !== undefined ? line.numR : '';
    const marker = line.marker || ' ';
    const code = line.code !== undefined ? line.code : line.content;

    lineEl.innerHTML = `
      ${checkboxHtml}
      <div class="diff-line-nums">
        <span class="diff-line-num">${numL}</span>
        <span class="diff-line-num">${numR}</span>
      </div>
      <span class="diff-line-marker">${escapeHTML(marker)}</span>
      <span class="diff-line-code">${escapeHTML(code)}</span>
    `;

    // Click on line numbers gutter also triggers staging toggle
    const numsEl = lineEl.querySelector('.diff-line-nums');
    const checkbox = lineEl.querySelector('.diff-line-checkbox');
    if (numsEl && checkbox) {
      numsEl.style.cursor = 'pointer';
      numsEl.addEventListener('click', (e) => {
        e.preventDefault();
        checkbox.click();
      });
    }

    viewer.appendChild(lineEl);
  });

  if (showCheckboxes) {
    // Add change listeners to all checkboxes inside this diff viewer
    const checkboxes = viewer.querySelectorAll('.diff-line-checkbox');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', async (e) => {
        // Collect indices of all currently checked checkboxes
        const selectedLineIndices = [];
        viewer.querySelectorAll('.diff-line-checkbox:checked').forEach(checkedCb => {
          selectedLineIndices.push(parseInt(checkedCb.dataset.index));
        });

        // Disable all checkboxes in the viewer to prevent race conditions during fetch
        checkboxes.forEach(c => c.disabled = true);

        try {
          const res = await fetch(`${API_BASE}/git/stage-lines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              repoPath: state.activeRepoPath,
              filePath,
              selectedLineIndices
            })
          });

          if (!res.ok) throw new Error(await res.text());

          // Reload repository status
          await selectRepository(state.activeRepoPath);
        } catch (err) {
          showToast('error', 'Error al preparar líneas', err.message);
          // Re-enable and revert target checkbox
          checkboxes.forEach(c => c.disabled = false);
          e.target.checked = !e.target.checked;
        }
      });
    });
  }

  container.innerHTML = '';
  container.appendChild(viewer);
}

// ============================================================
// EMPTY STATE HELPER
// ============================================================
function createEmptyState(iconHtml, title, subtitle) {
  const el = document.createElement('div');
  el.className = 'empty-state';
  el.innerHTML = `${iconHtml}<p>${title}</p><span>${subtitle}</span>`;
  return el;
}

// ============================================================
// REPO PICKER
// ============================================================
function buildRepoList(filter = '') {
  els.repoList.innerHTML = '';
  const q = filter.toLowerCase().trim();
  const fps = state.config.folderProfiles || [];
  const filtered = fps.filter(fp => {
    const name = getBasename(fp.path).toLowerCase();
    return !q || name.includes(q) || fp.path.toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    els.repoList.innerHTML = `<div class="picker-empty">No se encontraron repositorios</div>`;
    return;
  }

  filtered.forEach(fp => {
    const name = getBasename(fp.path);
    const item = document.createElement('div');
    item.className = `picker-item${fp.path === state.activeRepoPath ? ' active' : ''}`;
    item.dataset.path = fp.path;
    item.innerHTML = `
      <span class="picker-item-name">${escapeHTML(name)}</span>
      <span class="picker-item-sub">${escapeHTML(fp.path)}</span>
    `;
    item.addEventListener('click', () => {
      closeAllMenus();
      selectRepository(fp.path);
    });
    els.repoList.appendChild(item);
  });
}

function buildProfileMenu() {
  els.profileMenu.innerHTML = '';
  const keys = Object.keys(state.config.profiles);

  if (keys.length === 0) {
    els.profileMenu.innerHTML = `<div class="picker-empty">No hay perfiles configurados</div>`;
    return;
  }

  keys.forEach(key => {
    const profile = state.config.profiles[key];
    const isActive = key === state.activeProfile;
    const initial = key.charAt(0).toUpperCase();

    const item = document.createElement('div');
    item.className = `picker-item profile-picker-item${isActive ? ' active' : ''}`;
    item.dataset.profile = key;
    item.innerHTML = `
      <div class="profile-picker-avatar${isActive ? ' active-avatar' : ''}">${initial}</div>
      <div class="profile-picker-info">
        <span class="profile-picker-name">${escapeHTML(key)}</span>
        <span class="profile-picker-email">${escapeHTML(profile.email)}</span>
      </div>
      ${isActive
        ? `<svg class="profile-picker-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>`
        : ''
      }
    `;
    item.addEventListener('click', () => {
      closeAllMenus();
      selectActiveProfile(key);
    });
    els.profileMenu.appendChild(item);
  });
}

// ============================================================
// MENU HELPERS
// ============================================================
function closeAllMenus() {
  els.repoMenu?.classList.remove('open');
  els.profileMenu?.classList.remove('open');
  els.branchMenu?.classList.remove('open');
  if (els.repoSearchInput) els.repoSearchInput.value = '';
  if (els.branchSearchInput) els.branchSearchInput.value = '';
  buildRepoList('');
  buildBranchList('');
}

async function fetchBranches() {
  if (!state.activeRepoPath) return [];
  try {
    const res = await fetch(`${API_BASE}/git/branches?path=${encodeURIComponent(state.activeRepoPath)}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    state.branches = data.branches || [];
    return state.branches;
  } catch (e) {
    showToast('error', 'Error al obtener branches', e.message);
    return [];
  }
}

async function handleBranchCheckout(branchName, create = false) {
  if (!state.activeRepoPath) return;

  // Check if there are uncommitted changes
  if (state.repoData && state.repoData.changes && state.repoData.changes.length > 0) {
    // Show switch branch modal
    els.switchTargetBranchName.textContent = branchName;
    els.switchTargetBranchName2.textContent = branchName;
    els.switchCurrentBranchName1.textContent = state.activeBranch;
    els.switchBranchModal.dataset.targetBranch = branchName;
    els.switchBranchModal.dataset.isCreate = create ? 'true' : 'false';
    
    // Reset options default state
    els.optionLeaveChanges.checked = true;
    els.optionLeaveLabel.classList.add('active');
    els.optionBringLabel.classList.remove('active');

    els.switchBranchModal.showModal();
    return;
  }

  // No changes, switch directly!
  try {
    const res = await fetch(`${API_BASE}/git/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repoPath: state.activeRepoPath,
        branch: branchName,
        create: create,
        stashChanges: false
      })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Error al cambiar de branch');
    }
    const result = await res.json();
    let successMsg = create ? `Branch creado: ${branchName}` : `Cambiado a branch: ${branchName}`;
    if (result.poppedStash) {
      successMsg += ` (cambios restaurados de stash)`;
    }
    showToast('success', successMsg);
    
    // Refresh repo status & data
    await selectRepository(state.activeRepoPath);
  } catch (e) {
    showToast('error', 'Error al cambiar branch', e.message);
  }
}

function buildBranchList(filter = '') {
  if (!els.branchList) return;
  els.branchList.innerHTML = '';
  const q = filter.toLowerCase().trim();

  // Find if there's an exact match
  const exactMatch = state.branches.find(b => b.name.toLowerCase() === q);

  // Filter branches
  const filtered = state.branches.filter(b => {
    return !q || b.name.toLowerCase().includes(q);
  });

  // If there is filter text and no exact match, add option to create branch
  if (q && !exactMatch) {
    const createItem = document.createElement('div');
    createItem.className = 'picker-item';
    createItem.style.borderLeft = '2px solid var(--green)';
    createItem.style.background = 'var(--bg-3)';
    createItem.innerHTML = `
      <span class="picker-item-name" style="color:var(--green)">+ Crear branch "${escapeHTML(filter)}"</span>
      <span class="picker-item-sub">Partiendo de: ${escapeHTML(state.activeBranch)}</span>
    `;
    createItem.addEventListener('click', async () => {
      closeAllMenus();
      await handleBranchCheckout(filter, true);
    });
    els.branchList.appendChild(createItem);
  }

  if (filtered.length === 0 && !q) {
    els.branchList.innerHTML = `<div class="picker-empty">No se encontraron branches</div>`;
    return;
  }

  filtered.forEach(b => {
    const item = document.createElement('div');
    item.className = `picker-item${b.current ? ' active' : ''}`;
    item.dataset.branch = b.name;
    
    const indicator = b.current 
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px; height:14px; color:var(--green); flex-shrink:0;"><path d="M20 6 9 17l-5-5"/></svg>` 
      : ``;

    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        <span class="picker-item-name">${escapeHTML(b.name)}</span>
        ${indicator}
      </div>
    `;

    item.addEventListener('click', async () => {
      closeAllMenus();
      if (b.current) return;
      await handleBranchCheckout(b.name, false);
    });
    els.branchList.appendChild(item);
  });
}

// State additions
state.selectedMergeSource = '';

async function openMergeModal() {
  if (!state.activeRepoPath) return;
  
  els.mergeActiveBranchTitle.textContent = state.activeBranch;
  els.mergeActiveBranchBody.textContent = state.activeBranch;
  els.mergeBranchSearch.value = '';
  state.selectedMergeSource = '';
  
  // Hide preview card and disable submit initially
  els.mergePreviewCard.style.display = 'none';
  els.mergeSubmit.disabled = true;
  els.mergeSubmit.textContent = 'Fusionar ramas';

  // Load branches
  await fetchBranches();
  buildMergeBranchList();

  // If working directory is dirty, warn right away
  const isDirty = state.repoData && state.repoData.changes && state.repoData.changes.length > 0;
  if (isDirty) {
    els.mergePreviewCard.className = 'merge-preview-card conflict';
    els.mergePreviewCard.style.display = 'flex';
    els.mergePreviewCard.querySelector('.merge-preview-icon').innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; color:var(--red);"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    `;
    els.mergePreviewCard.querySelector('.merge-preview-title').textContent = 'Fusión Bloqueada';
    els.mergePreviewCard.querySelector('.merge-preview-desc').textContent = 'Tienes cambios sin confirmar. Confirma, descarta o guarda en stash tus cambios antes de realizar un merge.';
  }

  els.mergeModal.showModal();
}

function buildMergeBranchList(filter = '') {
  if (!els.mergeBranchList) return;
  els.mergeBranchList.innerHTML = '';
  const q = filter.toLowerCase().trim();

  // Exclude current branch
  const otherBranches = state.branches.filter(b => b.name !== state.activeBranch);
  const filtered = otherBranches.filter(b => !q || b.name.toLowerCase().includes(q));

  if (filtered.length === 0) {
    els.mergeBranchList.innerHTML = `<div class="picker-empty">No se encontraron otras ramas</div>`;
    return;
  }

  filtered.forEach(b => {
    const item = document.createElement('div');
    item.className = `picker-item${b.name === state.selectedMergeSource ? ' active' : ''}`;
    item.dataset.branch = b.name;
    item.innerHTML = `
      <span class="picker-item-name">${escapeHTML(b.name)}</span>
    `;

    item.addEventListener('click', () => {
      // Mark as selected
      els.mergeBranchList.querySelectorAll('.picker-item').forEach(el => {
        el.classList.toggle('active', el.dataset.branch === b.name);
      });
      state.selectedMergeSource = b.name;
      loadMergePreview();
    });

    els.mergeBranchList.appendChild(item);
  });
}

async function loadMergePreview() {
  const source = state.selectedMergeSource;
  if (!source) {
    els.mergePreviewCard.style.display = 'none';
    els.mergeSubmit.disabled = true;
    return;
  }

  // Check dirty copy first
  const isDirty = state.repoData && state.repoData.changes && state.repoData.changes.length > 0;

  // Show loading state
  els.mergePreviewCard.className = 'merge-preview-card info';
  els.mergePreviewCard.style.display = 'flex';
  els.mergePreviewCard.querySelector('.merge-preview-icon').innerHTML = `<span class="spinner">⚙</span>`;
  els.mergePreviewCard.querySelector('.merge-preview-title').textContent = 'Analizando fusión...';
  els.mergePreviewCard.querySelector('.merge-preview-desc').textContent = `Comprobando compatibilidad entre ${state.activeBranch} y ${source}...`;
  els.mergeSubmit.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/git/merge-preview?path=${encodeURIComponent(state.activeRepoPath)}&current=${encodeURIComponent(state.activeBranch)}&source=${encodeURIComponent(source)}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    if (isDirty) {
      els.mergePreviewCard.className = 'merge-preview-card conflict';
      els.mergePreviewCard.querySelector('.merge-preview-icon').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; color:var(--red);"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      `;
      els.mergePreviewCard.querySelector('.merge-preview-title').textContent = 'Fusión Bloqueada';
      els.mergePreviewCard.querySelector('.merge-preview-desc').textContent = 'Tienes cambios sin confirmar. Confirma, descarta o guarda en stash tus cambios antes de realizar un merge.';
      els.mergeSubmit.disabled = true;
      els.mergeSubmit.textContent = `Fusionar ${source} en ${state.activeBranch}`;
      return;
    }

    if (data.commits.length === 0) {
      els.mergePreviewCard.className = 'merge-preview-card info';
      els.mergePreviewCard.querySelector('.merge-preview-icon').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; color:var(--accent);"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      `;
      els.mergePreviewCard.querySelector('.merge-preview-title').textContent = 'Rama al día';
      els.mergePreviewCard.querySelector('.merge-preview-desc').textContent = `La rama ${state.activeBranch} ya contiene todos los cambios de ${source}.`;
      els.mergeSubmit.disabled = true;
      els.mergeSubmit.textContent = 'Fusionar ramas';
      return;
    }

    const commitText = data.commits.length === 1 ? '1 commit' : `${data.commits.length} commits`;

    if (data.conflicts) {
      els.mergePreviewCard.className = 'merge-preview-card conflict';
      els.mergePreviewCard.querySelector('.merge-preview-icon').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; color:var(--red);"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      `;
      els.mergePreviewCard.querySelector('.merge-preview-title').textContent = 'Fusión con Conflictos';
      els.mergePreviewCard.querySelector('.merge-preview-desc').textContent = `Se fusionarán ${commitText}, pero habrá conflictos que deberás resolver manualmente en los archivos correspondientes.`;
      els.mergeSubmit.disabled = false;
      els.mergeSubmit.textContent = `Fusionar ${source} en ${state.activeBranch}`;
    } else {
      els.mergePreviewCard.className = 'merge-preview-card success';
      els.mergePreviewCard.querySelector('.merge-preview-icon').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px; height:14px; color:var(--green);"><path d="M20 6 9 17l-5-5"/></svg>
      `;
      els.mergePreviewCard.querySelector('.merge-preview-title').textContent = 'Fusión Limpia';
      els.mergePreviewCard.querySelector('.merge-preview-desc').textContent = `Se fusionarán ${commitText} de ${source} en ${state.activeBranch}. No se detectan conflictos potenciales.`;
      els.mergeSubmit.disabled = false;
      els.mergeSubmit.textContent = `Fusionar ${source} en ${state.activeBranch}`;
    }
  } catch (e) {
    els.mergePreviewCard.className = 'merge-preview-card conflict';
    els.mergePreviewCard.querySelector('.merge-preview-icon').innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; color:var(--red);"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    `;
    els.mergePreviewCard.querySelector('.merge-preview-title').textContent = 'Error de Análisis';
    els.mergePreviewCard.querySelector('.merge-preview-desc').textContent = e.message;
    els.mergeSubmit.disabled = true;
  }
}

// ============================================================
// MODALS
// ============================================================
function populateProfileSelects() {
  const keys = Object.keys(state.config.profiles);
  [els.linkRepoProfile, els.cloneRepoProfile].forEach(sel => {
    if (!sel) return;
    sel.innerHTML = '';
    keys.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k;
      if (k === state.config.defaultProfile) opt.selected = true;
      sel.appendChild(opt);
    });
  });
}

async function openFolderBrowser() {
  try {
    const res = await fetch(`${API_BASE}/repos/browse`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.path;
  } catch {
    showToast('error', 'No se pudo abrir el selector de carpetas', 'Ingresa la ruta manualmente.');
    return null;
  }
}

async function handleLinkRepoSubmit(e) {
  e.preventDefault();
  const repoPath = $('link-path').value.trim();
  const profileName = els.linkRepoProfile.value;
  try {
    const res = await fetch(`${API_BASE}/repos/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath, profileName })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Error desconocido');
    const data = await res.json();
    els.linkRepoModal.close();
    els.linkRepoForm.reset();
    closeAllMenus();
    await fetchConfig();
    buildRepoList();
    buildProfileMenu();
    await selectRepository(data.path);
    showToast('success', 'Repositorio vinculado', data.path);
  } catch (err) {
    showToast('error', 'Error al vincular', err.message);
  }
}

async function handleCloneRepoSubmit(e) {
  e.preventDefault();
  const url = $('clone-url').value.trim();
  const repoPath = $('clone-path').value.trim();
  const profileName = els.cloneRepoProfile.value;
  els.cloneSubmitBtn.disabled = true;
  els.cloneSubmitBtn.innerHTML = `<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Clonando...`;
  try {
    const res = await fetch(`${API_BASE}/repos/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, repoPath, profileName })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Error desconocido');
    const data = await res.json();
    els.cloneRepoModal.close();
    els.cloneRepoForm.reset();
    closeAllMenus();
    await fetchConfig();
    buildRepoList();
    buildProfileMenu();
    await selectRepository(data.path);
    showToast('success', 'Repositorio clonado', data.path);
  } catch (err) {
    showToast('error', 'Error al clonar', err.message);
  } finally {
    els.cloneSubmitBtn.disabled = false;
    els.cloneSubmitBtn.innerHTML = `Clonar e Importar`;
  }
}

// ============================================================
// DOCTOR
// ============================================================
async function openDoctor() {
  els.doctorCheckItems.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;padding:30px;gap:10px;color:var(--text-muted);font-size:12px;">
      <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px;height:20px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Escaneando sistema...
    </div>`;
  els.doctorModal.showModal();
  try {
    const res = await fetch(`${API_BASE}/doctor`);
    const checks = await res.json();
    renderDoctorChecks(checks);
  } catch {
    els.doctorCheckItems.innerHTML = `<div style="color:var(--red);padding:20px;text-align:center;font-size:12px;">Error al conectar con la API de diagnóstico.</div>`;
  }
}

function renderDoctorChecks(checks) {
  els.doctorCheckItems.innerHTML = '';
  checks.forEach(c => {
    const iconMap = {
      ok:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>`,
      warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    };
    const el = document.createElement('div');
    el.className = `check-item ${c.status}`;
    el.innerHTML = `
      <div class="check-item-icon">${iconMap[c.status] || iconMap.warning}</div>
      <div class="check-item-meta">
        <span class="check-name">${escapeHTML(c.name)}</span>
        <span class="check-msg">${escapeHTML(c.msg)}</span>
      </div>`;
    els.doctorCheckItems.appendChild(el);
  });
}

async function runDoctorFix() {
  if (state.doctorFixing) return;
  state.doctorFixing = true;
  const orig = els.doctorFixBtn.innerHTML;
  els.doctorFixBtn.innerHTML = `<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Reparando...`;
  try {
    await fetch(`${API_BASE}/doctor/fix`, { method: 'POST' });
    const res = await fetch(`${API_BASE}/doctor`);
    renderDoctorChecks(await res.json());
    showToast('success', 'Reparación completada', 'Se intentaron agregar las claves SSH al agente.');
    setTimeout(() => els.doctorModal.close(), 1200);
  } catch (e) {
    showToast('error', 'Error al reparar', e.message);
  } finally {
    state.doctorFixing = false;
    els.doctorFixBtn.innerHTML = orig;
  }
}

// ============================================================
// DRAG & DROP
// ============================================================
function initDragAndDrop() {
  let dragCount = 0;
  window.addEventListener('dragenter', (e) => { e.preventDefault(); if (++dragCount === 1) els.dragOverlay.classList.add('active'); });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('dragleave', () => { if (--dragCount === 0) els.dragOverlay.classList.remove('active'); });
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCount = 0;
    els.dragOverlay.classList.remove('active');
    const f = e.dataTransfer?.files?.[0];
    if (f?.path) {
      populateProfileSelects();
      $('link-path').value = f.path;
      els.linkRepoModal.showModal();
    } else {
      showToast('info', 'Arrastra y suelta solo funciona en la app de escritorio', 'Usa el botón "Buscar..." para seleccionar carpetas.');
    }
  });
}

// ============================================================
// COMMIT HANDLER (stub — backend endpoint needed)
// ============================================================
async function handleCommit() {
  const title = els.commitTitle.value.trim();
  const desc = els.commitDesc.value.trim();
  const isAmend = els.commitAmendCheckbox && els.commitAmendCheckbox.checked;

  if (!title || (!isAmend && state.stagedFiles.size === 0)) return;

  const stagedPaths = state.repoData.changes
    .filter(c => state.stagedFiles.has(c.id))
    .map(c => c.path);

  els.commitBtn.disabled = true;
  const origHtml = els.commitBtn.innerHTML;
  els.commitBtn.innerHTML = `<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Committing...`;

  try {
    const res = await fetch(`${API_BASE}/git/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repoPath: state.activeRepoPath,
        title,
        description: desc,
        files: stagedPaths,
        amend: isAmend
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error desconocido');
    }

    // Reset form
    els.commitTitle.value = '';
    els.commitDesc.value = '';
    if (els.commitAmendCheckbox) els.commitAmendCheckbox.checked = false;

    showToast('success', isAmend ? 'Commit enmendado' : `Commit: ${title}`, 'Los cambios se registraron correctamente.');

    // Show undo banner
    if (els.undoBanner) els.undoBanner.style.display = 'block';

    // Refresh repo data
    await fetchRepoData(state.activeRepoPath);
    state.selectedChangeFile = null;
    renderChanges();
    showDiffPlaceholder();
    updateChangesBadge();
    updateCommitBtn();

    // Also refresh remote status to show push/pull counts
    fetchRemoteStatus(state.activeRepoPath, true).then(status => {
      state.remoteStatus = status;
      updateRemoteButton(status);
    });
  } catch (err) {
    showToast('error', 'Error al hacer commit', err.message);
  } finally {
    els.commitBtn.innerHTML = origHtml;
    updateCommitBtn();
  }
}

let isRefreshing = false;
async function autoRefresh() {
  if (isRefreshing || !state.activeRepoPath) return;

  // Only refresh when window/tab is visible and active view is changes or history
  if (document.visibilityState === 'hidden') return;
  if (state.activeView !== 'changes' && state.activeView !== 'history') return;

  isRefreshing = true;
  try {
    // 1. Fetch updated repository changes, commits, and stashedChanges
    await fetchRepoData(state.activeRepoPath);

    // 2. Render updates based on active view
    if (state.activeView === 'changes') {
      renderChanges();
      updateChangesBadge();
      updateCommitBtn();

      // If a file was selected, check if it's still modified
      if (state.selectedChangeFile) {
        const stillModifiedFile = state.repoData?.changes?.find(c => c.id === state.selectedChangeFile.id);
        if (stillModifiedFile) {
          state.selectedChangeFile = stillModifiedFile;
          
          // Quietly update diff (fetch first, then render without a full layout spinner flash)
          const diffData = await fetchFileDiff(stillModifiedFile.path, stillModifiedFile.status);
          if (state.currentDiffText !== diffData.diff) {
            state.currentDiffText = diffData.diff;
            renderDiffViewer(diffData, els.diffContent, true, stillModifiedFile.path);
          }
        } else {
          state.selectedChangeFile = null;
          showDiffPlaceholder();
        }
      }
    } else if (state.activeView === 'history') {
      renderHistoryList();
    }

    // 3. Refresh remote status in background (only when changes view is active to update Pull/Push buttons)
    if (state.activeView === 'changes') {
      const status = await fetchRemoteStatus(state.activeRepoPath, true); // skipFetch = true to skip network
      state.remoteStatus = status;
      updateRemoteButton(status);
    }
  } catch (err) {
    console.error('Auto-refresh error:', err);
  } finally {
    isRefreshing = false;
  }
}

// ============================================================
// EVENT LISTENERS INITIALIZATION
// ============================================================
function initEvents() {
  // --- Topbar tabs ---
  els.tabChanges.addEventListener('click', () => switchView('changes'));
  els.tabHistory.addEventListener('click', () => switchView('history'));
  els.tabProfiles.addEventListener('click', () => switchView('profiles'));

  // --- Repo picker ---
  els.repoPicker.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = els.repoMenu.classList.contains('open');
    closeAllMenus();
    if (!isOpen) {
      els.repoMenu.classList.add('open');
      els.repoSearchInput?.focus();
    }
  });
  els.repoMenu.addEventListener('click', (e) => e.stopPropagation());
  els.repoSearchInput?.addEventListener('input', (e) => buildRepoList(e.target.value));

  // --- Profile picker ---
  els.profilePicker.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = els.profileMenu.classList.contains('open');
    closeAllMenus();
    if (!isOpen) els.profileMenu.classList.add('open');
  });
  els.profileMenu.addEventListener('click', (e) => e.stopPropagation());

  // Close menus on outside click
  document.addEventListener('click', closeAllMenus);

  // --- Doctor ---
  els.doctorBtn.addEventListener('click', openDoctor);
  els.closeDoctorBtn.addEventListener('click', () => els.doctorModal.close());
  els.doctorCancelBtn.addEventListener('click', () => els.doctorModal.close());
  els.doctorFixBtn.addEventListener('click', runDoctorFix);

  // --- Sync ---
  els.syncBtn.addEventListener('click', async () => {
    await fetchConfig();
    buildRepoList();
    buildProfileMenu();
    showToast('success', 'Configuraciones sincronizadas');
  });

  // --- Remote action (Fetch / Pull / Push) ---
  els.remoteActionBtn?.addEventListener('click', handleRemoteAction);

  // --- Changes view ---
  els.refreshChangesBtn?.addEventListener('click', async () => {
    if (!state.activeRepoPath) return;
    await fetchRepoData(state.activeRepoPath);
    renderChanges();
    updateChangesBadge();
    updateCommitBtn();
    showDiffPlaceholder();
    state.selectedChangeFile = null;
    // Also refresh remote status
    fetchRemoteStatus(state.activeRepoPath).then(status => {
      state.remoteStatus = status;
      updateRemoteButton(status);
    });
  });

  // Commit title/desc → enable/disable commit button
  els.commitTitle?.addEventListener('input', updateCommitBtn);
  els.commitDesc?.addEventListener('input', updateCommitBtn);
  els.commitBtn?.addEventListener('click', handleCommit);


  // --- Profile tab ---
  els.addProfileBtn?.addEventListener('click', () => els.newProfileModal.showModal());

  // --- New Profile modal ---
  els.closeNewProfileBtn?.addEventListener('click', () => els.newProfileModal.close());
  els.newProfileCancel?.addEventListener('click', () => els.newProfileModal.close());
  els.newProfileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('prof-id').value.trim();
    const name = $('prof-name').value.trim();
    const email = $('prof-email').value.trim();
    const setupSsh = $('prof-ssh').checked;
    const signingKey = $('prof-gpg').value.trim();
    try {
      const res = await fetch(`${API_BASE}/profile/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, email, setupSsh, signingKey })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      els.newProfileModal.close();
      els.newProfileForm.reset();
      await fetchConfig();
      buildProfileMenu();
      if (state.activeView === 'profiles') renderProfilesList();
      showToast('success', `Perfil "${id}" creado`, setupSsh ? 'Clave SSH generada.' : '');
    } catch (err) {
      showToast('error', 'Error al crear perfil', err.message);
    }
  });

  // --- Link repo modal ---
  els.linkRepoBtn?.addEventListener('click', () => { populateProfileSelects(); els.linkRepoModal.showModal(); });
  els.closeLinkRepoBtn?.addEventListener('click', () => els.linkRepoModal.close());
  els.linkRepoCancel?.addEventListener('click', () => els.linkRepoModal.close());
  els.linkRepoForm?.addEventListener('submit', handleLinkRepoSubmit);
  els.browseLinkPath?.addEventListener('click', async () => {
    const p = await openFolderBrowser();
    if (p) $('link-path').value = p;
  });

  // --- Clone repo modal ---
  els.cloneRepoBtn?.addEventListener('click', () => { populateProfileSelects(); els.cloneRepoModal.showModal(); });
  els.closeCloneRepoBtn?.addEventListener('click', () => els.cloneRepoModal.close());
  els.cloneRepoCancel?.addEventListener('click', () => els.cloneRepoModal.close());
  els.cloneRepoForm?.addEventListener('submit', handleCloneRepoSubmit);
  els.browseClonePath?.addEventListener('click', async () => {
    const p = await openFolderBrowser();
    if (p) $('clone-path').value = p;
  });

  // --- Branch picker ---
  els.branchPicker?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const isOpen = els.branchMenu.classList.contains('open');
    closeAllMenus();
    if (!isOpen && state.activeRepoPath) {
      els.branchMenu.classList.add('open');
      els.branchSearchInput?.focus();
      // Load branches
      await fetchBranches();
      buildBranchList(els.branchSearchInput?.value || '');
    }
  });
  els.branchMenu?.addEventListener('click', (e) => e.stopPropagation());
  els.branchSearchInput?.addEventListener('input', (e) => {
    buildBranchList(e.target.value);
  });

  // --- Switch branch modal action cards ---
  els.optionLeaveChanges?.addEventListener('change', () => {
    els.optionLeaveLabel?.classList.add('active');
    els.optionBringLabel?.classList.remove('active');
  });
  els.optionBringChanges?.addEventListener('change', () => {
    els.optionBringLabel?.classList.add('active');
    els.optionLeaveLabel?.classList.remove('active');
  });

  // Switch branch modal cancel / close
  els.closeSwitchBranchBtn?.addEventListener('click', () => els.switchBranchModal.close());
  els.switchBranchCancel?.addEventListener('click', () => els.switchBranchModal.close());

  // Switch branch modal submit
  els.switchBranchSubmit?.addEventListener('click', async () => {
    const action = document.querySelector('input[name="switch-branch-action"]:checked')?.value; // 'leave' | 'bring'
    const targetBranch = els.switchBranchModal.dataset.targetBranch;
    const isCreate = els.switchBranchModal.dataset.isCreate === 'true';

    els.switchBranchModal.close();
    if (!targetBranch) return;

    const stashChanges = (action === 'leave');
    
    // Perform checkout
    const origHtml = els.switchBranchSubmit.innerHTML;
    try {
      els.switchBranchSubmit.disabled = true;
      els.switchBranchSubmit.innerHTML = `<span class="spinner">⚙</span> Cambiando...`;
      
      const res = await fetch(`${API_BASE}/git/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoPath: state.activeRepoPath,
          branch: targetBranch,
          create: isCreate,
          stashChanges: stashChanges,
          currentBranch: state.activeBranch
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al cambiar de branch');
      }

      const result = await res.json();
      
      let successMsg = isCreate ? `Branch creado: ${targetBranch}` : `Cambiado a branch: ${targetBranch}`;
      if (stashChanges) {
        successMsg += ` (cambios guardados en stash)`;
      }
      if (result.poppedStash) {
        successMsg += ` (cambios restaurados de stash)`;
      }
      showToast('success', successMsg);

      // Refresh repo status & data
      await selectRepository(state.activeRepoPath);
    } catch (e) {
      showToast('error', 'Error al cambiar branch', e.message);
    } finally {
      els.switchBranchSubmit.disabled = false;
      els.switchBranchSubmit.innerHTML = origHtml;
    }
  });

  // --- Merge Branches ---
  els.mergeTriggerBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllMenus();
    openMergeModal();
  });
  els.mergeBranchSearch?.addEventListener('input', (e) => {
    buildMergeBranchList(e.target.value);
  });
  els.closeMergeBtn?.addEventListener('click', () => els.mergeModal.close());
  els.mergeCancel?.addEventListener('click', () => els.mergeModal.close());

  els.mergeSubmit?.addEventListener('click', async () => {
    const source = state.selectedMergeSource;
    if (!source || !state.activeRepoPath) return;

    els.mergeModal.close();
    const origHtml = els.mergeSubmit.innerHTML;
    try {
      els.mergeSubmit.disabled = true;
      els.mergeSubmit.innerHTML = `<span class="spinner">⚙</span> Fusionando...`;

      const res = await fetch(`${API_BASE}/git/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoPath: state.activeRepoPath,
          sourceBranch: source
        })
      });

      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();

      if (result.success) {
        showToast('success', `Fusionado correctamente`, `Rama ${source} fusionada en ${state.activeBranch}.`);
      } else if (result.conflicts) {
        showToast('info', 'Fusión con conflictos', 'Resuelve los conflictos en los archivos listados en la pestaña "Cambios" antes de continuar.');
      } else {
        throw new Error(result.message || 'Error en la fusión');
      }

      // Refresh repository status
      await selectRepository(state.activeRepoPath);
    } catch (err) {
      showToast('error', 'Error al fusionar', err.message);
    } finally {
      els.mergeSubmit.disabled = false;
      els.mergeSubmit.innerHTML = origHtml;
    }
  });

  // --- Amend last commit checkbox ---
  els.commitAmendCheckbox?.addEventListener('change', async (e) => {
    if (!state.activeRepoPath) {
      e.target.checked = false;
      return;
    }
    if (e.target.checked) {
      state.prevCommitTitle = els.commitTitle.value;
      state.prevCommitDesc = els.commitDesc.value;
      
      try {
        const res = await fetch(`${API_BASE}/git/last-commit?path=${encodeURIComponent(state.activeRepoPath)}`);
        if (!res.ok) throw new Error('No se pudo obtener el último commit');
        const data = await res.json();
        
        els.commitTitle.value = data.title || '';
        els.commitDesc.value = data.description || '';
      } catch (err) {
        showToast('error', 'Error al obtener último commit', err.message);
        e.target.checked = false;
      }
    } else {
      els.commitTitle.value = state.prevCommitTitle || '';
      els.commitDesc.value = state.prevCommitDesc || '';
    }
    updateCommitBtn();
  });

  // --- Undo last commit banner button ---
  els.undoCommitBtn?.addEventListener('click', async () => {
    if (!state.activeRepoPath) return;
    
    const origHtml = els.undoCommitBtn.innerHTML;
    try {
      els.undoCommitBtn.disabled = true;
      els.undoCommitBtn.innerHTML = 'Deshaciendo...';
      
      const res = await fetch(`${API_BASE}/git/undo-commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath: state.activeRepoPath })
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      if (els.undoBanner) els.undoBanner.style.display = 'none';
      showToast('success', 'Commit deshecho', 'El commit se revirtió. Los archivos modificados permanecen preparados.');
      
      // Refresh changes & repo state
      await selectRepository(state.activeRepoPath);
    } catch (err) {
      showToast('error', 'Error al deshacer commit', err.message);
    } finally {
      els.undoCommitBtn.disabled = false;
      els.undoCommitBtn.innerHTML = origHtml;
    }
  });

  // --- Stash Banner Buttons ---
  els.stashViewBtn?.addEventListener('click', () => {
    if (state.repoData && state.repoData.stashedChanges) {
      inspectStash(state.repoData.stashedChanges.id);
    }
  });

  els.stashRestoreBtn?.addEventListener('click', async () => {
    if (!state.activeRepoPath || !state.repoData.stashedChanges) return;

    const origHtml = els.stashRestoreBtn.innerHTML;
    try {
      els.stashRestoreBtn.disabled = true;
      els.stashRestoreBtn.innerHTML = 'Restaurando...';
      if (els.stashDiscardBtn) els.stashDiscardBtn.disabled = true;

      const res = await fetch(`${API_BASE}/git/stash-pop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoPath: state.activeRepoPath,
          stashId: state.repoData.stashedChanges.id
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      showToast('success', 'Cambios restaurados', 'Los cambios en stash se aplicaron correctamente.');
      await selectRepository(state.activeRepoPath);
    } catch (err) {
      showToast('error', 'Error al restaurar stash', err.message);
    } finally {
      if (els.stashRestoreBtn) {
        els.stashRestoreBtn.disabled = false;
        els.stashRestoreBtn.innerHTML = origHtml;
      }
      if (els.stashDiscardBtn) els.stashDiscardBtn.disabled = false;
    }
  });

  els.stashDiscardBtn?.addEventListener('click', async () => {
    if (!state.activeRepoPath || !state.repoData.stashedChanges) return;

    if (!confirm('¿Estás seguro de que deseas descartar permanentemente estos cambios guardados en stash?')) {
      return;
    }

    const origHtml = els.stashDiscardBtn.innerHTML;
    try {
      els.stashDiscardBtn.disabled = true;
      els.stashDiscardBtn.innerHTML = 'Descartando...';
      if (els.stashRestoreBtn) els.stashRestoreBtn.disabled = true;

      const res = await fetch(`${API_BASE}/git/stash-drop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoPath: state.activeRepoPath,
          stashId: state.repoData.stashedChanges.id
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      showToast('success', 'Stash descartado', 'Los cambios guardados en stash han sido eliminados.');
      await selectRepository(state.activeRepoPath);
    } catch (err) {
      showToast('error', 'Error al descartar stash', err.message);
    } finally {
      if (els.stashDiscardBtn) {
        els.stashDiscardBtn.disabled = false;
        els.stashDiscardBtn.innerHTML = origHtml;
      }
      if (els.stashRestoreBtn) els.stashRestoreBtn.disabled = false;
    }
  });

  // Preferences & Sidebar Toggle Events
  if (els.preferencesBtn && els.preferencesModal) {
    els.preferencesBtn.addEventListener('click', () => {
      // Reload UI inputs from state before showing
      if (els.prefTheme) els.prefTheme.value = state.preferences.theme;
      if (els.prefOS) els.prefOS.value = state.preferences.osMode;
      if (els.prefAutoCollapse) els.prefAutoCollapse.checked = state.preferences.autoCollapse;
      els.preferencesModal.showModal();
    });
  }

  if (els.closePreferencesBtn && els.preferencesModal) {
    els.closePreferencesBtn.addEventListener('click', () => {
      els.preferencesModal.close();
    });
  }

  if (els.preferencesSaveBtn && els.preferencesModal) {
    els.preferencesSaveBtn.addEventListener('click', () => {
      savePreferences();
      els.preferencesModal.close();
    });
  }

  if (els.preferencesModal) {
    els.preferencesModal.addEventListener('click', (e) => {
      if (e.target === els.preferencesModal) {
        els.preferencesModal.close();
      }
    });
  }

  if (els.sidebarToggleBtn) {
    els.sidebarToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-collapsed');
      wasCollapsedByResize = false; // User choice overrides resize behavior
    });
  }

  // --- Auto-refresh listeners ---
  window.addEventListener('focus', autoRefresh);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      autoRefresh();
    }
  });

  // Periodic refresh when active and tab is visible (every 10 seconds)
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      autoRefresh();
    }
  }, 10000);
}

// ============================================================
// INIT
// ============================================================
async function init() {
  initPreferences();
  initEvents();
  initDragAndDrop();

  // Resolve dynamic backend port if running inside Tauri
  if (window.__TAURI__) {
    try {
      const port = await window.__TAURI__.core.invoke('get_backend_port');
      API_BASE = `http://localhost:${port}/api`;
      console.log('Dynamic API_BASE resolved:', API_BASE);
    } catch (err) {
      console.error('Failed to get dynamic backend port from Tauri:', err);
    }
  }

  const config = await fetchConfig();
  if (!config) return;

  buildRepoList();
  buildProfileMenu();

  // Restore last selected repo
  const saved = localStorage.getItem('gitx-active-repo-path');
  const exists = config.folderProfiles.some(fp => fp.path === saved);

  if (saved && exists) {
    await selectRepository(saved);
  } else if (config.folderProfiles.length > 0) {
    await selectRepository(config.folderProfiles[0].path);
  } else {
    els.currentRepoName.textContent = 'Sin repositorio';
    els.currentProfileName.textContent = 'Sin perfil';
    if (els.topbarProfileAvatar) {
      els.topbarProfileAvatar.textContent = '—';
    }
  }

  switchView('changes');
}

init();
