<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <img alt="Anime Picker logo" class="logo" src="@/assets/logo.svg"/>
    
    <div class="wrapper">

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/similaranimes">Similar Animes</RouterLink>
        <RouterLink to="/animes">Top Animes</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header>

  <main>
  <RouterView />
  </main>

  <footer>© 2025 AnimePicker. Made by Eduardo Cassol.</footer>
</template>

<style scoped>
main{
  margin-top: 2rem;
  padding: 0 1rem;
  min-height:75vh;
}

header {
  line-height: 1;
  width: 100%;
  text-align: center;
  padding: 10px 0;
  margin: 0;
}

.logo {
  width: 360px;
  height: auto;
  margin: 0 auto !important;
  display: block;
}

footer {
  margin-top: auto;
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: block;
  }

  .logo {
    margin: 0 auto 1rem;
    display: inline-block;
  }

  header .wrapper {
    display: block;
    
  }

  nav {
    text-align: center;
    margin-left: 0;

    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 0;
  }
  
}
</style>
