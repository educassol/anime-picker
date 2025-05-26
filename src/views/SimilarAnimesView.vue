<script setup>
import { ref, onMounted, watchEffect } from 'vue';
import Fuse from 'fuse.js';
import jikanService from '@/services/jikan';

// Variáveis reativas
const searchQuery = ref('');
const allAnimes = ref([]);
const suggestions = ref([]);
const selectedAnime = ref(null);
const similarAnimes = ref([]);
const isLoading = ref({
  initial: true,
  more: false,
  apiSearch: false,
  details: false
});
const error = ref(null);
let fuse = null;
let page = 1;
let searchTimeout = null;
const DEBOUNCE_DELAY = 500;

// Carregamento inicial unificado
onMounted(async () => {
  try {
    await loadMoreAnimes();
    initFuse();
  } catch (err) {
    error.value = 'Error loading starter list';
  } finally {
    isLoading.value.initial = false;
  }
});

// Carregar mais animes com paginação
const loadMoreAnimes = async () => {
  try {
    isLoading.value.more = true;
    const response = await jikanService.getTopAnimes(page);
    allAnimes.value = [...allAnimes.value, ...response.data.data];
    page++;
    initFuse(); // Atualizar Fuse com novos dados
  } finally {
    isLoading.value.more = false;
  }
};

// Inicializar Fuse.js
const initFuse = () => {
  fuse = new Fuse(allAnimes.value, {
    keys: ['title', 'title_english', 'title_synonyms'],
    threshold: 0.3,
    minMatchCharLength: 2,
    ignoreLocation: true
  });
};

// Busca híbrida
const searchHandler = async () => {
  try {
    if (!fuse) return;

    // Busca local
    const localResults = fuse.search(searchQuery.value)
      .slice(0, 20)
      .map(({ item }) => item);

    // Busca na API se necessário
    if (localResults.length < 5 && searchQuery.value.length > 2) {
      isLoading.value.apiSearch = true;
      const apiResponse = await jikanService.searchAnime(searchQuery.value);
      const apiResults = apiResponse.data.data
        .filter(newAnime => !allAnimes.value.some(existing => 
          existing.mal_id === newAnime.mal_id
        ))
        .slice(0, 5);
      
      suggestions.value = [...localResults, ...apiResults];
    } else {
      suggestions.value = localResults;
    }
  } catch (err) {
    error.value = 'Search error';
  } finally {
    isLoading.value.apiSearch = false;
  }
};

// Selecionar anime
const selectAnime = (anime) => {
  searchQuery.value = '';
  selectedAnime.value = anime;
  searchSimilar(anime);
};

