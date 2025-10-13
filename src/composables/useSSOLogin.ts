import { encryptByBase64 } from '@/utils/cipher';
import { unref } from 'vue';
import { useRouter } from 'vue-router';

export function useSSOLogin(curRedirectUrl?: string) {
  const { currentRoute } = useRouter();
  const redirectUrlGet =
    (unref(currentRoute).query?.redirect as string) || '/home';
  const ssoLoginUrl = `https://info-sso.hypergryph.net/oauth2/authorize`;
  const clientID = 'cloud-real-device';
  // 给SSO的重定向地址
  const redirectUrl = `${location.origin}/login${encodeURIComponent(
    `?state=${encryptByBase64(curRedirectUrl || redirectUrlGet).replace(
      /=/g,
      '__'
    )}`
  )}`;
  const handleSSOLogin = () => {
    window.open(
      `${ssoLoginUrl}?response_type=code&login_type=account&hideAuthBtn=1&client_id=${clientID}&redirect_uri=${redirectUrl}`,
      '_self'
    );
  };

  return { handleSSOLogin };
}

