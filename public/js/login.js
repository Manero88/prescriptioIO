document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();

    var gebruikersnaam = document.getElementById('gebruikersnaam').value;
    var wachtwoord = document.getElementById('wachtwoord').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gebruikersnaam: gebruikersnaam, wachtwoord: wachtwoord }),
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (data.success) {
            console.log('Succesvol ingelogd');
            alert('Succesvol ingelogd');
            window.location.href = '/profiel.html';
        } else {
            alert('Inloggen mislukt');
            window.location.reload();
        }
    });
});
