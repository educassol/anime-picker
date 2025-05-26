<script setup>
import { ref, onMounted, watchEffect } from 'vue';
import Fuse from 'fuse.js';
import jikanService from '@/services/jikan';

const searchQuery = ref('');
const allAnimes = ref([]);
const suggestions = ref([]);
const animes = ref([]);
const currentPage = ref(1);
const isLoading = ref({
  initial: true,
  search: false,
  more: false
});
const error = ref(null);
const itemsPerPage = ref(24);
let fuse = null;
let page = 1;
let searchTimeout = null;
const DEBOUNCE_DELAY = 500;

// Carregar dados iniciais
onMounted(async () => {
  try {
    await loadMoreAnimes();
    initFuse();
  } catch (err) {
    error.value = 'Error loading initial data';
  } finally {
    isLoading.value.initial = false;
  }
});

// Inicializar Fuse.js
const initFuse = () => {
  fuse = new Fuse(allAnimes.value, {
    keys: ['title', 'title_english', 'title_synonyms'],
    threshold: 0.3,
    minMatchCharLength: 2,
    ignoreLocation: true
  });
};

// Carregar mais animes
const loadMoreAnimes = async () => {
  try {
    isLoading.value.more = true;
    const response = await jikanService.getTopAnimes(page, itemsPerPage.value);
    allAnimes.value = [...allAnimes.value, ...response.data.data];
    animes.value = allAnimes.value.slice(0, itemsPerPage.value);
    page++;
  } catch (err) {
    error.value = 'Error loading more animes';
  } finally {
    isLoading.value.more = false;
  }
};

// Busca híbrida
const searchHandler = async () => {
  try {
    isLoading.value.search = true;
    
    // Busca local
    const localResults = fuse.search(searchQuery.value)
      .slice(0, itemsPerPage.value)
      .map(({ item }) => item);

    // Busca na API se necessário
    if (localResults.length < itemsPerPage.value && searchQuery.value.length > 2) {
      const apiResponse = await jikanService.searchAnimes(
        searchQuery.value,
        currentPage.value,
        itemsPerPage.value
      );
      const apiResults = apiResponse.data.data
        .filter(newAnime => !allAnimes.value.some(existing => 
          existing.mal_id === newAnime.mal_id
        ));
      
      suggestions.value = [...localResults, ...apiResults].slice(0, 5);
    } else {
      suggestions.value = localResults.slice(0, 5);
    }
    
  } catch (err) {
    error.value = 'Search error';
  } finally {
    isLoading.value.search = false;
  }
};

// Selecionar anime
const selectAnime = (anime) => {
  searchQuery.value = anime.title;
  animes.value = [anime];
  suggestions.value = [];
};

// Paginação
const handlePagination = (direction) => {
  currentPage.value += direction;
  if (searchQuery.value) {
    searchHandler();
  } else {
    loadMoreAnimes();
  }
};

// Observador de busca
watchEffect(() => {
  clearTimeout(searchTimeout);
  if (searchQuery.value) {
    searchTimeout = setTimeout(searchHandler, DEBOUNCE_DELAY);
  } else {
    animes.value = allAnimes.value.slice(0, itemsPerPage.value);
    suggestions.value = [];
  }
});
</script>

<template>
  <div class="anime-search-view">
    <!-- Barra de Busca -->
    <div class="search-container">
      <div class="search-box">
        <input
          v-model="searchQuery"
          placeholder="Search anime..."
          class="search-input"
          @keyup.enter="searchHandler"
        />
        
        <!-- Sugestões de Busca -->
        <div v-if="suggestions.length" class="suggestions">
          <div
            v-for="anime in suggestions"
            :key="anime.mal_id"
            class="suggestion-item"
            @click="selectAnime(anime)"
          >
            <img
              :src="anime.images?.webp?.small_image_url"
              class="suggestion-image"
            />
            <div class="suggestion-info">
              <div class="title">{{ anime.title }}</div>
              <div class="score">⭐ {{ anime.score || 'N/A' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estados -->
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="isLoading.initial || isLoading.search" class="loading">
      {{ isLoading.initial ? 'Loading...' : 'Searching...' }}
    </div>

    <!-- Lista de Animes -->
    <div v-else class="similar-grid">
      <a 
        v-for="anime in animes" 
        :key="anime.mal_id" 
        :href="`https://myanimelist.net/anime/${anime.mal_id}`"
        target="_blank"
        class="similar-card"
      >
        <img 
          :src="anime.images?.webp?.large_image_url || '/placeholder.jpg'"
          class="similar-image"
        />
        <div class="similar-info">
          <h3>{{ anime.title }}</h3>
          <p class="synopsis">{{ anime.synopsis?.substring(0, 100) }}...</p>
          <div class="anime-details">
            <div class="detail-item">
              <span>⭐ {{ anime.score || 'N/A' }}</span>
              <span>🎬 {{ anime.episodes || 'N/A' }} eps</span>
            </div>
            <div class="detail-item">
              <span>📅 {{ anime.year || 'N/A' }}</span>
              <span>👥 {{ anime.members?.toLocaleString() || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </a>
    </div>

    <!-- Paginação -->
    <div class="pagination">
      <button 
        @click="handlePagination(-1)" 
        :disabled="currentPage === 1 || isLoading.more"
        class="pagination-button"
      >
        Previous
      </button>
      <span class="page-number">Page {{ currentPage }}</span>
      <button 
        @click="handlePagination(1)" 
        :disabled="isLoading.more"
        class="pagination-button"
      >
        Next
      </button>
    </div>
  </div>
</template>

<style scoped>

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
  position: absolute;
  width: 100%;
  max-height: 60vh;
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-top: 0.5rem;
  z-index: 1000;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.suggestion-item:hover {
  background: #f5f5f5;
}

.suggestion-image {
  width: 50px;
  height: 70px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 1rem;
}

.suggestion-info {
  flex: 1;
}

.suggestion-info .title {
  font-weight: 500;
  color: #333;
}

.suggestion-info .score {
  color: #4a90e2;
  font-size: 0.9rem;
}

.similar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
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
  padding: 1rem;
}

.similar-info h3 {
  margin: 0 0 0.5rem;
  color: #2e51a2;
  font-size: 1.1rem;
}

.synopsis {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.anime-details {
  display: grid;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  color: #444;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
}

.pagination-button {
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-button:hover:not(:disabled) {
  background: #4a90e2;
  color: white;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-number {
  color: #666;
}

.error-message {
  color: #dc3545;
  background: #f8d7da;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  text-align: center;
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
  
  .similar-info h3 {
    font-size: 1rem;
  }
  
  .synopsis {
    font-size: 0.8rem;
  }
}
</style>