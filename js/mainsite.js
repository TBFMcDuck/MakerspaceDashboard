// Check if user is using a mobile phone
if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
    var mobileUser = true;
  }else{
    var mobileUser = false;
  }

// Problemdiv
document.getElementById("dismissProblemDivButton").addEventListener("click", function() {
    document.getElementById("problemdiv").style.display = "none";
})

// Hotkey for search input
function focusSearch() {
    document.getElementById("searchInput").focus();
}

// Unfocus the search input
function unfocusSearch() {
    document.getElementById("searchInput").blur();
}

// Add ctrl + k as a hotkey for search input and enter to scroll down to results
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === "k") {
        event.preventDefault(); // Prevents the browsers default action (eks google search)
        if (document.activeElement !== document.getElementById("searchInput")) {
            focusSearch(); // Focus on the search input
        }
        else {
            unfocusSearch();
        }
    }
    else if (event.key === "Enter") {
        let element;
        if (currentDisplayMode === "table") {
            element = document.getElementById("printerTable");
        } else {
            element = document.getElementById("printerGrid");
        }
        
        // Calculate the offset position
        const navbarHeight = document.querySelector('.topnav').offsetHeight;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - navbarHeight;

        // Scroll to the calculated position
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
});

// Search
function searchFunction(input) {
  // Declare variables
  var filter, table, tr, td, i, txtValue;

  if (!input) {
    input = "";
  }

  filter = input.toUpperCase();

  if (!(filter.includes(current_filter.toUpperCase()))) {
    filter = filter + "#" + current_filter.toUpperCase();
  }

  var anyPrinterMatchesQuery = false;

  if (currentDisplayMode === "table"){
    table = document.getElementById("printerTable");
    tr = table.getElementsByTagName("tr");

    // Loop through all table rows, and hide those who don't match the search query
    for (i = 0; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td")[0];
        if (td) {
            txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
                anyPrinterMatchesQuery = true;
            } else {
                tr[i].style.display = "none";
            }
        }
    }
    }
    else {
        if (filter.includes("#")) {
            var userSearch = filter.split("#")[0];
            var filter_selected = filter.split("#")[1];
        }
        else {
            var userSearch = filter;
            var filter_selected = "";
        }
        grid = document.getElementById("printerGrid");
        var gridItems = grid.children; // Get the child elements of the grid
        for (i = 0; i < gridItems.length; i++) {
            child = gridItems[i];
            txtValue = child.textContent || child.innerText;
            if ((txtValue.toUpperCase().indexOf(userSearch) > -1) && (txtValue.toUpperCase().indexOf(filter_selected) > -1)) {
                child.style.display = "";
                anyPrinterMatchesQuery = true;
            } else {
                child.style.display = "none";
            }
        }
    }
    if (!anyPrinterMatchesQuery) {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('loading').innerHTML = '<i class="fas fa-exclamation-circle"></i> There are no printers matching your search and/or filter.';
    }
    else {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('loading').innerHTML = '(Fetching printer data...)';
    }
}

// Variables to save the last sort column and order so the sort can be reapplied after the table is refreshed
let lastSortColumn = null;
let lastSortOrder = null;
// Sort the column alphabetically
function sortTable(n, event) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById("printerTable");
    switching = true;
    // Set the sorting direction to ascending:
    dir = "asc"; 
    /* Make a loop that will continue until
    no switching has been done: */
    while (switching) {
        // Start by saying: no switching is done:
        switching = false;
        rows = table.rows;
        /* Loop through all table rows (except the
        first, which contains table headers): */
        for (i = 1; i < (rows.length - 1); i++) {
            // Start by saying there should be no switching:
            shouldSwitch = false;
            /* Get the two elements you want to compare,
            one from current row and one from the next: */
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            /* Check if the two rows should switch place,
            based on the direction, asc or desc: */
            if (dir == "asc") {
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                // If so, mark as a switch and break the loop:
                shouldSwitch = true;
                break;
                }
            } else if (dir == "desc") {
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                // If so, mark as a switch and break the loop:
                shouldSwitch = true;
                break;
                }
            }
        }
        if (shouldSwitch) {
            /* If a switch has been marked, make the switch
            and mark that a switch has been done: */
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            // Each time a switch is done, increase this count by 1:
            switchcount ++; 
            } else {
            /* If no switching has been done AND the direction is "asc",
            set the direction to "desc" and run the while loop again. */
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
    // Save the last sort column and order so the sort can be reapplied after the table is refreshed
    lastSortColumn = n;
    if (dir == "asc") {
        lastSortOrder = "asc";
        event.target.innerHTML = "&darr;";
    } else {
        lastSortOrder = "desc";
        event.target.innerHTML = "&uarr;";
    }
}

