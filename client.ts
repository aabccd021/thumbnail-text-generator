// take input of the form and send it to the server
// get the response from the server and display it on the page
//
async function formHandler(event: SubmitEvent) {
  event.preventDefault()

  if (!(event.target instanceof HTMLFormElement)) {
    console.error(event.target)
    throw new Error(`event.target is not HTMLFormElement: ${JSON.stringify(event.target)}`)
  }

  const formData = new FormData(event.target)

  console.log(JSON.stringify(formData))

  const data = {
    font: formData.get('font'),
    text: formData.get('text'),
    fill: formData.get('fill'),
    strokes: [],
  }

  const result = await fetch('/generate-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const generateResult: unknown = await result.json()
  if (typeof generateResult !== 'string') {
    console.error(generateResult)
    throw new Error(`generateResult is not string: ${JSON.stringify(generateResult)}`)
  }

  const img = document.getElementById('result')
  if (!(img instanceof HTMLImageElement)) {
    console.error(img)
    throw new Error(`img is not HTMLImageElement`)
  }
  img.setAttribute('src', generateResult)
}

document.getElementById('form')?.addEventListener('submit', (event) => {
  void formHandler(event)
})
