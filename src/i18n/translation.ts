import type I18nKey from "./i18nKey";
import { en } from "./languages/en";
import { zh_CN } from "./languages/zh_CN";
import { DEFAULT_LOCALE, type Locale, toLocale } from "./locale";

export type Translation = {
	[K in I18nKey]: string;
};

const map: Record<Locale, Translation> = {
	zh: zh_CN,
	en: en,
};

export function getTranslation(lang: string): Translation {
	return map[toLocale(lang)];
}

/**
 * Get a UI string in the given locale.
 * Falls back to the default locale when `lang` is omitted or unsupported.
 */
export function i18n(key: I18nKey, lang: string = DEFAULT_LOCALE): string {
	return getTranslation(lang)[key];
}
