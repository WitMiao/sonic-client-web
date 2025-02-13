import Base64 from 'crypto-js/enc-base64';
import UTF8 from 'crypto-js/enc-utf8';

function decodeByBase64(cipherText: string) {
  return Base64.parse(cipherText).toString(UTF8);
}

export default decodeByBase64;
