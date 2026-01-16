export async function loadData(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

export async function loadHtml(url) {
    let response = await fetch(url);
    let html = await response.text();
    return html;
}