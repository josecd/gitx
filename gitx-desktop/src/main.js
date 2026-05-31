import './style.css';

const API_BASE = 'http://localhost:3001/api';

// ----------------------------------
// State Management
// ----------------------------------
const state = {
  activeTab: 'profiles', // 'profiles' | 'history'
  activeRepoPath: '',
  activeRepoName: '',
  activeProfile: '',
  
  selectedProfileId: '', // Sidebar selection in profiles tab
  selectedCommitId: '',  // Sidebar selection in history tab
  selectedFileId: '',    // Center panel selection
  
  // Real data fetched from backend
  config: {
    profiles: {},
    folderProfiles: [],
    defaultProfile: ''
  },
  
  repoData: {
    commits: [],
    changes: []
  },
  
  searchQuery: '',
  doctorFixing: false
};

// ----------------------------------
// Element Selections
// ----------------------------------
const els = {
  currentRepoName: document.getElementById('current-repo-name'),
  currentProfileName: document.getElementById('current-profile-name'),
  repoDropdownBtn: document.getElementById('repo-dropdown-btn'),
  repoMenu: document.getElementById('repo-menu'),
  repoList: document.getElementById('repo-list'),
  repoSearchInput: document.getElementById('repo-search-input'),
  profileDropdownBtn: document.getElementById('profile-dropdown-btn'),
  profileMenu: document.getElementById('profile-menu'),
  
  tabProfiles: document.getElementById('tab-profiles'),
  tabHistory: document.getElementById('tab-history'),
  sidebarList: document.getElementById('sidebar-items-list'),
  sidebarFooter: document.getElementById('sidebar-footer-action'),
  searchInput: document.getElementById('search-input'),
  addProfileBtn: document.getElementById('add-profile-btn'),
  
  centerPanelTitle: document.getElementById('center-panel-title'),
  centerPanelSubtitle: document.getElementById('center-panel-subtitle'),
  centerList: document.getElementById('center-items-list'),
  
  inspectorFileName: document.getElementById('inspector-file-name'),
  inspectorFilePath: document.getElementById('inspector-file-path'),
  inspectorActions: document.getElementById('inspector-actions-container'),
  inspectorContent: document.getElementById('inspector-main-content'),
  
  doctorBtn: document.getElementById('doctor-btn'),
  doctorModal: document.getElementById('doctor-modal'),
  closeDoctorBtn: document.getElementById('close-doctor-btn'),
  doctorCancelBtn: document.getElementById('doctor-cancel-btn'),
  doctorFixBtn: document.getElementById('doctor-fix-btn'),
  doctorCheckItems: document.getElementById('doctor-check-items'),
  
  newProfileModal: document.getElementById('new-profile-modal'),
  closeNewProfileBtn: document.getElementById('close-new-profile-btn'),
  newProfileForm: document.getElementById('new-profile-form'),
  newProfileCancel: document.getElementById('new-profile-cancel'),
  
  linkRepoBtn: document.getElementById('link-repo-btn'),
  cloneRepoBtn: document.getElementById('clone-repo-btn'),
  linkRepoModal: document.getElementById('link-repo-modal'),
  linkRepoForm: document.getElementById('link-repo-form'),
  linkRepoCancel: document.getElementById('link-repo-cancel'),
  closeLinkRepoBtn: document.getElementById('close-link-repo-btn'),
  linkRepoProfileSelect: document.getElementById('link-profile'),
  browseLinkPathBtn: document.getElementById('browse-link-path-btn'),
  
  cloneRepoModal: document.getElementById('clone-repo-modal'),
  cloneRepoForm: document.getElementById('clone-repo-form'),
  cloneRepoCancel: document.getElementById('clone-repo-cancel'),
  closeCloneRepoBtn: document.getElementById('close-clone-repo-btn'),
  cloneRepoProfileSelect: document.getElementById('clone-profile'),
  cloneSubmitBtn: document.getElementById('clone-submit-btn'),
  browseClonePathBtn: document.getElementById('browse-clone-path-btn'),
  
  syncBtn: document.getElementById('sync-btn')
};

// Helper: Get base name of a path
function getBasename(pathStr) {
  return pathStr.split(/[/\\]/).pop();
}

// ----------------------------------
// API Call Wrappers
// ----------------------------------
async function fetchConfig() {
  try {
    const res = await fetch(`${API_BASE}/config`);
    state.config = await res.json();
    return state.config;
  } catch (e) {
    console.error('Error fetching config from server. Is server running?', e);
    alert('No se pudo conectar al servidor local de GitX. Asegúrate de correr npm run dev');
  }
}

