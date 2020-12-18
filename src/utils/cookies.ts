import { getApi } from "model/selectors/getApi";

function getCookie(name: string): string {
  const value = "; " + document.cookie;
  const parts = value.split("; " + name + "=");

  if (parts.length === 2) {
    const cookieValue = parts.pop()!.split(";").shift();
    return cookieValue ? cookieValue : "";
  }
  return "";
}

let _locale: any;
export function getLocaleFromCookie(): string {
  if (!_locale) {
    const cookieValue = unescape(getCookie("origamCurrentLocale"));
    const pattern = /c=([a-zA-Z-]+)\|/i;
    const results = cookieValue.match(pattern);
    if(results){
      _locale = results[1];
    }else{
      throw new Error("Locale cookie was not found. Was the function \"initLocaleCookie\" called?");
    }
  }
  return _locale;
}

export async function initLocaleCookie(ctx: any) {
  const cookieValue = unescape(getCookie("origamCurrentLocale"));
  if (cookieValue) {
    return;
  }
  const api = getApi(ctx);
  const defaultCultureInfo = await api.defaultCulture();
  const expireDate = new Date();
  expireDate.setTime(expireDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expires = "; expires=" + expireDate.toUTCString();
  const cultureInfo = "c=" + defaultCultureInfo.culture + "|uic=" + defaultCultureInfo.uiCulture;
  document.cookie = "origamCurrentLocale=" + cultureInfo + expires + "; Path=/";
}
