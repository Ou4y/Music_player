// app.js
// Modular SPA Music Player

// --- State ---
const state = {
  songs: [], // {id, title, artist, src, liked, cover}
  liked: [], // song ids
  playlists: {}, // {playlistName: [songIds]}
  currentView: 'home',
  currentAudio: null,
  currentSongId: null,
  scrollPositions: { home: 0, liked: 0, playlists: 0 },
};

// --- Utility Functions ---
function saveState() {
  localStorage.setItem('liked', JSON.stringify(state.liked));
  localStorage.setItem('playlists', JSON.stringify(state.playlists));
}
function loadState() {
  state.liked = JSON.parse(localStorage.getItem('liked')) || [];
  state.playlists = JSON.parse(localStorage.getItem('playlists')) || {};
}

// --- Navigation ---
function switchView(view) {
  if (state.currentView === view) return;
  // Save scroll
  state.scrollPositions[state.currentView] = window.scrollY;
  // Hide all
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('d-none'));
  // Show target
  document.getElementById('section-' + view).classList.remove('d-none');
  // Restore scroll
  setTimeout(() => window.scrollTo(0, state.scrollPositions[view] || 0), 10);
  // Update nav
  document.querySelectorAll('#nav-menu .nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-section') === view);
  });
  state.currentView = view;
}

function handleHashChange() {
  const hash = location.hash.replace('#', '') || 'home';
  if (["home", "liked", "playlists"].includes(hash)) {
    switchView(hash);
    renderSection(hash);
  }
}

window.addEventListener('hashchange', handleHashChange);

// --- Render Functions ---
function renderSection(view) {
  showLoading();
  setTimeout(() => {
    if (view === 'home') renderHome();
    else if (view === 'liked') renderLiked();
    else if (view === 'playlists') renderPlaylists();
    hideLoading();
  }, 300); // Simulate loading
}

function renderHome() {
  const container = document.getElementById('section-home');
  // ...render grid, search, sort, like buttons...
  container.innerHTML = `<div class="mb-3 d-flex justify-content-between align-items-center">
    <input id="search-input" class="form-control w-50" placeholder="Search songs...">
    <select id="sort-select" class="form-select w-auto ms-2">
      <option value="title">Sort by Title</option>
      <option value="artist">Sort by Artist</option>
    </select>
  </div>
  <div class="row" id="songs-grid"></div>`;
  renderSongsGrid(state.songs, 'songs-grid');
  // Event listeners
  document.getElementById('search-input').oninput = e => {
    filterAndRenderSongs();
  };
  document.getElementById('sort-select').onchange = e => {
    filterAndRenderSongs();
  };
}

function filterAndRenderSongs() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const sort = document.getElementById('sort-select').value;
  let filtered = state.songs.filter(song =>
    song.title.toLowerCase().includes(search) || song.artist.toLowerCase().includes(search)
  );
  filtered = filtered.sort((a, b) => a[sort].localeCompare(b[sort]));
  renderSongsGrid(filtered, 'songs-grid');
}

