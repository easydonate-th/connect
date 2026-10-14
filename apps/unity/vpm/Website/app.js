// Copy buttons: data-copy holds the id of the field to copy
for (const button of document.querySelectorAll('[data-copy]')) {
  const label = button.textContent

  button.addEventListener('click', async () => {
    const field = document.querySelector(`#${button.dataset.copy}`)
    field.select()

    try {
      await navigator.clipboard.writeText(field.value)
      button.textContent = 'Copied'
    } catch {
      button.textContent = 'Press Ctrl+C'
    }

    setTimeout(() => {
      button.textContent = label
    }, 1500)
  })
}
