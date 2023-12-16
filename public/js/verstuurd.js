document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logoutButton');

    logoutButton.addEventListener('click', function() {
        
        fetch('/logout', {
            method: 'POST',
        })
        .then(response => {
            if (response.redirected) {
                window.location.href = response.url;
            } else {
                console.error('Uitloggen mislukt.');
            }
        })
        .catch(error => {
            console.error('Fout bij uitloggen:', error);
        });
    });
});


document.addEventListener('DOMContentLoaded', function() {
    const filterNaam = document.getElementById('filter-naam');
    const filterDatum = document.getElementById('filter-datum');
    const filterButton = document.getElementById('filter-toepassen');
    const vorigeButton = document.getElementById('vorige');
    const volgendeButton = document.getElementById('volgende');
    const tabelBody = document.getElementById('recepten-tabel').getElementsByTagName('tbody')[0];

    let huidigePagina = 1;
    const receptenPerPagina = 10;

    const haalReceptenOp = (pagina, naamFilter, datumFilter) => {
        fetch(`/api/recepten?pagina=${pagina}&naamFilter=${naamFilter}&datumFilter=${datumFilter}`)
        .then(response => response.json())
        .then(data => {
            updateTabel(data);
        })
        .catch(error => {
            console.error('Fout bij het ophalen van recepten:', error);
        });
    };
    

    const updateTabel = (receptenData) => {
        tabelBody.innerHTML = '';

        receptenData.forEach(recept => {
            const rij = tabelBody.insertRow();
            rij.insertCell().textContent = recept.naam;
            rij.insertCell().textContent = recept.voorletters;
            
            const geboortedatum = new Date(recept.geboortedatum);
            const dag = geboortedatum.getDate().toString().padStart(2, '0');
            const maand = (geboortedatum.getMonth() + 1).toString().padStart(2, '0'); // Maanden zijn zero-based
            const jaar = geboortedatum.getFullYear();
            rij.insertCell().textContent = `${dag}-${maand}-${jaar}`;

            rij.insertCell().textContent = recept.adres;
            rij.insertCell().textContent = recept.huisnr;
            rij.insertCell().textContent = recept.toev;
            rij.insertCell().textContent = recept.postcode;
            rij.insertCell().textContent = recept.woonplaats;
            rij.insertCell().textContent = recept.recept;
            rij.insertCell().textContent = recept.bezorgen;

            const datumAanmaak = new Date(recept.datumAanmaak);
            const dagAanmaak = datumAanmaak.getDate().toString().padStart(2, '0');
            const maandAanmaak = (datumAanmaak.getMonth() + 1).toString().padStart(2, '0'); // Maanden zijn zero-based
            const jaarAanmaak = datumAanmaak.getFullYear();
    rij.insertCell().textContent = `${dagAanmaak}-${maandAanmaak}-${jaarAanmaak}`;

    rij.insertCell().textContent = recept.tijdstipAanmaak;
        });
    };

    filterButton.addEventListener('click', () => {
        haalReceptenOp(1, filterNaam.value, filterDatum.value);
    });

    filterNaam.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            haalReceptenOp(1, filterNaam.value, filterDatum.value);
        }
    });

    filterDatum.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            haalReceptenOp(1, filterNaam.value, filterDatum.value);
        }
    });

    vorigeButton.addEventListener('click', () => {
        if (huidigePagina > 1) {
            huidigePagina--;
            haalReceptenOp(huidigePagina, filterNaam.value, filterDatum.value);
        }
    });

    volgendeButton.addEventListener('click', () => {
        huidigePagina++;
        haalReceptenOp(huidigePagina, filterNaam.value, filterDatum.value);
    });

    haalReceptenOp(huidigePagina, '', '');
});
