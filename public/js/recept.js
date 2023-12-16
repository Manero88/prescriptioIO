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

document.getElementById('recept-form').addEventListener('submit', function(e) {
    e.preventDefault();

    let formData = {
        naam: document.getElementById('naam').value,
        voorletters: document.getElementById('voorletters').value,
        geboortedatum: document.getElementById('geboortedatum').value,
        adres: document.getElementById('adres').value,
        huisnr: document.getElementById('huisnr').value,
        toev: document.getElementById('toev').value,
        postcode: document.getElementById('postcode').value,
        woonplaats: document.getElementById('woonplaats').value,
        recept: document.getElementById('recept').value,
        bezorgen: document.getElementById('bezorgen').checked
    };

    fetch('/verwerkRecept', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "recept.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();

        window.location.reload();
    })
    .catch(error => console.error('Fout:', error));
});
