document.addEventListener('DOMContentLoaded', () => {
    // ---- ELEMENTOS GLOBALES Y DEL REPRODUCTOR ----
    const mainContent = document.getElementById('main-content');
    const audio = new Audio();
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playPauseIcon = document.getElementById('playPauseIcon');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const songTitleFooter = document.getElementById('songTitleFooter');
    const artistNameFooter = document.getElementById('artistNameFooter');
    const albumArtFooter = document.getElementById('albumArtFooter');
    const currentTimeEl = document.getElementById('currentTime');
    const totalDurationEl = document.getElementById('totalDuration');
    const progressBar = document.getElementById('progressBar');
    const progressHandle = document.getElementById('progressHandle');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeIcon = document.getElementById('volumeIcon');

    // ---- ESTADO GLOBAL DEL REPRODUCTOR ----
    let currentPlaylist = [];
    let currentIndex = -1;
    let isPlaying = false;

    if (volumeSlider) {
        audio.volume = volumeSlider.value;
    }

    // ===============================================
    // ---- FUNCIÓN PARA MANEJAR "ME GUSTA" ----
    // ===============================================
    
    async function toggleLike(songId, likeButton, navigateToLiked = false) {
        if (!likeButton) {
            console.error('toggleLike called without a valid likeButton!', { songId, likeButton });
            showNotification('Error interno: botón no encontrado.', 'error');
            return;
        }
        const heartIcon = likeButton.querySelector('svg');
        if (!heartIcon) {
            console.error('No SVG icon found inside likeButton!', likeButton);
            showNotification('Error interno: icono no encontrado.', 'error');
            return;
        }
        try {
            const formData = new FormData();
            formData.append('song_id', songId);
            
            const response = await fetch('api/toggle_like.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                if (result.action === 'added') {
                    // Canción agregada a "Me Gusta"
                    heartIcon.classList.remove('text-neutral-500', 'hover:text-white');
                    heartIcon.classList.add('text-green-500');
                    heartIcon.innerHTML = '<path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>';
                    
                    // Mostrar notificación visual
                    showNotification('¡Canción agregada a Me Gusta!', 'success');
                    
                    // Navegar a liked-songs si se solicita
                    if (navigateToLiked) {
                        setTimeout(() => {
                            navigate('liked-songs.php');
                        }, 800); // Pequeño delay para mostrar la notificación
                    }
                    
                } else {
                    // Canción quitada de "Me Gusta"
                    heartIcon.classList.remove('text-green-500');
                    heartIcon.classList.add('text-neutral-500', 'hover:text-white');
                    heartIcon.innerHTML = '<path d="M10 3.22l-.61-.63a5.5 5.5 0 00-7.78 7.78l8.39 8.39 8.39-8.39a5.5 5.5 0 00-7.78-7.78l-.61-.63zM10 18.28l-8.39-8.39a4 4 0 010-5.66 4 4 0 015.66 0l.73.73.73-.73a4 4 0 015.66 0 4 4 0 010 5.66L10 18.28z"></path>';
                    
                    showNotification('Canción quitada de Me Gusta', 'info');
                }
                
                console.log(result.message);
            } else {
                console.error('Error:', result.message);
                showNotification('Error: ' + result.message, 'error');
            }
            
        } catch (error) {
            console.error('Error en la petición:', error);
            showNotification('Error de conexión. Por favor, intenta de nuevo.', 'error');
        }
    }

    // ===============================================
    // ---- FUNCIÓN PARA MOSTRAR NOTIFICACIONES ----
    // ===============================================
    
    function showNotification(message, type = 'info') {
        // Remover notificación existente si hay una
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
        
        // Estilos según el tipo
        const styles = {
            success: 'bg-green-600 text-white',
            error: 'bg-red-600 text-white',
            info: 'bg-blue-600 text-white'
        };
        
        notification.className += ` ${styles[type] || styles.info}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animación de entrada
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // ===============================================
    // ---- LÓGICA DE NAVEGACIÓN DINÁMICA (SPA) ----
    // ===============================================

    const loadPageContent = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('La respuesta de la red no fue correcta.');
            
            const html = await response.text();
            mainContent.innerHTML = html;
            
            const newTitle = html.match(/<title>(.*?)<\/title>/i);
            document.title = newTitle ? newTitle[1] : "Spotify Clon";

            initializePageScripts(new URL(url, window.location.origin));
        } catch (error) {
            console.error('Error al obtener el contenido de la página:', error);
            mainContent.innerHTML = `<p class="p-6 text-red-500">Error: No se pudo cargar la página.</p>`;
        }
    };

    const navigate = (url) => {
        history.pushState({ path: url }, '', url);
        loadPageContent(url);
    };

    // ===============================================
    // ---- EVENT LISTENER PRINCIPAL ----
    // ===============================================
    
    // Reemplazar completamente el event listener principal
    document.body.addEventListener('click', async (e) => {
        const songCard = e.target.closest('.song-card');
        const playButton = e.target.closest('.play-button');
        const likeButton = e.target.closest('.like-button');
        const link = e.target.closest('a');
        const songRow = e.target.closest('.song-row');
        const mainPlayBtn = e.target.closest('#mainPlayBtn');

        // CORRECCIÓN: Manejar clics en botones de like primero
        if (likeButton && likeButton.dataset.songId) {
            e.preventDefault();
            e.stopPropagation();
            const songId = likeButton.dataset.songId;
            toggleLike(songId, likeButton);
            return;
        }

        // Manejar clics en botón de play principal de playlist
        if (mainPlayBtn) {
            e.preventDefault();
            e.stopPropagation();
            if (currentPlaylist && currentPlaylist.length > 0) {
                playSongFromPlaylist(0);
            } else {
                console.warn('Main play button clicked but playlist is empty');
                showNotification('No hay canciones para reproducir', 'error');
            }
            return;
        }

        // Manejar clics en cards de canciones (home.php)
        if (songCard && songCard.dataset.song) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Song card clicked!'); // Debug
            
            try {
                const songData = JSON.parse(songCard.dataset.song);
                console.log('Song data:', songData); // Debug
                
                // Verificar si hay pagePlaylistData disponible
                if (typeof window.pagePlaylistData !== 'undefined' && 
                    Array.isArray(window.pagePlaylistData) && 
                    window.pagePlaylistData.length > 0) {
                    
                    currentPlaylist = window.pagePlaylistData.map(normalizeSongData);
                    
                    // Encontrar el índice de la canción clickeada
                    const clickedSongId = songData.song_id || songData.id;
                    currentIndex = currentPlaylist.findIndex(song => 
                        (song.song_id || song.id) == clickedSongId
                    );
                    
                    if (currentIndex === -1) {
                        console.warn('Song not found in playlist, adding it as first song');
                        currentPlaylist.unshift(normalizeSongData(songData));
                        currentIndex = 0;
                    }
                } else {
                    // Crear playlist con solo esta canción
                    console.log('Creating single-song playlist');
                    currentPlaylist = [normalizeSongData(songData)];
                    currentIndex = 0;
                }
                
                console.log('Playing from playlist, index:', currentIndex, 'Total songs:', currentPlaylist.length); // Debug
                
                // Verificación adicional antes de reproducir
                if (currentPlaylist.length > 0 && currentIndex >= 0 && currentIndex < currentPlaylist.length) {
                    playSongFromPlaylist(currentIndex);
                } else {
                    console.error('Invalid playlist state before playing');
                    showNotification('Error al configurar la playlist', 'error');
                }
            } catch (error) {
                console.error('Error parsing song data:', error);
                showNotification('Error al procesar datos de la canción', 'error');
            }
            return;
        }

        // Manejar clics en botones de play
        if (playButton) {
            e.preventDefault();
            e.stopPropagation();
            const card = playButton.closest('.song-card');
            if (card && card.dataset.song) {
                // Delegar al manejo de song-card
                const cardEvent = new Event('click', { bubbles: true });
                card.dispatchEvent(cardEvent);
            }
            return;
        }

        // Manejar clics en enlaces de navegación
        if (link && link.href.startsWith(window.location.origin) && !link.href.includes('#')) {
            e.preventDefault();
            navigate(link.href);
            return;
        }

        // Manejar clics en filas de canciones (desde playlists)
        if (songRow && songRow.dataset.songIndex) {
            e.preventDefault();
            e.stopPropagation();
            const songIndex = parseInt(songRow.dataset.songIndex, 10);
            if (!isNaN(songIndex)) {
                console.log('Song row clicked, index:', songIndex); // Debug
                playSongFromPlaylist(songIndex);
            }
            return;
        }
    });

    // ===============================================
    // ---- FUNCIONES DE NORMALIZACIÓN Y REPRODUCCIÓN ----
    // ===============================================

    function normalizeSongData(songData) {
        return {
            id: songData.id || songData.song_id,
            song_id: songData.song_id || songData.id,
            title: songData.title || songData.song_title,
            song_title: songData.song_title || songData.title,
            artist: songData.artist || songData.artist_name,
            artist_name: songData.artist_name || songData.artist,
            album_title: songData.album_title || songData.album,
            file_path: songData.file_path,
            duration: songData.duration,
            cover_path: songData.cover_path
        };
    }

    function playSongFromPlaylist(index) {
        // Validación más robusta
        if (!currentPlaylist || currentPlaylist.length === 0) {
            console.error('Playlist vacía o no inicializada');
            showNotification('No hay canciones en la playlist', 'error');
            return;
        }
        
        if (index < 0 || index >= currentPlaylist.length) {
            console.error('Invalid playlist index:', index, 'Playlist length:', currentPlaylist.length);
            return;
        }
        
        currentIndex = index;
        const song = currentPlaylist[currentIndex];
        
        if (!song || !song.file_path) {
            console.error('Canción no válida o sin archivo:', song);
            showNotification('Archivo de canción no encontrado', 'error');
            return;
        }
        
        // Normalizar datos antes de usar
        const normalizedSong = normalizeSongData(song);
        
        console.log('Setting audio source to:', normalizedSong.file_path); // Debug
        audio.src = normalizedSong.file_path;
        updatePlayerUI(normalizedSong);
        updateCurrentSongVisuals();
        
        playAudio();
    }
    
    function updateCurrentSongVisuals() {
        // Remover clase de canción anterior
        document.querySelectorAll('.song-card.playing').forEach(card => {
            card.classList.remove('playing');
        });
        
        // Añadir clase a canción actual
        const currentSongCards = document.querySelectorAll('.song-card');
        currentSongCards.forEach(card => {
            if (card.dataset.song) {
                const songData = JSON.parse(card.dataset.song);
                if (currentPlaylist[currentIndex] && 
                    (songData.song_id || songData.id) == (currentPlaylist[currentIndex].song_id || currentPlaylist[currentIndex].id)) {
                    card.classList.add('playing');
                }
            }
        });
    }

    // Manejo de errores de audio
    audio.addEventListener('error', function(e) {
        console.error('Error al cargar audio:', e);
        console.error('Audio source:', audio.src);
        showNotification('Error al cargar la canción', 'error');
        
        // Intentar siguiente canción si hay más en la playlist
        if (currentPlaylist.length > 1 && currentIndex < currentPlaylist.length - 1) {
            setTimeout(() => {
                currentIndex++;
                playSongFromPlaylist(currentIndex);
            }, 1000);
        }
    });

    // ===============================================
    // ---- NAVEGACIÓN CON HISTORIAL ----
    // ===============================================

    window.addEventListener('popstate', (e) => {
        const path = (e.state && e.state.path) ? e.state.path : 'home.php';
        loadPageContent(path);
    });

    // Event listener para cuando liked-songs.php dispare el evento de datos listos
    document.addEventListener('likedSongsDataReady', (e) => {
        console.log('Received likedSongsDataReady event:', e.detail); // Debug
        if (e.detail && e.detail.playlistData) {
            console.log('Initializing playlist from event data:', e.detail.playlistData); // Debug
            initializePlaylist(e.detail.playlistData);
        }
    });

    const initializePageScripts = (url) => {
        console.log('Initializing page scripts for:', url.pathname); // Debug
        
        if (url.pathname.includes('playlist.php')) {
            const albumId = url.searchParams.get('album_id') || 1;
            console.log('Loading album playlist for album ID:', albumId); // Debug
            loadAlbumPlaylist(albumId);
        }
        else if (typeof window.pagePlaylistData !== 'undefined' && window.pagePlaylistData) {
            console.log('Initializing playlist with data:', window.pagePlaylistData); // Debug
            initializePlaylist(window.pagePlaylistData);
            window.pagePlaylistData = undefined; 
        } else {
            console.log('No pagePlaylistData found, currentPlaylist:', currentPlaylist); // Debug
            
            // Si estamos en liked-songs.php, esperar a que los datos estén disponibles
            if (url.pathname.includes('liked-songs.php')) {
                console.log('Waiting for liked-songs data to be available...'); // Debug
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    console.log(`Polling attempt ${attempts}: pagePlaylistData =`, window.pagePlaylistData); // Debug
                    
                    if (typeof window.pagePlaylistData !== 'undefined' && window.pagePlaylistData && window.pagePlaylistData.length > 0) {
                        clearInterval(checkInterval);
                        console.log('Liked-songs data found, initializing playlist:', window.pagePlaylistData); // Debug
                        initializePlaylist(window.pagePlaylistData);
                        window.pagePlaylistData = undefined;
                    } else if (attempts >= 50) { // 5 segundos máximo (50 * 100ms)
                        clearInterval(checkInterval);
                        console.warn('Timeout waiting for liked-songs data after', attempts, 'attempts');
                        console.warn('Current state - pagePlaylistData:', window.pagePlaylistData);
                        console.warn('Current state - currentPlaylist:', currentPlaylist);
                    }
                }, 100);
            }
        }
    };
    
    // ======================================================
    // ---- FUNCIONES Y EVENTOS DEL REPRODUCTOR ----
    // ======================================================
    
    function initializePlaylist(playlistData) {
        console.log('initializePlaylist called with:', playlistData); // Debug
        
        if (!playlistData || !Array.isArray(playlistData) || playlistData.length === 0) {
            console.warn('Playlist data is empty or invalid');
            currentPlaylist = [];
            return;
        }
        
        currentPlaylist = playlistData.map(normalizeSongData);
        console.log('Playlist initialized with', currentPlaylist.length, 'songs'); // Debug
        
        const mainPlayBtn = document.getElementById('mainPlayBtn');
        if (mainPlayBtn) {
            mainPlayBtn.onclick = () => {
                if (currentPlaylist.length > 0) {
                    console.log('Main play button clicked, playing index 0'); // Debug
                    playSongFromPlaylist(0);
                } else {
                    console.warn('Main play button clicked but playlist is empty');
                    showNotification('No hay canciones para reproducir', 'error');
                }
            };
        }
    
        document.querySelectorAll('.song-row').forEach(row => {
            row.addEventListener('click', () => {
                const songIndex = parseInt(row.dataset.songIndex, 10);
                if (!isNaN(songIndex)) {
                    console.log('Song row clicked, index:', songIndex); // Debug
                    playSongFromPlaylist(songIndex);
                }
            });
        });
    }
    
    // Mejorar la función togglePlay para manejar playlists vacías
    function togglePlay() {
        if (!audio.src) { 
            if (currentPlaylist && currentPlaylist.length > 0) {
                console.log('No audio source, playing first song from playlist'); // Debug
                playSongFromPlaylist(0); 
            } else {
                console.warn('No audio source and no playlist available');
                showNotification('Selecciona una canción para reproducir', 'info');
            }
            return; 
        }
        if (isPlaying) pauseAudio(); 
        else playAudio();
    }
    function playAudio() {
        audio.play().then(() => { 
            isPlaying = true; 
            updatePlayPauseIcons(); 
            console.log('Audio playing successfully'); // Debug
        }).catch(e => {
            console.error("Error al reproducir:", e);
            showNotification('Error al reproducir la canción', 'error');
        });
    }

    function pauseAudio() {
        audio.pause(); 
        isPlaying = false; 
        updatePlayPauseIcons();
    }
    
   
    function updatePlayPauseIcons() {
        const pauseIcon = `<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v10a1.5 1.5 0 0 1-3 0V5A1.5 1.5 0 0 1 5.5 3.5zm6.5 0A1.5 1.5 0 0 1 13.5 5v10a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"></path></svg>`;
        const playIcon = `<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.025A1 1 0 008 8v4a1 1 0 001.555.975l3.5-2a1 1 0 000-1.95l-3.5-2z" clip-rule="evenodd"></path></svg>`;
        if(playPauseIcon) playPauseIcon.innerHTML = isPlaying ? pauseIcon : playIcon;
    }

    function updatePlayerUI(song) {
        if (songTitleFooter) songTitleFooter.textContent = song.title || song.song_title;
        if (artistNameFooter) artistNameFooter.textContent = song.artist || song.artist_name;
        if (albumArtFooter) albumArtFooter.src = song.cover_path;
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    // ===============================================
    // ---- EVENTOS DEL REPRODUCTOR ----
    // ===============================================
    
    if(playPauseBtn) playPauseBtn.addEventListener('click', togglePlay);
    
    if(nextBtn) nextBtn.addEventListener('click', () => { 
        if (currentPlaylist.length > 0) { 
            currentIndex = (currentIndex + 1) % currentPlaylist.length; 
            playSongFromPlaylist(currentIndex); 
        } 
    });
    
    if(prevBtn) prevBtn.addEventListener('click', () => { 
        if (currentPlaylist.length > 0) { 
            const newIndex = audio.currentTime < 3 ? 
                (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length : 
                currentIndex; 
            playSongFromPlaylist(newIndex); 
        } 
    });
    
    audio.addEventListener('ended', () => { 
        if(nextBtn) nextBtn.click(); 
    });
    
    audio.addEventListener('timeupdate', () => { 
        if (audio.duration) { 
            const p = (audio.currentTime / audio.duration) * 100; 
            if(progressBar) progressBar.style.width = `${p}%`; 
            if(progressHandle) progressHandle.style.left = `${p}%`; 
            if(currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime); 
        } 
    });
    
    audio.addEventListener('loadedmetadata', () => { 
        if(totalDurationEl) totalDurationEl.textContent = formatTime(audio.duration); 
    });
    
    if(progressBarContainer) progressBarContainer.addEventListener('click', (e) => { 
        if (audio.duration) audio.currentTime = (e.offsetX / progressBarContainer.clientWidth) * audio.duration; 
    });
    
    if(volumeSlider) volumeSlider.addEventListener('input', e => audio.volume = e.target.value);
    
    audio.addEventListener('volumechange', () => { 
        if(volumeSlider) volumeSlider.value = audio.volume; 
    });

    // Función mejorada para debugging el estado de la playlist
    function debugPlaylistState() {
        console.log('=== PLAYLIST DEBUG ===');
        console.log('currentPlaylist:', currentPlaylist);
        console.log('currentPlaylist.length:', currentPlaylist ? currentPlaylist.length : 'null/undefined');
        console.log('currentIndex:', currentIndex);
        console.log('window.pagePlaylistData:', typeof window.pagePlaylistData !== 'undefined' ? window.pagePlaylistData : 'undefined');
        console.log('=====================');
    }

    // Hacer la función de debug disponible globalmente para testing
    window.debugPlaylistState = debugPlaylistState;

    // Hacer la función disponible globalmente
    window.initializePlaylist = initializePlaylist;
    
    // Hacer toggleLike disponible globalmente
    window.toggleLike = toggleLike;

    // Mejorar loadAlbumPlaylist para manejar mejor los errores
    async function loadAlbumPlaylist(albumId) {
        try {
            const response = await fetch(`api/get_songs.php?album_id=${albumId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const songs = await response.json();
            
            if (!Array.isArray(songs) || songs.length === 0) {
                console.warn('No songs returned from API or invalid format');
                showNotification('No se encontraron canciones en este álbum', 'error');
                return;
            }
            
            const playlistContainer = document.getElementById('playlist-songs');
            if(playlistContainer) {
                playlistContainer.innerHTML = ''; // Limpia el contenedor
                songs.forEach((song, index) => {
                    const songRow = document.createElement('div');
                    songRow.className = "song-row grid grid-cols-[16px,minmax(0,2fr),minmax(0,1.5fr),minmax(0,1fr)] items-center gap-x-4 p-2 rounded-md hover:bg-neutral-800 transition duration-150 cursor-pointer";
                    songRow.dataset.songIndex = index;
                    songRow.innerHTML = `
                        <div class="text-right text-neutral-400">${index + 1}</div>
                        <div class="flex items-center space-x-3">
                            <img src="${song.cover_path}" alt="${song.song_title}" class="w-10 h-10 rounded-sm">
                            <div><p class="text-white font-semibold">${song.song_title}</p><p class="text-neutral-400 text-sm">${song.artist_name}</p></div>
                        </div>
                        <div class="text-neutral-400 text-sm truncate">${song.album_title}</div>
                        <div class="text-right text-neutral-400 text-sm">${song.duration}</div>
                    `;
                    playlistContainer.appendChild(songRow);
                });
            }
            
            // Asegurar que la playlist se inicializa correctamente
            console.log('Initializing album playlist with', songs.length, 'songs'); // Debug
            initializePlaylist(songs);

        } catch (error) { 
            console.error('Error al cargar la playlist del álbum:', error);
            showNotification('Error al cargar las canciones del álbum', 'error');
        }
    }

    // ---- INICIALIZACIÓN ----
    loadPageContent('home.php');
});