// Buscar similares
const searchSimilar = async (anime) => {
  try {
    isLoading.value.details = true;
    error.value = null;
    
    const recommendations = await jikanService.getAnimeRecommendations(anime.mal_id);
    const basicRecs = recommendations.data.data
      .filter(rec => rec.entry)
      .slice(0, 12);

    const detailedAnimes = [];
    for (const rec of basicRecs) {
      try {
        const details = await jikanService.getAnimeById(rec.entry.mal_id);
        detailedAnimes.push({
          id: rec.entry.mal_id,
          title: rec.entry.title,
          image: rec.entry.images.webp.image_url,
          score: details.data.data.score || 'N/A',
          episodes: details.data.data.episodes, // Adicione episódios
          year: details.data.data.year, // Adicione ano
          synopsis: details.data.data.synopsis, // Adicione sinopse
          votes: rec.votes,
          url: `https://myanimelist.net/anime/${rec.entry.mal_id}`
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`Erro no anime ${rec.entry.mal_id}:`, err);
        detailedAnimes.push({
          id: rec.entry.mal_id,
          title: rec.entry.title,
          image: rec.entry.images.webp.image_url,
          score: 'N/A',
          episodes: 'N/A',
          year: 'N/A',
          synopsis: null,
          votes: rec.votes,
          url: `https://myanimelist.net/anime/${rec.entry.mal_id}`
        });
      }
    }
    
    similarAnimes.value = detailedAnimes;
    
  } catch (err) {
    error.value = 'Error finding similar animes: ' + err.message;
  } finally {
    isLoading.value.details = false;
  }
};

// Scroll infinito
const handleScroll = (e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target;
  if (scrollHeight - scrollTop <= clientHeight + 100) {
    loadMoreAnimes();
  }
};

// Observador de busca
watchEffect(() => {
  clearTimeout(searchTimeout);
  if (searchQuery.value) {
    searchTimeout = setTimeout(searchHandler, DEBOUNCE_DELAY);
  } else {
    suggestions.value = [];
  }
});
</script>

<template>
  <div class="anime-search-view">
    <div class="search-container">
      <div class="search-box">
        <input
          v-model="searchQuery"
          placeholder="Search an anime..."
          class="search-input"
          @scroll.passive="handleScroll"
        >
        
        <div v-if="suggestions.length" class="suggestions">
          <div
            v-for="anime in suggestions"
            :key="anime.mal_id"
            class="suggestion-item"
            @click="selectAnime(anime)"
          >
            <img
              :src="anime.images.webp.small_image_url"
              class="suggestion-image"
            />
            <div class="suggestion-info">
              <div class="title">{{ anime.title }}</div>
              <div v-if="anime.title_english" class="english-title">
                {{ anime.title_english }}
              </div>
              <div class="score">⭐ {{ anime.score || 'N/A' }}</div>
            </div>
          </div>
          <div v-if="isLoading.apiSearch" class="loading-more">
            Searching...
          </div>
        </div>
      </div>

      <!-- Progresso -->
      <div v-if="isLoading.details" class="loading">
      <div class="progress">Searching, please wait...</div>
      </div>

      <!-- Seção de anime selecionado -->
      <div v-if="selectedAnime" class="selected-anime">
        

        <!-- Seção de animes similares -->
        <div v-if="similarAnimes.length" class="similar-animes">
    <h3>Similar animes to: {{ selectedAnime.title }}</h3>
    <div class="similar-grid">
      <a
        v-for="anime in similarAnimes"
        :key="anime.id"
        :href="anime.url"
        target="_blank"
        class="similar-card"
      >
        <img :src="anime.image" class="similar-image" />
        <div class="similar-info">
          <h3>{{ anime.title }}</h3>
          <!-- Adicione a descrição -->
          <p class="synopsis" v-if="anime.synopsis">
            {{ anime.synopsis.substring(0, 100) }}...
          </p>
          <div class="anime-details">
            <!-- Adicione os episódios -->
            <div class="detail-item">
              <span>⭐ {{ anime.score || 'N/A' }}</span>
              <span>🎬 {{ anime.episodes || 'N/A' }} eps</span>
            </div>
            <div class="detail-item">
              <span>👍 {{ anime.votes }} votes</span>
              <span>📅 {{ anime.year || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </a>
    </div>
  </div>
      </div>

      <!-- Estados de loading e erro -->
      <div v-if="isLoading.details" class="loading">
        Loading details...
      </div>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.synopsis {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0.5rem 0;
}

.anime-details {
  display: grid;
  gap: 0.5rem;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  color: #444;
}
.loading .progress {
  margin: 1rem 0;
  color: #4a90e2;
  font-weight: 500;
}
.search-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 1rem;
}
h3{
  color: white;
}
.search-input {
  width: 100%;
  padding: 0.5rem;
  font-size: 1.1rem;
  border: 2px solid #4a90e2;
  border-radius: 8px;
  margin-bottom: 0;
}

.suggestions {
  max-height: 60vh;
  overflow-y: auto;
  display: grid;
  gap: 0.5rem;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  cursor: pointer;
  color: white;
  border-bottom: 1px solid #eee;
  border-radius: 6px;
  transition: background 0.2s;
}

.suggestion-item:hover {
  background: #4a90e2;
}

.suggestion-image {
  width: 50px;
  height: 70px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 1rem;
}

.selected-anime {
  margin-top: 2rem;
}

.anime-card {
  display: flex;
  gap: 2rem;
  margin: 2rem 0;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.anime-image {
  width: 200px;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
}

.similar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.similar-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  text-decoration: none;
  color: inherit;
}

.similar-card:hover {
  transform: translateY(-3px);
}

.similar-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.similar-info {
  padding: 0.5rem; 
}

.similar-info h3 {
  margin: 0;
  color: black;
}

.error-message {
  color: #dc3545;
  background: #f8d7da;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

p {
  color: black;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

@media (max-width: 768px) {
  .similar-grid {
    grid-template-columns: 1fr;
  }
  
  .anime-card {
    flex-direction: column;
  }
  
  .anime-image {
    width: 100%;
    height: auto;
  }
}
</style>