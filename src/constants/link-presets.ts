import I18nKey from "@i18n/i18nKey";
import type { Locale } from "@i18n/locale";
import { i18n } from "@i18n/translation";
import { localeUrl } from "@utils/url-utils";
import { LinkPreset, type NavBarLink } from "@/types/config";

export function getLinkPresets(lang: Locale): { [key in LinkPreset]: NavBarLink } {
	return {
		[LinkPreset.Home]: {
			name: i18n(I18nKey.home, lang),
			url: localeUrl("/", lang),
		},
		[LinkPreset.About]: {
			name: i18n(I18nKey.about, lang),
			url: localeUrl("/about/", lang),
		},
		[LinkPreset.Archive]: {
			name: i18n(I18nKey.archive, lang),
			url: localeUrl("/archive/", lang),
		},
	};
}
