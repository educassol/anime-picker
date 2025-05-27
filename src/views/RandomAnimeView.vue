<script setup>
import { ref, onMounted } from 'vue';
import jikanService from '@/services/jikan';

const selectedGenres = ref([]); // Alterado para array
const genres = ref([]);
const randomAnime = ref(null);
const isLoading = ref(false);
const error = ref(null);
const showGenreFilters = ref(false);

onMounted(async () => {
  try {
    const response = await jikanService.getGenres();
    genres.value = response.data.data;
  } catch (err) {
    error.value = 'Error loading genres';
  }
});

const fetchRandomAnime = async () => {
  try {
    resetState();
    isLoading.value = true;
    const response = await jikanService.getRandomAnime();
    randomAnime.value = response.data.data;
  } catch (err) {
    error.value = 'Error searching random anime';
  } finally {
    isLoading.value = false;
  }
};

const fetchRandomByGenres = async () => {
  try {
    resetState();
    isLoading.value = true;

    const genreString = selectedGenres.value.join(',');
    const response = await jikanService.getAnimeByGenre(genreString);
    const animeList = response.data.data;

    if (animeList.length > 0) {
      const randomIndex = Math.floor(Math.random() * animeList.length);
      randomAnime.value = animeList[randomIndex];
    } else {
      error.value = 'No animes with this genres!';
    }
  } catch (err) {
    error.value = 'Error searching genres';
  } finally {
    isLoading.value = false;
    showGenreFilters.value = false; 
  }
};
const truncateSynopsis = (text) => {
  if (!text) return '';
  const screenWidth = window.innerWidth;
  const maxLength = screenWidth < 480 ? 200 : 500;
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};
const toggleFilters = () => {
  showGenreFilters.value = !showGenreFilters.value;
};
const resetState = () => {
  randomAnime.value = null;
  error.value = null;
};
</script>

<template>
  <div class="random-anime-view">
    <div class="controls">
      <div class="filter-controls">
        <button @click="toggleFilters" class="filter-button" :class="{ active: showGenreFilters }">
          {{ showGenreFilters ? 'Hide Filters' : 'Filter' }}
        </button>

        <transition name="fade">
  <div v-if="showGenreFilters">
    <div class="genre-overlay" @click="toggleFilters"></div>
    <div class="genre-selection">
      <div class="genre-options">
        <label 
          v-for="genre in genres" 
          :key="genre.mal_id" 
          class="genre-checkbox"
        >
          <input 
            type="checkbox" 
            :value="genre.mal_id" 
            v-model="selectedGenres"
          >
          <span class="checkmark"></span>
          {{ genre.name }}
        </label>
      </div>
    </div>
  </div>
</transition>
      </div>

      <button @click="selectedGenres.length > 0 ? fetchRandomByGenres() : fetchRandomAnime()" :disabled="isLoading"
        class="random-button">
        {{ isLoading ? 'Searching...' : 'Pick!' }}
      </button>
    </div>


    <!-- Mensagens de Erro -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Resultado -->
    <div v-if="randomAnime" class="anime-card">
      <img :src="randomAnime.images.webp.large_image_url" :alt="randomAnime.title" class="anime-image" />
      <div class="anime-info">
        <h2>{{ randomAnime.title }}</h2>
        <div class="details">
          <span>⭐ {{ randomAnime.score || 'N/A' }} &nbsp;</span>
          <span>🎬 {{ randomAnime.episodes || 'N/A' }} episodes &nbsp;</span>
          <span>📅 {{ randomAnime.year || 'N/A' }} &nbsp;</span>
          <a :href="'https://myanimelist.net/anime/' + randomAnime.mal_id" target="_blank" rel="noopener noreferrer"
            class="mal-link">
            <img src="https://cdn.myanimelist.net/img/sp/icon/apple-touch-icon-256.png" alt="MAL icon" class="mal-icon">
            MyAnimeList
          </a>
        </div>
        <p class="synopsis">{{ truncateSynopsis(randomAnime.synopsis) }}</p>
        <div class="genres">
          <span v-for="genre in randomAnime.genres" :key="genre.mal_id" class="genre-tag">
            {{ genre.name }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.genre-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* Animação melhorada */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from .genre-selection,
.fade-leave-to .genre-selection {
  transform: translate(-50%, -30%);
  opacity: 0;
}
.anime-image {
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
}

.genre-tag {
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
}

.filter-button, .random-button {
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
}
.mal-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2e51a2;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 4px;
  background-color: #f5f5f5;
  white-space: nowrap;
  transition: background-color 0.2s;
}

