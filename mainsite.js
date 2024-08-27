var oppsett_span = document.getElementById('oppsett');
var oppsett_knapp = document.getElementById("oppsettButton");


oppsett_knapp.addEventListener('click', function() {
  if (oppsett_span.style.display === 'none') {
    oppsett_span.style.display = 'block';
    oppsett_knapp.textContent = "Skjul \u2191";
  } else {
    oppsett_span.style.display = 'none';
    oppsett_knapp.textContent = "Vis \u2193";
  }
});

function searchFunction() {
  // Declare variables
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById("searchInput");
  filter = input.value.toUpperCase();
  table = document.getElementById("printerTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[0];
    if (td) {
      txtValue = td.textContent || td.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}
// Variables to save the last sort column and order so the sort can be reapplied after the table is refreshed
let lastSortColumn = null;
let lastSortOrder = null;
function sortTable(n) {
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
    } else {
        lastSortOrder = "desc";
    }
}
// Refresh the table when the page loads
window.onload = function() {
    refreshTable();
}
function refreshTable() {
    // Clear the table
    document.getElementById('printerTableBody').innerHTML = '';
    // Display loading text
    document.getElementById('loading').style.display = 'block';

    // Initialize Firestore
    var db = firebase.firestore();

    // Fetch the printerdata from Firestore
    db.collection("printerdata").onSnapshot((querySnapshot) => {
        var table = document.getElementById('printerTableBody');
        table.innerHTML = ''; // Clear the table before adding new data

        querySnapshot.forEach((doc) => {
            var item = doc.data();
            var row = table.insertRow(-1);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            var cell4 = row.insertCell(3);

            cell1.innerHTML = item.name + " (Data fetched at:" + item.updateTime + ")";
            cell2.innerHTML = item.type;
            cell3.innerHTML = '<a href="' + item.address + '" target="_blank">' + item.address + '</a>';
            cell4.innerHTML = item.status;
            cell4.className = 'status-cell';

            // Cleaning the status
            if (item.status == "Printing") {
                cell4.innerHTML = '<div>' + item.status + ' (' + Math.round(item.progress) + '%)</div>' + '<div><progress class="status-progress" value="' + item.progress + '" max="100"></progress></div>';
                cell4.style.backgroundColor = '#ff8c00';
            }
            else if (item.status == "Operational") {
                cell4.style.backgroundColor = '#00ff77';
            }
            else if (item.status == "Paused") {
                cell4.innerHTML = '<div>' + item.status + ' (' + item.progress + '%)</div>' + '<div><progress class="status-progress" value="' + item.progress + '" max="100"></progress></div>';
                cell4.style.backgroundColor = '#2b8eff';
            }
            else if(item.status == "Offline after error") {
                cell4.innerHTML = "(Probably) Turned off" + "<span class = 'tooltip' title='Offline after error'>🛈</span>";
                cell4.style.backgroundColor = '#696969';
            }
            else if (item.status == "Offline") {
                cell4.style.backgroundColor = '#872727';
            }
            else if (item.status == null) {
                cell4.innerHTML = "unknown";
            }

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
            searchFunction();
        });
    }, error => {
        console.error('Error:', error);
        // Hide loading text
        document.getElementById('loading').style.display = 'none';
    });
}

// Add an event listener to the button
document.getElementById('refreshButton').addEventListener('click', refreshTable);