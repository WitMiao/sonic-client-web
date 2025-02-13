<script setup lang="ts">
import axios from '@/http/axios';

import store from '@/store';
import decodeByBase64 from '@/utils/cipher';
import message from 'element-plus/lib/components/message';
import messageBox from 'element-plus/lib/components/message-box';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const { currentRoute } = router;
const isLogout = currentRoute.value.query?.isLogout === '1';
const redirectUrl = (currentRoute.value.query?.redirect as string) || '/';
const loginParamsUrlGet = currentRoute.value.query?.loginParams as string;
const loginParams = loginParamsUrlGet
  ? JSON.parse(decodeByBase64(currentRoute.value.query?.loginParams as string))
  : {};

const retryCount = ref(0);

const goToTechLogin = (needRefresh = false) => {
  window.open(
    `https://forgeon.hypergryph.net/link/other?fs=1${
      needRefresh ? '&refresh=1' : ''
    }&redirect=${encodeURIComponent(redirectUrl)}&origin=${encodeURIComponent(
      `${window.location.origin}/Login`
    )}`,
    '_self'
  );
};

const onLogin = async () => {
  await store.commit('clearAuth');

  const res: { code: number; data: any } = await axios.post(
    '/controller/users/loginSso',
    loginParams
  );
  if (res.code === 2000) {
    // 获取后端路由

    store.commit('changeLogin', res.data);
    if (route.query.redirect) {
      const { redirect } = route.query;
      router.replace(redirect as string);
    } else {
      router.replace({ path: '/' });
    }
    message.success('跨平台登录成功');
  } else if (retryCount.value >= 3) {
    messageBox.alert('跨平台登录失败, 请重新登录', 'error');
    goToTechLogin(true);
  } else {
    setTimeout(() => {
      retryCount.value += 1;
      onLogin();
    }, 500);
  }
};

onMounted(() => {
  if (isLogout) {
    goToTechLogin(true);
  } else if (loginParams?.accessToken) {
    if (loginParams?.token) {
      store.commit('setForgeonToken', loginParams.token);
    }
    onLogin();
  } else {
    goToTechLogin();
  }
});
</script>

<template>
  <div
    class="flex items-center justify-center w-100vw h-100vh bg-#202020 text-white"
  >
    跨平台登录信息获取中...
  </div>
</template>
