import { type CollectionEntry, getCollection, render } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { getPostLang, getPostSlug, type Locale, otherLocale } from "@i18n/locale";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils.ts";

export function renderPost(entry: CollectionEntry<"posts">) {
	return render(entry);
}

// // Retrieve posts of one locale and sort them by publication date
async function getRawSortedPosts(lang: Locale) {
	const allBlogPosts = await getCollection("posts", ({ id, data }) => {
		const published = import.meta.env.PROD ? data.draft !== true : true;
		return published && getPostLang(id) === lang;
	});

	const sorted = allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

export async function getSortedPosts(lang: Locale) {
	const sorted = await getRawSortedPosts(lang);

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].id;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].id;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}

/**
 * Find the translation of a post: the entry with the same slug in the other locale.
 * Returns undefined when the post has no translation.
 */
export async function getPostTranslation(
	entry: CollectionEntry<"posts">,
): Promise<CollectionEntry<"posts"> | undefined> {
	const slug = getPostSlug(entry.id);
	const candidates = await getRawSortedPosts(otherLocale(getPostLang(entry.id)));
	return candidates.find((post) => getPostSlug(post.id) === slug);
}

export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(lang: Locale): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts(lang);

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.id,
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(lang: Locale): Promise<Tag[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ id, data }) => {
		const published = import.meta.env.PROD ? data.draft !== true : true;
		return published && getPostLang(id) === lang;
	});

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(lang: Locale): Promise<Category[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ id, data }) => {
		const published = import.meta.env.PROD ? data.draft !== true : true;
		return published && getPostLang(id) === lang;
	});
	const count: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { category: string | null } }) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized, lang);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c, lang),
		});
	}
	return ret;
}
