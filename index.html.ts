const html = (strings: TemplateStringsArray, ...values: string[]) => {
  const raw = strings.raw
  let result = ''
  for (let i = 0; i < raw.length; i++) {
    result += raw[i]
    if (i < values.length) {
      result += values[i]
    }
  }
  return result
}

export const indexHtml = (fontsAvailable: string[]) => {
  const fontInputs = fontsAvailable
    .map(font => html`<option value="${font}">${font}</option>`)
    .join('\n')
  return html`
<!-- hello world -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>hello world</title>
    <style>
      body {
        font-family: sans-serif;
      }
      form {
        display: flex;
        flex-direction: column;
      }
      label {
        margin-top: 1em;
      }
      input {
        margin-left: 1em;
      }
      button {
        margin-top: 1em;
      }
    </style>
</head>
<body>
    <form id="form" action="/generate-text" method="POST">
      <label for="font">font</label>
      <select id="font" name="font">
        ${fontInputs}
      <label for="text">text</label>
      <input id="text" name="text" type="text" value="hello world">
      <label for="fill">fill</label>
      <input id="fill" name="fill" type="text" value="white">
      <label for="strokes">strokes</label>
      <input id="strokes" name="strokes" type="text" value='[{"color":"black","width":2}]'>
      <button type="submit">submit</button>
    </form>
    <img id="result" src="" alt="result" />
</body>
<script src="/client.js"></script>
</html>
`
}
