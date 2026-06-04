import { getParamsUrl, requireAuth } from "./utils/helpers.js";

(async () => {
    const params = new URLSearchParams(window.location.search);
    const paramsUrl = getParamsUrl(params);
    const pageUrl = `polls?${paramsUrl}`

    // Authenticate user
    const userAuthenticated = await requireAuth(pageUrl);
    if (!userAuthenticated) return;
})()
