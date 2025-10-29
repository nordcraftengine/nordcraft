export const isInputTarget = (event: Event) => {
  const target = event.target
  if (target instanceof HTMLElement) {
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'STYLE-EDITOR'
    ) {
      return true
    }
    if (target.contentEditable?.toLocaleLowerCase() === 'true') {
      return true
    }
  }
  return false
}
