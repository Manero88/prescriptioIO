document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split("/").pop();
    const menuItems = document.querySelectorAll('#menu-bar a');
    menuItems.forEach(item => {
        if(item.getAttribute('href') === currentPage) {
            item.classList.add('active');
        }
    });

    // Profielfoto uploaden en tonen
    document.getElementById('profile-picture').addEventListener('click', function() {
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = function(e) {
            var file = e.target.files[0];
            var reader = new FileReader();
            reader.onloadend = function() {
                document.getElementById('profile-picture').src = reader.result;
                uploadImage(reader.result);
            };
            reader.readAsDataURL(file);
        };
        fileInput.click();
    });

        // Ophalen van gebruikersgegevens
        fetch('/getUserData')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            document.getElementById('title').value = data.titel;
            document.getElementById('name').value = data.naam;
            document.getElementById('practice').value = data.praktijk;
            if(data.profilPic){
                document.getElementById('profile-picture').src = data.profilPic;
            }
        })
        .catch(error => console.error('Fout bij het ophalen van gebruikersgegevens:', error));
});

document.getElementById('save').addEventListener('click', function(e) {
    e.preventDefault();
    var title = document.getElementById('title').value;
    var name = document.getElementById('name').value;
    var practice = document.getElementById('practice').value;

    fetch('/updateProfile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title, name: name, practice: practice }),
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            alert('Gegevens succesvol opgeslagen!');
        } else {
            alert('Er was een probleem met het opslaan van de gegevens.');
        }
    })
    .catch(error => console.error('Fout:', error));
});

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

function uploadImage(base64Data) {
    fetch('/upload', {
        method: 'POST',
        body: JSON.stringify({ image: base64Data }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            console.log('Afbeelding succesvol geüpload.');
        } else {
            console.error('Fout bij het uploaden van de afbeelding.');
        }
    })
    .catch(error => {
        console.error('Fout bij het uploaden van de afbeelding:', error);
    });
}