function renderSongsGrid(songs, gridId, playlistAdd = false) {
  const grid = document.getElementById(gridId);
  if (!songs.length) {
    grid.innerHTML = '<div class="empty-state">No songs found.</div>';
    return;
  }
  grid.innerHTML = songs.map(song => `
    <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
      <div class="card bg-secondary text-light h-100">
        <img src="${song.cover || 'https://placehold.co/400x400?text=No+Cover'}" class="card-img-top" alt="${song.title} cover" style="object-fit:cover; height:200px;">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${song.title}</h5>
          <p class="card-text">${song.artist}</p>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <button class="btn btn-primary btn-sm play-btn" data-id="${song.id}"><i class="bi bi-play-fill"></i></button>
            <button class="btn btn-outline-danger btn-sm like-btn" data-id="${song.id}">
              <i class="bi ${state.liked.includes(song.id) ? 'bi-heart-fill' : 'bi-heart'}"></i>
            </button>
            <div class="dropdown">
              <button class="btn btn-outline-light btn-sm dropdown-toggle add-to-playlist-btn" data-id="${song.id}" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-plus-circle"></i>
              </button>
              <ul class="dropdown-menu">
                ${Object.keys(state.playlists).length === 0 ? '<li><span class="dropdown-item text-muted">No playlists</span></li>' :
                  Object.keys(state.playlists).map(name => `<li><a class="dropdown-item add-to-playlist" data-id="${song.id}" data-playlist="${name}">${name}</a></li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function renderLiked() {
  const container = document.getElementById('section-liked');
  const likedSongs = state.songs.filter(song => state.liked.includes(song.id));
  if (!likedSongs.length) {
    container.innerHTML = `<div class="empty-state">
      <i class="bi bi-heart" style="font-size:3rem;"></i><br>
      No liked songs yet.
    </div>`;
    return;
  }
  container.innerHTML = `<div class="mb-2 d-flex justify-content-end">
    <button class="btn btn-danger btn-sm" id="unlike-all">Unlike All</button>
  </div>
  <div class="row" id="liked-grid"></div>`;
  renderSongsGrid(likedSongs, 'liked-grid');
  document.getElementById('unlike-all').onclick = () => {
    state.liked = [];
    saveState();
    renderLiked();
  };
}

function renderPlaylists() {
  const container = document.getElementById('section-playlists');
  // ...playlist management UI...
  container.innerHTML = `<div class="mb-3 d-flex justify-content-between align-items-center">
    <input id="playlist-name" class="form-control w-50" placeholder="New playlist name">
    <button class="btn btn-success ms-2" id="add-playlist">Add Playlist</button>
  </div>
  <div id="playlists-list"></div>`;
  renderPlaylistsList();
  document.getElementById('add-playlist').onclick = () => {
    const name = document.getElementById('playlist-name').value.trim();
    if (name && !state.playlists[name]) {
      state.playlists[name] = [];
      saveState();
      renderPlaylistsList();
      document.getElementById('playlist-name').value = '';
    }
  };
}

function renderPlaylistsList() {
  const list = document.getElementById('playlists-list');
  const names = Object.keys(state.playlists);
  if (!names.length) {
    list.innerHTML = '<div class="empty-state">No playlists yet.</div>';
    return;
  }
  list.innerHTML = names.map(name => `
    <div class="card bg-secondary text-light mb-2">
      <div class="card-body d-flex justify-content-between align-items-center">
        <span class="fw-bold">${name}</span>
        <div>
          <button class="btn btn-outline-primary btn-sm view-playlist" data-name="${name}"><i class="bi bi-eye"></i></button>
          <button class="btn btn-outline-danger btn-sm delete-playlist" data-name="${name}"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderPlaylistSongs(name) {
  const container = document.getElementById('section-playlists');
  const songIds = state.playlists[name] || [];
  const songs = state.songs.filter(s => songIds.includes(s.id));
  // Find songs not in playlist
  const notInPlaylist = state.songs.filter(s => !songIds.includes(s.id));
  container.innerHTML = `<button class="btn btn-link mb-2" id="back-to-playlists"><i class="bi bi-arrow-left"></i> Back to Playlists</button>
    <h4 class="mb-3 d-inline-block">${name}</h4>
    <button class="btn btn-outline-success btn-sm ms-3 mb-2" id="show-add-songs">Add Songs</button>
    <div class="playlist-song-list">
      ${songs.length === 0 ? '<div class="empty-state">No songs in this playlist.</div>' :
        songs.map(song => `
          <div class="playlist-song-item">
            <img src="${song.cover || 'https://placehold.co/60x60?text=No+Cover'}" alt="${song.title} cover" style="width:48px;height:48px;object-fit:cover;border-radius:8px;margin-right:12px;">
            <span class="playlist-song-title">${song.title} <span class="text-muted small">- ${song.artist}</span></span>
            <span class="playlist-song-actions">
              <button class="btn btn-primary btn-sm play-btn" data-id="${song.id}"><i class="bi bi-play-fill"></i></button>
              <button class="btn btn-outline-danger btn-sm remove-from-playlist-btn" data-id="${song.id}" data-playlist="${name}"><i class="bi bi-x-circle"></i></button>
            </span>
          </div>
        `).join('')}
    </div>
    <div id="add-songs-list" class="mt-3" style="display:none;"></div>`;

  // Add event for show-add-songs
  setTimeout(() => {
    const showBtn = document.getElementById('show-add-songs');
    if (showBtn) {
      showBtn.onclick = () => {
        const addList = document.getElementById('add-songs-list');
        if (addList.style.display === 'none') {
          // Show list
          addList.style.display = 'block';
          addList.innerHTML = notInPlaylist.length === 0 ? '<div class="empty-state">All songs are in this playlist.</div>' :
            notInPlaylist.map(song => `
              <div class="d-flex align-items-center mb-2">
                <img src="${song.cover || 'https://placehold.co/40x40?text=No+Cover'}" alt="${song.title} cover" style="width:32px;height:32px;object-fit:cover;border-radius:6px;margin-right:10px;">
                <span class="flex-grow-1">${song.title} <span class="text-muted small">- ${song.artist}</span></span>
                <button class="btn btn-success btn-sm add-song-to-playlist-btn" data-id="${song.id}" data-playlist="${name}">Add</button>
              </div>
            `).join('');
        } else {
          addList.style.display = 'none';
        }
      };
    }
  }, 0);
}

// --- Player Bar ---
let isPlaying = true;
let fakeProgress = 0; // 0-100
let fakeProgressInterval = null;
const SONG_DURATION = 180; // 3 minutes in seconds
let currentTime = 0;

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function renderPlayerBar() {
  const bar = document.getElementById('player-bar');
  if (!state.currentSongId) {
    bar.innerHTML = '<span>No song playing</span>';
    clearInterval(fakeProgressInterval);
    return;
  }
  const song = state.songs.find(s => s.id === state.currentSongId);
  // Calculate progress and time
  fakeProgress = (currentTime / SONG_DURATION) * 100;
  if (fakeProgress > 100) fakeProgress = 100;
  // Controls: prev, play/pause, next
  bar.innerHTML = `
    <div class="d-flex align-items-center w-100">
      <img src="${song.cover || 'https://placehold.co/60x60?text=No+Cover'}" alt="${song.title} cover" style="width:48px;height:48px;object-fit:cover;border-radius:8px;margin-right:12px;">
      <div class="flex-grow-1">
        <div><strong>${song.title}</strong> - ${song.artist}</div>
        <div class="d-flex align-items-center mt-1">
          <button class="btn btn-light btn-sm me-2 player-prev"><i class="bi bi-skip-start-fill"></i></button>
          <button class="btn btn-light btn-sm me-2 player-playpause">${isPlaying ? '<i class="bi bi-pause-fill"></i>' : '<i class="bi bi-play-fill"></i>'}</button>
          <button class="btn btn-light btn-sm me-3 player-next"><i class="bi bi-skip-end-fill"></i></button>
          <span class="me-2 ms-2" style="width:48px;display:inline-block;text-align:right;">${formatTime(currentTime)}</span>
          <div class="progress flex-grow-1 player-progress-bar" style="height: 6px; min-width: 80px; cursor:pointer;" title="Seek">
            <div class="progress-bar bg-success" role="progressbar" style="width: ${fakeProgress}%" aria-valuenow="${fakeProgress}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
          <span class="ms-2" style="width:48px;display:inline-block;text-align:left;">${formatTime(SONG_DURATION)}</span>
        </div>
      </div>
      <span class="ms-3 text-success d-none d-md-inline"><i class="bi bi-volume-up"></i> ${isPlaying ? 'Playing...' : 'Paused'}</span>
    </div>
  `;
}

function startFakeProgress() {
  clearInterval(fakeProgressInterval);
  fakeProgressInterval = setInterval(() => {
    if (isPlaying && state.currentSongId) {
      currentTime += 1;
      if (currentTime >= SONG_DURATION) {
        playSongByOffset(1); // Auto-next
        return;
      }
      renderPlayerBar();
    }
  }, 1000);
}

function playSongByOffset(offset) {
  if (!state.currentSongId) return;
  const idx = state.songs.findIndex(s => s.id === state.currentSongId);
  let newIdx = idx + offset;
  if (newIdx < 0) newIdx = state.songs.length - 1;
  if (newIdx >= state.songs.length) newIdx = 0;
  state.currentSongId = state.songs[newIdx].id;
  currentTime = 0;
  isPlaying = true;
  renderPlayerBar();
  startFakeProgress();
}

// --- Loading ---
function showLoading() {
  document.getElementById('loading-overlay').classList.remove('d-none');
}
function hideLoading() {
  document.getElementById('loading-overlay').classList.add('d-none');
}

// --- Event Delegation ---
document.body.addEventListener('click', function(e) {
  if (e.target.closest('.play-btn')) {
    const id = e.target.closest('.play-btn').dataset.id;
    state.currentSongId = id;
    isPlaying = true;
    currentTime = 0;
    renderPlayerBar();
    startFakeProgress();
  }
  if (e.target.closest('.like-btn')) {
    const id = e.target.closest('.like-btn').dataset.id;
    if (state.liked.includes(id)) {
      state.liked = state.liked.filter(lid => lid !== id);
    } else {
      state.liked.push(id);
    }
    saveState();
    renderHome();
    renderLiked();
  }
  if (e.target.closest('.delete-playlist')) {
    const name = e.target.closest('.delete-playlist').dataset.name;
    delete state.playlists[name];
    saveState();
    renderPlaylistsList();
  }
  if (e.target.closest('.add-to-playlist-btn')) {
    // Open dropdown is handled by Bootstrap, so do nothing here
    // The actual add is handled below
  }
  if (e.target.classList && e.target.classList.contains('add-to-playlist')) {
    const songId = e.target.dataset.id;
    const playlist = e.target.dataset.playlist;
    if (!state.playlists[playlist].includes(songId)) {
      state.playlists[playlist].push(songId);
      saveState();
      // Show feedback
      e.target.textContent = 'Added!';
      setTimeout(() => {
        e.target.textContent = playlist;
      }, 800);
    }
  }
  if (e.target.closest('.view-playlist')) {
    const name = e.target.closest('.view-playlist').dataset.name;
    renderPlaylistSongs(name);
  }
  if (e.target.closest('#back-to-playlists')) {
    renderPlaylists();
  }
  if (e.target.closest('.remove-from-playlist-btn')) {
    const songId = e.target.closest('.remove-from-playlist-btn').dataset.id;
    const playlist = e.target.closest('.remove-from-playlist-btn').dataset.playlist;
    state.playlists[playlist] = state.playlists[playlist].filter(id => id !== songId);
    saveState();
    renderPlaylistSongs(playlist);
  }
  if (e.target.classList && e.target.classList.contains('add-song-to-playlist-btn')) {
    const songId = e.target.dataset.id;
    const playlist = e.target.dataset.playlist;
    if (!state.playlists[playlist].includes(songId)) {
      state.playlists[playlist].push(songId);
      saveState();
      renderPlaylistSongs(playlist);
    }
  }
  if (e.target.closest('.player-playpause')) {
    isPlaying = !isPlaying;
    renderPlayerBar();
    if (isPlaying) startFakeProgress();
    else clearInterval(fakeProgressInterval);
  }
  if (e.target.closest('.player-prev')) {
    playSongByOffset(-1);
  }
  if (e.target.closest('.player-next')) {
    playSongByOffset(1);
  }
});

document.body.addEventListener('mousedown', function(e) {
  const bar = e.target.closest('.player-progress-bar');
  if (bar && state.currentSongId) {
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    currentTime = Math.round(percent * SONG_DURATION);
    renderPlayerBar();
  }
});

// --- Initialization ---
function initSongs() {
  // 5 static songs with realistic names and local cover images
  state.songs = [
    {id: '1', title: 'Lost in the Echo', artist: 'Linkin Park', src: 'audio/lost_in_the_echo.mp3', cover: 'img/Lost in the Echo.jpg'},
    {id: '2', title: 'Blinding Lights', artist: 'The Weeknd', src: 'audio/blinding_lights.mp3', cover: 'img/the-weeknd-blinding-lights-record.webp'},
    {id: '3', title: 'Levitating', artist: 'Dua Lipa', src: 'audio/levitating.mp3', cover: 'img/levitating.jpg'},
    {id: '4', title: 'Shape of You', artist: 'Ed Sheeran', src: 'audio/shape_of_you.mp3', cover: 'img/Shape of you.jpg'},
    {id: '5', title: 'Dance Monkey', artist: 'Tones and I', src: 'audio/dance_monkey.mp3', cover: 'img/Dance monkey.jpg'},
  ];
}

function init() {
  loadState();
  initSongs();
  handleHashChange();
  renderPlayerBar();
  currentTime = 0;
  isPlaying = true;
  startFakeProgress();
}

document.addEventListener('DOMContentLoaded', init);
