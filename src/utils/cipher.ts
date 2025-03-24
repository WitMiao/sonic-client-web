import Base64 from 'crypto-js/enc-base64';
import UTF8 from 'crypto-js/enc-utf8';

function encryptByBase64(cipherText: string) {
  return UTF8.parse(cipherText).toString(Base64);
}

function decodeByBase64(cipherText: string) {
  return Base64.parse(cipherText).toString(UTF8);
}

export { decodeByBase64, encryptByBase64 };
