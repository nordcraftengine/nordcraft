export const createPanicScreen = ({
  name,
  message,
  isPage,
  cause,
}: {
  name: string
  message: string
  isPage?: boolean
  cause?: unknown
}) => {
  let content = getContent(name, message, isPage)

  // Easter egg for RangeError
  if (cause instanceof RangeError) {
    for (let i = 0; i < 10; i++) {
      content += `<div style="transform-origin: 15% 15%; scale: ${1 / (i * 0.225 + 1.225)}; font-size: ${22 / ((i * 0.6) ** 2 + 1)}px">${getContent(name, message, isPage)}</div>`
    }
  }

  return document.createRange().createContextualFragment(`
      <main style="background-color: blue; color: white; font-family: 'Courier New', monospace; font-weight: 100; display: flex; justify-content: flex-start; align-items: flex-start; margin: 0px; padding: 0px;">
        <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start; height: 100vh;">
          <div style="display: flex; flex-direction: column; gap: 20px; padding: 80px; font-size: 22px;">${content}</div>
        </div>
        <div style="position:fixed; pointer-events: none; width: 100vw; height: 100vh; background-image: linear-gradient(0deg, rgba(0,0,0,0) 25%, rgba(0,0,0,0.33) 25%, rgba(0,0,0,0.33) 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.33) 75%, rgba(0,0,0,0.33) 100%); background-size: 4px 4px;"></div>
        <div style="position:fixed; pointer-events: none; width: 100vw; height: 100vh; background-image: radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.25) 100%);"></div>
      </main>
  `)
}

const getContent = (name: string, message: string, isPage?: boolean) => `
  <h1 style="display: inline; font-size: 1em; background: white; color: blue; padding: 0.4em 0.8em;">Error: ${name}</h1>
  <p style="font-size: 0.8em;">The ${isPage ? 'page' : 'component'} could not be rendered. Fix the issue and try again. Join our <a style="color:white" href="https://discord.gg/nordcraft" target="_blank">Discord</a> for help.</p>
  <p style="font-size: 0.81em; white-space: pre-wrap">${message}</p>`