async function fetchRepoData(repoPath) {
  try {
    const res = await fetch(`${API_BASE}/repo-status?path=${encodeURIComponent(repoPath)}`);
    if (!res.ok) throw new Error(await res.text());
    state.repoData = await res.json();
    return state.repoData;
  } catch (e) {
    console.error('Error fetching repo data:', e);
    state.repoData = { commits: [], changes: [] };
  }
}

// ----------------------------------
// Event Listeners Initialization
// ----------------------------------
function initEvents() {
  // Dropdown Toggle: Repo
  els.repoDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    els.profileMenu.classList.remove('show');
    const showing = els.repoMenu.classList.toggle('show');
    if (showing) {
      if (els.repoSearchInput) {
        els.repoSearchInput.focus();
      }
    } else {
      resetRepoSearch();
    }
  });

  // Prevent dropdown closing when clicking inside it (e.g. search input), except when clicking a menu-item
  els.repoMenu.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-item')) {
      e.stopPropagation();
    }
  });

  // Dropdown Toggle: Profile
  els.profileDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    els.repoMenu.classList.remove('show');
    resetRepoSearch();
    els.profileMenu.classList.toggle('show');
  });

  // Close menus on click outside
  document.addEventListener('click', () => {
    els.repoMenu.classList.remove('show');
    els.profileMenu.classList.remove('show');
    resetRepoSearch();
  });

  // Dropdown search input
  els.repoSearchInput.addEventListener('input', (e) => {
    renderRepoList(e.target.value);
  });

  // Tabs
  els.tabProfiles.addEventListener('click', () => switchTab('profiles'));
  els.tabHistory.addEventListener('click', () => switchTab('history'));

  // Search filter
  els.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderSidebar();
  });

  // Modals
  els.doctorBtn.addEventListener('click', openDoctor);
  els.closeDoctorBtn.addEventListener('click', () => els.doctorModal.close());
  els.doctorCancelBtn.addEventListener('click', () => els.doctorModal.close());
  els.doctorFixBtn.addEventListener('click', runDoctorFix);

  els.addProfileBtn.addEventListener('click', () => els.newProfileModal.showModal());
  els.closeNewProfileBtn.addEventListener('click', () => els.newProfileModal.close());
  els.newProfileCancel.addEventListener('click', () => els.newProfileModal.close());
  
  els.newProfileForm.addEventListener('submit', handleNewProfileSubmit);

  // Link & Clone Repos modals trigger
  els.linkRepoBtn.addEventListener('click', () => {
    populateProfileSelects();
    els.linkRepoModal.showModal();
  });
  els.closeLinkRepoBtn.addEventListener('click', () => els.linkRepoModal.close());
  els.linkRepoCancel.addEventListener('click', () => els.linkRepoModal.close());
  els.linkRepoForm.addEventListener('submit', handleLinkRepoSubmit);
  els.browseLinkPathBtn.addEventListener('click', async () => {
    const selected = await openFolderBrowser();
    if (selected) {
      document.getElementById('link-path').value = selected;
    }
  });

  els.cloneRepoBtn.addEventListener('click', () => {
    populateProfileSelects();
    els.cloneRepoModal.showModal();
  });
  els.closeCloneRepoBtn.addEventListener('click', () => els.cloneRepoModal.close());
  els.cloneRepoCancel.addEventListener('click', () => els.cloneRepoModal.close());
  els.cloneRepoForm.addEventListener('submit', handleCloneRepoSubmit);
  els.browseClonePathBtn.addEventListener('click', async () => {
    const selected = await openFolderBrowser();
    if (selected) {
      document.getElementById('clone-path').value = selected;
    }
  });
  
  els.syncBtn.addEventListener('click', async () => {
    await fetchConfig();
    alert('Configuraciones sincronizadas con la máquina');
    renderSidebar();
    renderCenterPanel();
  });
}

// ----------------------------------
// Core Logic Functions
// ----------------------------------

