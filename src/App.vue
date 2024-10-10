<script setup>
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import './assets/dark.css';
import './assets/light.css';
import { getElementPlusLocale } from './locales/setupI18n';

const store = useStore();
const locale = ref(getElementPlusLocale());
const storelocale = computed(() => {
  return store.getters.getLocale;
});
// 监听语言切换
watch(storelocale, () => {
  locale.value = getElementPlusLocale();
});
</script>

<template>
  <el-config-provider :locale="locale">
    <router-view />
  </el-config-provider>
</template>

<style>
@import './assets/common.css';
</style>
