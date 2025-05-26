// document.getElementById('form_register').addEventListener('submit', e => {
//     e.preventDefault();
    
//     const data = {
//         groupName: document.getElementById('id_groupName').value
//     }
    
//     sendForm(data);
// })

// async function sendForm(data) {
//     const res = await fetch('/api/Users/Groups', {
//         method: 'POST',
//         headers: {'Content-Type': 'application/json'},
//         body: JSON.stringify(data)
//     });

//     const result = await res.json();
// }