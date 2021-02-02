<template>
  <div id="mainMap"></div>
</template>

<script lang="ts">
import { Component, Vue, Mixins } from 'vue-property-decorator';
import { ThreeMap } from '@/views/map/map';

@Component({ name: 'MainMap' })
export default class MainMap extends Vue {
  // eslint-disable-next-line class-methods-use-this
  mounted() {
    const map = new ThreeMap('mainMap');
    debugger;
  }
}
</script>

<style scoped>
html body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#mainMap {
  position: absolute;
  z-index: 2;
  background: white;
  padding: 10px;
  visibility: hidden;
}
</style>