// Switch display modes
var switchBTN = document.getElementById("switchDisplayBTN");
var currentDisplayMode = "grid"
let searchInput = document.getElementById("searchInput");

function switchDisplay () {
    if (currentDisplayMode === "table") {
        currentDisplayMode = "grid";
        switchBTN.innerHTML = 'Switch to tableview <i class="fas fa-table"></i>'
        searchInput.placeholder = "Søk etter printer, model, status, posisjon eller adresse (Ctrl + K)"
        filterSelect.style.display = "block";
    }
    else {
        currentDisplayMode = "table";
        switchBTN.innerHTML = 'Switch to gridview <i class="fas fa-th">'
        searchInput.placeholder = "Søk etter printer (Ctrl + K)"
        filterSelect.style.display = "none";
    }

    refresh();
}

// Clean status
function cleanStatus(item){
    // Cleaning the status
    if (item.note.substring(11).startsWith("!disabled") || item.note.startsWith("!disabled")) {
        let statusTextDiv = document.createElement("div");
        statusTextDiv.className = "statusText";
        statusTextDiv.innerHTML = "Disabled";
        return [statusTextDiv, '#cccccc'];
    }
    else if (item.status == "Printing") {
        let statusTextDiv = document.createElement("div");
        statusTextDiv.className = "statusText";
        statusTextDiv.innerHTML = item.status + ' (' + Math.round(item.progress) + '%)';
        return [statusTextDiv, "#ff8c00"];
    }
    else if (item.status == "Operational") {
        let statusTextDiv = document.createElement("div");
        statusTextDiv.className = "statusText";
        statusTextDiv.innerHTML = "Operational";
        return [statusTextDiv, '#00ff77'];
    }
    else if (item.status == "Paused") {
        let statusTextDiv = document.createElement("div");
        statusTextDiv.className = "statusText";
        statusTextDiv.innerHTML = status + ' (' + Math.round(item.progress) + '%)';
        return [statusTextDiv, '#2b8eff'];
    }
    else if(item.status == "Offline after error") {
        let statusTextDiv = document.createElement("div");
        statusTextDiv.className = "statusText";
        statusTextDiv.innerHTML = "(Probably) Turned off " + "<span class = 'tooltip' title='Offline after error'><i class = 'fas fa-info-circle'</i></span>";
        return [statusTextDiv, '#696969'];
    }
    else if (item.status == "Offline") {
        let statusTextDiv = document.createElement("div");
        statusTextDiv.className = "statusText";
        statusTextDiv.innerHTML = "Offline";
        return [statusTextDiv, '#872727'];
    }
    else {
        let statusTextDiv = document.createElement("div");
        statusTextDiv.className = "statusText";
        statusTextDiv.innerHTML = "Unknown";
        return [statusTextDiv, "#232323"];
    }
}

// Refresh table
function renderTable(querySnapshot) {
    // Remove printergrid
    document.getElementById("printerGrid").style.display = 'none';
    // Show top row of table
    document.getElementById("printerTable").style.display = 'table';

    var table = document.getElementById('printerTableBody')
    table.innerHTML = ''; // Clear the table before adding new data
    // Display loading text
    document.getElementById('loading').style.display = 'block';

    // For every printer
    querySnapshot.forEach((doc) => {
        var item = doc.data();
        var row = table.insertRow(-1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);

        cell1.innerHTML = item.name + " (Fetched:" + item.updateTime + ")";
        cell2.innerHTML = item.type;
        if (mobileUser){
            cell3.innerHTML = '<a href="' + item.address + '" target="_blank" style="color:white;">' + item.address.substring(7, 13) + '...</a>';
        }
        else {
            cell3.innerHTML = '<a href="' + item.address + '" target="_blank" style="color:white;">' + item.address + '</a>';
        }
        
        // Cleaned status
        var cleaned_status_and_bg_color = cleanStatus(item);
        cell4.appendChild(cleaned_status_and_bg_color[0]);
        cell4.style.backgroundColor = cleaned_status_and_bg_color[1];
        cell4.className = 'status-cell';

        // Hide loading text
        document.getElementById('loading').style.display = 'none';
        // Reapply the sort
        if (lastSortColumn !== null) {
            sortTable(lastSortColumn);
            // If your sort function doesn't automatically toggle the sort order,
            // you might need to apply the sort twice to get the correct order
            if (lastSortOrder === "desc") {
                console.log('Sorting again');
                sortTable(lastSortColumn);
            }
        }
    });
}

