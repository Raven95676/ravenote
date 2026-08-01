import { render } from "astro:content";
import rss from "@astrojs/rss";
import { HTML_LANGS, type Locale } from "@i18n/locale";
import { getSortedPosts } from "@utils/content-utils";
import { getPostUrlById } from "@utils/url-utils";
import type { APIContext } from "astro";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import sanitizeHtml from "sanitize-html";
import { siteConfig } from "@/config";

function stripInvalidXmlChars(str: string): string {
	return str.replace(
		// biome-ignore lint/suspicious/noControlCharactersInRegex: https://www.w3.org/TR/xml/#charsets
		/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]/g,
		"",
	);
}

function makeAbsolute(
	value: string | undefined,
	base: URL,
): string | undefined {
	if (!value) return value;

	try {
		return new URL(value, base).href;
	} catch {
		return value;
	}
}

function makeSrcsetAbsolute(
	srcset: string | undefined,
	base: URL,
): string | undefined {
	if (!srcset) return srcset;

	return srcset
		.split(",")
		.map((candidate) => {
			const [source, ...descriptor] = candidate.trim().split(/\s+/);
			return [makeAbsolute(source, base), ...descriptor].join(" ");
		})
		.join(", ");
}

function prepareFeedContent(content: string, postUrl: URL): string {
	return sanitizeHtml(stripInvalidXmlChars(content), {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat([
			"img",
			"picture",
			"source",
			"details",
			"summary",
		]),
		allowedAttributes: {
			"*": ["id", "class", "style", "title", "aria-*", "data-*"],
			a: ["href", "name", "target", "rel"],
			img: [
				"src",
				"srcset",
				"sizes",
				"alt",
				"width",
				"height",
				"loading",
				"decoding",
			],
			source: ["src", "srcset", "sizes", "type", "media"],
		},
		transformTags: {
			a: (tagName, attribs) => {
				const href = makeAbsolute(attribs.href, postUrl);
				return {
					tagName,
					attribs: href ? { ...attribs, href } : attribs,
				};
			},
			img: (tagName, attribs) => {
				const src = makeAbsolute(attribs.src, postUrl);
				const srcset = makeSrcsetAbsolute(attribs.srcset, postUrl);
				return {
					tagName,
					attribs: {
						...attribs,
						...(src ? { src } : {}),
						...(srcset ? { srcset } : {}),
					},
				};
			},
			source: (tagName, attribs) => {
				const src = makeAbsolute(attribs.src, postUrl);
				const srcset = makeSrcsetAbsolute(attribs.srcset, postUrl);
				return {
					tagName,
					attribs: {
						...attribs,
						...(src ? { src } : {}),
						...(srcset ? { srcset } : {}),
					},
				};
			},
		},
	});
}

/** Build the RSS response containing only the posts of the given locale. */
export async function getRssResponse(context: APIContext, lang: Locale) {
	const blog = await getSortedPosts(lang);
	const site = context.site ?? new URL("https://blog.ravenote.me");
	const container = await AstroContainer.create();
	const items = await Promise.all(
		blog.map(async (post) => {
			const postUrl = new URL(getPostUrlById(post.id), site);
			const { Content } = await render(post);
			const content = await container.renderToString(Content);

			return {
				title: post.data.title,
				pubDate: post.data.published,
				description: post.data.description || "",
				link: postUrl.href,
				content: prepareFeedContent(content, postUrl),
			};
		}),
	);

	return rss({
		title: siteConfig.title[lang],
		description: siteConfig.subtitle[lang] || "No description",
		site,
		items,
		customData: `<language>${HTML_LANGS[lang]}</language>`,
	});
}
