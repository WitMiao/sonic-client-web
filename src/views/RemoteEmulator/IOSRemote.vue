<script setup>
/*
 *   sonic-client-web  Front end of Sonic cloud real machine platform.
 *   Copyright (C) 2022 SonicCloudOrg
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Affero General Public License as published
 *   by the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Affero General Public License for more details.
 *
 *   You should have received a copy of the GNU Affero General Public License
 *   along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import defaultLogo from '@/assets/logo.png';
import ElementUpdate from '@/components/ElementUpdate.vue';
import PackageList from '@/components/PackageList.vue';
import Pageable from '@/components/Pageable.vue';
import StepList from '@/components/StepList.vue';
import StepLog from '@/components/StepLog.vue';
import TestCaseList from '@/components/TestCaseList.vue';
import axios from '@/http/axios';
import {
  Camera,
  Cellphone,
  Delete,
  Download,
  House,
  InfoFilled,
  Location,
  Minus,
  Operation,
  Phone,
  PhoneFilled,
  Place,
  Plus,
  Pointer,
  Position,
  Search,
  SwitchButton,
  VideoCamera,
} from '@element-plus/icons';
import { ElMessage } from 'element-plus';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import useClipboard from 'vue-clipboard3';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import IOSPerf from '../../components/IOSPerf.vue';
import PocoPane from '../../components/PocoPane.vue';
import RemotePageHeader from '../../components/RemotePageHeader.vue';
import RenderDeviceName from '../../components/RenderDeviceName.vue';
import IOSOtherRemote from './IosOtherRemote.vue';

const pocoPaneRef = ref(null);
const iosPerfRef = ref(null);
const { t: $t } = useI18n();
const { toClipboard } = useClipboard();
const route = useRoute();
const store = useStore();
const router = useRouter();
const iFrameHeight = ref(0);
const terminalHeight = ref(0);
const caseList = ref(null);
const device = ref({});
const agent = ref({});
const uploadUrl = ref('');
const text = ref({ content: '' });
const imgWidth = ref(0);
const imgHeight = ref(0);
const loading = ref(false);
const pocoLoading = ref(false);
const appList = ref([]);
const filterAppText = ref('');
// 旋转状态 // 0 90 180 270
const directionStatus = ref({
  value: 0,
});
const moveX = ref(0);
const moveY = ref(0);
const depth = ref(50);
const isFixTouch = false;
const isPress = false;
let loop = null;
let time = 0;
let isLongPress = false;
const screenMode = ref(window.localStorage.getItem('screenMode') || 'Scrcpy'); // Scrcpy,Minicap
const mouseMoveTime = 0;
const remoteWDAPort = ref(0);
const remoteSIBPort = ref(0);
const elementLoading = ref(false);
const isShowImg = ref(false);
const isDriverFinish = ref(false);
const imgUrl = ref('');
const activity = ref('');
const isShowTree = ref(false);
const elementData = ref([]);
const elementDetail = ref(null);
const elementScreenLoading = ref(false);
const tree = ref(null);
const proxyWebPort = ref(0);
const proxyConnPort = ref(0);
const currentId = ref([]);
const filterText = ref('');
const project = ref(null);
const testCase = ref({});
const activeTab = ref('main');
const activeTab2 = ref('step');
const stepLog = ref([]);
const debugLoading = ref(false);
const checkElementLoading = ref(false);
const dialogElement = ref(false);
const dialogImgElement = ref(false);
const imgElementUrl = ref(null);
const updateImgEle = ref(null);
const title = ref('');
const uploadLoading = ref(false);
const location = ref(false);
const screenFps = ref('high');
const isWebView = ref(true);
const webViewListDetail = ref([]);
const iframeUrl = ref('');
const webViewLoading = ref(false);
const isMultiple = ref(false);
const controlsMachine = ref([]);
const element = ref({
  id: null,
  moduleId: 0,
  eleName: '',
  eleType: 'image',
  eleValue: '',
  projectId: 0,
});

const webSocketParams = ref({});

const computedCenter = (x, y, width, height) => {
  const reX = parseInt(parseInt(x, 10) + parseInt(width, 10) / 2, 10);
  const reY = parseInt(parseInt(y, 10) + parseInt(height, 10) / 2, 10);
  return `${reX},${reY}`;
};
const img = import.meta.globEager('../../assets/img/*');
const websocket = ref();
const terminalWebsocket = ref();
const screenWebsocket = ref();

defineProps({
  tabPosition: String,
  canvasRectInfo: Object,
  layoutSplitInfo: Object,
  isSplitPressing: Boolean,
  lineMouseup: Function,
  lineMousemove: Function,
  lineMousedown: Function,
  lineMouseleave: Function,
});

const tabWebView = (port, id, transTitle) => {
  title.value = transTitle;
  isWebView.value = false;
  iframeUrl.value = `/chrome/devtools/inspector.html?ws=${agent.value.host}:${agent.value.port}/websockets/webView/${agent.value.secretKey}/${port}/${id}`;
  nextTick(() => {
    iFrameHeight.value = document.body.clientHeight - 180;
  });
};

const switchIsWebView = () => {
  isWebView.value = true;
};
const setOtherWebSocketParams = (param) => {
  webSocketParams.value = param;
};
const getWebViewForward = () => {
  webViewLoading.value = true;
  websocket.value.send(
    JSON.stringify({
      type: 'forwardView',
    })
  );
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'forwardView',
    });
  }
};

/**
 * app列表处理
 */
const appListPageData = ref([]);
const currAppListPageIndex = ref(0);
const currAppListPageData = ref([]);
// 转换分页数组
const transformPageable = (data) => {
  const pageSize = 7;
  const len = data.length;
  let start = 0;
  let end = pageSize;
  // 重置分页数组
  appListPageData.value = [];
  while (end <= len) {
    appListPageData.value.push(data.slice(start, end));
    start = end;
    end += pageSize;
  }
  if (len % pageSize) {
    appListPageData.value.push(data.slice(start, len));
  }
  currAppListPageData.value = appListPageData.value[currAppListPageIndex.value];
};
const changeAppListPage = (pageNum) => {
  currAppListPageIndex.value = pageNum - 1;
  currAppListPageData.value = appListPageData.value[currAppListPageIndex.value];
};
const filterTableData = computed(() => {
  const list = appList.value.filter(
    (data) =>
      !filterAppText.value ||
      data.name.toLowerCase().includes(filterAppText.value.toLowerCase()) ||
      data.bundleId.toLowerCase().includes(filterAppText.value.toLowerCase())
  );
  transformPageable(list);
  return list;
});
const simLocation = ref({
  long: 0.0,
  lat: 0.0,
});
const locationSet = () => {
  const params = {
    type: 'location',
    detail: 'set',
    long: `${simLocation.value.long}`,
    lat: `${simLocation.value.lat}`,
  };
  websocket.value.send(JSON.stringify(JSON.stringify(params)));
  if (isMultiple.value) {
    setOtherWebSocketParams(params);
  }

  ElMessage.success({
    message: $t('IOSRemote.startSimulating'),
  });
};
const locationUnset = () => {
  websocket.value.send(
    JSON.stringify({
      type: 'location',
      detail: 'unset',
    })
  );
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'location',
      detail: 'unset',
    });
  }
  ElMessage.success({
    message: $t('IOSRemote.positioningRestored'),
  });
};
const switchScreen = () => {
  websocket.value.send(
    JSON.stringify({
      type: 'screen',
      detail: screenFps.value,
    })
  );
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'screen',
      detail: screenFps.value,
    });
  }
};
const openApp = (pkg) => {
  websocket.value.send(
    JSON.stringify({
      type: 'launch',
      pkg,
    })
  );
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'launch',
      pkg,
    });
  }
};
const killApp = (pkg) => {
  websocket.value.send(
    JSON.stringify({
      type: 'kill',
      pkg,
    })
  );
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'kill',
      pkg,
    });
  }
  ElMessage.success({
    message: $t('androidRemoteTS.code.killMsg'),
  });
};
const refreshAppList = (noMsg = false) => {
  appList.value = [];
  if (!noMsg) {
    ElMessage.success({
      message: $t('IOSRemote.loadingAppList'),
    });
  }
  terminalWebsocket.value.send(
    JSON.stringify({
      type: 'appList',
    })
  );
};
const uninstallApp = (pkg) => {
  ElMessage.success({
    message: $t('androidRemoteTS.startUninstall'),
  });
  websocket.value.send(
    JSON.stringify({
      type: 'uninstallApp',
      detail: pkg,
    })
  );
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'uninstallApp',
      detail: pkg,
    });
  }
};
const startProxy = () => {
  websocket.value.send(
    JSON.stringify({
      type: 'proxy',
    })
  );
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'proxy',
    });
  }
};
const installCert = () => {
  websocket.value.send(
    JSON.stringify({
      type: 'installCert',
    })
  );
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'installCert',
    });
  }
};
const saveEle = () => {
  updateImgEle.value.validate((valid) => {
    if (valid) {
      element.value.eleType = 'image';
      element.value.eleValue = imgElementUrl.value;
      element.value.projectId = project.value.id;
      axios.put('/controller/elements', element.value).then((resp) => {
        if (resp.code === 2000) {
          ElMessage.success({
            message: resp.message,
          });
          dialogImgElement.value = false;
        }
      });
    }
  });
};
const switchTabs = (e) => {
  if (e.props.name === 'apps' || e.props.name === 'perfmon') {
    if (appList.value.length === 0) {
      refreshAppList();
    }
  }
};
const switchLocation = () => {
  location.value = !location.value;
  ElMessage.success({
    message: $t('IOSRemote.calibration'),
  });
};
const selectCase = (val) => {
  ElMessage.success({
    message: $t('androidRemoteTS.associationSuccess'),
  });
  testCase.value = val;
};
const removeCase = () => {
  testCase.value = {};
};
const getImg = (name) => {
  let result;
  if (name === 'meizu') {
    name = 'Meizu';
  }
  if (name === 'LENOVO') {
    name = 'Lenovo';
  }
  try {
    result = img[`../../assets/img/${name}.jpg`].default;
  } catch {
    result = img['../../assets/img/unName.jpg'].default;
  }
  return result;
};

const install = (ipa) => {
  if (ipa.length > 0) {
    websocket.value.send(
      JSON.stringify({
        type: 'debug',
        detail: 'install',
        ipa,
      })
    );
    // 发送多控操作广播
    if (isMultiple.value) {
      setOtherWebSocketParams({
        type: 'debug',
        detail: 'install',
        ipa,
      });
    }
    ElMessage.success({
      message: $t('androidRemoteTS.startInstall'),
    });
  }
};

// 选中安装包列表中的item后响应事件
const selectPackage = (val) => {
  const { url: ipa, ...args } = val;
  if (ipa.length > 0) {
    websocket.value.send(
      JSON.stringify({
        ...args,
        type: 'debug',
        detail: 'install',
        ipa,
      })
    );
    if (isMultiple.value) {
      setOtherWebSocketParams({
        ...args,
        type: 'debug',
        detail: 'install',
        ipa,
      });
    }
    ElMessage.success({
      message: $t('androidRemoteTS.startInstall'),
    });
  }
};
const activeInstallTab = ref('linkInstallPane');
watch(filterText, (newValue, oldValue) => {
  tree.value.filter(newValue);
});
const filterNode = (value, data) => {
  if (!value) return true;
  return (
    data.label.indexOf(value) !== -1 ||
    (data.detail.name ? data.detail.name.indexOf(value) !== -1 : false)
  );
};
const findBestNS = (elementDetail) => {
  const result = [];
  if (!elementDetail.name) {
    return result;
  }
  // eslint-disable-next-line no-useless-escape
  let r = `name CONTAINS \'${elementDetail.name}\'`;
  if (elementDetail.label) {
    r += ` AND label CONTAINS '${elementDetail.label}'`;
  }
  if (elementDetail.enabled) {
    r += ` AND enabled == ${elementDetail.enabled}`;
  }
  if (elementDetail.visible) {
    r += ` AND visible == ${elementDetail.visible}`;
  }
  result.push(r);
  return result;
};
const findBestClassChain = (elementDetail) => {
  const result = [];
  if (elementDetail.name) {
    result.push(
      `**/${elementDetail.type}[\`name == \"${elementDetail.name}\"\`]`
    );
    result.push(
      `**/${elementDetail.type}[\`name CONTAINS \"${elementDetail.name}\"\`]`
    );
  }
  if (elementDetail.label) {
    result.push(
      `**/${elementDetail.type}[\`label == \"${elementDetail.label}\"\`]`
    );
    result.push(
      `**/${elementDetail.type}[\`label CONTAINS \"${elementDetail.label}\"\`]`
    );
  }
  return result;
};
const findBestXpath = (elementDetail) => {
  const result = [];
  if (elementDetail.name) {
    result.push(`//${elementDetail.type}[@name='${elementDetail.name}']`);
    result.push(
      `//${elementDetail.type}[contains(@name,'${elementDetail.name}')]`
    );
  }
  if (elementDetail.label) {
    result.push(`//${elementDetail.type}[@label='${elementDetail.label}']`);
    result.push(
      `//${elementDetail.type}[contains(@label,'${elementDetail.label}')]`
    );
  }
  return result;
};
const copy = (value) => {
  try {
    toClipboard(value);
    ElMessage.success({
      message: $t('dialog.copy.success'),
    });
  } catch (e) {
    ElMessage.error({
      message: $t('dialog.copy.fail'),
    });
  }
};

