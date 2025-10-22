import Base64 from 'crypto-js/enc-base64';
import UTF8 from 'crypto-js/enc-utf8';

function encryptByBase64(cipherText: string) {
  return UTF8.parse(cipherText).toString(Base64);
}

function decodeByBase64(cipherText: string) {
  if (!cipherText) return '';
  // 还原将 '=' 替换为 '__' 的填充，并解码后去除可能的空字符
  const normalized = cipherText.replace(/__/g, '=');
  try {
    const decoded = Base64.parse(normalized).toString(UTF8);
    return decoded.replace(/\0/g, '');
  } catch (e) {
    // 异常时回退原文，避免抛错中断导航
    return cipherText;
  }
}

export { decodeByBase64, encryptByBase64 };
