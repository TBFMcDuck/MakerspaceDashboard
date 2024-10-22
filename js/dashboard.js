// ------------------------------------------------------
//                      Firestore
// ------------------------------------------------------
// Create a BroadcastChannel
const channel = new BroadcastChannel('tab-status');
// Other vaiables
let shouldUpdate = true; // Variable to track if this tab should update
let lastUpdateTime = null; // Variable to not read unupdated pages
let unsubscribe = null; // Variable to store the Firestore unsubscribe function
var querySnapshotLocal = null;
// UI
let updatingText = document.getElementById("updatedAutoText");
let updatingTextBtmBar = document.getElementById("updatedAutoTextBottomBar");

// Enable Firestore offline persistence, to decrease reads by storing data localy
firebase.firestore().enablePersistence()
    .catch(function(err) {
        if (err.code == 'failed-precondition') {
            console.error('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
        } else if (err.code == 'unimplemented') {
            console.error('The current browser does not support all of the features required to enable persistence');
        }
    });

// Initialize Firestore
var db = firebase.firestore();

// Refresh the table when the page loads
window.onload = function() {
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
        applySearchFilter();

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
        // If the error is because we have run out of reads, we display an alternate message to the user and prompts it to use the backup
        if (error.code === 'resource-exhausted') {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('loading').innerHTML = 'Quota exceeded. Please try again tomorrow or use the backup tab.';
            updatingText.innerHTML = 'Updating failed due to quota limit <i class="fas fa-exclamation-circle"></i>';
        } else {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('loading').innerHTML = 'Failed to fetch from Firestore.';
            updatingText.innerHTML = 'Updating failed <i class="fas fa-exclamation-circle"></i>';
        }
        console.error('Error:', error);
    });
}

// If there is a change in only 1 printer, we only change that printers value in the local query to save on reads
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

// ------------------------------------------------------
// Decrease reads by not updating when the user is away
// ------------------------------------------------------
// Listen for messages from other tabs, if another tab is active, make this one in active
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
// Handle when the tab becomes inactive manually by the user
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
// Send a message when this tab becomes active to inactive other potensially open tabs
window.addEventListener('focus', () => {
    shouldUpdate = true;
    channel.postMessage('active');
    subscribeToFirestore();
    updatingText.innerHTML = 'Updates automatically <i class="fas fa-check"></i>';
    updatingTextBtmBar.innerHTML = 'Updates automatically <i class="fas fa-check"></i>';
    document.title = 'Makerspace Dashboard';
});

