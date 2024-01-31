let stokeCount = 0

async function formHandler(event: SubmitEvent) {
  event.preventDefault()

  if (!(event.target instanceof HTMLFormElement)) {
    console.error(event.target)
    throw new Error(`event.target is not HTMLFormElement: ${JSON.stringify(event.target)}`)
  }

  const formData = new FormData(event.target)

  console.log(JSON.stringify(formData))

  const strokes: Stroke[] = Array.from(Array(stokeCount).keys()).map((i) => {
    const strokeColorInputEl = document.getElementById(`stroke-color-${i}`)
    if (!(strokeColorInputEl instanceof HTMLInputElement)) {
      console.error(strokeColorInputEl)
      throw new Error(`strokeColorInputEl is not HTMLInputElement: ${JSON.stringify(strokeColorInputEl)}`)
    }
    const strokeColor = strokeColorInputEl.value

    const strokeWidthInputEl = document.getElementById(`stroke-width-${i}`)
    if (!(strokeWidthInputEl instanceof HTMLInputElement)) {
      console.error(strokeWidthInputEl)
      throw new Error(`strokeWidthInputEl is not HTMLInputElement: ${JSON.stringify(strokeWidthInputEl)}`)
    }
    const strokeWidth = parseInt(strokeWidthInputEl.value, 10)

    return {
      color: strokeColor,
      width: strokeWidth,
    }
  })

  const data = {
    font: formData.get('font'),
    text: formData.get('text'),
    fill: formData.get('fill'),
    strokes: strokes,
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

const formEl = document.getElementById('form')
if (!(formEl instanceof HTMLFormElement)) {
  console.error(formEl)
  throw new Error(`formEl is not HTMLFormElement`)
}

// button
const addStrokeEl = document.getElementById('add-stroke')
if (!(addStrokeEl instanceof HTMLButtonElement)) {
  console.error(addStrokeEl)
  throw new Error(`addStrokeEl is not HTMLButtonElement`)
}

formEl.addEventListener('submit', (event) => {
  void formHandler(event)
})

// append stroke input element to the form
addStrokeEl.addEventListener('click', () => {
  const strokeColorInputEl = document.createElement('input')
  strokeColorInputEl.setAttribute('type', 'text')
  strokeColorInputEl.setAttribute('id', `stroke-color-${stokeCount}`)
  strokeColorInputEl.setAttribute('value', 'black')
  formEl.appendChild(strokeColorInputEl)

  const strokeWidthInputEl = document.createElement('input')
  strokeWidthInputEl.setAttribute('type', 'text')
  strokeWidthInputEl.setAttribute('id', `stroke-width-${stokeCount}`)
  strokeWidthInputEl.setAttribute('value', '2')
  formEl.appendChild(strokeWidthInputEl)

  stokeCount++
})
