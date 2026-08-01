import { getRssResponse } from "@utils/rss-utils";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
	return getRssResponse(context, "zh");
}
