<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  projectId: Number,
  platformType: String,
});
// 点击事件发送
const emit = defineEmits(['selectPackage']);

const isProd = window.location.hostname === 'mtl.int.hypergryph.com';

const iframeUrl = computed(() => {
  const url = isProd
    ? 'https://forgeon.hypergryph.net/'
    : 'https://forgeon-test.hypergryph.net/';
  return `${url}test/gamePackage?fs=1&mtl=1&platform=${
    props.platformType === 'Android' ? '1' : '2'
  }`;
});

function replaceUrl(url: string) {
  return url
    .replace('forgeon.hypergryph.net', 'tech.int.hypergryph.com')
    .replace('forgeon-test.hypergryph.net', 't-tech.int.hypergryph.com');
}

const handleIframeLoaded = () => {
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'download' && e.data?.data?.url) {
      emit('selectPackage', {
        ...e.data.data,
        url: replaceUrl(e.data.data.url),
        attachments:
          e.data.data.attachments?.map((att: string) => replaceUrl(att)) || [],
      });
    }
  });
};
</script>

<template>
  <iframe
    :src="iframeUrl"
    style="width: 100%; min-height: 800px; height: 82vh; border: none"
    @load="handleIframeLoaded()"
  ></iframe>
</template>
