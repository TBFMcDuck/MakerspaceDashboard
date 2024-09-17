// Problemdiv
document.getElementById("dismissProblemDivButton").addEventListener("click", function() {
    document.getElementById("problemdiv").style.display = "none";
})

// Add ctrl + k as a hotkey for search input and enter to scroll down to results
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === "k") {
        event.preventDefault(); // Prevents the browsers default action (eks google search)
        if (document.activeElement !== document.getElementById("searchInput")) {
            document.getElementById("searchInput").focus(); // Select on the search input
        }
        else {
            document.getElementById("searchInput").blur(); // Unselect the search input
        }
    }
    else if (event.key === "Enter") {
        scrollToSearchResult();
    }
});

function scrollToSearchResult() {    
    // Calculate the offset position
    const navbarHeight = document.querySelector('.topnav').offsetHeight;
    const elementPosition = document.getElementById("dashboard").getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - navbarHeight;

    // Scroll to the calculated position
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}