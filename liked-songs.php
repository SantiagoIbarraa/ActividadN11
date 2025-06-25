<?php
// Este archivo es un fragmento de contenido para mostrar las canciones con "Me Gusta"
require 'api/db_connect.php';

// Asegurarse de que la sesión esté iniciada para obtener el ID de usuario
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$user_id = $_SESSION['user_id'] ?? 0;

// Obtener todas las canciones a las que el usuario le ha dado "Me Gusta"
$liked_songs = [];
if ($user_id > 0) {
    $sql = "SELECT s.id as song_id, s.title as song_title, s.file_path, s.duration, 
                   a.name as artist_name, al.title as album_title, al.cover_path
            FROM user_liked_songs uls
            JOIN songs s ON uls.song_id = s.id
            JOIN artists a ON s.artist_id = a.id
            JOIN albums al ON s.album_id = al.id
            WHERE uls.user_id = ?
            ORDER BY uls.liked_at DESC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $liked_songs = $result->fetch_all(MYSQLI_ASSOC);
    }
    $stmt->close();
}
$conn->close();
?>

<?php include 'includes/header.php'; ?>

<div class="flex-1 overflow-y-auto">
    <!-- Header de la playlist -->
    <div class="p-6 pt-16 pb-8 flex items-end space-x-6 playlist-header-bg">
        <div class="w-56 h-56 shadow-2xl bg-gradient-to-br from-indigo-800 to-blue-400 flex items-center justify-center rounded-md">
            <svg class="h-20 w-20 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
            </svg>
        </div>
        <div>
            <p class="text-sm uppercase font-semibold text-white">Playlist</p>
            <h1 class="text-7xl font-black text-white leading-tight mt-2 mb-4">Canciones que te gustan</h1>
            <p class="text-neutral-300 text-sm"><?php echo htmlspecialchars($_SESSION['nombre_usuario'] ?? 'Usuario'); ?> • <span id="songs-count"><?php echo count($liked_songs); ?></span> canciones</p>
        </div>
    </div>

    <!-- Controles principales -->
    <div class="p-6">
        <?php if (!empty($liked_songs)): ?>
        <div class="flex items-center space-x-6 mb-8">
            <button id="mainPlayBtn" class="bg-green-500 text-black p-4 rounded-full hover:scale-105 transition duration-200 shadow-lg hover:bg-green-400">
                <svg class="h-7 w-7" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.5,7.6L12.5,10L8.5,12.4V7.6z M10,0.5C4.7,0.5,0.5,4.7,0.5,10c0,5.3,4.2,9.5,9.5,9.5s9.5-4.2,9.5-9.5C19.5,4.7,15.3,0.5,10,0.5z"/>
                </svg>
            </button>
            <button id="shuffleBtn" class="text-neutral-400 hover:text-white transition-colors p-2" title="Reproducir aleatoriamente">
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15.5 3.5a1 1 0 011 1v11a1 1 0 01-1 1h-11a1 1 0 01-1-1v-11a1 1 0 011-1h11zM14 5H6v10h8V5zM8 7v6l4-3-4-3z"/>
                </svg>
            </button>
        </div>
        <?php endif; ?>
        
        <!-- Lista de canciones -->
        <div id="playlist-songs-container" class="mt-6">
            <!-- Header de la tabla -->
            <div class="grid grid-cols-[16px,minmax(0,2fr),minmax(0,1.5fr),32px,minmax(0,1fr)] items-center gap-x-4 border-b border-neutral-700 pb-2 text-neutral-400 text-sm font-semibold px-4">
                <div class="text-right">#</div>
                <div>Título</div>
                <div>Álbum</div>
                <div></div>
                <div class="text-right">
                    <svg class="h-4 w-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L10 9.586V6z" clip-rule="evenodd"/>
                    </svg>
                </div>
            </div>
            
            <!-- Contenedor de canciones -->
            <div id="playlist-songs" class="space-y-1 mt-2">
                <?php if (!empty($liked_songs)): ?>
                    <?php foreach ($liked_songs as $index => $song): ?>
                        <div class="song-row grid grid-cols-[16px,minmax(0,2fr),minmax(0,1.5fr),32px,minmax(0,1fr)] items-center gap-x-4 p-2 rounded-md hover:bg-neutral-800 transition duration-150 cursor-pointer group" 
                             data-song-index="<?php echo $index; ?>"
                             data-song-id="<?php echo $song['song_id']; ?>">
                            
                            <!-- Número/Indicador de reproducción -->
                            <div class="text-right text-neutral-400 group-hover:hidden">
                                <?php echo $index + 1; ?>
                            </div>
                            <div class="text-right hidden group-hover:block">
                                <svg class="h-4 w-4 text-white ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M8.5,7.6L12.5,10L8.5,12.4V7.6z"/>
                                </svg>
                            </div>
                            
                            <!-- Información de la canción -->
                            <div class="flex items-center space-x-3">
                                <img src="<?php echo htmlspecialchars($song['cover_path']); ?>" 
                                     alt="Cover" 
                                     class="w-10 h-10 rounded-sm">
                                <div>
                                    <p class="text-white font-semibold hover:underline cursor-pointer">
                                        <?php echo htmlspecialchars($song['song_title']); ?>
                                    </p>
                                    <p class="text-neutral-400 text-sm hover:text-white cursor-pointer">
                                        <?php echo htmlspecialchars($song['artist_name']); ?>
                                    </p>
                                </div>
                            </div>
                            
                            <!-- Álbum -->
                            <div class="text-neutral-400 text-sm truncate hover:text-white cursor-pointer">
                                <?php echo htmlspecialchars($song['album_title']); ?>
                            </div>
                            
                            <!-- Botón de me gusta -->
                            <div class="flex justify-center">
                                <button class="like-button p-1 hover:scale-110 transition-transform opacity-0 group-hover:opacity-100" 
                                        data-song-id="<?php echo $song['song_id']; ?>" 
                                        title="Quitar de Me Gusta">
                                    <svg class="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
                                    </svg>
                                </button>
                            </div>
                            
                            <!-- Duración -->
                            <div class="text-right text-neutral-400 text-sm">
                                <?php echo htmlspecialchars($song['duration']); ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <!-- Estado vacío -->
                    <div class="flex flex-col items-center justify-center py-16 text-center">
                        <svg class="h-16 w-16 text-neutral-600 mb-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
                        </svg>
                        <h3 class="text-xl font-semibold text-white mb-2">Canciones que te gustan</h3>
                        <p class="text-neutral-400 mb-6">Cuando te guste una canción, aparecerá aquí.</p>
                        <a href="home.php" class="bg-white text-black px-6 py-3 rounded-full font-semibold hover:scale-105 transition duration-200">
                            Buscar canciones
                        </a>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php if (!empty($liked_songs)): ?>
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Preparar datos de la playlist para JavaScript
    const playlistData = <?php echo json_encode($liked_songs); ?>;
    
    // Normalizar los datos para que sean consistentes con el formato esperado por app.js
    const normalizedPlaylistData = playlistData.map(song => ({
        id: song.song_id,
        song_id: song.song_id,
        title: song.song_title,
        song_title: song.song_title,
        artist: song.artist_name,
        artist_name: song.artist_name,
        album_title: song.album_title,
        file_path: song.file_path,
        duration: song.duration,
        cover_path: song.cover_path
    }));
    
    // Asignar a la variable global que usa app.js
    window.pagePlaylistData = normalizedPlaylistData;
    
    console.log('Liked songs playlist loaded:', normalizedPlaylistData);
    
    // Manejar botones de "me gusta" con efectos visuales mejorados
    const likeButtons = document.querySelectorAll('.like-button');
    
    likeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const songRow = this.closest('.song-row');
            const songId = this.dataset.songId;
            
            if (songRow && songId) {
                // Agregar efecto visual de eliminación
                songRow.style.transition = 'all 0.3s ease-out';
                songRow.style.opacity = '0.5';
                songRow.style.transform = 'translateX(-20px)';
                
                // Llamar a la función toggleLike del app.js
                if (typeof window.toggleLike === 'function') {
                    window.toggleLike(songId, this);
                } else {
                    // Fallback si no está disponible la función global
                    console.warn('toggleLike function not available globally');
                }
                
                // Después de un breve delay, verificar si se eliminó
                setTimeout(() => {
                    const heartIcon = this.querySelector('svg');
                    if (heartIcon && !heartIcon.classList.contains('text-green-500')) {
                        // La canción fue eliminada exitosamente
                        songRow.remove();
                        
                        // Actualizar contador
                        updateSongCount();
                        
                        // Actualizar índices de las filas restantes
                        updateRowIndices();
                        
                        // Si no quedan canciones, recargar para mostrar estado vacío
                        if (document.querySelectorAll('.song-row').length === 0) {
                            setTimeout(() => {
                                window.location.reload();
                            }, 500);
                        }
                    } else {
                        // Restaurar estado visual si no se eliminó
                        songRow.style.opacity = '1';
                        songRow.style.transform = 'translateX(0)';
                    }
                }, 600);
            }
        });
    });
    
    function updateSongCount() {
        const remainingSongs = document.querySelectorAll('.song-row').length;
        const counterElement = document.getElementById('songs-count');
        if (counterElement) {
            counterElement.textContent = remainingSongs;
        }
    }
    
    function updateRowIndices() {
        const songRows = document.querySelectorAll('.song-row');
        songRows.forEach((row, index) => {
            // Actualizar el número visual
            const numberCell = row.querySelector('.text-right.text-neutral-400');
            if (numberCell) {
                numberCell.textContent = index + 1;
            }
            
            // Actualizar el data-song-index
            row.dataset.songIndex = index;
        });
    }
    
    // Mejorar la visualización de la canción actual
    function highlightCurrentSong(index) {
        // Remover highlight anterior
        document.querySelectorAll('.song-row').forEach(row => {
            row.classList.remove('bg-neutral-700', 'text-green-500');
        });
        
        // Agregar highlight a la canción actual
        const currentRow = document.querySelector(`[data-song-index="${index}"]`);
        if (currentRow) {
            currentRow.classList.add('bg-neutral-700');
            const titleElement = currentRow.querySelector('.text-white.font-semibold');
            if (titleElement) {
                titleElement.classList.add('text-green-500');
            }
        }
    }
    
    // Event listener para detectar cambios de canción desde app.js
    document.addEventListener('songChanged', function(e) {
        if (e.detail && typeof e.detail.index === 'number') {
            highlightCurrentSong(e.detail.index);
        }
    });
    
    // Agregar funcionalidad al botón shuffle (opcional)
    const shuffleBtn = document.getElementById('shuffleBtn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', function() {
            // Implementar shuffle si se desea
            console.log('Shuffle clicked - functionality can be implemented');
            this.classList.toggle('text-green-500');
            this.classList.toggle('text-neutral-400');
        });
    }
});
</script>
<?php endif; ?>