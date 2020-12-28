<template>
  <div id="app">
    <LoadScreen v-if="showFileLoader" @start="startRendering"></LoadScreen>
    <Renderer v-else />
  </div>
</template>

<script lang="ts">
import LoadScreen from './components/LoadScreen.vue'
import Renderer from './components/Renderer.vue'

import { Component, Vue } from 'vue-property-decorator'

@Component({
  components: {
    Renderer,
    LoadScreen,
  },
})
export default class App extends Vue {
  private showFileLoader = true

  startRendering(): void {
    this.showFileLoader = false
  }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  position: relative;
  min-height: 100%;
}

body {
  height: 100vh;
  margin: 0px;
  padding: 0px;
  color: white;
  background-color: rgb(59, 57, 63);
}
</style>