// Refresh grid
function renderGrid(querySnapshot) {
    // Hide loading text
    document.getElementById('loading').style.display = 'none';
    // Hide pritnertable
    document.getElementById("printerTable").style.display = 'none';

    // Show grid
    var printergrid = document.getElementById("printerGrid");
    printergrid.style.display = 'flex';
    printergrid.innerHTML = '';

    querySnapshot.forEach((doc) => {
        var item = doc.data();
        var newCard = document.createElement("div");

        // Shorten too long printernames
        if (item.name.length > 11) {
            var name = item.name.substring(0, 11) + "."
        }
        else {
            var name = item.name
        }

        if (item.note.substring(11).startsWith("!disabled") || item.note.startsWith("!disabled")) {
            var octoprintLink = '<a target="_blank"><i class="fas fa-external-link-alt" style="color:#909090; cursor: not-allowed;"></i></a>';
            var itemName = '<a style = "color: #909090; text-decoration: line-through; cursor: not-allowed;" target="_blank">' + name + '</a>'
        }
        else {
            var octoprintLink = '<a href="' + item.address +  '" target="_blank" <i class="fas fa-external-link-alt" style = "color:white;"></i></a>'
            var itemName = '<a style = "color: white; text-decoration: none;" href="' + item.address +  '" target="_blank">' + name + '</a>'
        }

        var clean_status = cleanStatus(item);

        // Status
        var status = document.createElement("div");
        status.style.backgroundColor = clean_status[1];
        status.className = 'printer-status-card';
        if (item.status === "Printing" || item.status === "Paused") {
            if (item.status === "Paused"){
                var barColor = '#2b8eff';
            }
            else {
                var barColor = "#ff8c00";
            }
            let progressBar = new Progress({parent: status, cornerRadius: "3px", barColor: barColor, backgroundColor: "#383838", minPercent: 0.01});
            progressBar.setProgress(item.progress/100);
            progressBar.addMidElement(clean_status[0]);
        }
        else {
            status.appendChild(clean_status[0]);
        }

        var lastUpdated = document.createElement("p");
        lastUpdated.innerHTML = '<p class=printer-bottom-text> Fetched: ' + item.updateTime + '</p>';

        newCard.className = "printer-card";
        newCard.innerHTML = '<h3>' + itemName + " " + octoprintLink + '</h3>' + '<h4> Model: ' + item.type + '</h4>'
        newCard.appendChild(status);

        // Timeleft
        if (item.status === "Printing" || item.status === "Paused") {
            let timeLeftDiv = document.createElement("div");
            timeLeftDiv.className = "timeleftDiv";
            
            let printTime = item.printTime;
            let printTimeUnit = "s";
            if (printTime >= 60) {
                printTime = printTime/60;
                printTimeUnit = "min";
                if (printTime >= 60) {
                    printTime = printTime/60;
                    printTimeUnit = "h";
                }
            }
            let timeLeft = item.timeLeft + item.printTime;
            let timeLeftUnit = "s";
            if (timeLeft >= 60) {
                timeLeft = timeLeft/60;
                timeLeftUnit = "min";
                if (timeLeft >= 60) {
                    timeLeft = timeLeft/60;
                    timeLeftUnit = "h";
                }
            }

            timeLeftDiv.innerHTML = '<p class="timeleftText">' + printTime.toFixed(1)+ printTimeUnit + "/" + timeLeft.toFixed(1) + timeLeftUnit + '</p>';
            newCard.appendChild(timeLeftDiv);
        }

        newCard.appendChild(lastUpdated);

        // Adress
        var address = document.createElement("p");
        address.innerHTML = '<p class="adressBottomText">' + item.address + '<p>';
        
        newCard.appendChild(address);

        // Printernotes
        var printerNoteDiv = document.createElement("div");
        if (item.note.substring(11).startsWith("!disabled") || item.note.startsWith("!disabled")) {
            var printerNoteSpan = document.createElement("span");
            printerNoteSpan.className = "printerNoteImportant";
            printerNoteSpan.innerHTML = "<i class='fas fa-exclamation-circle'></i>";
            printerNoteDiv.appendChild(printerNoteSpan);

            var note 
            if (item.note.startsWith("!important")) {
                note = item.note.substring(21);
            }
            else {
                note = item.note.substring(10);
            }

            var printerNoteHover = document.createElement("div");
            printerNoteHover.className = 'printernoteHover';
            printerNoteHover.innerHTML = "<p>" + note + "</p>";
            printerNoteHover.style.display = "none"; // Initially hidden

            printerNoteDiv.addEventListener("mouseover", function() {
                show_note(printerNoteHover);
            });

            printerNoteDiv.addEventListener("mouseout", function() {
                hide_note(printerNoteHover);
            });

            printerNoteDiv.appendChild(printerNoteHover);
        } 
        else if (item.note && item.note.startsWith("!important")) {
            var printerNoteSpan = document.createElement("span");
            printerNoteSpan.className = "printerNoteImportant";
            printerNoteSpan.innerHTML = "<i class='fas fa-exclamation-circle'></i>";
            printerNoteDiv.appendChild(printerNoteSpan);

            var printerNoteHover = document.createElement("div");
            printerNoteHover.className = 'printernoteHover';
            printerNoteHover.innerHTML = "<p>" + item.note.substring(11) + "</p>";
            printerNoteHover.style.display = "none"; // Initially hidden

            printerNoteDiv.addEventListener("mouseover", function() {
                show_note(printerNoteHover);
            });

            printerNoteDiv.addEventListener("mouseout", function() {
                hide_note(printerNoteHover);
            });

            printerNoteDiv.appendChild(printerNoteHover);
        }
        else {
            var printerNoteSpan = document.createElement("span");
            printerNoteSpan.className = "printerNote";
            printerNoteSpan.innerHTML = "<i class='fas fa-file-alt'></i>";
            printerNoteDiv.appendChild(printerNoteSpan);

            var printerNoteHover = document.createElement("div");
            printerNoteHover.className = 'printernoteHover';
            printerNoteHover.innerHTML = "<p>" + item.note + "</p>";
            printerNoteHover.style.display = "none"; // Initially hidden

            printerNoteDiv.addEventListener("mouseover", function() {
                show_note(printerNoteHover);
            });

            printerNoteDiv.addEventListener("mouseout", function() {
                hide_note(printerNoteHover);
            });

            printerNoteDiv.appendChild(printerNoteHover);
        }

        printerNoteDiv.onclick = function () {
            alert(item.note);
        };

        newCard.append(printerNoteDiv);

        // PrinterNote
        function show_note(noteHover) {
            noteHover.style.display = "block";
        }

        function hide_note(noteHover) {
            noteHover.style.display = "none";
        }

        // Printerposition
        var placementCodeDiv = document.createElement("div");
        placementCodeDiv.className = "placementCodeDiv"
        if (item.placementcode) {
            placementCodeDiv.innerHTML = "<p class='positionCodeText'>" + item.placementcode + "</p>"
        }  
        newCard.append(placementCodeDiv);

        printergrid.appendChild(newCard);
    });
}

