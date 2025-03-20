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
    <video
      :id="`scrcpy-video${id}`"
      style="
        display: inline-block;
        min-height: calc(100% - 20px);
        max-height: calc(100vh - 220px);
        max-width: 400px;
      "
      :style="{
        width:
          directionStatus?.value === 0 || directionStatus?.value === 180
            ? 'auto'
            : canvasRectInfo?.width || '100%',
        height: canvasRectInfo?.height,
      }"
      autoplay
      muted
    />
    <div :style="{ marginTop: loading ? '20px' : undefined }">
      {{ deviceName }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import axios from '@/http/axios';
import { isHttpProtocol } from '@/utils/index';
import { ElMessage } from 'element-plus';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Scrcpy from './Scrcpy';

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

const wsUrl = isHttpProtocol ? 'ws' : 'wss';
const locationHost =
  process.env.NODE_ENV === 'development'
    ? 't-mtl.int.hypergryph.com'
    : window.location.host;

const route = useRoute();
const scrcpy = ref();
const screenWebsocket = ref();
const websocket = ref();
// 旋转状态 // 0 90 180 270
const loading = ref(false);
const device = ref();
const agent = ref();
const oldBlob = ref();
// const audioPlayer = null;
const imgWidth = ref(0);
const imgHeight = ref(0);

const deviceName = computed(() => {
  return device.value?.chiName || device.value?.name;
});

const close = () => {
  if (websocket.value) {
    websocket.value.close();
    websocket.value = null;
  }
  if (screenWebsocket.value) {
    screenWebsocket.value.close();
    screenWebsocket.value = undefined;

    scrcpy.value?.destroy();
    scrcpy.value = undefined;
  }
  // video的src变灰
  emit('close', props.id);
  //   if (audioPlayer !== null) {
  //     destroyAudio();
  //   }
};

const screenWebsocketOnmessage = (message: any) => {
  if (typeof message.data === 'object') {
    oldBlob.value = message.data;
    const blob = new Blob([message.data], { type: 'image/jpeg' });
    const URL = window.URL || window.webkitURL;
    const image = new Image();
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const g = canvas.getContext('2d') as CanvasRenderingContext2D;
    image.onload = () => {
      // 不根据按钮组，使用数据源的分辨率点对点
      const { width } = image;
      const { height } = image;
      canvas.width = width;
      canvas.height = height;
      g.drawImage(image, 0, 0, width, height);
    };
    const u = URL.createObjectURL(blob);
    image.src = u;
  } else {
    switch (JSON.parse(message.data).msg) {
      case 'rotation': {
        if (props.directionStatus?.value !== -1) {
          loading.value = true;
        }
        // 旋转需要重置一下jmuxer
        // 重置播放器
        scrcpy.value?.jmuxer?.reset();
        break;
      }
      case 'support': {
        ElMessage.error({
          message: JSON.parse(message.data).text,
        });
        loading.value = false;
        break;
      }
      case 'size': {
        imgWidth.value = JSON.parse(message.data).width;
        imgHeight.value = JSON.parse(message.data).height;
        loading.value = false;
        break;
      }
      case 'picFinish': {
        loading.value = false;
        break;
      }
      case 'timeout': {
        close();
        break;
      }
      case 'error': {
        ElMessage.error({
          message: `系统出现异常！【${deviceName.value}】已断开远程控制！`,
        });
        close();
        break;
      }
      default:
        break;
    }
  }
};

const websocketOnmessage = (message: any) => {
  switch (JSON.parse(message.data).msg) {
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

const openSocket = (host: string, port: number, key: string, udId: string) => {
  if ('WebSocket' in window) {
    websocket.value = new WebSocket(
      `${wsUrl}://${locationHost}/websockets/${host}/android/${key}/${udId}/${
        route.query.useTime
      }/${localStorage.getItem('SonicToken')}`
    );

    scrcpy.value = new Scrcpy({
      socketURL: `${wsUrl}://${locationHost}/websockets/${host}/android/screen/${key}/${udId}/${localStorage.getItem(
        'SonicToken'
      )}`,
      node: `scrcpy-video${props.id}`,
      onmessage: screenWebsocketOnmessage,
      excuteMode: 'Scrcpy',
    });
    screenWebsocket.value = scrcpy.value.websocket;
    screenWebsocket.value.onopen = () => {
      screenWebsocket.value.send(
        JSON.stringify({
          type: 'useTime',
          detail: route.query.useTime,
        })
      );
    };
    websocket.value.onmessage = websocketOnmessage;
    // websocket.value.onclose = (e) => {};
    websocket.value.onopen = () => {
      websocket.value.send(
        JSON.stringify({
          type: 'useTime',
          detail: route.query.useTime,
        })
      );
    };
    //
  } else {
    console.error('连接失败');
  }
};

const getDeviceById = async (id: string) => {
  const deviceResp = await axios.get('/controller/devices', { params: { id } });
  if (deviceResp.code === 2000) {
    device.value = deviceResp.data;
    const agentResp = await axios.get('/controller/agents', {
      params: { id: device.value.agentId },
    });
    if (agentResp.code === 2000) {
      agent.value = agentResp.data;
      openSocket(
        agent.value.host,
        agent.value.port,
        agent.value.secretKey,
        device.value.udId
      );
    }
  }
};

onMounted(async () => {
  await getDeviceById(props.id as string);
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