// ------------------------------------------------------
//                  Displaying the data
// ------------------------------------------------------
// Handy functions
function shortenName(name, maxLength) {
    if (name.length > maxLength) {
        return name.substring(0, 11) + "."
    }
    else {
        return name
    }
}
function isDisabled(note) {
    return note.substring(11).startsWith("!disabled") || note.startsWith("!disabled")
}
function disabledLinkAndNameHTML(name) {
    return [
        '<a target="_blank"><i class="fas fa-external-link-alt" style="color:#909090; cursor: not-allowed;"></i></a>', 
        '<a style = "color: #909090; text-decoration: line-through; cursor: not-allowed;" target="_blank">' + name + '</a>'
    ]
}
function enabledLinkAndNameHTML(name, address) {
    return [
        '<a href="' + address +  '" target="_blank" <i class="fas fa-external-link-alt" style = "color:white;"></i></a>',
        '<a style = "color: white; text-decoration: none;" href="' + address +  '" target="_blank">' + name + '</a>'
    ]
}
function setOctoprintLinkAndName(note, name, address) {
    if (isDisabled(note)) {
        return disabledLinkAndNameHTML(name);
    }
    else {
        return enabledLinkAndNameHTML(name, address);
    }
}
function lastUpdatedHTML(updateTime) {
    var element = document.createElement("p");
    element.innerHTML = '<p class=printer-bottom-text> Fetched: ' + updateTime+ '</p>';
    return element
}
function timeLeftFormat(printTime, timeLeft) {
    timeLeft = timeLeft + printTime

    let printTimeUnit = "s";
    if (printTime >= 60) {
        printTime = printTime/60;
        printTimeUnit = "min";
        if (printTime >= 60) {
            printTime = printTime/60;
            printTimeUnit = "h";
        }
    }
    let timeLeftUnit = "s";
    if (timeLeft >= 60) {
        timeLeft = timeLeft/60;
        timeLeftUnit = "min";
        if (timeLeft >= 60) {
            timeLeft = timeLeft/60;
            timeLeftUnit = "h";
        }
    }

    return [printTime.toFixed(1)+ printTimeUnit, timeLeft.toFixed(1) + timeLeftUnit]
}    
function timeLeftHTML(printTime, timeLeft){
    let timeLeftDiv = document.createElement("div");
    timeLeftDiv.className = "timeleftDiv";

    timeLeftDiv.innerHTML = '<p class="timeleftText">' + timeLeftFormat(printTime, timeLeft)[0] + "/" + timeLeftFormat(printTime, timeLeft)[1] + '</p>';
    return timeLeftDiv
}
function addressHTML(address) {
    var addressP = document.createElement("p");
    addressP.innerHTML = '<p class="adressBottomText">' + address + '<p>';
    return addressP
}
function placementCodeHTML(placementcode) {
    var element = document.createElement("div");
    element.className = "placementCodeDiv"
    if (placementcode) {
        element.innerHTML = "<p class='positionCodeText'>" + placementcode + "</p>"
    }  
    return element
}
function printerNoteHTML(note) {
    var printerNoteDiv = document.createElement("div");
    if (isDisabled(note)) {
        var printerNoteSpan = document.createElement("span");
        printerNoteSpan.className = "printerNoteImportant";
        printerNoteSpan.innerHTML = "<i class='fas fa-exclamation-circle'></i>";
        printerNoteDiv.appendChild(printerNoteSpan);

        var newNote 
        if (note.startsWith("!important")) {
            newNote = note.substring(21);
        }
        else {
            newNote = note.substring(10);
        }

        var printerNoteHover = document.createElement("div");
        printerNoteHover.className = 'printernoteHover';
        printerNoteHover.innerHTML = "<p>" + newNote + "</p>";
        printerNoteHover.style.display = "none"; // Initially hidden

        printerNoteDiv.addEventListener("mouseover", function() {
            show_note(printerNoteHover);
        });

        printerNoteDiv.addEventListener("mouseout", function() {
            hide_note(printerNoteHover);
        });

        printerNoteDiv.appendChild(printerNoteHover);
    } 
    else if (note && note.startsWith("!important")) {
        var printerNoteSpan = document.createElement("span");
        printerNoteSpan.className = "printerNoteImportant";
        printerNoteSpan.innerHTML = "<i class='fas fa-exclamation-circle'></i>";
        printerNoteDiv.appendChild(printerNoteSpan);

        var printerNoteHover = document.createElement("div");
        printerNoteHover.className = 'printernoteHover';
        printerNoteHover.innerHTML = "<p>" + note.substring(11) + "</p>";
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

    printerNoteDiv.onclick = function () {
        alert(note);
    };

    // Funcitions
    function show_note(noteHover) {
        noteHover.style.display = "block";
    }

    function hide_note(noteHover) {
        noteHover.style.display = "none";
    }

    return printerNoteDiv
}
function statusHTML(status, progress, clean_status) {
    var statusElement = document.createElement("div");
    statusElement.style.backgroundColor = clean_status[1];
    statusElement.className = 'printer-status-card';
    if (status === "Printing" || status === "Paused") {
        if (status === "Paused"){
            var barColor = '#2b8eff';
        }
        else {
            var barColor = "#ff8c00";
        }
        let progressBar = new Progress({parent: statusElement, cornerRadius: "3px", barColor: barColor, backgroundColor: "#383838", minPercent: 0.01});
        progressBar.setProgress(progress/100);
        progressBar.addMidElement(clean_status[0]);
    }
    else {
        statusElement.appendChild(clean_status[0]);
    }
    return statusElement
}

// Switch display modes
var currentDisplayMode = "grid"
function switchDisplay () {
    var switchBTN = document.getElementById("switchDisplayBTN");
    let searchInput = document.getElementById("searchInput");
    let filterSelect = document.getElementById("filterSelect");
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

    subscribeToFirestore(); // Resubscribe to firestore
}
// Clean status
function cleanStatus(item){ // Returns the div and bg color for it.
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
        statusTextDiv.innerHTML = item.status + ' (' + Math.round(item.progress) + '%)';
        return [statusTextDiv, '#2b8eff'];
    }
    else if (item.status == "Pausing") {
        let statusTextDiv = document.createElement("div");
        statusTextDiv.className = "statusText";
        statusTextDiv.innerHTML = item.status + "...";
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
    else if (item.status == "Cancelling") {
        let statusTextDiv = document.createElement("div");
        statusTextDiv.className = "statusText";
        statusTextDiv.innerHTML = "Cancelling";
        return [statusTextDiv, '#FF6347'];
    }
    else {
        let statusTextDiv = document.createElement("div");
        statusTextDiv.className = "statusText";
        statusTextDiv.innerHTML = "Unknown";
        return [statusTextDiv, "#232323"];
    }
}
// Displaying in table mode
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
        cell3.innerHTML = '<a href="' + item.address + '" target="_blank" style="color:white;">' + item.address + '</a>';
        
        // Cleaned status
        var cleaned_status_and_bg_color = cleanStatus(item);
        cell4.appendChild(cleaned_status_and_bg_color[0]);
        cell4.style.backgroundColor = cleaned_status_and_bg_color[1];
        cell4.className = 'status-cell';

        // Hide loading text
        document.getElementById('loading').style.display = 'none';
        // Reapply the sort
        if (lastSortColumn !== null) {
            alphabeticalSort(lastSortColumn);
            // If your sort function doesn't automatically toggle the sort order,
            // you might need to apply the sort twice to get the correct order
            if (lastSortOrder === "desc") {
                console.log('Sorting again');
                alphabeticalSort(lastSortColumn);
            }
        }
    });
}
// Printermodal
var modal = document.getElementById("printerModal");
var span = document.getElementsByClassName("close")[0];

