export async function loadData(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
}