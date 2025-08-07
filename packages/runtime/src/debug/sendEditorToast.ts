export function sendEditorToast(
  title: string,
  message: string,
  {
    type = 'neutral',
  }: {
    type?: 'neutral' | 'warning' | 'critical'
  },
) {
  window.parent?.postMessage(
    {
      type: 'emitToast',
      toastType: type,
      title,
      message,
    },
    '*',
  )
}