function openModal(item) {
    document.getElementById("modalPlacementCode").innerHTML = item.placementcode;
    document.getElementById("modalPrinterName").innerText = item.name;
    document.getElementById("modalPrinterModel").innerText = "Model: " + item.type;
    // Status
    let modalStatusHtml = statusHTML(item.status, item.progress, cleanStatus(item));
    modalStatusHtml.className = "modalStatus";
    document.getElementById("modalPrinterStatus").innerHTML = modalStatusHtml.outerHTML;
    document.getElementById("modalLastUpdated").innerHTML = '<p> Last changed: ' + item.updateTime + '</p>';
    
    // Create a copy button
    var copyButton = document.createElement("button");
    // Icon for button
    copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/></svg>';
    copyButton.className = "copyButton";
    copyButton.onclick = function() {
        // First copy to clipboard, then show "Copied!" message
        navigator.clipboard.writeText(item.address).then(() => {
            // Show "Copied!" message
            copiedMessage.style.display = 'inline';
            // Hide after 1 second
            setTimeout(() => {
                copiedMessage.style.display = 'none';
            }, 1000);
        });
    }

    // Create "Copied!" melding
    var copiedMessage = document.createElement("span");
    copiedMessage.innerText = "Copied!";
    copiedMessage.className = "copiedMessage";
    copiedMessage.style.display = 'none'; 

    document.getElementById("modalAddress").innerHTML = item.address;
    document.getElementById("modalAddress").appendChild(copyButton);
    document.getElementById("modalAddress").appendChild(copiedMessage);
    document.getElementById("modalPrinterTemps").innerHTML = 'end: Na°C bed: Na°C'
    document.getElementById("modalGoToOctoButton").href = item.address;
    document.getElementById("modalGoToOctoButton").target = "_blank";
    let note = item.note;
    if (note === "") {
        note = "No note.";
    }
    document.getElementById("modalPrinterNote").innerHTML = 'Note: ' + note;
    if (item.status === "Printing" || item.status === "Paused") {
        document.getElementById("modalLoadedModel").innerHTML = 'Printing: ' + 'modelPlaceHolderText.gcode';
        let timeLeftHTMLElement = document.createElement("div");
        timeLeftHTMLElement.className = "modalTimeLeft";
        timeLeftHTMLElement.innerHTML = '<p style="margin:0px;">' + timeLeftFormat(item.printTime, item.timeLeft)[0] + "/" + timeLeftFormat(item.printTime, item.timeLeft)[1] + '</p>';
        document.getElementById("modalTimeLeft").innerHTML = timeLeftHTMLElement.outerHTML;
    } else {
        document.getElementById("modalLoadedModel").innerHTML = 'Loaded: ' + 'modelPlaceHolderText.gcode';
        document.getElementById("modalTimeLeft").innerHTML = "";
    }

    // Only display is wider than 900px
    if (window.innerWidth > 900) {
        modal.style.display = "block";
    }
}

