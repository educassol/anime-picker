import axios from 'axios';

const jikanApi = axios.create({
  baseURL: 'https://api.jikan.moe/v4/',
  timeout: 5000,
});
let controller = null;
export default {
  // Buscar anime por ID
  getAnimeById(id) {
    return axios.get(`https://api.jikan.moe/v4/anime/${id}`);
  },

  // Buscar top animes
  getTopAnimes(page = 1, limit = 24) {
    return jikanApi.get('top/anime', { params: { page, limit } });
  },

  // Buscar animes por nome
  searchAnimes(query, page = 1, limit = 24) {
    return jikanApi.get('anime', { params: { q: query, page, limit } });
  },

  getRandomAnime() {
    return jikanApi.get('random/anime');
  },

  // Buscar todos os gêneros disponíveis
  getGenres() {
    return jikanApi.get('genres/anime');
  },

 // Buscar animes por gênero
 getAnimeByGenre(genreId, page = 1) {
  return jikanApi.get('anime', {
    params: {
      genres: genreId,
      page: page,
      limit: 25 // Máximo permitido pela API
    }
  });
  },
  
  searchAnime(query) {
    if (controller) controller.abort();
    controller = new AbortController();
    
    return axios.get(`https://api.jikan.moe/v4/anime?q=${query}&sfw&limit=5`, {
      signal: controller.signal
    });
  },

  getAnimeRecommendations(id) {
    return axios.get(`https://api.jikan.moe/v4/anime/${id}/recommendations`);
  }
};