// Create a BroadcastChannel
const channel = new BroadcastChannel('tab-status');

// Variable to track if this tab should update
let shouldUpdate = true;

// Variable to not read unupdated pages
let lastUpdateTime = null;

// Variable to store the Firestore unsubscribe function
let unsubscribe = null;

// Updating text
let updatingText = document.getElementById("updatedAutoText");
let updatingTextBtmBar = document.getElementById("updatedAutoTextBottomBar");

// Enable Firestore offline persistence, to decrease reads probatly
firebase.firestore().enablePersistence()
    .catch(function(err) {
        if (err.code == 'failed-precondition') {
            console.error('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
        } else if (err.code == 'unimplemented') {
            console.error('The current browser does not support all of the features required to enable persistence');
        }
    });

// Listen for messages from other tabs
channel.onmessage = (event) => {
    if (event.data === "active") {
        shouldUpdate = false;
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
            updatingText.innerHTML = 'Updates paused because other tab is active. <i class="fas fa-pause-circle"></i>';
            updatingTextBtmBar.innerHTML = 'Updates paused because other tab is active. <i class="fas fa-pause-circle"></i>';
            document.title = '(inactive) Makerspace Dashboard';
        }
    }
};

// Send a message when this tab becomes active
window.addEventListener('focus', () => {
    shouldUpdate = true;
    channel.postMessage('active');
    subscribeToFirestore();
    updatingText.innerHTML = 'Updates automatically <i class="fas fa-check"></i>';
    updatingTextBtmBar.innerHTML = 'Updates automatically <i class="fas fa-check"></i>';
    document.title = 'Makerspace Dashboard';
});

