import I18nKey from "@i18n/i18nKey";
import { DEFAULT_LOCALE, getPostLang, getPostSlug, type Locale } from "@i18n/locale";
import { i18n } from "@i18n/translation";

export function pathsEqual(path1: string, path2: string) {
	const normalizedPath1 = path1.replace(/^\/|\/$/g, "").toLowerCase();
	const normalizedPath2 = path2.replace(/^\/|\/$/g, "").toLowerCase();
	return normalizedPath1 === normalizedPath2;
}

function joinUrl(...parts: string[]): string {
	const joined = parts.join("/");
	return joined.replace(/\/+/g, "/");
}

export function url(path: string) {
	return joinUrl("", import.meta.env.BASE_URL, path);
}

/**
 * Prefix a root-relative path with the locale when it is not the default locale.
 * localeUrl("/archive/", "zh") -> "/archive/", localeUrl("/archive/", "en") -> "/en/archive/"
 */
export function localeUrl(path: string, lang: Locale): string {
	if (lang === DEFAULT_LOCALE) return url(path);
	return url(`/${lang}${path}`);
}

/**
 * Build the URL of a post from its collection id.
 * The id carries the locale ("zh/foo" -> "/posts/foo/", "en/foo" -> "/en/posts/foo/").
 */
export function getPostUrlById(id: string): string {
	return localeUrl(`/posts/${getPostSlug(id)}/`, getPostLang(id));
}

export function getTagUrl(tag: string, lang: Locale): string {
	if (!tag) return localeUrl("/archive/", lang);
	return localeUrl(`/archive/?tag=${encodeURIComponent(tag.trim())}`, lang);
}

export function getCategoryUrl(category: string | null, lang: Locale): string {
	if (
		!category ||
		category.trim() === "" ||
		category.trim().toLowerCase() === i18n(I18nKey.uncategorized, lang).toLowerCase()
	)
		return localeUrl("/archive/?uncategorized=true", lang);
	return localeUrl(
		`/archive/?category=${encodeURIComponent(category.trim())}`,
		lang,
	);
}

export function getDir(path: string): string {
	const lastSlashIndex = path.lastIndexOf("/");
	if (lastSlashIndex < 0) {
		return "/";
	}
	return path.substring(0, lastSlashIndex + 1);
}