const getPoco = (engine, port) => {
  pocoLoading.value = true;
  const params = {
    type: 'debug',
    detail: 'poco',
    engine,
    port,
  };
  websocket.value.send(JSON.stringify(params));
  // 发送多控操作广播
  if (isMultiple.value) {
    setOtherWebSocketParams(params);
  }
};
let oldBlob;

const getImgUrl = () => {
  let imageUrl;
  if (oldBlob) {
    const blob = new Blob([oldBlob], { type: 'image/jpeg' });
    const URL = window.URL || window.webkitURL;
    imageUrl = URL.createObjectURL(blob);
  } else {
    imageUrl = null;
  }
  return imageUrl;
};
const setImgData = (data) => {
  let imageUrl = getImgUrl();
  if (imageUrl === null) {
    imageUrl = data;
  }
  const image = new Image();
  imgUrl.value = imageUrl;
  image.src = imageUrl;
  const canvas = document.getElementById('debugPicIOS');
  image.onload = () => {
    canvas.width = image.width;
    canvas.height = image.height;
  };
  isShowImg.value = true;
};

const screenUrls = ref([]);

const getVideoScreenshot = () => {
  const canvas = document.createElement('canvas');
  const canvasCtx = canvas.getContext('2d');
  const video = document.getElementById('scrcpy-video');
  // 默认生成图片大小
  let w;
  let h;
  if (directionStatus.value === 0 || directionStatus.value === 180) {
    if (screenMode.value === 'Scrcpy') {
      w = imgWidth.value;
      h = imgHeight.value;
    } else {
      w = 369;
      h = 800;
    }
  } else if (screenMode.value === 'Scrcpy') {
    w = imgHeight.value;
    h = imgWidth.value;
  } else {
    w = 800;
    h = 369;
  }
  canvas.width = w;
  canvas.height = h;
  canvasCtx.drawImage(
    video,
    0,
    0,
    video.videoWidth,
    video.videoHeight,
    0,
    0,
    w,
    h
  );
  return canvas.toDataURL('image/png', 1);
};