async function selectRepository(repoPath) {
  state.activeRepoPath = repoPath;
  state.activeRepoName = getBasename(repoPath);
  els.currentRepoName.textContent = state.activeRepoName;
  
  // Persistir el repositorio seleccionado
  localStorage.setItem('gitx-active-repo-path', repoPath);
  
  // Buscar el perfil asociado a esta carpeta
  // Si no está directamente, resolverlo usando herencia de rutas
  let resolvedProfile = state.config.defaultProfile || 'personal';
  let maxLen = 0;
  state.config.folderProfiles.forEach(fp => {
    if (repoPath.startsWith(fp.path) && fp.path.length > maxLen) {
      resolvedProfile = fp.profile;
      maxLen = fp.path.length;
    }
  });

  state.activeProfile = resolvedProfile;
  els.currentProfileName.textContent = resolvedProfile;

  // Actualizar menús visuales
  els.repoMenu.querySelectorAll('.menu-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-path') === repoPath);
  });
  
  updateProfileDropdownSelection(resolvedProfile);

  // Cargar datos reales de este repo
  await fetchRepoData(repoPath);

  if (state.activeTab === 'profiles') {
    state.selectedProfileId = resolvedProfile;
  } else {
    state.selectedCommitId = state.repoData.commits[0]?.id || '';
    state.selectedFileId = '';
  }

  renderSidebar();
  renderCenterPanel();
}

async function selectActiveProfile(profileKey) {
  state.activeProfile = profileKey;
  els.currentProfileName.textContent = profileKey;
  updateProfileDropdownSelection(profileKey);

  // Guardar cambio en el sistema
  try {
    const res = await fetch(`${API_BASE}/profile/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileName: profileKey,
        repoPath: state.activeRepoPath,
        global: false
      })
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (e) {
    console.error('Error switching profile on machine:', e);
  }

  // Refrescar
  await fetchConfig();
  if (state.activeTab === 'profiles') {
    state.selectedProfileId = profileKey;
  }
  
  renderSidebar();
  renderCenterPanel();
}

function updateProfileDropdownSelection(profileKey) {
  els.profileMenu.querySelectorAll('.menu-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-profile') === profileKey);
  });
}

function switchTab(tab) {
  state.activeTab = tab;
  els.tabProfiles.classList.toggle('active', tab === 'profiles');
  els.tabHistory.classList.toggle('active', tab === 'history');
  els.sidebarFooter.style.display = tab === 'profiles' ? 'block' : 'none';
  
  if (tab === 'history') {
    state.selectedCommitId = state.repoData.commits[0]?.id || '';
    state.selectedFileId = '';
  } else {
    state.selectedProfileId = state.activeProfile;
    state.selectedFileId = 'gitconfig';
  }
  
  renderSidebar();
  renderCenterPanel();
}

// ----------------------------------
// Rendering Functions
// ----------------------------------

function renderSidebar() {
  els.sidebarList.innerHTML = '';
  const query = state.searchQuery.toLowerCase().trim();

  if (state.activeTab === 'profiles') {
    Object.keys(state.config.profiles).forEach(key => {
      const profile = state.config.profiles[key];
      if (query && !key.toLowerCase().includes(query) && !profile.name.toLowerCase().includes(query) && !profile.email.toLowerCase().includes(query)) {
        return;
      }
      
      const isSelected = key === state.selectedProfileId;
      const isActive = key === state.activeProfile;
      const firstLetter = key.charAt(0).toUpperCase();

      const itemEl = document.createElement('div');
      itemEl.className = `list-item ${isSelected ? 'selected' : ''}`;
      itemEl.innerHTML = `
        <div class="item-avatar">${firstLetter}</div>
        <div class="item-details">
          <div class="item-title-row">
            <span class="name">${key}</span>
            ${isActive 
              ? '<span class="badge active-badge">✓ Activo</span>' 
              : `<button class="badge-btn activate-shortcut-btn" data-profile="${key}">Activar</button>`
            }
          </div>
          <span class="item-subtitle">${profile.email}</span>
        </div>
      `;

      itemEl.addEventListener('click', () => {
        state.selectedProfileId = key;
        renderSidebar();
        renderCenterPanel();
      });

      const activateBtn = itemEl.querySelector('.activate-shortcut-btn');
      if (activateBtn) {
        activateBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await selectActiveProfile(key);
        });
      }

      els.sidebarList.appendChild(itemEl);
    });
  } else {
    // Render Real Commits
    state.repoData.commits.forEach(commit => {
      if (query && !commit.title.toLowerCase().includes(query) && !commit.author.toLowerCase().includes(query)) {
        return;
      }

      const isSelected = commit.id === state.selectedCommitId;
      const itemEl = document.createElement('div');
      itemEl.className = `list-item commit-item ${isSelected ? 'selected' : ''}`;
      itemEl.innerHTML = `
        <div class="commit-title">${commit.title}</div>
        <div class="commit-meta">
          <div class="author-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>${commit.author}</span>
          </div>
          <span class="hash">${commit.hash}</span>
        </div>
      `;

      itemEl.addEventListener('click', () => {
        state.selectedCommitId = commit.id;
        state.selectedFileId = ''; // reset file selection on new commit
        renderSidebar();
        renderCenterPanel();
      });

      els.sidebarList.appendChild(itemEl);
    });
  }
}

function renderCenterPanel() {
  els.centerList.innerHTML = '';

  if (state.activeTab === 'profiles') {
    const profile = state.config.profiles[state.selectedProfileId];
    if (!profile) return;
    
    els.centerPanelTitle.textContent = `Configuración: ${state.selectedProfileId}`;
    els.centerPanelSubtitle.textContent = '3 elementos asociados';

    const configs = [
      { id: 'gitconfig', name: 'user.gitconfig', type: 'config', status: 'ok', info: 'Configuración local' },
      { id: 'sshconfig', name: 'ssh_config', type: 'ssh', status: 'ok', info: 'Alias SSH en ~/.ssh/config' },
      { id: 'gpg', name: 'GPG Key', type: 'gpg', status: profile.signingKey ? 'ok' : 'added', info: profile.signingKey ? 'Firma activa' : 'Opcional' }
    ];

    if (!state.selectedFileId || !['gitconfig', 'sshconfig', 'gpg'].includes(state.selectedFileId)) {
      state.selectedFileId = 'gitconfig';
    }

    configs.forEach(cfg => {
      const isSelected = cfg.id === state.selectedFileId;
      const itemEl = document.createElement('div');
      itemEl.className = `file-item ${isSelected ? 'selected' : ''}`;
      
      let icon = '';
      if (cfg.type === 'config') icon = `<svg class="config-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`;
      if (cfg.type === 'ssh') icon = `<svg class="ssh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
      if (cfg.type === 'gpg') icon = `<svg class="gpg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

      itemEl.innerHTML = `
        <div class="file-info">
          ${icon}
          <span class="name">${cfg.name}</span>
        </div>
        <span class="file-status-badge ${cfg.status}">${cfg.info}</span>
      `;

      itemEl.addEventListener('click', () => {
        state.selectedFileId = cfg.id;
        renderCenterPanel();
      });

      els.centerList.appendChild(itemEl);
    });

    renderInspector();
  } else {
    // Render files changed in current commit / status
    els.centerPanelTitle.textContent = 'Archivos Modificados';
    els.centerPanelSubtitle.textContent = `${state.repoData.changes.length} archivos modificados`;

    if (state.repoData.changes.length === 0) {
      els.centerList.innerHTML = `<div style="padding: 20px; font-size: 0.8rem; color: var(--text-dark); text-align: center;">Sin cambios locales en el repositorio</div>`;
      renderInspector();
      return;
    }

    if (!state.selectedFileId || !state.repoData.changes.find(c => c.id === state.selectedFileId)) {
      state.selectedFileId = state.repoData.changes[0]?.id || '';
    }

    state.repoData.changes.forEach(file => {
      const isSelected = file.id === state.selectedFileId;
      const itemEl = document.createElement('div');
      itemEl.className = `file-item ${isSelected ? 'selected' : ''}`;
      
      itemEl.innerHTML = `
        <div class="file-info">
          <svg class="config-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span class="name">${file.name}</span>
        </div>
        <span class="file-status-badge modified">${file.additions} / -${file.deletions}</span>
      `;

      itemEl.addEventListener('click', () => {
        state.selectedFileId = file.id;
        renderCenterPanel();
      });

      els.centerList.appendChild(itemEl);
    });

    renderInspector();
  }
}

