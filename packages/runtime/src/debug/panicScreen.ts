export const renderPanicScreen = (
  title: string,
  message: string,
  isPage: boolean,
) => `
  <main style="background-color: blue; color: white; font-family: 'Courier New', monospace; font-weight: 100; display: flex; justify-content: flex-start; align-items: flex-start; margin: 0px; padding: 0px;">
    <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start; height: 100vh;">
      <div style="display: flex; flex-direction: column; gap: 20px; padding: 80px;">
        <div>
          <h1 style="display: inline; font-size: 22px; background: white; color: blue; padding: 8px 16px;">${title}</h1>
        </div>
        <div>
          <p style="font-size: 18px;">The ${isPage ? 'page' : 'component'} could not be rendered. Fix the issue and try again. Join our <a style="color:white" href="https://discord.gg/nordcraft" target="_blank">Discord</a> for help.</p>
        </div>
        <div>
          <p style="font-size: 18px;">Error Message: ${message}</p>
        </div>
      </div>
    </div>
    <div style="position:fixed; pointer-events: none; width: 100vw; height: 100vh; background-image: linear-gradient(0deg, rgba(0,0,0,0) 25%, rgba(0,0,0,0.33) 25%, rgba(0,0,0,0.33) 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.33) 75%, rgba(0,0,0,0.33) 100%); background-size: 4px 4px;"></div>
    <div style="position:fixed; pointer-events: none; width: 100vw; height: 100vh; background-image: radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.25) 100%);"></div>
  </main>
`