// Handle when the tab becomes inactive
window.addEventListener('blur', () => {
    shouldUpdate = false;
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
        updatingText.innerHTML = 'Updates paused because other tab is active. <i class="fas fa-pause-circle"></i>';
        updatingTextBtmBar.innerHTML = 'Updates paused because other tab is active. <i class="fas fa-pause-circle"></i>';
        document.title = '(inactive) Makerspace Dashboard';
    }
});

// Initialize Firestore
var db = firebase.firestore();

var querySnapshotLocal = null;

// Refresh the table when the page loads
window.onload = function() {
    refresh();
}

function refresh() {
    subscribeToFirestore();
}

function subscribeToFirestore() {
    if (unsubscribe) {
        unsubscribe();
    }

    let query = db.collection("printerdata");
    if (lastUpdateTime) {
       query = query.where("updateTime", ">", lastUpdateTime);
    }

    // Fetch the printerdata from Firestore (real time listener)
    unsubscribe = query.onSnapshot((querySnapshot) => {
        // Check if this tab should update
        if (!shouldUpdate) return;
        
        updateLocalQuery(querySnapshot);


        if (currentDisplayMode === "table") {
            renderTable(querySnapshotLocal);
        } else {
            renderGrid(querySnapshotLocal);
        }

        // Reapply search
        searchFunction();

        // Update the lastUpdateTime to the smallest earliest of the new document's updateTime
        if (!querySnapshot.empty) {
            let maxUpdateTime = querySnapshot.docs[0].data().updateTime;
            querySnapshot.forEach(doc => {
                const updateTime = doc.data().updateTime;
                if (updateTime > maxUpdateTime) {
                    maxUpdateTime = updateTime;
                }
            });
           lastUpdateTime = maxUpdateTime;
        }

    }, error => {
        if (error.code === 'resource-exhausted') {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('loading').innerHTML = 'Quota exceeded. Please try again tomorrow.';
            updatingText.innerHTML = 'Updating failed due to quota limit <i class="fas fa-exclamation-circle"></i>';
        } else {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('loading').innerHTML = 'Failed to fetch from Firestore.';
            updatingText.innerHTML = 'Updating failed <i class="fas fa-exclamation-circle"></i>';
        }
        console.error('Error:', error);
    });
}

function updateLocalQuery(updatedQuery) {
    if (querySnapshotLocal === null) {
        querySnapshotLocal = updatedQuery;
    } else {
        // Create a map of local documents for quick lookup
        const localDocsMap = new Map();
        querySnapshotLocal.forEach(doc => {
            localDocsMap.set(doc.id, doc);
        });

        // Update local documents with new data
        updatedQuery.forEach(updatedDoc => {
            if (localDocsMap.has(updatedDoc.id)) {
                localDocsMap.set(updatedDoc.id, updatedDoc);
            } else {
                // Add new documents to the local snapshot
                querySnapshotLocal.push(updatedDoc);
            }
        });

        // Convert the map back to an array
        querySnapshotLocal = Array.from(localDocsMap.values());
    }
}

// Filter
filterSelect = document.getElementById("filterSelect");

let current_filter = ""

function filter(searchWord) {
    current_filter = searchWord
    searchFunction(searchInput.value);
}

