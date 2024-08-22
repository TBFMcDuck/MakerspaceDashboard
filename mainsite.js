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