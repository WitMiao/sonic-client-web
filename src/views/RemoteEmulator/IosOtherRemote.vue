<template>
  <div
    v-loading="loading"
    style="
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      min-height: 100%;
      max-height: calc(100vh - 200px);
    "
  >
    <canvas
      :id="`iosCap${id}`"
      style="
        display: inline-block;
        min-height: calc(100% - 20px);
        max-height: calc(100vh - 220px);
        max-width: 400px;
      "
      :style="{
        width:
          directionStatus.value === 0 || directionStatus.value === 180
            ? 'auto'
            : canvasRectInfo.width || '100%',
        height: canvasRectInfo.height,
      }"
    />
    <div :style="{ marginTop: loading ? '20px' : undefined }">
      {{ deviceName }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from '@/http/axios';
import { ElMessage } from 'element-plus';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const props = withDefaults(
  defineProps<{
    canvasRectInfo?: Record<string, any>;
    id?: string;
    directionStatus?: Record<string, any>;
    webSocketParams?: Record<string, any>;
  }>(),
  {
    canvasRectInfo: () => ({}),
    id: '',
    directionStatus: () => ({}),
    webSocketParams: () => ({}),
  }
);

const emit = defineEmits(['close']);

const device = ref();
const agent = ref();
const route = useRoute();
const websocket = ref();
const screenWebsocket = ref();
const oldBlob = ref();
const loading = ref(false);
const imgWidth = ref(0);
const imgHeight = ref(0);
// 旋转状态 // 0 90 180 270
// const directionStatus = ref({
//   value: 0,
// });
const deviceName = computed(() => {
  return device.value?.chiName || device.value?.name;
});

const screenWebsocketOnmessage = (message: any) => {
  oldBlob.value = message.data;
  const blob = new Blob([message.data], { type: 'image/jpeg' });
  const URL = window.URL || window.webkitURL;
  const img = new Image();
  const canvas = document.getElementById(
    `iosCap${props.id}`
  ) as HTMLCanvasElement;
  const g = canvas.getContext('2d') as CanvasRenderingContext2D;
  img.onload = () => {
    // 不根据按钮组，使用数据源的分辨率点对点
    const { width } = img;
    const { height } = img;
    canvas.width = width;
    canvas.height = height;
    g.drawImage(img, 0, 0, width, height);
  };
  const u = URL.createObjectURL(blob);
  img.src = u;
};
const close = () => {
  websocket.value?.close();
  screenWebsocket.value?.close();
  emit('close', props.id);
};

const websocketOnmessage = (message: any) => {
  switch (JSON.parse(message.data).msg) {
    case 'openDriver': {
      if (JSON.parse(message.data).status === 'success') {
        imgWidth.value = JSON.parse(message.data).width;
        imgHeight.value = JSON.parse(message.data).height;
        loading.value = false;
      }
      break;
    }
    case 'error': {
      ElMessage.error({
        message: `系统出现异常！【${deviceName.value}】已断开远程控制！`,
      });
      close();
      break;
    }
    case 'stopDebug': {
      ElMessage.error({
        message: `【${deviceName.value}】已断开`,
      });
      close();
      break;
    }
    case 'exitUse':
    case 'timeout': {
      close();
      break;
    }
    default:
      break;
  }
};
const openSocket = (host: string, port: string, key: string, udId: string) => {
  if ('WebSocket' in window) {
    websocket.value = new WebSocket(
      `ws://${host}:${port}/websockets/ios/${key}/${udId}/${localStorage.getItem(
        'SonicToken'
      )}`
    );
    screenWebsocket.value = new WebSocket(
      `ws://${host}:${port}/websockets/ios/screen/${key}/${udId}/${localStorage.getItem(
        'SonicToken'
      )}`
    );
  } else {
    // console.error($t('androidRemoteTS.noWebSocket'));
  }
  websocket.value.onmessage = websocketOnmessage;
  // websocket.onclose = () => {};
  websocket.value.onopen = () => {
    websocket.value.send(
      JSON.stringify({
        type: 'useTime',
        detail: route.query.useTime,
      })
    );
  };
  screenWebsocket.value.onmessage = screenWebsocketOnmessage;
  // screenWebsocket.value.onclose = () => {};
  screenWebsocket.value.onopen = () => {
    screenWebsocket.value.send(
      JSON.stringify({
        type: 'useTime',
        detail: route.query.useTime,
      })
    );
  };
};

const getDeviceById = (id: string) => {
  loading.value = true;
  axios.get('/controller/devices', { params: { id } }).then((resp) => {
    if (resp.code === 2000) {
      device.value = resp.data;
      axios
        .get('/controller/agents', { params: { id: device.value.agentId } })
        .then((res) => {
          if (res.code === 2000) {
            agent.value = res.data;
            openSocket(
              agent.value.host,
              agent.value.port,
              agent.value.secretKey,
              device.value.udId
            );
          }
        });
    }
  });
};
onMounted(async () => {
  await getDeviceById(props.id);
});

watch(
  () => props.webSocketParams,
  (newValue) => {
    if (newValue?.type === 'close') {
      close();
    } else if (newValue?.adaptFunction) {
      websocket.value?.send(
        JSON.stringify({
          ...newValue,
          ...newValue.adaptFunction(imgWidth.value, imgHeight.value),
          adaptFunction: undefined,
        })
      );
    } else {
      websocket.value?.send(JSON.stringify(newValue || {}));
    }
  },
  {
    deep: true,
  }
);
</script>
