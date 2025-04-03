<script setup lang="ts">
import axios from '@/http/axios';

import store from '@/store';
import { decodeByBase64, encryptByBase64 } from '@/utils/cipher';
import message from 'element-plus/lib/components/message';
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

const goToTechLogin = () => {
  window.open(
    `https://forgeon.hypergryph.net/link/other?fs=1&refresh=1&redirect=${encodeURIComponent(
      encryptByBase64(redirectUrl)
    )}&origin=${encodeURIComponent(`${window.location.origin}/Login`)}`,
    '_self'
  );
};

const onLogin = async () => {
  await store.commit('clearAuth');

  const res: { code: number; data: any } = await axios.post(
    '/users/loginSso',
    loginParams
  );
  if (res.code === 2000) {
    // 获取后端路由
    store.commit('changeLogin', res.data);
    if (route.query.redirect) {
      const { redirect } = route.query;
      router.replace(decodeByBase64(redirect as string));
    } else {
      router.replace({ path: '/' });
    }
    message.success('跨平台登录成功');
  } else if (retryCount.value >= 3) {
    goToTechLogin();
  } else {
    setTimeout(() => {
      retryCount.value += 1;
      onLogin();
    }, 500);
  }
};

onMounted(() => {
  if (localStorage.getItem('SonicToken')) {
    if (['/', '/Index/Devices'].includes(redirectUrl)) {
      router.replace({ path: decodeByBase64(redirectUrl) });
    } else {
      router.replace({ path: decodeByBase64(redirectUrl || '/') });
    }
    return;
  }
  if (isLogout) {
    goToTechLogin();
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
    style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100vw;
      height: 100vh;
    "
  >
    跨平台登录信息获取中...
  </div>
</template>
