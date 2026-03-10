async function initFooter() {
    const container = document.getElementById("common-footer");
    if (!container) return;

    try {
        // Create and load the CSS FIRST
        await new Promise((resolve, reject) => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "/css/footer.css";
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });

        // Fetch and inject the HTML
        const response = await fetch("/footer.html");
        const html = await response.text();
        container.innerHTML = html;

        container.classList.add("footer-ready");

        // Load the interactive JavaScript
        const script = document.createElement("script");
        script.src = "/js/footer.js";
        document.body.appendChild(script);

    } catch (error) {
        console.error("Failed to build the footer:", error);
    }
}

initFooter();