async function renderInspector() {
  els.inspectorContent.innerHTML = '';
  
  if (state.activeTab === 'profiles') {
    const profile = state.config.profiles[state.selectedProfileId];
    if (!profile) return;

    const isProfileActive = state.selectedProfileId === state.activeProfile;
    const bannerHtml = isProfileActive
      ? `
        <div class="activation-banner ok">
          <div class="banner-content">
            <svg class="banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <div class="banner-text">
              <strong>Perfil Activo</strong>
              <p>Este repositorio está configurado con esta identidad para firmar y registrar commits.</p>
            </div>
          </div>
        </div>
      `
      : `
        <div class="activation-banner warning">
          <div class="banner-content">
            <svg class="banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div class="banner-text">
              <strong>Perfil Inactivo en este repositorio</strong>
              <p>Tus commits actuales usarán la identidad del perfil activo: <strong>${state.activeProfile}</strong>.</p>
            </div>
          </div>
          <button class="primary-btn" id="activate-profile-btn" style="white-space: nowrap;">Activar Perfil</button>
        </div>
      `;

    const profileHeaderHtml = `
      <div class="details-hero">
        <div class="details-avatar">${state.selectedProfileId.charAt(0).toUpperCase()}</div>
        <div class="details-meta">
          <h3>Perfil: ${state.selectedProfileId}</h3>
          <p style="margin-top: 2px;">${profile.email}</p>
        </div>
      </div>
      ${bannerHtml}
    `;

    if (state.selectedFileId === 'gitconfig') {
      els.inspectorFileName.textContent = '.git/config';
      els.inspectorFilePath.textContent = `${state.activeRepoPath}/.git/config`;
      els.inspectorActions.innerHTML = '<span class="file-status-badge ok">Local Config</span>';
      
      els.inspectorContent.innerHTML = `
        <div class="profile-details-view">
          ${profileHeaderHtml}

          <div class="details-section">
            <h4>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Identidad Git Local
            </h4>
            <div class="config-grid">
              <div class="config-box">
                <span class="lbl">user.name</span>
                <span class="val">${profile.name}</span>
              </div>
              <div class="config-box">
                <span class="lbl">user.email</span>
                <span class="val">${profile.email}</span>
              </div>
            </div>
          </div>

          <div class="details-section">
            <h4>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Firma de Commits
            </h4>
            <div class="config-grid">
              <div class="config-box">
                <span class="lbl">commit.gpgsign</span>
                <span class="val">${profile.signingKey ? 'true' : 'false'}</span>
              </div>
              <div class="config-box">
                <span class="lbl">user.signingkey</span>
                <span class="val">${profile.signingKey || 'No configurada'}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (state.selectedFileId === 'sshconfig') {
      els.inspectorFileName.textContent = 'ssh_config';
      els.inspectorFilePath.textContent = '~/.ssh/config';
      els.inspectorActions.innerHTML = '<span class="file-status-badge ok">SSH Alias Active</span>';
      
      const hostAlias = `github.com-${state.selectedProfileId}`;
      const defaultSshKey = profile.sshKey || `${homedir()}/.ssh/id_ed25519_${state.selectedProfileId}`;
      const pubKeyPlaceholder = `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI${btoa(state.selectedProfileId).substring(0, 40)} ${profile.email}`;
      
      els.inspectorContent.innerHTML = `
        <div class="profile-details-view">
          ${profileHeaderHtml}

          <div class="details-section">
            <h4>Configuración del Host Virtual</h4>
            <div class="config-box" style="margin-bottom: 12px;">
              <span class="lbl">Host Remoto Virtual</span>
              <span class="val" style="color: var(--accent-green)">git@github.com-${state.selectedProfileId}:usuario/repo.git</span>
            </div>
            <div class="config-box">
              <span class="lbl">IdentityFile asociado</span>
              <span class="val" style="font-family: var(--font-mono)">${defaultSshKey}</span>
            </div>
          </div>

          <div class="details-section">
            <h4>SSH Clave Pública (Simulada)</h4>
            <div class="key-box">${pubKeyPlaceholder}</div>
          </div>
        </div>
      `;
    } else {
      els.inspectorFileName.textContent = 'Claves GPG';
      els.inspectorFilePath.textContent = 'Criptografía local';
      els.inspectorActions.innerHTML = `<span class="file-status-badge ${profile.signingKey ? 'ok' : 'added'}">${profile.signingKey ? 'Firmado habilitado' : 'Sin clave de firma'}</span>`;
      
      els.inspectorContent.innerHTML = `
        <div class="profile-details-view">
          ${profileHeaderHtml}

          <div class="details-section">
            <h4>Clave de Firma GPG</h4>
            ${profile.signingKey 
              ? `<div class="config-box">
                  <span class="lbl">ID de Clave Secreta GPG</span>
                  <span class="val" style="color: var(--accent-yellow)">${profile.signingKey}</span>
                 </div>`
              : `<p style="font-size: 0.85rem; color: var(--text-muted);">No has configurado una firma GPG para este perfil. Tus commits se realizarán normalmente pero no se marcarán como "Verified" en GitHub/GitLab.</p>`
            }
          </div>
        </div>
      `;
    }

    // Registrar el listener del botón de activación si existe
    const actBtn = document.getElementById('activate-profile-btn');
    if (actBtn) {
      actBtn.addEventListener('click', () => {
        selectActiveProfile(state.selectedProfileId);
      });
    }
  } else {
    // Render Real Diff
    const selectedFile = state.repoData.changes.find(c => c.id === state.selectedFileId);
    if (!selectedFile) {
      // Si no hay archivos cambiados, mostrar el commit completo
      const commit = state.repoData.commits.find(c => c.id === state.selectedCommitId);
      if (commit && commit.id !== 'empty') {
        els.inspectorFileName.textContent = commit.title;
        els.inspectorFilePath.textContent = `Hash: ${commit.fullHash || commit.hash}`;
        els.inspectorActions.innerHTML = '';
        
        try {
          const res = await fetch(`${API_BASE}/commit-diff?path=${encodeURIComponent(state.activeRepoPath)}&commit=${commit.fullHash || commit.hash}`);
          const data = await res.json();
          renderRawOutput(data.diff || 'No se pudo leer la información del commit.');
        } catch (e) {
          renderRawOutput('Cargando diff de commit...');
        }
      }
      return;
    }

    els.inspectorFileName.textContent = selectedFile.name;
    els.inspectorFilePath.textContent = selectedFile.path;
    els.inspectorActions.innerHTML = `
      <span class="diff-summary text-green">+${selectedFile.additions}</span>
      <span class="diff-summary text-red">-${selectedFile.deletions}</span>
    `;

    // Fetch real diff from server
    try {
      const res = await fetch(`${API_BASE}/repo-diff?path=${encodeURIComponent(state.activeRepoPath)}&file=${encodeURIComponent(selectedFile.path)}`);
      const data = await res.json();
      renderDiff(data.diff);
    } catch (e) {
      console.error(e);
      renderRawOutput('Error al cargar la vista de diferencias en tiempo real.');
    }
  }
}

function renderRawOutput(text) {
  const container = document.createElement('pre');
  container.style.fontFamily = 'var(--font-mono)';
  container.style.fontSize = '0.78rem';
  container.style.padding = '20px';
  container.style.color = 'var(--text-main)';
  container.style.backgroundColor = 'var(--bg-primary)';
  container.style.overflow = 'auto';
  container.style.height = '100%';
  container.style.lineHeight = '1.5';
  container.textContent = text;
  els.inspectorContent.appendChild(container);
}

function renderDiff(diffText) {
  const container = document.createElement('div');
  container.className = 'diff-container';
  
  const lines = diffText.split('\n');
  let lnL = 0;
  let lnR = 0;

  lines.forEach(line => {
    let type = 'normal';
    let lineContent = line;
    let numL = '';
    let numR = '';

    if (line.startsWith('@@')) {
      type = 'info';
      const match = line.match(/@@\s+-(\d+),\d+\s+\+(\d+),\d+\s+@@/);
      if (match) {
        lnL = parseInt(match[1]);
        lnR = parseInt(match[2]);
      }
    } else if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff --git')) {
      type = 'info';
      numL = '...';
      numR = '...';
    } else if (line.startsWith('-')) {
      type = 'deletion';
      lineContent = line.substring(1);
      numL = lnL++;
      numR = ' ';
    } else if (line.startsWith('+')) {
      type = 'addition';
      lineContent = line.substring(1);
      numL = ' ';
      numR = lnR++;
    } else {
      numL = lnL++;
      numR = lnR++;
    }

    const lineEl = document.createElement('div');
    lineEl.className = `diff-line ${type}`;
    
    if (type === 'info' && line.startsWith('@@')) {
      lineEl.innerHTML = `
        <div class="line-nums"><span>...</span><span>...</span></div>
        <div class="line-content">${lineContent}</div>
      `;
    } else {
      lineEl.innerHTML = `
        <div class="line-nums"><span>${numL}</span><span>${numR}</span></div>
        <div class="line-content">${escapeHTML(lineContent)}</div>
      `;
    }
    
    container.appendChild(lineEl);
  });

  els.inspectorContent.appendChild(container);
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ----------------------------------
// Doctor Dialog Logic
// ----------------------------------
async function openDoctor() {
  els.doctorCheckItems.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted);">
    <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 24px; height: 24px; margin: 0 auto 10px;">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
    Escaneando sistema de archivos de Git y claves SSH...
  </div>`;
  els.doctorModal.showModal();

  try {
    const res = await fetch(`${API_BASE}/doctor`);
    const checks = await res.json();
    renderDoctorChecks(checks);
  } catch (e) {
    els.doctorCheckItems.innerHTML = `<div style="color: var(--accent-red); padding: 20px; text-align: center;">Error al conectar con la API de diagnóstico.</div>`;
  }
}

function renderDoctorChecks(checks) {
  els.doctorCheckItems.innerHTML = '';
  
  checks.forEach(check => {
    const itemEl = document.createElement('div');
    itemEl.className = `check-item ${check.status}`;
    
    let icon = '';
    if (check.status === 'ok') {
      icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>`;
    } else if (check.status === 'warning') {
      icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else {
      icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    }

    itemEl.innerHTML = `
      <div class="check-item-icon">${icon}</div>
      <div class="check-item-meta">
        <span class="check-name">${check.name}</span>
        <span class="check-msg">${check.msg}</span>
      </div>
    `;
    els.doctorCheckItems.appendChild(itemEl);
  });
}

async function runDoctorFix() {
  if (state.doctorFixing) return;
  state.doctorFixing = true;
  
  const originalHtml = els.doctorFixBtn.innerHTML;
  els.doctorFixBtn.innerHTML = `
    <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
    <span>Reparando claves SSH y agentes...</span>
  `;
  
  try {
    const res = await fetch(`${API_BASE}/doctor/fix`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    
    // Volver a escanear
    const checksRes = await fetch(`${API_BASE}/doctor`);
    const checks = await checksRes.json();
    renderDoctorChecks(checks);
    
    els.doctorFixBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6 9 17l-5-5"/>
      </svg>
      <span>¡Reparado!</span>
    `;

    setTimeout(() => {
      els.doctorModal.close();
      els.doctorFixBtn.innerHTML = originalHtml;
    }, 1500);

  } catch (e) {
    alert(`Error al reparar: ${e.message}`);
    els.doctorFixBtn.innerHTML = originalHtml;
  } finally {
    state.doctorFixing = false;
  }
}

// ----------------------------------
// New Profile Form Handler
// ----------------------------------
async function handleNewProfileSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('prof-id').value.trim();
  const name = document.getElementById('prof-name').value.trim();
  const email = document.getElementById('prof-email').value.trim();
  const setupSsh = document.getElementById('prof-ssh').checked;
  const signingKey = document.getElementById('prof-gpg').value.trim();

  try {
    const res = await fetch(`${API_BASE}/profile/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, email, setupSsh, signingKey })
    });

    if (!res.ok) throw new Error(await res.text());
    
    await fetchConfig();
    
    // Cerrar y limpiar
    els.newProfileModal.close();
    els.newProfileForm.reset();
    
    // Actualizar el dropdown
    buildDropdowns();
    
    state.selectedProfileId = id;
    await selectActiveProfile(id);
    
    alert(`¡Perfil "${id}" creado y guardado en tu máquina!`);
  } catch (error) {
    alert(`Error al crear perfil: ${error.message}`);
  }
}

// ----------------------------------
// Dropdown Builder
// ----------------------------------
function buildDropdowns() {
  // 1. Build Repositories dropdown
  renderRepoList();

  // 2. Build Profiles dropdown
  els.profileMenu.innerHTML = '';
  Object.keys(state.config.profiles).forEach(key => {
    const profile = state.config.profiles[key];
    const itemEl = document.createElement('div');
    itemEl.className = 'menu-item';
    itemEl.setAttribute('data-profile', key);
    itemEl.innerHTML = `
      <span class="item-name">${key}</span>
      <span class="item-email">${profile.email}</span>
    `;
    itemEl.addEventListener('click', () => selectActiveProfile(key));
    els.profileMenu.appendChild(itemEl);
  });
}

function renderRepoList(filterText = '') {
  if (!els.repoList) return;
  
  els.repoList.innerHTML = '';
  const searchVal = filterText.toLowerCase().trim();
  
  const folderProfiles = (state.config && state.config.folderProfiles) || [];
  const filtered = folderProfiles.filter(fp => {
    const repoName = getBasename(fp.path).toLowerCase();
    const repoPath = fp.path.toLowerCase();
    return repoName.includes(searchVal) || repoPath.includes(searchVal);
  });
  
  if (filtered.length === 0) {
    const noResults = document.createElement('div');
    noResults.style.padding = '12px 14px';
    noResults.style.color = 'var(--text-muted)';
    noResults.style.fontSize = '0.8rem';
    noResults.style.textAlign = 'center';
    noResults.textContent = 'No se encontraron repositorios';
    els.repoList.appendChild(noResults);
    return;
  }
  
  filtered.forEach(fp => {
    const repoName = getBasename(fp.path);
    const itemEl = document.createElement('div');
    itemEl.className = 'menu-item';
    if (fp.path === state.activeRepoPath) {
      itemEl.classList.add('active');
    }
    itemEl.setAttribute('data-path', fp.path);
    itemEl.innerHTML = `
      <span class="item-name">${repoName}</span>
      <span class="item-path">${fp.path}</span>
    `;
    itemEl.addEventListener('click', () => {
      selectRepository(fp.path);
      resetRepoSearch();
    });
    els.repoList.appendChild(itemEl);
  });
}

function resetRepoSearch() {
  if (els.repoSearchInput) {
    els.repoSearchInput.value = '';
  }
  renderRepoList('');
}

function populateProfileSelects() {
  const config = state.config || { profiles: {} };
  const profiles = Object.keys(config.profiles);
  const selects = [els.linkRepoProfileSelect, els.cloneRepoProfileSelect];
  selects.forEach(select => {
    if (!select) return;
    select.innerHTML = '';
    profiles.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      if (p === config.defaultProfile) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  });
}

async function handleLinkRepoSubmit(e) {
  e.preventDefault();
  const repoPath = document.getElementById('link-path').value.trim();
  const profileName = els.linkRepoProfileSelect.value;
  
  try {
    const res = await fetch(`${API_BASE}/repos/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoPath, profileName })
    });
    
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    
    els.linkRepoModal.close();
    els.linkRepoForm.reset();
    els.repoMenu.classList.remove('show');
    
    await fetchConfig();
    buildDropdowns();
    
    await selectRepository(data.path);
    alert('Repositorio vinculado con éxito');
  } catch (error) {
    alert(`Error al vincular repositorio: ${error.message}`);
  }
}

