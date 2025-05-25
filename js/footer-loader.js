fetch(`/footer.html`)
.then(response => response.text())
.then(html => {
    document.getElementById("common-footer").innerHTML = html;

    // Load footer.js after footer.html is inserted
    const script = document.createElement("script");
    script.src = `/js/footer.js`;
    document.body.appendChild(script);
})
.catch(error => console.error("Error loading footer:", error));
