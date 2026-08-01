/**
 * Locale definitions and helpers.
 * This site supports exactly two locales: zh (default, no URL prefix) and en ("/en/" prefix).
 * Keep in sync with the `i18n` block in astro.config.mjs.
 */

export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh";

/** Human-readable name of each locale, used by the language switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
	zh: "中文",
	en: "English",
};

/** BCP 47 value for the <html lang> attribute, RSS feeds and JSON-LD. */
export const HTML_LANGS: Record<Locale, string> = {
	zh: "zh-CN",
	en: "en",
};

/** Coerce an arbitrary string (e.g. Astro.currentLocale) to a supported Locale. */
export function toLocale(value: string | undefined | null): Locale {
	return (LOCALES as readonly string[]).includes(value ?? "")
		? (value as Locale)
		: DEFAULT_LOCALE;
}

/** The other locale (valid because there are exactly two locales). */
export function otherLocale(lang: Locale): Locale {
	return lang === "zh" ? "en" : "zh";
}

/**
 * Remove the leading locale prefix (e.g. "/en") from a URL pathname.
 * "/en/posts/foo/" -> "/posts/foo/", "/en/" -> "/", "/posts/foo/" -> "/posts/foo/"
 */
export function stripLocalePrefix(pathname: string): string {
	for (const locale of LOCALES) {
		if (locale === DEFAULT_LOCALE) continue;
		if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
			return pathname.slice(locale.length + 1) || "/";
		}
	}
	return pathname;
}

/** Locale of a posts-collection entry, derived from its id ("zh/foo" -> "zh"). */
export function getPostLang(id: string): Locale {
	const seg = id.split("/")[0];
	return toLocale(seg);
}

/** Slug of a posts-collection entry without the locale prefix ("zh/foo" -> "foo"). */
export function getPostSlug(id: string): string {
	const seg = id.split("/")[0];
	return (LOCALES as readonly string[]).includes(seg)
		? id.slice(seg.length + 1)
		: id;
}
