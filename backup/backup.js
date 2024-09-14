// Refresh grid
function renderGrid(querySnapshot) {
    // Show grid
    var printergrid = document.getElementById("printerGrid");
    printergrid.style.display = 'flex';
    printergrid.innerHTML = '';

    querySnapshot.forEach((doc) => {
        var item = doc.data();
        var newCard = document.createElement("div");

        var octoprintLink = '<a href="' + item.address +  '" target="_blank" <i class="fas fa-external-link-alt" style="color:white;"></i></a>';
        var itemName = '<a style="color: white; text-decoration: none;" href="' + item.address +  '" target="_blank">' + item.placementcode + '</a>';

        newCard.className = "printer-card";
        newCard.innerHTML = '<h3>' + itemName + " " + octoprintLink + '</h3>'

        // Address
        var address = document.createElement("a");
        address.innerHTML = '<p class="addressBottomText">' + item.address + '<p>';
        
        newCard.appendChild(address);

        // Explenation
        var explenationText = document.createElement("p");
        explenationText.innerHTML = '<p class="explenationText"> This is a backup, the data may be inacurate.<p>';
        
        newCard.appendChild(explenationText);

        printergrid.appendChild(newCard);
    });
}

fetch('../assets/printerBackup/printerinfoBackup.json')
    .then(response => response.json())
    .then(data => {
        // Convert the JSON data to a format compatible with renderGrid
        const querySnapshot = data.map(item => ({
            data: () => item
        }));

        // Call renderGrid with the fetched data
        renderGrid(querySnapshot);
    })
    .catch(error => {
        console.error('Error fetching the JSON data:', error);
    });

// Search
function searchFunction(input) {
    // Declare variables
    var i, txtValue;
  
    if (!input) {
      input = "";
    }
  
    userSearch = input.toUpperCase();

    var anyPrinterMatchesQuery = false;
        
    grid = document.getElementById("printerGrid");
    var gridItems = grid.children; // Get the child elements of the grid
    for (i = 0; i < gridItems.length; i++) {
        child = gridItems[i];
        txtValue = child.textContent || child.innerText;
        if ((txtValue.toUpperCase().indexOf(userSearch) > -1)) {
            child.style.display = "";
            anyPrinterMatchesQuery = true;
        } else {
            child.style.display = "none";
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