<script setup lang="ts">
import { useSSOLogin } from '@/composables/useSSOLogin';
import axios from '@/http/axios';

import store from '@/store';
import { decodeByBase64 } from '@/utils/cipher';
import message from 'element-plus/lib/components/message';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { currentRoute } = router;
const isLogout = currentRoute.value.query?.isLogout === '1';
const redirectUrl = (currentRoute.value.query?.redirect as string) || '/';
// SSOcode
const ssoCodeGet = currentRoute.value.query?.code as string;
const ssoStateGet = currentRoute.value.query?.state as string;
const ssoRedirectURI = `${location.origin}/login?state=${ssoStateGet}`;
const retryCount = ref(0);

const { handleSSOLogin } = useSSOLogin(redirectUrl);

const onLogin = async () => {
  await store.commit('clearAuth');
  const res: { code: number; data: any } = await axios.post('/users/loginSso', {
    code: ssoCodeGet,
    redirectURI: ssoRedirectURI,
  });
  if (res.code === 2000) {
    // 获取后端路由
    store.commit('changeLogin', res.data);
    if (ssoStateGet) {
      const curRedirectUrl = decodeByBase64(ssoStateGet || '');
      router.replace({ path: curRedirectUrl });
    } else {
      router.replace({ path: '/' });
    }
    message.success('登录成功');
  } else if (retryCount.value >= 3) {
    handleSSOLogin();
  } else {
    setTimeout(() => {
      retryCount.value += 1;
      onLogin();
    }, 500);
  }
};

onMounted(() => {
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_TOKEN) {
    localStorage.setItem('SonicToken', import.meta.env.VITE_DEV_TOKEN);
  }
  if (localStorage.getItem('SonicToken')) {
    // redirect 参数来自路由守卫，已是直接路径，不应再做 Base64 解码
    router.replace({ path: redirectUrl || '/' });
    return;
  }
  if (ssoCodeGet) {
    onLogin();
  } else if (isLogout) {
    handleSSOLogin();
  } else {
    handleSSOLogin();
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
    SSO登录信息获取中...
  </div>
</template>