async function handleCloneRepoSubmit(e) {
  e.preventDefault();
  const url = document.getElementById('clone-url').value.trim();
  const repoPath = document.getElementById('clone-path').value.trim();
  const profileName = els.cloneRepoProfileSelect.value;
  
  const submitBtn = els.cloneSubmitBtn;
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Clonando...';
  
  try {
    const res = await fetch(`${API_BASE}/repos/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, repoPath, profileName })
    });
    
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    
    els.cloneRepoModal.close();
    els.cloneRepoForm.reset();
    els.repoMenu.classList.remove('show');
    
    await fetchConfig();
    buildDropdowns();
    
    await selectRepository(data.path);
    alert('Repositorio clonado e importado con éxito');
  } catch (error) {
    alert(`Error al clonar repositorio: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

async function openFolderBrowser() {
  try {
    const res = await fetch(`${API_BASE}/repos/browse`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.path;
  } catch (error) {
    console.error('Error opening folder browser:', error);
    alert('No se pudo abrir el selector de carpetas. Por favor ingresa la ruta manualmente.');
    return null;
  }
}

function initDragAndDrop() {
  const dragOverlay = document.getElementById('drag-overlay');
  if (!dragOverlay) return;

  let dragCounter = 0;

  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1) {
      dragOverlay.classList.add('active');
    }
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      dragOverlay.classList.remove('active');
    }
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dragOverlay.classList.remove('active');

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const absolutePath = file.path;

      if (absolutePath) {
        populateProfileSelects();
        const linkPathInput = document.getElementById('link-path');
        if (linkPathInput) {
          linkPathInput.value = absolutePath;
        }
        els.linkRepoModal.showModal();
      } else {
        alert("Arrastrar y soltar carpetas solo está disponible al ejecutar GitX como una App de Escritorio instalada (Electron/Tauri) debido a restricciones de seguridad del navegador.\n\nPor ahora, usa el botón 'Buscar...' en los formularios para seleccionar carpetas de forma interactiva.");
      }
    }
  });
}

// ----------------------------------
// Application Init
// ----------------------------------
async function init() {
  initEvents();
  initDragAndDrop();
  
  // Cargar configuración de la máquina
  const config = await fetchConfig();
  if (config) {
    buildDropdowns();
    
    // Seleccionar el repositorio guardado o el primero de la lista
    const savedRepoPath = localStorage.getItem('gitx-active-repo-path');
    const pathExists = config.folderProfiles.some(fp => fp.path === savedRepoPath);

    if (savedRepoPath && pathExists) {
      await selectRepository(savedRepoPath);
    } else if (config.folderProfiles.length > 0) {
      await selectRepository(config.folderProfiles[0].path);
    } else {
      els.currentRepoName.textContent = 'Sin repositorio';
      els.currentProfileName.textContent = 'Sin perfil';
    }
  }
}

init();
