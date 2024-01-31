
// take input of the form and send it to the server
// get the response from the server and display it on the page

document.getElementById('form')?.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(event.target as HTMLFormElement);

  const font = formData.get('font');
  const text = formData.get('text');
  const fill = formData.get('fill');
  const strokes = JSON.parse(formData.get('strokes') as string);

  const data = {
    font,
    text,
    fill,
    strokes,
  };

  fetch('/generate-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch((error) => console.error('Error:', error));
});

