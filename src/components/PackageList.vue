<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  projectId: Number,
  platformType: String,
});
// 点击事件发送
const emit = defineEmits(['selectPackage']);

const iframeUrl = computed(() => {
  return `https://forgeon-test.hypergryph.net/test/gamePackage?fs=1&mtl=1&platform=${
    props.platformType === 'Android' ? '1' : '2'
  }`;
});

function replaceUrl(url: string) {
  return url.replace(
    'forgeon-test.hypergryph.net',
    't-tech.int.hypergryph.com'
  );
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
