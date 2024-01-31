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

export const indexHtml = html`
<!-- hello world -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>hello world</title>
</head>
<body>
    <h1>hello worl</h1>
</body>
<script src="/client.js"></script>
</html>
`