const quickCap = () => {
  let imageUrl;
  if (oldBlob) {
    const blob = new Blob([oldBlob], { type: 'image/jpeg' });
    const URL = window.URL || window.webkitURL;
    imageUrl = URL.createObjectURL(blob);
  } else {
    imageUrl = getVideoScreenshot();
  }
  const image = new Image();
  screenUrls.value.push(imageUrl);
  image.src = imageUrl;
};
const removeScreen = () => {
  screenUrls.value = [];
};
const toAddElement = (eleType, eleValue) => {
  if (project.value) {
    element.value.eleType = eleType;
    element.value.eleValue = eleValue;
    dialogElement.value = true;
  }
};
const downloadImg = (url) => {
  const currentTime = new Date().getTime();
  const link = document.createElement('a');
  fetch(url)
    .then((res) => res.blob())
    .then((blob) => {
      link.href = URL.createObjectURL(blob);
      link.download = `${currentTime}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
};
const logOutPut = ref([]);
const logFilter = ref('');
const terminalScroll = ref(null);
const getSyslog = () => {
  terminalWebsocket.value.send(
    JSON.stringify({
      type: 'syslog',
      filter: logFilter.value,
    })
  );
};
const stopSyslog = () => {
  terminalWebsocket.value.send(
    JSON.stringify({
      type: 'stopSyslog',
    })
  );
};
const clearLogcat = () => {
  logOutPut.value = [];
};
/**
 * 获取 process 列表数据 & 处理
 */
const processList = ref([]);
const processListPageData = ref([]);
const currProcessListPage = ref([]);
const currProcessListIndex = ref(0);
const processPageSize = 10;
const setCurrListPage = () => {
  currProcessListPage.value =
    processListPageData.value[currProcessListIndex.value];
};
// 转换分页数组
const formatProcessPageable = (data) => {
  const len = data.length;
  let start = 0;
  let end = processPageSize;
  // 重置分页数组
  processListPageData.value = [];
  while (end <= len) {
    processListPageData.value.push(data.slice(start, end));
    start = end;
    end += processPageSize;
  }
  if (len % processPageSize) {
    processListPageData.value.push(data.slice(start, len));
  }
  setCurrListPage();
};
const changeProcessListPage = (pageNum) => {
  currProcessListIndex.value = pageNum - 1;
  setCurrListPage();
};

watch(
  processList,
  (newVal) => {
    formatProcessPageable(newVal);
  },
  {
    immediate: true,
    deep: true,
  }
);
const clearProcess = () => {
  processList.value = [];
};
const getProcessList = () => {
  clearProcess();
  terminalWebsocket.value.send(
    JSON.stringify({
      type: 'processList',
    })
  );
};

const terminalWebsocketOnmessage = (message) => {
  switch (JSON.parse(message.data).msg) {
    case 'processListDetail': {
      const de = JSON.parse(message.data).detail;
      if (de && de !== null) {
        processList.value.push(de);
      }
      break;
    }
    case 'appListDetail': {
      const de = JSON.parse(message.data).detail;
      if (de && de !== null) {
        appList.value.push(de);
      }
      break;
    }
    case 'terminal':
      logOutPut.value.push($t('androidRemoteTS.connection'));
      break;
    case 'logDetail':
      logOutPut.value.push(
        JSON.parse(message.data)
          .detail.replace(
            /Notice/g,
            "<span style='color: #0d84ff'>Notice</span>"
          )
          .replace(/Error/g, "<span style='color: #F56C6C'>Error</span>")
      );
      nextTick(() => {
        terminalScroll.value.wrap.scrollTop =
          terminalScroll.value.wrap.scrollHeight;
      });
      break;
    default:
      break;
  }
};

const inputValue = ref('');
const inputBox = ref(null);
const inputBoxStyle = ref({});
const paste = ref('');
const isShowRenewButton = ref(false);
const changeInputHandle = () => {
  if (inputValue.value) {
    websocket.value.send(
      JSON.stringify({
        type: 'send',
        detail: inputValue.value,
      })
    );
    if (isMultiple.value) {
      setOtherWebSocketParams({
        type: 'send',
        detail: inputValue.value,
      });
    }
    inputValue.value = '';
  }
};
const deleteInputHandle = () => {
  websocket.value.send(
    JSON.stringify({
      type: 'send',
      detail: '\u007F',
    })
  );
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'send',
      detail: '\u007F',
    });
  }
};
const setPasteboard = (value) => {
  websocket.value.send(
    JSON.stringify({
      type: 'setPasteboard',
      detail: value,
    })
  );
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'setPasteboard',
      detail: value,
    });
  }
};
const getPasteboard = () => {
  websocket.value.send(
    JSON.stringify({
      type: 'getPasteboard',
    })
  );
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'getPasteboard',
    });
  }
};
const startPerfmon = (bundleId) => {
  websocket.value.send(
    JSON.stringify({
      type: 'startPerfmon',
      bundleId,
    })
  );
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'startPerfmon',
      bundleId,
    });
  }
};
const stopPerfmon = () => {
  websocket.value.send(
    JSON.stringify({
      type: 'stopPerfmon',
    })
  );
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'stopPerfmon',
    });
  }
};
const getCurLocation = ({ event, iosCap, rect, imageWidth, imageHeight }) => {
  let x;
  let y;
  if (location.value) {
    x = parseInt(
      (event.clientX - rect.left) * (imageHeight / iosCap.clientWidth),
      10
    );
    y = parseInt(
      (event.clientY - rect.top) * (imageWidth / iosCap.clientHeight),
      10
    );
  } else {
    x = parseInt(
      (event.clientX - rect.left) * (imageWidth / iosCap.clientWidth),
      10
    );
    y = parseInt(
      (event.clientY - rect.top) * (imageHeight / iosCap.clientHeight),
      10
    );
  }
  return { x, y };
};
const mouseup = (event) => {
  clearInterval(loop);
  time = 0;
  const iosCap = document.getElementById('iosCap');
  const rect = iosCap.getBoundingClientRect();
  const { x, y } = getCurLocation({
    event,
    iosCap,
    rect,
    imageWidth: imgWidth.value,
    imageHeight: imgHeight.value,
  });

  inputBoxStyle.value = {
    left: `${event.clientX - rect.left}px`,
    top: `${event.clientY - rect.top}px`,
  };
  if (moveX.value === x && moveY.value === y) {
    if (!isLongPress) {
      const params = {
        type: 'debug',
        detail: 'tap',
        point: { x, y },
        imageHeight: imgHeight.value,
      };
      websocket.value.send(JSON.stringify(params));
      // 发送多控操作广播
      if (isMultiple.value) {
        setOtherWebSocketParams({
          ...params,
          adaptFunction: (imageWidth, imageHeight) => {
            const { x: adaptX, y: adaptY } = getCurLocation({
              event,
              iosCap,
              rect,
              imageWidth,
              imageHeight,
            });
            return { point: `${adaptX},${adaptY}` };
          },
        });
      }
      inputBox.value.focus();
    }
  } else {
    const params = {
      type: 'debug',
      detail: 'swipe',
      pointA: `${moveX.value},${moveY.value}`,
      pointB: `${x},${y}`,
    };
    websocket.value.send(JSON.stringify(params));
    // 发送多控操作广播
    if (isMultiple.value) {
      setOtherWebSocketParams(params);
    }
    inputBox.value.focus();
  }
  isLongPress = false;
};
const mouseleave = () => {
  clearInterval(loop);
  isLongPress = false;
};
const mousedown = (event) => {
  const iosCap = document.getElementById('iosCap');
  const rect = iosCap.getBoundingClientRect();
  const { x, y } = getCurLocation({
    event,
    iosCap,
    rect,
    imageWidth: imgWidth.value,
    imageHeight: imgHeight.value,
  });
  moveX.value = x;
  moveY.value = y;
  clearInterval(loop);
  loop = setInterval(() => {
    time += 500;
    if (time >= 1000 && isLongPress === false) {
      const params = {
        type: 'debug',
        detail: 'longPress',
        point: `${moveX.value},${moveY.value}`,
      };
      websocket.value.send(JSON.stringify(params));
      // 发送多控操作广播
      if (isMultiple.value) {
        setOtherWebSocketParams({
          ...params,
          adaptFunction: (imageWidth, imageHeight) => {
            const { x: adaptX, y: adaptY } = getCurLocation({
              event,
              iosCap,
              rect,
              imageWidth,
              imageHeight,
            });
            return { point: `${adaptX},${adaptY}` };
          },
        });
      }
      isLongPress = true;
    }
  }, 500);
};

const findMinSize = (data) => {
  if (data.length === 0) {
    return null;
  }
  let result = data[0];
  data.forEach((item) => {
    if (item.size === result.size) {
      if (item.ele.detail.name && item.ele.detail.name.length !== 0) {
        result = item;
      }
    }
    if (item.size < result.size) {
      result = item;
    }
  });
  currentId.value = [result.ele.id];
  return result.ele.id;
};
const findElementByPoint = (ele, x, y) => {
  const result = [];
  ele.forEach((item) => {
    const eleStartX = parseInt(item.detail.x, 10);
    const eleStartY = parseInt(item.detail.y, 10);
    const eleEndX =
      parseInt(item.detail.x, 10) + parseInt(item.detail.width, 10);
    const eleEndY =
      parseInt(item.detail.y, 10) + parseInt(item.detail.height, 10);
    if (x >= eleStartX && x <= eleEndX && y >= eleStartY && y <= eleEndY) {
      result.push({
        ele: item,
        size:
          parseInt(item.detail.height, 10) * parseInt(item.detail.width, 10),
      });
    }
    if (item.children) {
      const childrenResult = findElementByPoint(item.children, x, y);
      if (childrenResult.length > 0) {
        result.push(...childrenResult);
      }
    }
  });
  return result;
};
const print = (data) => {
  const canvas = document.getElementById('debugPicIOS');
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, canvas.width, canvas.height);
  const eleStartX = parseInt(data.detail.x, 10);
  const eleStartY = parseInt(data.detail.y, 10);
  const eleEndX = parseInt(data.detail.x, 10) + parseInt(data.detail.width, 10);
  const eleEndY =
    parseInt(data.detail.y, 10) + parseInt(data.detail.height, 10);
  const a = Math.round(Math.random() * 255);
  const b = Math.round(Math.random() * 255);
  const c = Math.round(Math.random() * 255);
  g.fillStyle = `rgba(${a}, ${b}, ${c}, 0.6)`;
  g.fillRect(
    eleStartX * (canvas.width / imgWidth.value),
    eleStartY * (canvas.height / imgHeight.value),
    (eleEndX - eleStartX) * (canvas.width / imgWidth.value),
    (eleEndY - eleStartY) * (canvas.height / imgHeight.value)
  );
};
const handleNodeClick = (data) => {
  if (data !== null) {
    elementDetail.value = data.detail;
    print(data);
  }
};
const touchstart = async (event) => {
  const debugPicIOS = document.getElementById('debugPicIOS');
  const rect = debugPicIOS.getBoundingClientRect();
  const x = parseInt(
    (event.clientX - rect.left) * (imgWidth.value / debugPicIOS.clientWidth),
    10
  );
  const y = parseInt(
    (event.clientY - rect.top) * (imgHeight.value / debugPicIOS.clientHeight),
    10
  );
  await nextTick(() => {
    tree.value.setCurrentKey(
      findMinSize(findElementByPoint(elementData.value, x, y))
    );
  });
  await handleNodeClick(tree.value.getCurrentNode());
};

const getEleScreen = (xpath) => {
  elementScreenLoading.value = true;
  const params = {
    type: 'debug',
    detail: 'eleScreen',
    xpath,
  };
  websocket.value.send(JSON.stringify(params));
  // 发送多控操作广播
  if (isMultiple.value) {
    setOtherWebSocketParams(params);
  }
};
const clearLog = () => {
  stepLog.value = [];
};
const setStepLog = (data) => {
  stepLog.value.push(data);
};
const runStep = () => {
  debugLoading.value = true;
  activeTab2.value = 'log';
  const params = {
    type: 'debug',
    detail: 'runStep',
    caseId: testCase.value.id,
  };
  websocket.value.send(JSON.stringify(params));
  // 发送多控操作广播
  if (isMultiple.value) {
    setOtherWebSocketParams(params);
  }
};
const checkLocation = (data) => {
  checkElementLoading.value = true;
  const params = {
    type: 'debug',
    detail: 'checkLocation',
    element: data.eleValue,
    eleType: data.eleType,
    pwd: device.value.password,
  };
  websocket.value.send(JSON.stringify(params));
  // 发送多控操作广播
  if (isMultiple.value) {
    setOtherWebSocketParams(params);
  }
};
const stopStep = () => {
  debugLoading.value = false;
  const params = {
    type: 'debug',
    detail: 'stopStep',
    udId: device.value.udId,
    caseId: testCase.value.id,
    pf: device.value.platform,
  };
  websocket.value.send(JSON.stringify(params));
  // 发送多控操作广播
  if (isMultiple.value) {
    setOtherWebSocketParams(params);
  }
};
const pressKey = (key) => {
  websocket.value.send(
    JSON.stringify({
      type: 'debug',
      detail: 'keyEvent',
      key,
    })
  );
  // 发送多控操作广播
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'debug',
      detail: 'keyEvent',
      key,
    });
  }
};
const beforeAvatarUpload = (file) => {
  if (file.name.endsWith('.jpg') || file.name.endsWith('.png')) {
    return true;
  }
  ElMessage.error({
    message: $t('androidRemoteTS.failErr'),
  });
  return false;
};
const beforeAvatarUpload2 = (file) => {
  if (file.name.endsWith('.ipa')) {
    return true;
  }
  ElMessage.error({
    message: $t('androidRemoteTS.failErr'),
  });
  return false;
};
const limitOut = () => {
  ElMessage.error({
    message: $t('androidRemoteTS.addOne'),
  });
};

const scan = (url) => {
  websocket.value.send(
    JSON.stringify({
      type: 'scan',
      url,
    })
  );
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'scan',
      url,
    });
  }
};


const uploadPackage = (content) => {
  uploadLoading.value = true;
  const formData = new FormData();
  formData.append('file', content.file);
  formData.append('type', 'packageFiles');
  axios
    .post('/folder/upload', formData, {
      headers: { 'Content-type': 'multipart/form-data' },
    })
    .then((resp) => {
      uploadLoading.value = false;
      if (resp.code === 2000) {
        install(resp.data);
      }
    });
};

const uploadScan = (content) => {
  const formData = new FormData();
  formData.append('file', content.file);
  formData.append('type', 'imageFiles');
  axios
    .post('/folder/upload', formData, {
      headers: { 'Content-type': 'multipart/form-data' },
    })
    .then((resp) => {
      if (resp.code === 2000) {
        ElMessage.success({
          message: resp.message,
        });
        scan(resp.data);
      }
    });
};
const sendCommand = (value) => {
  websocket.value.send(
    JSON.stringify({
      type: 'debug',
      detail: 'siri',
      command: value,
    })
  );
  // 发送多控操作广播
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'debug',
      detail: 'siri',
      command: value,
    });
  }
};
const getElement = () => {
  elementLoading.value = true;
  setImgData(null);
  const params = {
    type: 'debug',
    detail: 'tree',
    needImg: oldBlob == null,
    depth: depth.value,
  };
  websocket.value.send(JSON.stringify(params));
  // 发送多控操作广播
  if (isMultiple.value) {
    setOtherWebSocketParams(params);
  }
};
const addTime = (value) => {
  websocket.value.send(
    JSON.stringify({
      type: 'addRemoteTime',
      detail: value,
    })
  );
  if (isMultiple.value) {
    setOtherWebSocketParams({
      type: 'addRemoteTime',
      detail: value,
    });
  }
  screenWebsocket.value.send(
    JSON.stringify({
      type: 'addRemoteTime',
      detail: value,
    })
  );
  terminalWebsocket.value.send(
    JSON.stringify({
      type: 'addRemoteTime',
      detail: value,
    })
  );
  isShowRenewButton.value = false;
};
const close = async () => {
  setOtherWebSocketParams({
    type: 'close',
  });
  if (websocket.value) {
    websocket.value.close();
    websocket.value = undefined;
  }
  if (terminalWebsocket.value) {
    terminalWebsocket.value.close();
    terminalWebsocket.value = undefined;
  }
  if (screenWebsocket.value) {
    screenWebsocket.value.close();
    screenWebsocket.value = undefined;
  }
  localStorage.removeItem('iosSendRemind');
  localStorage.removeItem('driverTime');

  router.push('/Index/Devices');
};
onBeforeUnmount(() => {
  close();
});

const getProjectList = () => {
  axios.get('/controller/projects/list').then((resp) => {
    store.commit('saveProjectList', resp.data);
  });
};
const activeTime = ref(0);
const idleCount = ref(0);

const remoteTimeout = ref(0);
const ticker = ref(0);
const getRemoteTimeout = () => {
  if (!localStorage.getItem('driverTime')) {
    localStorage.setItem('driverTime', Date.now());
  }
  ticker.value = Math.floor(
    (Date.now() - Number(localStorage.getItem('driverTime'))) / 1000
  );
  axios.get('/controller/confList/getRemoteTimeout').then((resp) => {
    remoteTimeout.value = resp.data;
    setInterval(() => {
      ticker.value += 1;
    }, 1000);
  });
};
const idleTimeout = ref(0);
const getIdleTimeout = () => {
  axios.get('/controller/confList/getIdleTimeout').then((resp) => {
    idleTimeout.value = resp.data;
  });
};

const checkAlive = () => {
  setInterval(() => {
    idleCount.value += 1;
    // const nowTime = new Date().getTime();
    // if (nowTime - activeTime.value > idleTimeout.value * 60 * 1000) {
    //   close();
    // }
  }, 1000);
};
const otherRemoteClose = (id) => {
  controlsMachine.value = controlsMachine.value.filter((item) => item !== id);
};

const screenWebsocketOnmessage = (message) => {
  oldBlob = message.data;
  const blob = new Blob([message.data], { type: 'image/jpeg' });
  const URL = window.URL || window.webkitURL;
  const image = new Image();
  const canvas = document.getElementById('iosCap');
  const g = canvas.getContext('2d');
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
};
const websocketOnmessage = (message) => {
  switch (JSON.parse(message.data).msg) {
    case 'share':
      remoteSIBPort.value = JSON.parse(message.data).port;
      break;
    case 'perfDetail':
      iosPerfRef.value.setData(JSON.parse(message.data).detail);
      break;
    case 'poco': {
      pocoLoading.value = false;
      const { result } = JSON.parse(message.data);
      if (result) {
        ElMessage.success({
          message: $t('androidRemoteTS.getPocoSuccess'),
        });
        pocoPaneRef.value.setPocoData(JSON.parse(result).result);
      } else {
        ElMessage.error({
          message: $t('androidRemoteTS.getPocoFail'),
        });
      }
      break;
    }
    case 'forwardView': {
      webViewLoading.value = false;
      ElMessage.success({
        message: $t('androidRemoteTS.getSuccess'),
      });
      webViewListDetail.value = JSON.parse(message.data).detail;
      break;
    }
    case 'setPaste': {
      ElMessage.success({
        message: $t('IOSRemote.clipboard.SentSuccessfully'),
      });
      break;
    }
    case 'paste': {
      paste.value = JSON.parse(message.data).detail;
      ElMessage.success({
        message: $t('IOSRemote.clipboard.text'),
      });
      break;
    }
    case 'rotation': {
      const d = JSON.parse(message.data).value;
      if (directionStatus.value.value !== d) {
        if (d !== -1) {
          ElMessage.success({
            message: $t('androidRemoteTS.messageOne'),
          });
        }
        directionStatus.value.value = JSON.parse(message.data).value;
        location.value = !location.value;
      }
      break;
    }
    case 'proxyResult': {
      proxyWebPort.value = JSON.parse(message.data).webPort;
      proxyConnPort.value = JSON.parse(message.data).port;
      nextTick(() => {
        iFrameHeight.value = document.body.clientHeight - 150;
      });
      break;
    }
    case 'tree': {
      ElMessage.success({
        message: $t('androidRemoteTS.getEle.success'),
      });
      const result = JSON.parse(message.data);
      currentId.value = [1];
      elementData.value = result.detail;
      isShowTree.value = true;
      elementLoading.value = false;
      if (result.img) {
        setImgData(result.img);
      }
      break;
    }
    case 'treeFail': {
      ElMessage.error({
        message: $t('androidRemoteTS.getEle.fail'),
      });
      elementLoading.value = false;
      break;
    }
    case 'installFinish': {
      if (JSON.parse(message.data).status === 'success') {
        ElMessage.success({
          message: $t('androidRemoteTS.install.success'),
        });
        refreshAppList(true);
      } else {
        ElMessage.error({
          message: $t('androidRemoteTS.install.fail'),
        });
      }
      break;
    }
    case 'uninstallFinish': {
      if (JSON.parse(message.data).detail === 'success') {
        ElMessage.success({
          message: $t('androidRemoteTS.uninstall.success'),
        });
        refreshAppList(true);
      } else {
        ElMessage.error({
          message: $t('androidRemoteTS.uninstall.fail'),
        });
      }
      break;
    }
    case 'openDriver': {
      let msg = $t('IOSRemote.driverStatus.fail');
      if (JSON.parse(message.data).status === 'success') {
        msg = $t('IOSRemote.driverStatus.success');
        imgWidth.value = JSON.parse(message.data).width;
        imgHeight.value = JSON.parse(message.data).height;
        isDriverFinish.value = true;
        remoteWDAPort.value = JSON.parse(message.data).wda;
        loading.value = false;
        pocoPaneRef.value.setSize(
          JSON.parse(message.data).width,
          JSON.parse(message.data).height
        );
      }
      ElMessage({
        type: JSON.parse(message.data).status,
        message: msg,
      });
      break;
    }
    case 'step': {
      setStepLog(JSON.parse(message.data));
      break;
    }
    case 'status': {
      debugLoading.value = false;
      checkElementLoading.value = false;
      ElMessage.info({
        message: $t('androidRemoteTS.runOver'),
      });
      break;
    }
    case 'eleScreen': {
      if (JSON.parse(message.data).img) {
        ElMessage.success({
          message: $t('androidRemoteTS.getPsSuccess'),
        });
        imgElementUrl.value = JSON.parse(message.data).img;
        dialogImgElement.value = true;
      } else {
        ElMessage.error($t('IOSRemote.eleScreen.err'));
      }
      elementScreenLoading.value = false;
      break;
    }
    case 'error': {
      ElMessage.error({
        message: $t('androidRemoteTS.systemException'),
      });
      close();
      break;
    }
    case 'stopDebug': {
      ElMessage.error({
        message: '主控设备已断开',
      });
      close();
      break;
    }
    case 'exitUse':
    case 'timeout': {
      ElMessage.success({
        message: '设备已达到最大使用时间，正在退出',
      });
      close();
      break;
    }
    case 'sendRemind': {
      // 展示续期按钮
      if (JSON.parse(message.data).count === 2) {
        isShowRenewButton.value = false;
        // ElMessage.warning({
        //   message: '续期已超2次',
        // });
        localStorage.setItem('iosSendRemind', '0');
      } else {
        isShowRenewButton.value = true;
        localStorage.setItem('iosSendRemind', '1');
      }
      break;
    }
    default:
      break;
  }
};

const openSocket = (host, port, key, udId) => {
  if ('WebSocket' in window) {
    websocket.value = new WebSocket(
      `ws://${host}:${port}/websockets/ios/${key}/${udId}/${localStorage.getItem(
        'SonicToken'
      )}`
    );
    terminalWebsocket.value = new WebSocket(
      `ws://${host}:${port}/websockets/ios/terminal/${key}/${udId}/${localStorage.getItem(
        'SonicToken'
      )}`
    );
    screenWebsocket.value = new WebSocket(
      `ws://${host}:${port}/websockets/ios/screen/${key}/${udId}/${localStorage.getItem(
        'SonicToken'
      )}`
    );
  } else {
    console.error($t('androidRemoteTS.noWebSocket'));
  }
  websocket.value.onmessage = websocketOnmessage;
  // websocket.value.onclose = () => {};
  websocket.value.onopen = () => {
    websocket.value.send(
      JSON.stringify({
        type: 'useTime',
        detail: route.query.useTime,
      })
    );
  };
  terminalWebsocket.value.onmessage = terminalWebsocketOnmessage;
  // terminalWebsocket.value.onclose = () => {};
  terminalWebsocket.value.onopen = () => {
    terminalWebsocket.value.send(
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

const getDeviceById = (id) => {
  loading.value = true;
  axios.get('/controller/devices', { params: { id } }).then((resp) => {
    if (resp.code === 2000) {
      device.value = resp.data;
      // if (device.value.status !== 'ONLINE') {
      // ElMessage.error({
      //   message: $t('androidRemoteTS.deviceFail'),
      // });
      // router.replace('/Index/Devices');
      // return;
      // }
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
  // 保存isMultiple和controlsMachine
  isMultiple.value = route.query.isMultiple === 'true';
  activeTab.value = isMultiple.value ? 'otherPhones' : 'main';
  controlsMachine.value = isMultiple.value
    ? route.query.controlsMachine.split(',')
    : [];

  if (localStorage.getItem('iosSendRemind') === '1') {
    isShowRenewButton.value = true;
  } else {
    isShowRenewButton.value = false;
  }
  if (store.state.project.id) {
    project.value = store.state.project;
  } else {
    getProjectList();
  }
  getDeviceById(route.params.deviceId);
  store.commit('autoChangeCollapse');
  getRemoteTimeout();
  getIdleTimeout();
  activeTime.value = new Date().getTime();
  window.document.onmousedown = () => {
    idleCount.value = 0;
    activeTime.value = new Date().getTime();
  };
  window.document.onmousemove = () => {
    idleCount.value = 0;
    activeTime.value = new Date().getTime();
  };
  checkAlive();
});
</script>

<template>
  <el-dialog
    v-model="dialogImgElement"
    :title="$t('androidRemoteTS.code.elementsSnapshot')"
    width="28%"
  >
    <el-card>
      <el-image
        z-index="5000"
        fit="contain"
        style="width: 100%; height: 100px"
        :src="imgElementUrl"
        :preview-src-list="[imgElementUrl]"
      ></el-image>
    </el-card>
    <el-form
      ref="updateImgEle"
      :model="element"
      size="small"
      style="margin-top: 20px"
    >
      <el-form-item
        prop="eleName"
        :label="$t('androidRemoteTS.code.eleName')"
        :rules="{
          required: true,
          message: $t('androidRemoteTS.code.eleNullName'),
          trigger: 'blur',
        }"
      >
        <el-input
          v-model="element.eleName"
          :placeholder="$t('androidRemoteTS.code.inputName')"
        ></el-input>
      </el-form-item>
      <div style="text-align: center">
        <el-button size="small" type="primary" @click="saveEle"
          >{{ $t('androidRemoteTS.code.saveEle') }}
        </el-button>
      </div>
    </el-form>
  </el-dialog>
  <el-dialog
    v-model="dialogElement"
    :title="$t('elements.eleInfo')"
    width="600px"
  >
    <element-update
      v-if="dialogElement"
      :project-id="project['id']"
      :element-id="0"
      :element-obj="element"
      :is-remote-page="true"
      :check-loading="checkElementLoading"
      @flush="dialogElement = false"
      @check-location="checkLocation"
    />
  </el-dialog>
  <remote-page-header
    :ticker="ticker"
    :idle-count="idleCount"
    :remote-timeout="remoteTimeout"
    :idle-timeout="idleTimeout"
    :is-show-renew-button="isShowRenewButton"
    @close="close"
    @add-time="addTime"
  />
  <div style="padding: 20px">
    <el-row
      :gutter="24"
      @mouseup="lineMouseup"
      @mouseleave="lineMouseleave"
      @mousemove="lineMousemove"
    >
      <el-col
        :span="tabPosition == 'left' ? 12 : 24"
        :style="{
          flexBasis: tabPosition == 'left' ? layoutSplitInfo.left + '%' : '',
          maxWidth: tabPosition == 'left' ? layoutSplitInfo.left + '%' : '',
          transition: !isSplitPressing ? 'flex-basis 0.3s,max-width 0.3s' : '',
        }"
      >
        <el-card
          v-loading="loading"
          :element-loading-text="$t('androidRemoteTS.code.preparingImager')"
          element-loading-background="rgba(255, 255, 255, 1)"
          style="font-size: 14px"
          :body-style="{
            padding: '10px',
            background: '#ccc',
            position: 'relative',
            minHeight: '340px',
          }"
        >
          <template #header>
            <div style="position: relative; display: flex; align-items: center">
              <el-icon :size="14" style="vertical-align: middle">
                <Cellphone />
              </el-icon>
              <RenderDeviceName
                style="color: #e6a23c; margin-left: 5px"
                :device="device"
              />
              <el-popover placement="bottom-end" width="270" trigger="hover">
                <el-form
                  label-position="left"
                  class="demo-table-expand"
                  label-width="90px"
                  style="margin-left: 10px; word-break: break-all"
                >
                  <el-form-item :label="$t('devices.detail.name')">
                    <span>{{ device.name }}</span>
                  </el-form-item>
                  <el-form-item :label="$t('devices.detail.model')">
                    <span>{{ device['model'] }}</span>
                  </el-form-item>
                  <el-form-item :label="$t('devices.detail.udId')">
                    <span>{{ device['udId'] }}</span>
                  </el-form-item>
                  <el-form-item :label="$t('devices.form.system')">
                    <img
                      height="25"
                      style="
                        position: absolute;
                        top: 7px;
                        bottom: 7px;
                        left: 7px;
                      "
                      :src="
                        getImg(device['platform'] === 1 ? 'ANDROID' : 'IOS')
                      "
                    />
                  </el-form-item>
                  <el-form-item
                    :label="$t('androidRemoteTS.code.systemVersion')"
                  >
                    <span>{{ device['version'] }}</span>
                  </el-form-item>
                  <el-form-item :label="$t('devices.detail.size')">
                    <span>{{ device['size'] }}</span>
                  </el-form-item>
                  <el-form-item :label="$t('devices.detail.cpu')">
                    <span>{{ device['cpu'] }}</span>
                  </el-form-item>
                  <el-form-item :label="$t('devices.filter.manufacturer')">
                    <img
                      height="25"
                      style="
                        position: absolute;
                        top: 7px;
                        bottom: 7px;
                        left: 7px;
                      "
                      :src="getImg(device['manufacturer'])"
                    />
                  </el-form-item>
                </el-form>
                <template #reference>
                  <div style="position: absolute; right: 0px; color: #909399">
                    <el-icon :size="15" style="vertical-align: middle">
                      <InfoFilled />
                    </el-icon>
                  </div>
                </template>
              </el-popover>
            </div>
          </template>
          <div style="display: flex">
            <div style="flex: 1; text-align: center">
              <div>
                <input
                  ref="inputBox"
                  v-model="inputValue"
                  class="input-box"
                  type="text"
                  :style="inputBoxStyle"
                  @input="changeInputHandle"
                  @keyup.delete="deleteInputHandle"
                />
                <canvas
                  id="iosCap"
                  style="
                    display: inline-block;
                    min-height: 100%;
                    max-height: calc(100vh - 200px);
                  "
                  :style="{
                    width:
                      directionStatus.value === 0 ||
                      directionStatus.value === 180
                        ? 'auto'
                        : canvasRectInfo.width || '100%',
                    height: canvasRectInfo.height,
                  }"
                  @mouseup="mouseup"
                  @mousedown="mousedown"
                  @mouseleave="mouseleave"
                />
              </div>
              <el-button-group id="iOSpressKey">
                <el-button
                  size="small"
                  style="width: 100%"
                  type="info"
                  @click="pressKey('home')"
                >
                  <el-icon :size="13" style="vertical-align: middle">
                    <House />
                  </el-icon>
                </el-button>
              </el-button-group>
            </div>
            <div style="width: 50px; text-align: right">
              <el-tooltip
                :enterable="false"
                effect="dark"
                :content="$t('IOSRemote.clarityAndFps')"
                :placement="tabPosition == 'left' ? 'right' : 'left'"
                :offset="15"
              >
                <div>
                  <el-dropdown
                    :hide-on-click="false"
                    trigger="click"
                    placement="right"
                    style="margin-top: 4px"
                  >
                    <el-button size="small" type="info" circle>
                      <el-icon :size="12" style="vertical-align: middle">
                        <VideoCamera />
                      </el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu class="divider">
                        <el-radio-group
                          v-model="screenFps"
                          v-loading="loading"
                          size="mini"
                          @change="switchScreen"
                        >
                          <el-radio-button label="low"
                            >{{ $t('androidRemoteTS.low') }}
                          </el-radio-button>
                          <el-radio-button label="high"
                            >{{ $t('androidRemoteTS.high') }}
                          </el-radio-button>
                        </el-radio-group>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </el-tooltip>
              <el-tooltip
                :enterable="false"
                effect="dark"
                :content="$t('androidRemoteTS.code.manualRepair')"
                :placement="tabPosition == 'left' ? 'right' : 'left'"
                :offset="15"
              >
                <div>
                  <el-dropdown
                    :hide-on-click="false"
                    trigger="click"
                    placement="right"
                    style="margin-top: 4px"
                  >
                    <el-button size="small" type="info" circle>
                      <el-icon :size="12" style="vertical-align: middle">
                        <Place />
                      </el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu class="divider">
                        <el-button-group>
                          <el-tooltip
                            effect="dark"
                            :content="$t('IOSRemote.calibrationCoordinates')"
                            placement="top"
                          >
                            <el-button
                              size="small"
                              type="info"
                              circle
                              @click="switchLocation"
                            >
                              <el-icon
                                :size="14"
                                style="vertical-align: middle"
                              >
                                <Pointer />
                              </el-icon>
                            </el-button>
                          </el-tooltip>
                        </el-button-group>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </el-tooltip>
              <el-tooltip
                :enterable="false"
                effect="dark"
                :content="$t('IOSRemote.volume')"
                :placement="tabPosition == 'left' ? 'right' : 'left'"
                :offset="15"
              >
                <div>
                  <el-dropdown
                    :hide-on-click="false"
                    trigger="click"
                    placement="right"
                    style="margin-top: 4px"
                  >
                    <el-button size="small" type="primary" circle>
                      <el-icon :size="12" style="vertical-align: middle">
                        <Operation />
                      </el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu class="divider">
                        <div style="text-align: center">
                          <el-icon
                            :size="14"
                            style="color: #909399; vertical-align: middle"
                          >
                            <Phone />
                          </el-icon>
                          <el-divider direction="vertical"></el-divider>
                          <el-button-group>
                            <el-button
                              size="small"
                              type="info"
                              circle
                              @click="pressKey('volumeup')"
                            >
                              <el-icon
                                :size="12"
                                style="vertical-align: middle"
                              >
                                <Plus />
                              </el-icon>
                            </el-button>
                            <el-button
                              size="small"
                              type="info"
                              circle
                              @click="pressKey('volumedown')"
                            >
                              <el-icon
                                :size="12"
                                style="vertical-align: middle"
                              >
                                <Minus />
                              </el-icon>
                            </el-button>
                          </el-button-group>
                        </div>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </el-tooltip>
              <el-tooltip
                effect="dark"
                :content="$t('androidRemoteTS.code.dial')"
                :placement="tabPosition == 'left' ? 'right' : 'left'"
              >
                <div style="margin-top: 4px">
                  <el-button
                    size="small"
                    type="primary"
                    circle
                    @click="pressKey('mobilephone')"
                  >
                    <el-icon :size="12" style="vertical-align: middle">
                      <PhoneFilled />
                    </el-icon>
                  </el-button>
                </div>
              </el-tooltip>
              <el-tooltip
                effect="dark"
                :content="$t('androidRemoteTS.code.photograph')"
                :placement="tabPosition == 'left' ? 'right' : 'left'"
              >
                <div style="margin-top: 4px">
                  <el-button
                    size="small"
                    type="primary"
                    circle
                    @click="pressKey('camera')"
                  >
                    <el-icon :size="12" style="vertical-align: middle">
                      <Camera />
                    </el-icon>
                  </el-button>
                </div>
              </el-tooltip>
              <el-tooltip
                effect="dark"
                :content="$t('androidRemoteTS.code.browser')"
                :placement="tabPosition == 'left' ? 'right' : 'left'"
              >
                <div style="margin-top: 4px">
                  <el-button
                    size="small"
                    type="primary"
                    circle
                    @click="pressKey('mobilesafari')"
                  >
                    <el-icon :size="12" style="vertical-align: middle">
                      <Position />
                    </el-icon>
                  </el-button>
                </div>
              </el-tooltip>
              <el-tooltip
                effect="dark"
                :content="$t('androidRemoteTS.code.LUS')"
                :placement="tabPosition == 'left' ? 'right' : 'left'"
              >
                <div style="margin-top: 4px">
                  <el-button
                    size="small"
                    type="primary"
                    circle
                    @click="pressKey('lock')"
                  >
                    <el-icon :size="12" style="vertical-align: middle">
                      <SwitchButton />
                    </el-icon>
                  </el-button>
                </div>
              </el-tooltip>
            </div>
          </div>
        </el-card>
      </el-col>

      <div
        :class="{
          line: tabPosition == 'left',
          lineVertical: tabPosition == 'top',
        }"
        @mousedown="lineMousedown"
      />

      <el-col
        :span="tabPosition == 'left' ? 12 : 24"
        :style="{
          flexBasis:
            tabPosition == 'left'
              ? 100 - Number(layoutSplitInfo.left) + '%'
              : '',
          maxWidth:
            tabPosition == 'left'
              ? 100 - Number(layoutSplitInfo.left) + '%'
              : '',
        }"
      >
        <el-tabs
          v-model="activeTab"
          stretch
          class="remote-tab"
          :tab-position="tabPosition"
          @tab-click="switchTabs"
        >
          <el-tab-pane v-if="isMultiple" label="其他手机" name="otherPhones">
            <div style="display: flex">
              <IOSOtherRemote
                v-for="item in controlsMachine"
                :id="item"
                :key="item"
                :canvas-rect-info="canvasRectInfo"
                :direction-status="directionStatus"
                :web-socket-params="webSocketParams"
                @close="otherRemoteClose"
              />
            </div>
          </el-tab-pane>
          <el-tab-pane
            :label="$t('androidRemoteTS.code.remoteControlPanel')"
            name="main"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <strong>{{ $t('IOSRemote.siri.command') }}</strong>
                  </template>
                  <div style="padding: 12px 0">
                    <el-input
                      v-model="text.content"
                      clearable
                      size="small"
                      :placeholder="$t('IOSRemote.siri.inputCommand')"
                    ></el-input>
                    <div style="text-align: center; margin-top: 15px">
                      <el-button
                        size="mini"
                        type="primary"
                        @click="sendCommand(text.content)"
                        >{{ $t('androidRemoteTS.code.send') }}
                      </el-button>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-tabs type="border-card" stretch>
                  <el-tab-pane :label="$t('IOSRemote.remoteSIB')">
                    <div style="padding: 13px 0">
                      <div
                        v-loading="remoteSIBPort === 0"
                        element-loading-background="rgba(255, 255, 255, 1)"
                        style="margin-top: 20px; margin-bottom: 20px"
                      >
                        <el-card
                          :body-style="{
                            backgroundColor: '#303133',
                            cursor: 'pointer',
                          }"
                          @click="
                            copy(
                              'sib remote connect --host ' +
                                agent['host'] +
                                ' -p ' +
                                remoteSIBPort
                            )
                          "
                        >
                          <strong style="color: #f2f6fc">{{
                            'sib remote connect --host ' +
                            agent['host'] +
                            ' -p ' +
                            remoteSIBPort
                          }}</strong>
                        </el-card>
                      </div>
                    </div>
                  </el-tab-pane>
                  <el-tab-pane :label="$t('IOSRemote.remoteWDA')">
                    <div style="padding: 13px 0">
                      <div
                        v-if="remoteWDAPort !== 0"
                        style="margin-top: 20px; margin-bottom: 20px"
                      >
                        <el-card
                          :body-style="{
                            backgroundColor: '#303133',
                            cursor: 'pointer',
                          }"
                          @click="
                            copy(
                              'http://' + agent['host'] + ':' + remoteWDAPort
                            )
                          "
                        >
                          <strong style="color: #f2f6fc">{{
                            'http://' + agent['host'] + ':' + remoteWDAPort
                          }}</strong>
                        </el-card>
                      </div>
                      <div
                        v-else
                        v-loading="remoteWDAPort.length === 0"
                        element-loading-spinner="el-icon-lock"
                        element-loading-background="rgba(255, 255, 255, 1)"
                        :element-loading-text="$t('IOSRemote.driverNotSuccess')"
                        style="margin-top: 18px; margin-bottom: 18px"
                      >
                        <el-card>
                          <strong>{{
                            $t('IOSRemote.driverNotSuccess')
                          }}</strong>
                        </el-card>
                      </div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </el-col>
              <el-col :span="12" style="margin-top: 10px">
                <el-card>
                  <template #header>
                    <strong>{{ $t('IOSRemote.clipboard.operate') }}</strong>
                  </template>
                  <el-input
                    v-model="paste"
                    :rows="7"
                    show-word-limit
                    clearable
                    type="textarea"
                    :placeholder="$t('IOSRemote.clipboard.inputText')"
                  ></el-input>
                  <div style="text-align: center; margin-top: 15px">
                    <el-button
                      size="mini"
                      type="primary"
                      @click="setPasteboard(paste)"
                    >
                      {{ $t('IOSRemote.clipboard.send') }}
                    </el-button>
                    <el-button size="mini" type="primary" @click="getPasteboard"
                      >{{ $t('IOSRemote.clipboard.getText') }}
                    </el-button>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12" style="margin-top: 10px">
                <el-card>
                  <template #header>
                    <strong>{{ $t('IOSRemote.positioning.mock') }}</strong>
                  </template>
                  <el-form
                    size="small"
                    :model="simLocation"
                    style="padding: 38px 0"
                  >
                    <el-form-item :label="$t('IOSRemote.positioning.x')">
                      <el-input-number
                        v-model="simLocation.long"
                        style="width: 100%"
                        :precision="6"
                        :step="0.1"
                        controls-position="right"
                      />
                    </el-form-item>
                    <el-form-item :label="$t('IOSRemote.positioning.y')">
                      <el-input-number
                        v-model="simLocation.lat"
                        style="width: 100%"
                        :precision="6"
                        :step="0.1"
                        controls-position="right"
                      />
                    </el-form-item>
                  </el-form>
                  <div style="text-align: center">
                    <el-button size="mini" type="primary" @click="locationSet"
                      >{{ $t('IOSRemote.positioning.start') }}
                    </el-button>
                    <el-button size="mini" type="primary" @click="locationUnset"
                      >{{ $t('IOSRemote.positioning.end') }}
                    </el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>
          <el-tab-pane :label="$t('androidRemoteTS.code.app')" name="apps">
            <el-tabs v-model="activeInstallTab" type="border-card" stretch>
              <el-tab-pane name="linkInstallPane">
                <template #label>
                  <strong>{{ $t('androidRemoteTS.code.linkInstall') }}</strong>
                </template>
                <package-list
                  platform-type="iOS"
                  @select-package="selectPackage"
                ></package-list>
              </el-tab-pane>
              <el-tab-pane name="pushInstallPane">
                <template #label>
                  <strong>{{ $t('IOSRemote.installIPA') }}</strong>
                </template>
                <div style="text-align: center">
                  <el-upload
                    v-loading="uploadLoading"
                    drag
                    action=""
                    :with-credentials="true"
                    :limit="1"
                    :before-upload="beforeAvatarUpload2"
                    :on-exceed="limitOut"
                    :http-request="uploadPackage"
                  >
                    <i class="el-icon-upload"></i>
                    <div class="el-upload__text">
                      {{ $t('IOSRemote.moveIPA')
                      }}<em>{{ $t('devices.detail.uploadImg') }}</em>
                    </div>
                    <template #tip>
                      <div class="el-upload__tip">
                        {{ $t('IOSRemote.onlyIPAFile') }}
                      </div>
                    </template>
                  </el-upload>
                </div>
              </el-tab-pane>

              <el-tab-pane name="urlInstallPane">
                <template #label>
                  <strong>{{ $t('androidRemoteTS.code.URLInstall') }}</strong>
                </template>
                <el-input
                  v-model="uploadUrl"
                  clearable
                  size="small"
                  :placeholder="$t('IOSRemote.pleaseIPAFilePath')"
                ></el-input>
                <div style="text-align: center; margin-top: 20px">
                  <el-button
                    size="mini"
                    type="primary"
                    :disabled="uploadUrl.length === 0"
                    @click="install(uploadUrl)"
                    >{{ $t('androidRemoteTS.code.send') }}
                  </el-button>
                </div>
              </el-tab-pane>
            </el-tabs>

            <el-card shadow="hover" style="margin-top: 15px">
              <el-table :data="currAppListPageData" border>
                <el-table-column width="100" header-align="center">
                  <template #header>
                    <el-button size="mini" @click="refreshAppList"
                      >{{ $t('androidRemoteTS.code.refresh') }}
                    </el-button>
                  </template>
                  <template #default="scope">
                    <div
                      style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                      "
                    >
                      <el-avatar
                        shape="square"
                        :size="40"
                        :src="'data:image/png;base64,' + scope.row.iconBase64"
                      ></el-avatar>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column
                  width="150"
                  show-overflow-tooltip
                  header-align="center"
                  prop="name"
                  :label="$t('androidRemoteTS.code.appName')"
                >
                </el-table-column>
                <el-table-column
                  header-align="center"
                  show-overflow-tooltip
                  prop="bundleId"
                  :label="$t('androidRemoteTS.code.packagesName')"
                >
                  <template #default="scope">
                    <div
                      style="cursor: pointer"
                      @click="copy(scope.row.bundleId)"
                    >
                      {{ scope.row.bundleId }}
                    </div>
                  </template>
                </el-table-column>
                <el-table-column
                  header-align="center"
                  show-overflow-tooltip
                  prop="version"
                  :label="$t('androidRemoteTS.code.version')"
                  width="120"
                ></el-table-column>
                <el-table-column
                  header-align="center"
                  show-overflow-tooltip
                  prop="shortVersion"
                  :label="$t('androidRemoteTS.code.subversion')"
                  width="120"
                ></el-table-column>
                <el-table-column align="center" width="260">
                  <template #header>
                    <el-input
                      v-model="filterAppText"
                      size="mini"
                      :placeholder="$t('androidRemoteTS.code.nameSearch')"
                    />
                  </template>
                  <template #default="scope">
                    <el-button
                      size="mini"
                      type="primary"
                      @click="openApp(scope.row.bundleId)"
                    >
                      {{ $t('androidRemoteTS.code.open') }}
                    </el-button>
                    <el-button
                      size="mini"
                      type="warning"
                      @click="killApp(scope.row.bundleId)"
                    >
                      {{ $t('androidRemoteTS.code.kill') }}
                    </el-button>
                    <el-button
                      size="mini"
                      type="danger"
                      @click="uninstallApp(scope.row.bundleId)"
                    >
                      {{ $t('androidRemoteTS.code.unInstall') }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <Pageable
                :is-page-set="false"
                :total="filterTableData.length"
                :current-page="currAppListPageIndex + 1"
                :page-size="7"
                @change="changeAppListPage"
              ></Pageable>
            </el-card>
          </el-tab-pane>
          <el-tab-pane :label="$t('androidRemoteTS.code.packet')" name="proxy">
            <el-button size="small" type="success" @click="startProxy"
              >{{ $t('androidRemoteTS.code.startPacket') }}
            </el-button>
            <el-button size="small" @click="installCert"
              >{{ $t('IOSRemote.openWeb') }}
            </el-button>
            <strong style="color: #545c64; font-size: 14px; margin-left: 6px">
              {{ $t('IOSRemote.web.openInput') }}
              <span style="color: #409eff">{{
                'http://' +
                agent['host'] +
                ':' +
                agent['port'] +
                '/assets/download'
              }}</span>
              {{ $t('androidRemoteTS.code.downloadCertificate') }}</strong
            >
            <strong
              v-if="proxyConnPort !== 0"
              style="color: #67c23a; float: right; margin-top: 5px"
              >{{ $t('androidRemoteTS.code.proxyConnection') }}：{{
                agent['host'] + ':' + proxyConnPort
              }}</strong
            >
            <iframe
              v-if="proxyWebPort !== 0"
              allow="clipboard-read;clipboard-write"
              :style="
                'border:1px solid #C0C4CC;width: 100%;height: ' +
                iFrameHeight +
                'px;margin-top:15px'
              "
              :src="'http://' + agent['host'] + ':' + proxyWebPort"
            ></iframe>
            <el-card v-else style="margin-top: 20px">
              <template #header
                ><strong>{{
                  $t('androidRemoteTS.code.useTeaching')
                }}</strong></template
              >
              <div style="height: 300px">
                <el-steps direction="vertical" :active="3">
                  <el-step
                    :title="$t('androidRemoteTS.code.connectWifi')"
                    status="process"
                    :description="$t('androidRemoteTS.code.connectWifiText')"
                  />
                  <el-step
                    :title="$t('androidRemoteTS.code.downloadCertificate')"
                    status="process"
                    :description="
                      $t('androidRemoteTS.code.installCertificateText')
                    "
                  />
                  <el-step
                    :title="$t('androidRemoteTS.code.installCertificate')"
                    status="process"
                    :description="$t('IOSRemote.messageStep')"
                  />
                  <el-step
                    :title="$t('IOSRemote.trustCertificate')"
                    status="process"
                    :description="$t('IOSRemote.certificateStep')"
                  />
                  <el-step
                    :title="$t('androidRemoteTS.code.startPacket')"
                    status="process"
                    :description="$t('IOSRemote.startPacketMessage')"
                  />
                </el-steps>
              </div>
            </el-card>
          </el-tab-pane>
          <el-tab-pane
            :label="$t('androidRemoteTS.code.screenshotQuick')"
            name="screenCap"
          >
            <el-button type="primary" size="small" @click="quickCap">
              <el-icon :size="12" style="vertical-align: middle">
                <Camera />
              </el-icon>
              {{ $t('androidRemoteTS.code.screenshot') }}
            </el-button>
            <el-button type="danger" size="small" @click="removeScreen">
              <el-icon :size="12" style="vertical-align: middle">
                <Delete />
              </el-icon>
              {{ $t('androidRemoteTS.code.clean') }}
            </el-button>
            <el-card
              v-if="screenUrls.length === 0"
              style="height: 100%; margin-top: 10px"
            >
              <el-empty
                :description="$t('androidRemoteTS.code.noScreenshots')"
              ></el-empty>
            </el-card>
            <el-row v-else :gutter="20">
              <el-col
                v-for="u in screenUrls"
                :xs="8"
                :sm="8"
                :md="8"
                :lg="4"
                :xl="4"
                style="margin-top: 10px"
              >
                <el-card shadow="hover" :body-style="{ padding: '10px' }">
                  <el-image
                    :src="u"
                    :preview-src-list="screenUrls"
                    hide-on-click-modal
                  ></el-image>
                  <div style="text-align: center; margin-top: 5px">
                    <el-button
                      type="primary"
                      plain
                      size="mini"
                      @click="downloadImg(u)"
                    >
                      <el-icon :size="12" style="vertical-align: middle">
                        <Download />
                      </el-icon>
                      {{ $t('androidRemoteTS.code.savePicture') }}
                    </el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>
          <el-tab-pane label="Terminal" name="terminal">
            <el-tabs stretch type="border-card">
              <el-tab-pane label="Process">
                <div style="text-align: center">
                  <el-button
                    size="mini"
                    style="margin-left: 5px"
                    type="primary"
                    @click="getProcessList"
                    >Search
                  </el-button>
                  <el-button
                    size="mini"
                    style="margin-left: 5px"
                    type="warning"
                    @click="clearProcess"
                    >Clear
                  </el-button>
                </div>
                <el-table
                  style="margin-top: 10px"
                  border
                  :data="currProcessListPage"
                >
                  <el-table-column
                    align="center"
                    label="PID"
                    width="90"
                    prop="pid"
                  />
                  <el-table-column
                    align="center"
                    label="Name"
                    width="290"
                    prop="name"
                  />
                  <el-table-column
                    header-align="center"
                    label="Real Application Name"
                    show-overflow-tooltip
                    prop="realAppName"
                  />
                  <el-table-column
                    align="center"
                    label="Start Date"
                    width="250"
                    prop="startDate"
                  />
                </el-table>
                <Pageable
                  :is-page-set="false"
                  :total="processList.length"
                  :current-page="currProcessListIndex + 1"
                  :page-size="processPageSize"
                  @change="changeProcessListPage"
                ></Pageable>
              </el-tab-pane>
              <el-tab-pane label="Syslog">
                <el-card
                  style="border: 0px"
                  :body-style="{
                    color: '#FFFFFF',
                    backgroundColor: '#303133',
                    lineHeight: '1.5',
                  }"
                >
                  <div style="display: flex; margin-bottom: 10px">
                    <el-input
                      v-model="logFilter"
                      style="margin-left: 5px"
                      size="mini"
                      :placeholder="$t('androidRemoteTS.code.enterInput')"
                    >
                      <template #prepend>| grep</template>
                    </el-input>
                    <el-button
                      size="mini"
                      style="margin-left: 5px"
                      type="primary"
                      @click="getSyslog"
                      >Search
                    </el-button>
                    <el-button
                      size="mini"
                      style="margin-left: 5px"
                      type="danger"
                      @click="stopSyslog"
                      >Stop
                    </el-button>
                    <el-button
                      size="mini"
                      style="margin-left: 5px"
                      type="warning"
                      @click="clearLogcat"
                      >Clear
                    </el-button>
                  </div>
                  <el-scrollbar
                    ref="terminalScroll"
                    noresize
                    :style="'height:' + terminalHeight + 'px;min-height:450px'"
                  >
                    <div
                      v-for="(l, i) in logOutPut"
                      :key="i"
                      style="white-space: pre-wrap"
                      v-html="l"
                    ></div>
                  </el-scrollbar>
                </el-card>
              </el-tab-pane>
            </el-tabs>
          </el-tab-pane>
          <el-tab-pane
            :label="$t('androidRemoteTS.code.UIAutomation.UIAutomationName')"
            name="auto"
          >
            <div v-if="testCase['id']">
              <el-collapse accordion style="margin-bottom: 20px">
                <el-collapse-item>
                  <template #title>
                    <div
                      style="
                        display: flex;
                        align-items: center;
                        width: 100%;
                        justify-content: space-between;
                      "
                    >
                      <strong
                        style="
                          font-size: 15px;
                          color: #909399;
                          margin-left: 10px;
                        "
                        >{{
                          $t('androidRemoteTS.code.UIAutomation.testInfo')
                        }}</strong
                      >
                      <el-button
                        style="margin-right: 10px"
                        type="danger"
                        size="mini"
                        @click="removeCase"
                      >
                        {{ $t('androidRemoteTS.code.UIAutomation.clean') }}
                      </el-button>
                    </div>
                  </template>
                  <el-descriptions :column="2" size="medium" border>
                    <el-descriptions-item
                      width="100px"
                      :label="$t('projectIndexTS.page.caseId')"
                      >{{ testCase['id'] }}
                    </el-descriptions-item>
                    <el-descriptions-item
                      width="100px"
                      :label="$t('projectIndexTS.page.caseName')"
                      >{{ testCase.name }}
                    </el-descriptions-item>
                    <el-descriptions-item
                      :label="
                        $t('androidRemoteTS.code.UIAutomation.fatherPlayed')
                      "
                    >
                      <div style="display: flex; align-items: center">
                        <el-avatar
                          style="margin-right: 10px"
                          :size="27"
                          :src="
                            project['projectImg'].length > 0
                              ? project['projectImg']
                              : defaultLogo
                          "
                          shape="square"
                        ></el-avatar>
                        {{ project['projectName'] }}
                      </div>
                    </el-descriptions-item>
                    <el-descriptions-item
                      :label="$t('stepListViewTS.platformToBe')"
                    >
                      <div style="display: flex; align-items: center">
                        <el-avatar
                          style="margin-right: 10px"
                          :size="27"
                          :src="
                            getImg(
                              testCase['platform'] === 1 ? 'ANDROID' : 'IOS'
                            )
                          "
                          shape="square"
                        ></el-avatar>
                        {{
                          testCase['platform'] === 1
                            ? $t('publicStepTS.android')
                            : 'iOS'
                        }}
                      </div>
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('stepListViewTS.module')">
                      {{
                        testCase['modulesDTO'] !== null
                          ? testCase['modulesDTO'].name
                          : ''
                      }}
                    </el-descriptions-item>
                    <el-descriptions-item
                      :label="$t('stepListViewTS.versionName')"
                      >{{ testCase['version'] }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('stepListViewTS.designer')"
                      >{{ testCase['designer'] }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('stepListViewTS.last')"
                      >{{ testCase['editTime'] }}
                    </el-descriptions-item>
                    <el-descriptions-item
                      :label="$t('stepListViewTS.testMessage')"
                      >{{ testCase['des'] }}
                    </el-descriptions-item>
                  </el-descriptions>
                </el-collapse-item>
              </el-collapse>
              <el-tabs v-model="activeTab2" type="border-card" stretch>
                <el-tab-pane :label="$t('publicStepTS.list')" name="step">
                  <step-list
                    :is-show-run="true"
                    :platform="2"
                    :is-driver-finish="isDriverFinish"
                    :case-id="testCase['id']"
                    :project-id="project['id']"
                    :debug-loading="debugLoading"
                    @run-step="runStep"
                  />
                </el-tab-pane>
                <el-tab-pane
                  :label="$t('resultDetailTS.page.runLog')"
                  name="log"
                >
                  <step-log
                    :is-read-only="false"
                    :debug-loading="debugLoading"
                    :step-log="stepLog"
                    @clear-log="clearLog"
                    @stop-step="stopStep"
                  />
                </el-tab-pane>
              </el-tabs>
            </div>
            <div v-else>
              <span style="color: #909399; margin-right: 10px">{{
                $t('androidRemoteTS.code.associatedProject')
              }}</span>
              <el-select
                v-model="project"
                size="mini"
                value-key="id"
                :placeholder="$t('androidRemoteTS.code.chooseProject')"
              >
                <el-option
                  v-for="item in store.state.projectList"
                  :key="item.id"
                  :value="item"
                  :label="item['projectName']"
                >
                  <div style="display: flex; align-items: center">
                    <el-avatar
                      style="margin-right: 10px"
                      :size="32"
                      :src="
                        item['projectImg'].length > 0
                          ? item['projectImg']
                          : defaultLogo
                      "
                      shape="square"
                    ></el-avatar>
                    {{ item['projectName'] }}
                  </div>
                </el-option>
              </el-select>
              <el-button
                v-if="project !== null"
                size="mini"
                type="primary"
                round
                style="position: absolute; right: 20px"
                @click="caseList.open()"
              >
                新增用例
              </el-button>
              <test-case-list
                v-if="project !== null"
                ref="caseList"
                :project-id="project['id']"
                :platform="2"
                :is-read-only="true"
                @select-case="selectCase"
              ></test-case-list>
              <el-card style="height: 100%; margin-top: 20px">
                <el-result
                  icon="info"
                  :title="$t('androidRemoteTS.code.hintText')"
                  :sub-title="$t('androidRemoteTS.code.hintMessage')"
                >
                </el-result>
              </el-card>
            </div>
          </el-tab-pane>
          <el-tab-pane :label="$t('routes.controlElement')" name="ele">
            <el-tabs stretch type="border-card">
              <el-tab-pane :label="$t('androidRemoteTS.code.nativeControls')">
                <div v-show="isShowImg">
                  <div
                    style="
                      margin-bottom: 15px;
                      display: flex;
                      align-items: center;
                    "
                  >
                    <span
                      style="
                        margin-right: 10px;
                        color: #909399;
                        font-size: 14px;
                      "
                      >{{ $t('IOSRemote.depth') }}:
                    </span>
                    <el-input-number
                      v-model="depth"
                      size="mini"
                      :min="1"
                      :max="60"
                    />
                    <el-button
                      type="primary"
                      size="mini"
                      :loading="elementLoading"
                      :disabled="isDriverFinish === false"
                      style="margin-left: 10px"
                      @click="getElement"
                    >
                      <el-icon :size="12" style="vertical-align: middle">
                        <Search />
                      </el-icon>
                      {{ $t('androidRemoteTS.code.retrieveControlEle') }}
                    </el-button>
                  </div>
                  <el-row :gutter="10">
                    <el-col :span="7">
                      <el-card shadow="hover">
                        <div
                          :style="
                            'width: 100%;background-image: url(' +
                            imgUrl +
                            ');background-size: 100% 100%;'
                          "
                        >
                          <canvas
                            id="debugPicIOS"
                            @mousedown="touchstart"
                          ></canvas>
                        </div>
                      </el-card>
                    </el-col>
                    <el-col :span="9">
                      <el-card v-if="isShowTree" shadow="hover">
                        <el-input
                          v-model="filterText"
                          style="margin-bottom: 10px"
                          size="mini"
                          :placeholder="$t('IOSRemote.filterClassOrName')"
                        ></el-input>
                        <div style="height: 660px">
                          <el-scrollbar
                            class="element-tree-scrollbar"
                            style="height: 100%"
                          >
                            <el-tree
                              ref="tree"
                              :indent="13"
                              :filter-node-method="filterNode"
                              :default-expanded-keys="currentId"
                              node-key="id"
                              style="margin-top: 10px; margin-bottom: 20px"
                              :highlight-current="true"
                              :accordion="true"
                              :data="elementData"
                              @node-click="handleNodeClick"
                            >
                              <template #default="{ node, data }">
                                <span
                                  v-if="data.detail['name']"
                                  style="font-size: 14px"
                                >
                                  {{
                                    node.label.substring(
                                      0,
                                      node.label.indexOf('>')
                                    ) + ' '
                                  }}
                                  <span style="color: #f55781">name</span>={{
                                    '"' + data.detail['name'] + '">'
                                  }}
                                </span>
                                <span v-else style="font-size: 14px">{{
                                  node.label
                                }}</span>
                              </template>
                            </el-tree>
                          </el-scrollbar>
                        </div>
                      </el-card>
                    </el-col>
                    <el-col :span="8">
                      <el-card v-if="isShowTree" shadow="hover">
                        <div style="height: 695px; padding-bottom: 60px">
                          <div
                            v-if="project && project['id']"
                            style="text-align: center; margin-bottom: 10px"
                          >
                            <el-button
                              :disabled="elementDetail === null"
                              plain
                              size="small"
                              type="primary"
                              round
                              @click="toAddElement('', '')"
                              >{{ $t('androidRemoteTS.code.addControls') }}
                            </el-button>
                            <el-button
                              v-if="
                                elementDetail &&
                                elementDetail['xpath'] &&
                                isDriverFinish
                              "
                              :loading="elementScreenLoading"
                              style="margin-left: 5px"
                              plain
                              size="small"
                              round
                              @click="getEleScreen(elementDetail['xpath'])"
                              >{{ $t('androidRemoteTS.code.controlSnapshot') }}
                            </el-button>
                          </div>
                          <div v-else>
                            <el-alert
                              style="margin-bottom: 10px"
                              :title="$t('androidRemoteTS.code.titleMessage')"
                              type="info"
                              show-icon
                              close-text="Get!"
                            />
                            <el-select
                              v-model="project"
                              style="width: 100%"
                              size="mini"
                              value-key="id"
                              :placeholder="
                                $t('androidRemoteTS.code.chooseProject')
                              "
                            >
                              <el-option
                                v-for="item in store.state.projectList"
                                :key="item.id"
                                :value="item"
                                :label="item['projectName']"
                              >
                                <div style="display: flex; align-items: center">
                                  <el-avatar
                                    style="margin-right: 10px"
                                    :size="32"
                                    :src="
                                      item['projectImg'].length > 0
                                        ? item['projectImg']
                                        : defaultLogo
                                    "
                                    shape="square"
                                  ></el-avatar>
                                  {{ item['projectName'] }}
                                </div>
                              </el-option>
                            </el-select>
                          </div>
                          <el-scrollbar
                            style="height: 100%"
                            class="element-tree-scrollbar"
                          >
                            <el-form
                              v-if="elementDetail !== null"
                              label-position="left"
                              class="element-table"
                              label-width="100px"
                            >
                              <el-form-item
                                label="type"
                                style="cursor: pointer"
                                @click="copy(elementDetail['type'])"
                              >
                                <span>{{ elementDetail['type'] }}</span>
                              </el-form-item>
                              <el-form-item
                                v-if="elementDetail['name']"
                                label="accessibilityId"
                                style="cursor: pointer"
                              >
                                <span @click="copy(elementDetail['name'])">{{
                                  elementDetail['name']
                                }}</span>
                                <el-icon
                                  color="green"
                                  size="16"
                                  style="
                                    vertical-align: middle;
                                    margin-left: 10px;
                                    cursor: pointer;
                                  "
                                  @click="
                                    checkLocation({
                                      eleType: 'accessibilityId',
                                      eleValue: elementDetail['name'],
                                    })
                                  "
                                >
                                  <Location />
                                </el-icon>
                                <el-icon
                                  v-if="project && project['id']"
                                  color="green"
                                  size="16"
                                  style="
                                    vertical-align: middle;
                                    margin-left: 10px;
                                    cursor: pointer;
                                  "
                                  @click="
                                    toAddElement(
                                      'accessibilityId',
                                      elementDetail['name']
                                    )
                                  "
                                >
                                  <Pointer />
                                </el-icon>
                              </el-form-item>
                              <el-form-item :label="$t('IOSRemote.predicate')">
                                <el-table
                                  stripe
                                  :empty-text="$t('IOSRemote.noRecommend')"
                                  border
                                  :data="findBestNS(elementDetail)"
                                  :show-header="false"
                                >
                                  <el-table-column>
                                    <template #default="scope">
                                      <span
                                        style="cursor: pointer"
                                        @click="copy(scope.row)"
                                        >{{ scope.row }}</span
                                      >
                                      <el-icon
                                        color="green"
                                        size="16"
                                        style="
                                          vertical-align: middle;
                                          margin-left: 10px;
                                          cursor: pointer;
                                        "
                                        @click="
                                          checkLocation({
                                            eleType: 'nsPredicate',
                                            eleValue: scope.row,
                                          })
                                        "
                                      >
                                        <Location />
                                      </el-icon>
                                      <el-icon
                                        v-if="project && project['id']"
                                        color="green"
                                        size="16"
                                        style="
                                          vertical-align: middle;
                                          margin-left: 10px;
                                          cursor: pointer;
                                        "
                                        @click="
                                          toAddElement('nsPredicate', scope.row)
                                        "
                                      >
                                        <Pointer />
                                      </el-icon>
                                    </template>
                                  </el-table-column>
                                </el-table>
                              </el-form-item>
                              <el-form-item :label="$t('IOSRemote.classChain')">
                                <el-table
                                  stripe
                                  :empty-text="$t('IOSRemote.noRecommend')"
                                  border
                                  :data="findBestClassChain(elementDetail)"
                                  :show-header="false"
                                >
                                  <el-table-column>
                                    <template #default="scope">
                                      <span
                                        style="cursor: pointer"
                                        @click="copy(scope.row)"
                                        >{{ scope.row }}</span
                                      >
                                      <el-icon
                                        color="green"
                                        size="16"
                                        style="
                                          vertical-align: middle;
                                          margin-left: 10px;
                                          cursor: pointer;
                                        "
                                        @click="
                                          checkLocation({
                                            eleType: 'classChain',
                                            eleValue: scope.row,
                                          })
                                        "
                                      >
                                        <Location />
                                      </el-icon>
                                      <el-icon
                                        v-if="project && project['id']"
                                        color="green"
                                        size="16"
                                        style="
                                          vertical-align: middle;
                                          margin-left: 10px;
                                          cursor: pointer;
                                        "
                                        @click="
                                          toAddElement('classChain', scope.row)
                                        "
                                      >
                                        <Pointer />
                                      </el-icon>
                                    </template>
                                  </el-table-column>
                                </el-table>
                              </el-form-item>
                              <el-form-item
                                :label="$t('androidRemoteTS.code.xpath')"
                              >
                                <el-table
                                  stripe
                                  :empty-text="
                                    $t('androidRemoteTS.code.xpathNull')
                                  "
                                  border
                                  :data="findBestXpath(elementDetail)"
                                  :show-header="false"
                                >
                                  <el-table-column>
                                    <template #default="scope">
                                      <span
                                        style="cursor: pointer"
                                        @click="copy(scope.row)"
                                        >{{ scope.row }}</span
                                      >
                                      <el-icon
                                        color="green"
                                        size="16"
                                        style="
                                          vertical-align: middle;
                                          margin-left: 10px;
                                          cursor: pointer;
                                        "
                                        @click="
                                          checkLocation({
                                            eleType: 'xpath',
                                            eleValue: scope.row,
                                          })
                                        "
                                      >
                                        <Location />
                                      </el-icon>
                                      <el-icon
                                        v-if="project && project['id']"
                                        color="green"
                                        size="16"
                                        style="
                                          vertical-align: middle;
                                          margin-left: 10px;
                                          cursor: pointer;
                                        "
                                        @click="
                                          toAddElement('xpath', scope.row)
                                        "
                                      >
                                        <Pointer />
                                      </el-icon>
                                    </template>
                                  </el-table-column>
                                </el-table>
                              </el-form-item>
                              <el-form-item
                                :label="$t('androidRemoteTS.code.absolutePath')"
                                style="cursor: pointer"
                              >
                                <span @click="copy(elementDetail['xpath'])">{{
                                  elementDetail['xpath']
                                }}</span>
                                <el-icon
                                  color="green"
                                  size="16"
                                  style="
                                    vertical-align: middle;
                                    margin-left: 10px;
                                    cursor: pointer;
                                  "
                                  @click="
                                    checkLocation({
                                      eleType: 'xpath',
                                      eleValue: elementDetail['xpath'],
                                    })
                                  "
                                >
                                  <Location />
                                </el-icon>
                                <el-icon
                                  v-if="project && project['id']"
                                  color="green"
                                  size="16"
                                  style="
                                    vertical-align: middle;
                                    margin-left: 10px;
                                    cursor: pointer;
                                  "
                                  @click="
                                    toAddElement(
                                      'xpath',
                                      elementDetail['xpath']
                                    )
                                  "
                                >
                                  <Pointer />
                                </el-icon>
                              </el-form-item>
                              <el-form-item
                                label="name"
                                style="cursor: pointer"
                                @click="copy(elementDetail['name'])"
                              >
                                <span>{{ elementDetail['name'] }}</span>
                              </el-form-item>
                              <el-form-item
                                v-if="elementDetail['label']"
                                label="label"
                                style="cursor: pointer"
                                @click="copy(elementDetail['label'])"
                              >
                                <span>{{ elementDetail['label'] }}</span>
                              </el-form-item>
                              <el-form-item
                                v-if="elementDetail['value']"
                                label="value"
                                style="cursor: pointer"
                                @click="copy(elementDetail['value'])"
                              >
                                <span>{{ elementDetail['value'] }}</span>
                              </el-form-item>
                              <el-form-item
                                :label="$t('androidRemoteTS.code.centerXY')"
                                style="cursor: pointer"
                              >
                                <span
                                  @click="
                                    copy(
                                      computedCenter(
                                        elementDetail['x'],
                                        elementDetail['y'],
                                        elementDetail['width'],
                                        elementDetail['height']
                                      )
                                    )
                                  "
                                  >{{
                                    computedCenter(
                                      elementDetail['x'],
                                      elementDetail['y'],
                                      elementDetail['width'],
                                      elementDetail['height']
                                    )
                                  }}</span
                                >
                                <el-icon
                                  color="green"
                                  size="16"
                                  style="
                                    vertical-align: middle;
                                    margin-left: 10px;
                                    cursor: pointer;
                                  "
                                  @click="
                                    checkLocation({
                                      eleType: 'point',
                                      eleValue: computedCenter(
                                        elementDetail['x'],
                                        elementDetail['y'],
                                        elementDetail['width'],
                                        elementDetail['height']
                                      ),
                                    })
                                  "
                                >
                                  <Location />
                                </el-icon>
                                <el-icon
                                  v-if="project && project['id']"
                                  color="green"
                                  size="16"
                                  style="
                                    vertical-align: middle;
                                    margin-left: 10px;
                                    cursor: pointer;
                                  "
                                  @click="
                                    toAddElement(
                                      'point',
                                      computedCenter(
                                        elementDetail['x'],
                                        elementDetail['y'],
                                        elementDetail['width'],
                                        elementDetail['height']
                                      )
                                    )
                                  "
                                >
                                  <Pointer />
                                </el-icon>
                              </el-form-item>
                              <el-form-item label="index">
                                <span>{{ elementDetail['index'] }}</span>
                              </el-form-item>
                              <el-form-item label="enabled">
                                <el-switch
                                  :value="JSON.parse(elementDetail['enabled'])"
                                  disabled
                                >
                                </el-switch>
                              </el-form-item>
                              <el-form-item label="visible">
                                <el-switch
                                  :value="JSON.parse(elementDetail['visible'])"
                                  disabled
                                >
                                </el-switch>
                              </el-form-item>
                              <el-form-item label="x">
                                <span>{{ elementDetail['x'] }}</span>
                              </el-form-item>
                              <el-form-item label="y">
                                <span>{{ elementDetail['y'] }}</span>
                              </el-form-item>
                              <el-form-item label="width">
                                <span>{{ elementDetail['width'] }}</span>
                              </el-form-item>
                              <el-form-item label="height">
                                <span>{{ elementDetail['height'] }}</span>
                              </el-form-item>
                            </el-form>
                          </el-scrollbar>
                        </div>
                      </el-card>
                    </el-col>
                  </el-row>
                </div>
                <el-card v-show="!isShowImg" style="height: 100%">
                  <el-result
                    icon="info"
                    :title="$t('androidRemoteTS.code.hintText')"
                    :sub-title="$t('androidRemoteTS.code.subTitleText')"
                  >
                    <template #extra>
                      <el-button
                        type="primary"
                        size="mini"
                        :loading="elementLoading"
                        :disabled="isDriverFinish === false"
                        @click="getElement"
                      >
                        <el-icon :size="12" style="vertical-align: middle">
                          <Search />
                        </el-icon>
                        {{ $t('androidRemoteTS.code.getEle') }}
                      </el-button>
                    </template>
                  </el-result>
                </el-card>
              </el-tab-pane>
              <el-tab-pane :label="$t('androidRemoteTS.code.poco')">
                <poco-pane
                  ref="pocoPaneRef"
                  :poco-loading="pocoLoading"
                  :is-driver-finish="isDriverFinish"
                  :direction-status="directionStatus"
                  :project-list="store.state.projectList"
                  :get-img-url="getImgUrl"
                  @get-poco="getPoco"
                  @copy="copy"
                />
              </el-tab-pane>
            </el-tabs>
          </el-tab-pane>
          <el-tab-pane
            :label="$t('androidRemoteTS.code.webView.webDebug')"
            name="webview"
          >
            <div v-if="isWebView">
              <div v-if="webViewListDetail.length == 0">
                <el-result
                  icon="info"
                  :title="$t('androidRemoteTS.code.hintText')"
                  :sub-title="$t('androidRemoteTS.code.webView.err')"
                >
                  <template #extra>
                    <el-button
                      type="primary"
                      size="mini"
                      :loading="webViewLoading"
                      @click="getWebViewForward"
                    >
                      <el-icon :size="12" style="vertical-align: middle">
                        <Search />
                      </el-icon>
                      {{ $t('androidRemoteTS.code.webView.getWeb') }}
                    </el-button>
                  </template>
                </el-result>
              </div>
              <div v-else>
                <el-button
                  :loading="webViewLoading"
                  type="primary"
                  size="mini"
                  @click="getWebViewForward"
                >
                  {{ $t('androidRemoteTS.code.webView.againGetWeb') }}
                </el-button>
                <el-card
                  v-for="web in webViewListDetail"
                  :key="web.id"
                  style="margin-top: 15px"
                  class="device-card"
                  :body-style="{ padding: '0px 10px 10px 10px' }"
                >
                  <template #header>
                    <div>
                      <div style="display: flex; align-items: center">
                        <img :src="getImg('safari')" width="20" />
                        <strong style="margin-left: 10px">{{
                          web['pid'] +
                          ' ' +
                          web['name'] +
                          ' (' +
                          web['bundleId'] +
                          ')'
                        }}</strong>
                      </div>
                    </div>
                  </template>
                  <el-card
                    v-for="w in web['pages']"
                    :key="w.id"
                    :body-style="{ padding: '15px' }"
                    style="
                      margin-top: 10px;
                      word-wrap: break-word;
                      overflow: hidden;
                    "
                  >
                    <div
                      style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                      "
                    >
                      <div>
                        <div style="display: flex; align-items: center">
                          <img
                            v-if="w.favicon"
                            :src="w.favicon"
                            width="15"
                            style="margin-right: 5px"
                          />
                          <strong>{{
                            w.title.length > 0
                              ? w.title
                              : $t('androidRemoteTS.code.webView.Untitled')
                          }}</strong>
                        </div>
                        <div style="color: #909399">
                          {{
                            w.url.length > 50
                              ? w.url.substring(0, 50) + '...'
                              : w.url
                          }}
                        </div>
                      </div>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="
                          tabWebView(
                            w.port,
                            w.id,
                            w.title.length > 0
                              ? w.title
                              : $t('androidRemoteTS.code.webView.Untitled')
                          )
                        "
                      >
                        {{ $t('androidRemoteTS.code.webView.nowDebug') }}
                      </el-button>
                    </div>
                  </el-card>
                </el-card>
              </div>
            </div>
            <div v-else>
              <div style="display: flex; align-items: center">
                <el-page-header
                  icon="el-icon-arrow-left"
                  @back="switchIsWebView"
                >
                  <template #title>
                    <span style="color: #606266">{{
                      $t('androidRemoteTS.code.webView.return')
                    }}</span>
                  </template>
                  <template #content>
                    {{ $t('androidRemoteTS.code.webView.nowWeb') }}：<strong>{{
                      title
                    }}</strong>
                  </template>
                </el-page-header>
              </div>
              <iframe
                v-if="!isWebView"
                allow="clipboard-read;clipboard-write"
                :style="
                  'border:1px solid #C0C4CC;;width: 100%;height: ' +
                  iFrameHeight +
                  'px;margin-top:15px'
                "
                :src="iframeUrl"
              >
              </iframe>
            </div>
          </el-tab-pane>
          <el-tab-pane :label="$t('IOSRemote.perfmon')" name="perfmon">
            <i-o-s-perf
              ref="iosPerfRef"
              :app-list="appList"
              @start-perfmon="startPerfmon"
              @stop-perfmon="stopPerfmon"
            />
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="less">
#iOSpressKey {
  padding: 3px;
  width: 100%;
  margin-top: 10px;
}

.line {
  width: 2px;
  height: inherit;
  background: #ccc;
  text-align: center;
  border-radius: 1px;
  margin-right: -2px;
  position: relative;
  z-index: 9;
  cursor: e-resize;

  &::after {
    content: '';
    position: absolute;
    top: 48%;
    left: -14px;
    display: block;
    width: 30px;
    height: 30px;
    background: url('@/assets/img/drag.png') no-repeat center;
    transform: rotate(90deg);
    background-size: 100% 100%;
  }
}

.lineVertical {
  width: 100%;
  height: 2px;
  background: #ccc;
  text-align: center;
  position: relative;
  cursor: n-resize;
  margin: 1em calc(16px);

  &::after {
    content: '';
    position: absolute;
    left: 48%;
    top: -14px;
    display: block;
    width: 30px;
    height: 30px;
    background: url('@/assets/img/drag.png') no-repeat center;
    background-size: 100% 100%;
  }
}

#debugPicIOS {
  width: 100%;
  height: auto;
}

.url-install-box {
  position: relative;
  height: 100%;
}

.input-box {
  position: absolute;
  border: none;
  background-color: transparent;
  outline: none;
  z-index: -1;
  width: 1px;
}
</style>