.mal-link:hover {
  background-color: #eee;
  text-decoration: none;
}

.mal-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.controls {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  margin-bottom: 2rem;
}

.filter-controls {
  position: relative;
  display: inline-block;
}

.filter-button {
  margin-top: 0;
  padding: 0.6rem 1.2rem;
  color: #333;
  border: 1px solid #ddd;
  margin-right: 1rem;
  transition: all 0.2s;
}

.filter-button.active {
  background: #4a90e2;
  color: white;
  border-color: #4a90e2;
}

.genre-selection {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  z-index: 1000;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 800px;
  max-height: 60vh;
  overflow-y: auto;
}

.genre-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.random-button {
  margin-top: 0;
  width: 100vw;
  padding: 0.6rem 1.2rem;
  color: #333;
  border: 1px solid #ddd;
  margin-right: 1rem;
  transition: all 0.2s;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

label {
  color: white;
}

.genre-selection {
  margin: 1rem 0;
  max-width: 800px;
}

.genre-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  padding: 0rem;
  max-height: 150px;
  overflow-y: auto;
  justify-content: center;
}

.genre-checkbox {
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  padding: 0.5rem 1rem;
  background-color: #4a90e2;
  border-radius: 3px;
  transition: all 0.2s;
}

.genre-checkbox:hover {
  background-color: #4a4fe2;
}

.genre-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: relative;
  height: 18px;
  width: 18px;
  background-color: #fff;
  border: 2px solid #ccc;
  border-radius: 4px;
  margin-right: 8px;
}

.genre-checkbox input:checked~.checkmark {
  background-color: #4abd56;
  border-color: #ccc;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.genre-checkbox input:checked~.checkmark:after {
  display: block;
}

button {
  margin-top: 1rem;
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
}

h2 {
  color: black;
}

.details {
  color: black;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 1rem;
  flex-wrap: wrap;
}

.details-left {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.random-anime-view {
  max-width: 800px;
  margin: 1rem auto;
  padding: 0 0rem;
}

select {
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 1rem;
}

button {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

button:not(:disabled) {
  background: #4a90e2;
  color: white;
  cursor: pointer;
}

button:disabled {
  background: #b0b0b0;
}

.anime-card {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.anime-image {
  width: 100%;
  height: 350px;
  object-fit: cover;
  border-radius: 8px;
}

.anime-info {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.meta-info {
  display: flex;
  gap: 1.5rem;
  font-size: 0.95rem;
  color: #666;
}

.synopsis {
  line-height: 1.6;
  color: #444;
  font-size: 0.95rem;
  word-break: break-word;
  overflow-wrap: break-word;
}

.actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.genre-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.genre-tag {
  background: #4a90e2;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #ffffff;
}
@media (min-width: 769px) {
  .genre-overlay {
    display: none;
  }
  
  .genre-selection {
    width: 800px; /* Largura maior para desktop */
  }
}
@media (max-width: 768px) {
  .anime-card {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }

  .anime-image {
    height: auto;
    max-height: 400px;
  }

  .details {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .genre-selection {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 400px;
    margin: 0;
  }

  .genre-overlay {
    display: block;
  }

  .controls {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .random-anime-view {
    padding: 0 1rem;
  }

  .anime-info h2 {
    font-size: 1.5rem;
  }

  .details > span {
    font-size: 0.9rem;
  }

  .synopsis {
    font-size: 0.85rem;
  }

  .mal-link {
    width: 100%;
    justify-content: center;
  }
}
</style>