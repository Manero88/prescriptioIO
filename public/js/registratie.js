document.getElementById('registration-form').addEventListener('submit', function(e) {
    e.preventDefault();

    var formData = {
        titel: this.querySelector('[name="titel"]').value,
        naam: this.querySelector('[name="naam"]').value,
        email: this.querySelector('[name="email"]').value,
        praktijk: this.querySelector('[name="praktijk"]').value,
        wachtwoord: this.querySelector('[name="wachtwoord"]').value
    };

    fetch('/registreer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            alert('Gebruiker succesvol aangemaakt!');
            window.location.href = '/';
        } else {
            alert(data.message);
            window.location.reload();
        }
    })
    .catch(error => {
        console.error('Fout:', error);
        window.location.reload();
    });
});