span.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
// Displaying in grid mode
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

        // Necesarry variables
        var name = shortenName(item.name, maxLength=11);
        var clean_status = cleanStatus(item);

        // Create UI Elements
        var octoprintLink = setOctoprintLinkAndName(item.note, name, item.address)[0]
        var itemName = setOctoprintLinkAndName(item.note, name, item.address)[1]
        var lastUpdatedElement = lastUpdatedHTML(item.updateTime)
        var addressElement = addressHTML(item.address)
        var placementCodeDiv = placementCodeHTML(item.placementcode)
        var printerNoteDiv = printerNoteHTML(item.note)
        var status = statusHTML(item.status, item.progress, clean_status);
        // Potential UI elements
        if (item.status === "Printing" || item.status === "Paused") {
            var timeLeftElement = timeLeftHTML(item.printTime, item.timeLeft)
        }

        // Add everything to the card
        newCard.className = "printer-card";
        newCard.innerHTML = '<h3>' + itemName + " " + octoprintLink + '</h3>' + '<h4> Model: ' + item.type + '</h4>'
        
        newCard.appendChild(status);
        newCard.appendChild(lastUpdatedElement);
        newCard.appendChild(addressElement);
        newCard.append(placementCodeDiv);
        if (item.note != "") {
            newCard.append(printerNoteDiv);
        }
        if (item.status === "Printing" || item.status === "Paused") {
            newCard.append(timeLeftElement);
        }
        
        newCard.onclick = function() {
            openModal(item);
        }

        printergrid.appendChild(newCard);
    });
}

// ------------------------------------------------------
//                 Search, filter and sort
// ------------------------------------------------------
// Search
function applySearchFilter(input) {
    // Declare variables
    var filter, table, tr, td, i, txtValue;
  
    if (!input) {
      input = "";
    }
  
    filter = input.toUpperCase();
  
    if (!(filter.includes(active_filter.toUpperCase()))) {
      filter = filter + "#" + active_filter.toUpperCase();
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

// Filter
let active_filter = ""
function filter(searchWord) {
    let searchInput = document.getElementById("searchInput");
    active_filter = searchWord
    applySearchFilter(searchInput.value);
}
// Variables to save the last sort column and order so the sort can be reapplied after the table is refreshed
let lastSortColumn = null;
let lastSortOrder = null;
function alphabeticalSort(n, event) { 
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