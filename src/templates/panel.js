module.exports = function({ title = 'CEP Panel', href }) {
  return `<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
  </head>
  <body>
    <script>
      window.location.href = "${href}";
    </script>
  </body>
</html>`
}
