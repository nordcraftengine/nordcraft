/**
 * AI-generated descriptions for most commonly used keywords.
 * If more are needed, add them by any means.
 */
export const keywordDescriptionsByProperty: Record<
  string,
  Partial<Record<string, string>>
> = {
  'accent-color': {},
  'align-content': {
    normal: 'Uses the alignment behavior defined by the layout mode.',
    baseline:
      "Aligns the item's baseline with the baseline of the alignment context.",
    'space-between':
      'Distributes items with equal space between them and no space at the ends.',
    'space-around': 'Distributes items with equal space around each item.',
    'space-evenly':
      'Distributes items with equal space between and around items.',
    stretch:
      'Stretches items to fill the available space along the alignment axis.',
    unsafe: 'Allows alignment even if it may cause overflow or clipping.',
    safe: 'Prevents alignment that would cause overflow or clipping.',
    center: 'Places items at the center along the alignment axis.',
    start: 'Aligns items to the start edge of the alignment axis.',
    end: 'Aligns items to the end edge of the alignment axis.',
    'flex-start': 'Aligns items to the start edge in flex layout.',
    'flex-end': 'Aligns items to the end edge in flex layout.',
  },
  'align-items': {
    normal: 'Uses the alignment behavior defined by the layout mode.',
    stretch:
      'Stretches items to fill the available space along the alignment axis.',
    baseline:
      "Aligns the item's baseline with the baseline of the alignment context.",
    unsafe: 'Allows alignment even if it may cause overflow or clipping.',
    safe: 'Prevents alignment that would cause overflow or clipping.',
    center: 'Places items at the center along the alignment axis.',
    start: 'Aligns items to the start edge of the alignment axis.',
    end: 'Aligns items to the end edge of the alignment axis.',
    'self-start':
      'Aligns the item to its own start side based on writing mode and direction.',
    'self-end':
      'Aligns the item to its own end side based on writing mode and direction.',
    'flex-start': 'Aligns items to the start edge in flex layout.',
    'flex-end': 'Aligns items to the end edge in flex layout.',
  },
  'align-self': {
    normal: 'Uses the alignment behavior defined by the layout mode.',
    stretch:
      'Stretches items to fill the available space along the alignment axis.',
    baseline:
      "Aligns the item's baseline with the baseline of the alignment context.",
    unsafe: 'Allows alignment even if it may cause overflow or clipping.',
    safe: 'Prevents alignment that would cause overflow or clipping.',
    center: 'Places items at the center along the alignment axis.',
    start: 'Aligns items to the start edge of the alignment axis.',
    end: 'Aligns items to the end edge of the alignment axis.',
    'self-start':
      'Aligns the item to its own start side based on writing mode and direction.',
    'self-end':
      'Aligns the item to its own end side based on writing mode and direction.',
    'flex-start': 'Aligns items to the start edge in flex layout.',
    'flex-end': 'Aligns items to the end edge in flex layout.',
  },
  'align-tracks': {
    normal: 'Uses the alignment behavior defined by the layout mode.',
    baseline:
      "Aligns the item's baseline with the baseline of the alignment context.",
    'space-between':
      'Distributes items with equal space between them and no space at the ends.',
    'space-around': 'Distributes items with equal space around each item.',
    'space-evenly':
      'Distributes items with equal space between and around items.',
    stretch:
      'Stretches items to fill the available space along the alignment axis.',
    unsafe: 'Allows alignment even if it may cause overflow or clipping.',
    safe: 'Prevents alignment that would cause overflow or clipping.',
    center: 'Places items at the center along the alignment axis.',
    start: 'Aligns items to the start edge of the alignment axis.',
    end: 'Aligns items to the end edge of the alignment axis.',
    'flex-start': 'Aligns items to the start edge in flex layout.',
    'flex-end': 'Aligns items to the end edge in flex layout.',
  },
  'alignment-baseline': {
    baseline: 'Aligns the baseline of the box with the baseline of the parent.',
    alphabetic:
      'Aligns based on the alphabetic baseline used in Latin scripts.',
    ideographic:
      'Aligns based on the ideographic baseline used in East Asian scripts.',
    middle: 'Aligns at the mathematical center of the text.',
    central: 'Aligns based on the central baseline of the parent.',
    mathematical: 'Aligns based on the mathematical text baseline.',
    'text-before-edge':
      "Aligns the top of the text to the parent's text-before-edge baseline.",
    'text-after-edge':
      "Aligns the bottom of the text to the parent's text-after-edge baseline.",
  },
  all: {},
  'anchor-name': {},
  'anchor-scope': {},
  animation: {},
  'animation-composition': {
    replace:
      'Uses only the values from the animation with highest priority, replacing others.',
    add: 'Adds animated values to the underlying property value when supported.',
    accumulate:
      'Accumulates animated values over successive iterations when supported.',
  },
  'animation-delay': {},
  'animation-direction': {
    normal: 'Plays the animation forward on each cycle.',
    reverse: 'Plays the animation backward on each cycle.',
    alternate:
      'Alternates direction each cycle, playing forward then backward.',
    'alternate-reverse':
      'Alternates direction each cycle, playing backward then forward.',
  },
  'animation-duration': {},
  'animation-fill-mode': {
    none: 'The animation does not apply styles before it starts or after it ends.',
    forwards:
      'Retains the final computed values of the animation after it completes.',
    backwards: 'Applies starting keyframe values before the animation begins.',
    both: 'Applies both forwards and backwards fill behavior.',
  },
  'animation-iteration-count': {
    infinite: 'Repeats the animation indefinitely.',
  },
  'animation-name': {},
  'animation-play-state': {
    running: 'The animation is currently playing.',
    paused: 'The animation is paused and retains its current computed values.',
  },
  'animation-range': {},
  'animation-range-end': {},
  'animation-range-start': {},
  'animation-timeline': {},
  'animation-timing-function': {
    ease: 'Starts slow, speeds up, then slows down toward the end.',
    linear: 'Progresses at a constant rate over time.',
    'ease-in': 'Starts slowly and accelerates.',
    'ease-out': 'Starts quickly and decelerates.',
    'ease-in-out': 'Combines ease-in and ease-out behavior.',
    'step-start': 'Jumps to the end value at the start of the animation.',
    'step-end': 'Jumps to the end value at the end of the animation.',
    'steps()': 'Uses a stepped progression with a fixed number of intervals.',
    'cubic-bezier()': 'Defines a custom timing curve using control points.',
  },
  appearance: {
    none: 'Removes platform-native styling.',
    auto: 'Allows the user agent to apply platform-native styling.',
  },
  'aspect-ratio': {},
  'backdrop-filter': {},
  'backface-visibility': {},
  background: {},
  'background-attachment': {
    scroll: "The background scrolls along with the element's contents.",
    fixed:
      'The background is fixed with regard to the viewport; it does not move when scrolled.',
    local:
      "The background scrolls with the element's content and is clipped to the element's padding box.",
  },
  'background-blend-mode': {},
  'background-clip': {
    'border-box': 'The background is painted within the border box.',
    'padding-box':
      'The background is painted within the padding box; it is clipped at the padding edge.',
    'content-box': 'The background is painted within the content box.',
    text: 'The background is clipped to the foreground text (for text backgrounds).',
  },
  'background-color': {
    transparent:
      'Makes the background fully transparent, showing underlying content.',
  },
  'background-image': {},
  'background-origin': {
    'padding-box': 'The background positioning area is the padding box.',
    'border-box': 'The background positioning area is the border box.',
    'content-box': 'The background positioning area is the content box.',
  },
  'background-position': {
    left: 'Position the background image at the left edge.',
    center: 'Position the background image at the center.',
    right: 'Position the background image at the right edge.',
    top: 'Position the background image at the top edge.',
    bottom: 'Position the background image at the bottom edge.',
  },
  'background-position-x': {},
  'background-position-y': {},
  'background-repeat': {
    repeat: 'Tile the background image both horizontally and vertically.',
    'repeat-x': 'Tile the background image horizontally only.',
    'repeat-y': 'Tile the background image vertically only.',
    'no-repeat': 'Do not tile the background image; draw it once.',
    space: 'Tile the image with leftover space distributed between tiles.',
    round: 'Tile the image and scale tiles to fill the area without clipping.',
  },
  'background-size': {
    auto: "Use the image's intrinsic size; do not scale unless necessary.",
    cover:
      'Scale the image to cover the entire background area; the image may be clipped.',
    contain:
      'Scale the image to fit within the background area while preserving aspect ratio.',
  },
  'baseline-shift': {},
  'block-size': {},
  border: {},
  'border-block': {},
  'border-block-color': {},
  'border-block-end': {},
  'border-block-end-color': {},
  'border-block-end-style': {},
  'border-block-end-width': {},
  'border-block-start': {},
  'border-block-start-color': {},
  'border-block-start-style': {},
  'border-block-start-width': {},
  'border-block-style': {},
  'border-block-width': {},
  'border-bottom': {},
  'border-bottom-color': {
    currentColor: "Uses the element's current computed color value.",
  },
  'border-bottom-left-radius': {},
  'border-bottom-right-radius': {},
  'border-bottom-style': {
    none: 'No border is drawn.',
    solid: 'A single continuous line.',
    dashed: 'A border consisting of short, evenly spaced line segments.',
    dotted: 'A border consisting of circular dots.',
    double: 'Two parallel lines with space between them.',
    groove: 'A border that appears carved or recessed, based on shading.',
    ridge: 'A border that appears raised, the opposite of groove.',
    inset:
      'A border that gives the appearance of the element being sunken into the page.',
    outset:
      'A border that gives the appearance of the element being raised out of the page.',
  },
  'border-bottom-width': {
    thin: 'Uses a thin border width defined by the user agent.',
    medium: 'Uses the default medium border width defined by the user agent.',
    thick: 'Uses a thick border width defined by the user agent.',
  },
  'border-collapse': {},
  'border-color': {
    currentColor: "Uses the element's current computed color value.",
  },
  'border-end-end-radius': {},
  'border-end-start-radius': {},
  'border-image': {},
  'border-image-outset': {},
  'border-image-repeat': {},
  'border-image-slice': {},
  'border-image-source': {},
  'border-image-width': {},
  'border-inline': {},
  'border-inline-color': {},
  'border-inline-end': {},
  'border-inline-end-color': {},
  'border-inline-end-style': {},
  'border-inline-end-width': {},
  'border-inline-start': {},
  'border-inline-start-color': {},
  'border-inline-start-style': {},
  'border-inline-start-width': {},
  'border-inline-style': {},
  'border-inline-width': {},
  'border-left': {},
  'border-left-color': {
    currentColor: "Uses the element's current computed color value.",
  },
  'border-left-style': {
    none: 'No border is drawn.',
    solid: 'A single continuous line.',
    dashed: 'A border consisting of short, evenly spaced line segments.',
    dotted: 'A border consisting of circular dots.',
    double: 'Two parallel lines with space between them.',
    groove: 'A border that appears carved or recessed, based on shading.',
    ridge: 'A border that appears raised, the opposite of groove.',
    inset:
      'A border that gives the appearance of the element being sunken into the page.',
    outset:
      'A border that gives the appearance of the element being raised out of the page.',
  },
  'border-left-width': {
    thin: 'Uses a thin border width defined by the user agent.',
    medium: 'Uses the default medium border width defined by the user agent.',
    thick: 'Uses a thick border width defined by the user agent.',
  },
  'border-radius': {},
  'border-right': {},
  'border-right-color': {
    currentColor: "Uses the element's current computed color value.",
  },
  'border-right-style': {
    none: 'No border is drawn.',
    solid: 'A single continuous line.',
    dashed: 'A border consisting of short, evenly spaced line segments.',
    dotted: 'A border consisting of circular dots.',
    double: 'Two parallel lines with space between them.',
    groove: 'A border that appears carved or recessed, based on shading.',
    ridge: 'A border that appears raised, the opposite of groove.',
    inset:
      'A border that gives the appearance of the element being sunken into the page.',
    outset:
      'A border that gives the appearance of the element being raised out of the page.',
  },
  'border-right-width': {
    thin: 'Uses a thin border width defined by the user agent.',
    medium: 'Uses the default medium border width defined by the user agent.',
    thick: 'Uses a thick border width defined by the user agent.',
  },
  'border-spacing': {},
  'border-start-end-radius': {},
  'border-start-start-radius': {},
  'border-style': {
    none: 'No border is drawn.',
    solid: 'A single continuous line.',
    dashed: 'A border consisting of short, evenly spaced line segments.',
    dotted: 'A border consisting of circular dots.',
    double: 'Two parallel lines with space between them.',
    groove: 'A border that appears carved or recessed, based on shading.',
    ridge: 'A border that appears raised, the opposite of groove.',
    inset:
      'A border that gives the appearance of the element being sunken into the page.',
    outset:
      'A border that gives the appearance of the element being raised out of the page.',
  },
  'border-top': {},
  'border-top-color': {
    currentColor: "Uses the element's current computed color value.",
  },
  'border-top-left-radius': {},
  'border-top-right-radius': {},
  'border-top-style': {
    none: 'No border is drawn.',
    solid: 'A single continuous line.',
    dashed: 'A border consisting of short, evenly spaced line segments.',
    dotted: 'A border consisting of circular dots.',
    double: 'Two parallel lines with space between them.',
    groove: 'A border that appears carved or recessed, based on shading.',
    ridge: 'A border that appears raised, the opposite of groove.',
    inset:
      'A border that gives the appearance of the element being sunken into the page.',
    outset:
      'A border that gives the appearance of the element being raised out of the page.',
  },
  'border-top-width': {
    thin: 'Uses a thin border width defined by the user agent.',
    medium: 'Uses the default medium border width defined by the user agent.',
    thick: 'Uses a thick border width defined by the user agent.',
  },
  'border-width': {
    thin: 'Uses a thin border width defined by the user agent.',
    medium: 'Uses the default medium border width defined by the user agent.',
    thick: 'Uses a thick border width defined by the user agent.',
  },
  bottom: {
    auto: 'No offset is applied; layout determines final position.',
  },
  'box-align': {},
  'box-decoration-break': {},
  'box-direction': {},
  'box-flex': {},
  'box-flex-group': {},
  'box-lines': {},
  'box-ordinal-group': {},
  'box-orient': {},
  'box-pack': {},
  'box-shadow': {},
  'box-sizing': {
    'content-box':
      'Width and height apply only to the content box; padding and border are added outside.',
    'border-box': 'Width and height include padding and border.',
  },
  'break-after': {},
  'break-before': {},
  'break-inside': {},
  'caption-side': {},
  caret: {},
  'caret-color': {},
  'caret-shape': {},
  clear: {
    left: 'Prevents the element from being placed alongside left-floated elements; it is moved below them.',
    right:
      'Prevents the element from being placed alongside right-floated elements; it is moved below them.',
    both: 'Prevents the element from being placed alongside any floated elements; it is moved below all floats.',
    none: 'Allows the element to be placed alongside floated elements if space allows.',
    'inline-start':
      'Prevents placement alongside floated elements on the inline-start side.',
    'inline-end':
      'Prevents placement alongside floated elements on the inline-end side.',
  },
  clip: {},
  'clip-path': {
    none: 'No clipping path is applied.',
    'margin-box': 'Uses the margin box as the clipping region.',
    'border-box': 'Uses the border box as the clipping region.',
    'padding-box': 'Uses the padding box as the clipping region.',
    'content-box': 'Uses the content box as the clipping region.',
    'fill-box': "Uses the object's fill bounding box as the clipping region.",
    'stroke-box':
      "Uses the object's stroke bounding box as the clipping region.",
    'view-box': 'Uses the SVG viewBox as the clipping region.',
  },
  'clip-rule': {},
  color: {},
  'color-interpolation-filters': {},
  'color-scheme': {
    normal: 'No preference is indicated; the UA may choose any color scheme.',
    light: 'Indicates support for a light color scheme.',
    dark: 'Indicates support for a dark color scheme.',
    only: 'Indicates that only the specified color scheme should be used.',
  },
  'column-count': {},
  'column-fill': {},
  'column-gap': {
    normal: 'Uses layout-defined spacing between columns.',
  },
  'column-rule': {},
  'column-rule-color': {},
  'column-rule-style': {},
  'column-rule-width': {},
  'column-span': {},
  'column-width': {},
  columns: {},
  contain: {},
  'contain-intrinsic-block-size': {},
  'contain-intrinsic-height': {},
  'contain-intrinsic-inline-size': {},
  'contain-intrinsic-size': {},
  'contain-intrinsic-width': {},
  container: {},
  'container-name': {},
  'container-type': {},
  content: {},
  'content-visibility': {},
  'counter-increment': {},
  'counter-reset': {},
  'counter-set': {},
  cursor: {
    auto: 'Allows the UA to choose the cursor based on context.',
    default: "Uses the platform's default cursor.",
    pointer: 'Indicates a clickable element.',
    text: 'Indicates text selection is possible.',
    wait: 'Indicates the user should wait.',
    progress:
      'Indicates an operation is in progress but interaction is possible.',
    move: 'Indicates the element can be moved.',
    grab: 'Indicates content can be grabbed.',
    grabbing: 'Indicates content is currently being grabbed.',
    crosshair: 'Indicates precise targeting is available.',
    'not-allowed': 'Indicates the requested action will not be carried out.',
  },
  cx: {},
  cy: {},
  d: {},
  direction: {
    ltr: 'Sets text direction to left-to-right.',
    rtl: 'Sets text direction to right-to-left.',
  },
  display: {
    block:
      'Behaves as a block-level element in block layout, typically starting on a new line and expanding to fill the available inline space.',
    inline:
      'Behaves as an inline-level element within text lines, without forcing line breaks.',
    flex: 'Creates a container using the flex layout model for arranging its children along a main axis.',
    'inline-flex':
      'Creates an inline-level container that arranges its children using the flex layout model.',
    grid: 'Creates a container using the grid layout model, arranging children in rows and columns.',
    'inline-grid':
      'Creates an inline-level container that arranges its children using the grid layout model.',
    flow: 'Uses block and inline layout rules depending on context in the normal flow of the document.',
    'flow-root':
      'Creates a new block formatting boundary, isolating internal layout from surrounding elements.',
    table:
      'Behaves similarly to a block-level table element and uses table layout rules for its children.',
    'inline-table':
      'Behaves similarly to an inline-level table element and uses table layout rules for its children.',
    'list-item':
      'Behaves as a block-level element and includes a marker, similar to an HTML list item.',
    contents:
      'The element itself does not participate in layout; only its children are rendered.',
    none: 'Removes the element from layout and interaction; it does not occupy space.',
    'run-in':
      'Behaves as inline or block depending on surrounding context. Support is limited.',
    ruby: 'Uses the ruby layout model for East Asian annotation text.',
  },
  'dominant-baseline': {},
  'empty-cells': {},
  'field-sizing': {},
  fill: {},
  'fill-opacity': {},
  'fill-rule': {},
  filter: {
    none: 'No graphical filter is applied.',
    'blur()':
      'Applies a Gaussian blur to the element (function requires a length).',
    'brightness()':
      'Adjusts the brightness of the element (function requires a number or percentage).',
    'contrast()':
      'Adjusts the contrast of the element (function requires a number or percentage).',
    'grayscale()':
      'Converts the element to grayscale (function requires a number or percentage).',
    'sepia()':
      'Applies a sepia tone to the element (function requires a number or percentage).',
    'saturate()':
      'Adjusts color saturation (function requires a number or percentage).',
    'hue-rotate()': 'Rotates the hue of colors (function requires an angle).',
    'invert()':
      'Inverts the colors of the element (function requires a number or percentage).',
    'opacity()':
      'Adjusts the opacity via filter (function requires a number or percentage).',
    'drop-shadow()':
      'Applies a shadow that follows the shape of the element (function requires offsets, blur radius, and color).',
  },
  flex: {
    auto: 'Items grow and shrink as needed, with base size determined by content.',
    none: 'Disables flex sizing; the item is sized according to its base size and does not grow or shrink.',
  },
  'flex-basis': {
    auto: "The item's base size is determined by its content and styles before flex sizing occurs.",
    content: "The item's base size is determined solely by its content.",
    'fit-content':
      'The item sizes itself based on content but does not exceed the space available.',
  },
  'flex-direction': {
    row: 'Sets the main axis to the inline direction, placing items horizontally in writing order.',
    'row-reverse':
      'Sets the main axis to the inline direction, placing items horizontally in reverse writing order.',
    column:
      'Sets the main axis to the block direction, placing items vertically in block progression order.',
    'column-reverse':
      'Sets the main axis to the block direction, placing items vertically in reverse block progression order.',
  },
  'flex-flow': {},
  'flex-grow': {
    '0': 'Items do not grow to fill available space.',
    '1': 'Items grow to fill available space in proportion to other items.',
  },
  'flex-shrink': {
    '0': 'Items do not shrink when space is limited.',
    '1': 'Items shrink to avoid overflow in proportion to other items.',
  },
  'flex-wrap': {
    nowrap:
      'Prevents items from wrapping; all items are placed on a single line along the main axis.',
    wrap: 'Allows items to wrap onto multiple lines, progressing in block direction.',
    'wrap-reverse':
      'Allows items to wrap onto multiple lines, but in the reverse block direction.',
  },
  float: {
    left: 'Positions the element on the left side of its containing block and allows inline content to wrap around it.',
    right:
      'Positions the element on the right side of its containing block and allows inline content to wrap around it.',
    none: 'Does not float; the element remains in normal block flow.',
    'inline-start':
      'Floats the element to the inline-start side, depending on writing direction.',
    'inline-end':
      'Floats the element to the inline-end side, depending on writing direction.',
  },
  'flood-color': {},
  'flood-opacity': {},
  font: {},
  'font-family': {
    serif: 'Uses a serif typeface with small finishing strokes.',
    'sans-serif': 'Uses a sans-serif typeface with no finishing strokes.',
    monospace: 'Uses a typeface where all characters have equal width.',
    cursive: 'Uses a typeface that mimics handwriting.',
    fantasy: 'Uses a decorative or playful typeface.',
    'system-ui':
      'Uses the default user-interface font of the operating system.',
    'ui-serif': 'Uses the system UI serif typeface.',
    'ui-sans-serif': 'Uses the system UI sans-serif typeface.',
    'ui-monospace': 'Uses the system UI monospace typeface.',
    'ui-rounded': 'Uses the system UI rounded typeface.',
    emoji: 'Uses a typeface designed to display emoji.',
    math: 'Uses a typeface designed for mathematical typesetting.',
    fangsong: 'Uses a Chinese fangsong style typeface.',
  },
  'font-feature-settings': {},
  'font-kerning': {
    auto: 'Applies kerning based on typeface and UA heuristics.',
    normal: 'Enables kerning when provided by the typeface.',
    none: 'Disables kerning adjustments between glyphs.',
  },
  'font-language-override': {},
  'font-optical-sizing': {
    auto: 'Adjusts glyph shapes to improve readability at the current font size.',
    none: 'Disables optical size adjustments.',
  },
  'font-palette': {},
  'font-size': {
    'xx-small': 'Uses the smallest predefined font size.',
    'x-small': 'Uses a very small predefined font size.',
    small: 'Uses a small predefined font size.',
    medium: 'Uses the default medium font size.',
    large: 'Uses a large predefined font size.',
    'x-large': 'Uses a very large predefined font size.',
    'xx-large': 'Uses the largest predefined font size.',
    smaller: 'Uses a font size smaller than the parent element.',
    larger: 'Uses a font size larger than the parent element.',
  },
  'font-size-adjust': {},
  'font-smooth': {
    auto: 'Allows the browser or operating system to determine text smoothing behavior.',
    never:
      'Disables font anti-aliasing, rendering text with sharp pixel edges.',
    always: 'Forces anti-aliasing regardless of system or browser settings.',
  },
  'font-stretch': {
    normal: "Uses the typeface's standard width.",
    condensed: 'Uses a narrower typeface width if available.',
    expanded: 'Uses a wider typeface width if available.',
  },
  'font-style': {
    normal: "Uses the typeface's standard upright design.",
    italic:
      "Uses the typeface's italic design, where available, to represent emphasis or alternate form.",
    oblique:
      'Applies a slanted version of the upright typeface when a true italic design is not used.',
  },
  'font-synthesis': {},
  'font-synthesis-position': {},
  'font-synthesis-small-caps': {},
  'font-synthesis-style': {},
  'font-synthesis-weight': {},
  'font-variant': {
    normal: 'Uses the default glyph substitution behavior.',
    'small-caps':
      'Replaces lowercase letters with small capital glyphs when available.',
  },
  'font-variant-alternates': {},
  'font-variant-caps': {},
  'font-variant-east-asian': {},
  'font-variant-emoji': {},
  'font-variant-ligatures': {},
  'font-variant-numeric': {},
  'font-variant-position': {},
  'font-variation-settings': {},
  'font-weight': {
    normal:
      "Uses the typeface's standard weight (typically equivalent to 400).",
    bold: 'Uses a heavier weight than the normal weight (typically equivalent to 700).',
    lighter:
      'Uses a weight lighter than the inherited weight based on typeface weight mappings.',
    bolder:
      'Uses a weight heavier than the inherited weight based on typeface weight mappings.',
  },
  'font-width': {},
  'forced-color-adjust': {},
  gap: {
    normal: 'Uses the default spacing behavior defined by the layout model.',
  },
  grid: {},
  'grid-area': {},
  'grid-auto-columns': {
    auto: 'Implicit columns size themselves based on content and layout constraints.',
  },
  'grid-auto-flow': {
    row: 'Places items by filling each row before moving to the next.',
    column: 'Places items by filling each column before moving to the next.',
    dense:
      'Allows backfilling earlier gaps in the grid if smaller items can fit.',
    'row dense':
      'Fills rows in order and attempts to fill earlier gaps when possible.',
    'column dense':
      'Fills columns in order and attempts to fill earlier gaps when possible.',
  },
  'grid-auto-rows': {
    auto: 'Implicit rows size themselves based on content and layout constraints.',
  },
  'grid-column': {
    auto: 'The item is placed according to auto-placement rules along the column axis.',
    span: 'Extends the item across a specified number of column tracks.',
  },
  'grid-column-end': {
    auto: "The item's column end line is determined by auto-placement or other layout constraints.",
    span: 'Extends the item across a specified number of column tracks from the start line.',
  },
  'grid-column-gap': {},
  'grid-column-start': {
    auto: "The item's column start line is determined by auto-placement or other layout constraints.",
    span: 'Extends the item across a specified number of column tracks from this start position.',
  },
  'grid-gap': {},
  'grid-row': {
    auto: 'The item is placed according to auto-placement rules along the row axis.',
    span: 'Extends the item across a specified number of row tracks.',
  },
  'grid-row-end': {
    auto: "The item's row end line is determined by auto-placement or other layout constraints.",
    span: 'Extends the item across a specified number of row tracks from the start line.',
  },
  'grid-row-gap': {},
  'grid-row-start': {
    auto: "The item's row start line is determined by auto-placement or other layout constraints.",
    span: 'Extends the item across a specified number of row tracks from this start position.',
  },
  'grid-template': {},
  'grid-template-areas': {
    none: 'No named grid areas are defined.',
  },
  'grid-template-columns': {
    none: 'No explicit column tracks are defined; columns are created only as needed.',
  },
  'grid-template-rows': {
    none: 'No explicit row tracks are defined; rows are created only as needed.',
  },
  'hanging-punctuation': {},
  height: {
    auto: 'Determines the size based on content and layout context.',
    'max-content':
      'Sizes the element based on its largest unbreakable content.',
    'min-content':
      'Sizes the element based on its smallest possible content size without overflow.',
    'fit-content':
      'Clamps the size between the min-content and max-content sizes.',
    stretch:
      'Expands to fill available space in layout contexts that support stretching.',
  },
  'hyphenate-character': {},
  'hyphenate-limit-chars': {},
  hyphens: {
    none: 'Prevents words from being hyphenated automatically.',
    manual: 'Allows hyphenation only where explicit hyphens exist in the text.',
    auto: 'Allows the browser to insert hyphens at appropriate break points.',
  },
  'image-orientation': {},
  'image-rendering': {
    auto: 'Uses the default image scaling algorithm.',
    smooth: 'Prefers smooth, high-quality scaling.',
    'crisp-edges':
      'Preserves sharp edges when scaling, using pixel-aligned rendering.',
    pixelated: 'Scales images by enlarging individual pixels.',
  },
  'image-resolution': {},
  'ime-mode': {},
  'initial-letter': {},
  'initial-letter-align': {},
  'inline-size': {},
  inset: {
    auto: 'No offset is applied; layout determines final position.',
  },
  'inset-block': {
    auto: 'No offset is applied; layout determines final position.',
  },
  'inset-block-end': {
    auto: 'No offset is applied; layout determines final position.',
  },
  'inset-block-start': {
    auto: 'No offset is applied; layout determines final position.',
  },
  'inset-inline': {
    auto: 'No offset is applied; layout determines final position.',
  },
  'inset-inline-end': {
    auto: 'No offset is applied; layout determines final position.',
  },
  'inset-inline-start': {
    auto: 'No offset is applied; layout determines final position.',
  },
  'interpolate-size': {},
  isolation: {},
  'justify-content': {
    normal: 'Uses the alignment behavior defined by the layout mode.',
    'space-between':
      'Distributes items with equal space between them and no space at the ends.',
    'space-around': 'Distributes items with equal space around each item.',
    'space-evenly':
      'Distributes items with equal space between and around items.',
    stretch:
      'Stretches items to fill the available space along the alignment axis.',
    unsafe: 'Allows alignment even if it may cause overflow or clipping.',
    safe: 'Prevents alignment that would cause overflow or clipping.',
    center: 'Places items at the center along the alignment axis.',
    start: 'Aligns items to the start edge of the alignment axis.',
    end: 'Aligns items to the end edge of the alignment axis.',
    'flex-start': 'Aligns items to the start edge in flex layout.',
    'flex-end': 'Aligns items to the end edge in flex layout.',
    left: 'Aligns items to the left edge in horizontal writing modes.',
    right: 'Aligns items to the right edge in horizontal writing modes.',
  },
  'justify-items': {
    normal: 'Uses the alignment behavior defined by the layout mode.',
    stretch:
      'Stretches items to fill the available space along the alignment axis.',
    baseline:
      "Aligns the item's baseline with the baseline of the alignment context.",
    unsafe: 'Allows alignment even if it may cause overflow or clipping.',
    safe: 'Prevents alignment that would cause overflow or clipping.',
    center: 'Places items at the center along the alignment axis.',
    start: 'Aligns items to the start edge of the alignment axis.',
    end: 'Aligns items to the end edge of the alignment axis.',
    'self-start':
      'Aligns the item to its own start side based on writing mode and direction.',
    'self-end':
      'Aligns the item to its own end side based on writing mode and direction.',
    'flex-start': 'Aligns items to the start edge in flex layout.',
    'flex-end': 'Aligns items to the end edge in flex layout.',
    left: 'Aligns items to the left edge in horizontal writing modes.',
    right: 'Aligns items to the right edge in horizontal writing modes.',
  },
  'justify-self': {
    normal: 'Uses the alignment behavior defined by the layout mode.',
    stretch:
      'Stretches items to fill the available space along the alignment axis.',
    baseline:
      "Aligns the item's baseline with the baseline of the alignment context.",
    unsafe: 'Allows alignment even if it may cause overflow or clipping.',
    safe: 'Prevents alignment that would cause overflow or clipping.',
    center: 'Places items at the center along the alignment axis.',
    start: 'Aligns items to the start edge of the alignment axis.',
    end: 'Aligns items to the end edge of the alignment axis.',
    'self-start':
      'Aligns the item to its own start side based on writing mode and direction.',
    'self-end':
      'Aligns the item to its own end side based on writing mode and direction.',
    'flex-start': 'Aligns items to the start edge in flex layout.',
    'flex-end': 'Aligns items to the end edge in flex layout.',
    left: 'Aligns items to the left edge in horizontal writing modes.',
    right: 'Aligns items to the right edge in horizontal writing modes.',
  },
  'justify-tracks': {
    normal: 'Uses the alignment behavior defined by the layout mode.',
    'space-between':
      'Distributes items with equal space between them and no space at the ends.',
    'space-around': 'Distributes items with equal space around each item.',
    'space-evenly':
      'Distributes items with equal space between and around items.',
    stretch:
      'Stretches items to fill the available space along the alignment axis.',
    unsafe: 'Allows alignment even if it may cause overflow or clipping.',
    safe: 'Prevents alignment that would cause overflow or clipping.',
    center: 'Places items at the center along the alignment axis.',
    start: 'Aligns items to the start edge of the alignment axis.',
    end: 'Aligns items to the end edge of the alignment axis.',
    'flex-start': 'Aligns items to the start edge in flex layout.',
    'flex-end': 'Aligns items to the end edge in flex layout.',
    left: 'Aligns items to the left edge in horizontal writing modes.',
    right: 'Aligns items to the right edge in horizontal writing modes.',
  },
  left: {
    auto: 'No offset is applied; layout determines final position.',
  },
  'letter-spacing': {
    normal: 'Uses the default spacing between letters based on the typeface.',
  },
  'lighting-color': {},
  'line-break': {
    auto: 'Allows the browser to choose the line breaking strategy based on language and context.',
    loose:
      'Applies a looser line breaking strategy, allowing more break opportunities.',
    normal: 'Uses the default line breaking rules.',
    strict:
      'Applies a stricter line breaking strategy, reducing break opportunities.',
    anywhere: 'Allows breaks at arbitrary points to prevent overflow.',
  },
  'line-clamp': {},
  'line-height': {
    normal:
      'Sets the line height to a UA-defined default based on the font size.',
  },
  'line-height-step': {},
  'list-style': {
    none: 'Removes the list marker.',
  },
  'list-style-image': {
    none: 'No image is used as the list marker.',
  },
  'list-style-position': {
    inside: 'The marker is placed inside the content box.',
    outside: 'The marker is placed outside the content box.',
  },
  'list-style-type': {
    disc: 'Displays a filled circular bullet.',
    circle: 'Displays a hollow circular bullet.',
    square: 'Displays a filled square bullet.',
    decimal: 'Displays numbers starting from 1.',
    'lower-alpha': 'Displays lowercase latin letters.',
    'upper-alpha': 'Displays uppercase latin letters.',
  },
  margin: {
    auto: 'Let the user agent calculate the margin; commonly used for centering block elements horizontally.',
  },
  'margin-block': {},
  'margin-block-end': {},
  'margin-block-start': {},
  'margin-bottom': {
    auto: 'Let the user agent calculate the margin; commonly used for centering block elements horizontally.',
  },
  'margin-inline': {},
  'margin-inline-end': {},
  'margin-inline-start': {},
  'margin-left': {
    auto: 'Let the user agent calculate the margin; commonly used for centering block elements horizontally.',
  },
  'margin-right': {
    auto: 'Let the user agent calculate the margin; commonly used for centering block elements horizontally.',
  },
  'margin-top': {
    auto: 'Let the user agent calculate the margin; commonly used for centering block elements horizontally.',
  },
  'margin-trim': {},
  marker: {},
  'marker-end': {},
  'marker-mid': {},
  'marker-start': {},
  mask: {},
  'mask-border': {},
  'mask-border-mode': {},
  'mask-border-outset': {},
  'mask-border-repeat': {},
  'mask-border-slice': {},
  'mask-border-source': {},
  'mask-border-width': {},
  'mask-clip': {
    'border-box': 'Clips the mask to the border box.',
    'padding-box': 'Clips the mask to the padding box.',
    'content-box': 'Clips the mask to the content box.',
    border: 'Clips the mask to the border area in SVG contexts.',
    stroke: "Clips the mask to the object's stroke bounding box.",
    fill: "Clips the mask to the object's fill bounding box.",
    'view-box': 'Clips the mask to the SVG viewBox.',
  },
  'mask-composite': {},
  'mask-image': {},
  'mask-mode': {
    alpha: 'Interprets the mask using the alpha channel.',
    luminance: 'Interprets the mask using luminance values.',
    'match-source': 'Uses the mask mode that matches the source image type.',
  },
  'mask-origin': {
    'border-box': 'Positions the mask relative to the border box.',
    'padding-box': 'Positions the mask relative to the padding box.',
    'content-box': 'Positions the mask relative to the content box.',
  },
  'mask-position': {},
  'mask-repeat': {},
  'mask-size': {},
  'mask-type': {
    luminance: 'Uses luminance to determine mask transparency.',
    alpha: 'Uses alpha values to determine mask transparency.',
  },
  'masonry-auto-flow': {},
  'math-depth': {},
  'math-shift': {},
  'math-style': {},
  'max-block-size': {},
  'max-height': {
    auto: 'Determines the size based on content and layout context.',
    'max-content':
      'Sizes the element based on its largest unbreakable content.',
    'min-content':
      'Sizes the element based on its smallest possible content size without overflow.',
    'fit-content':
      'Clamps the size between the min-content and max-content sizes.',
    stretch:
      'Expands to fill available space in layout contexts that support stretching.',
  },
  'max-inline-size': {},
  'max-lines': {},
  'max-width': {
    auto: 'Determines the size based on content and layout context.',
    'max-content':
      'Sizes the element based on its largest unbreakable content.',
    'min-content':
      'Sizes the element based on its smallest possible content size without overflow.',
    'fit-content':
      'Clamps the size between the min-content and max-content sizes.',
    stretch:
      'Expands to fill available space in layout contexts that support stretching.',
  },
  'min-block-size': {},
  'min-height': {
    auto: 'Determines the size based on content and layout context.',
    'max-content':
      'Sizes the element based on its largest unbreakable content.',
    'min-content':
      'Sizes the element based on its smallest possible content size without overflow.',
    'fit-content':
      'Clamps the size between the min-content and max-content sizes.',
    stretch:
      'Expands to fill available space in layout contexts that support stretching.',
  },
  'min-inline-size': {},
  'min-width': {
    auto: 'Determines the size based on content and layout context.',
    'max-content':
      'Sizes the element based on its largest unbreakable content.',
    'min-content':
      'Sizes the element based on its smallest possible content size without overflow.',
    'fit-content':
      'Clamps the size between the min-content and max-content sizes.',
    stretch:
      'Expands to fill available space in layout contexts that support stretching.',
  },
  'mix-blend-mode': {
    normal: 'No blending; the element is drawn normally.',
    multiply:
      'Multiplies backdrop and source colors, resulting in darker colors.',
    screen:
      'Inverts, multiplies, and inverts again; results in a lighter effect.',
    overlay:
      'Combines multiply and screen modes to preserve highlights and shadows.',
    darken: 'Selects the darker of backdrop and source colors.',
    lighten: 'Selects the lighter of backdrop and source colors.',
    'color-dodge': 'Brightens the backdrop to reflect the source.',
    'color-burn': 'Darkens the backdrop to reflect the source.',
    'hard-light': 'Multiplies or screens colors depending on source lightness.',
    'soft-light': 'Applies a subtle lighting effect often used for shading.',
    difference: 'Subtracts darker colors from lighter ones to create contrast.',
    exclusion: 'Similar to difference but with lower contrast.',
    hue: 'Preserves luminance and saturation of backdrop while adopting hue of source.',
    saturation:
      'Preserves luminance and hue of backdrop while adopting saturation of source.',
    color: 'Preserves luminance while adopting hue and saturation of source.',
    luminosity:
      'Preserves hue and saturation while adopting luminance of source.',
    'plus-lighter':
      'Lightens the backdrop by adding color values from the source.',
  },
  'object-fit': {
    fill: 'Stretches the replaced element to fill the content box, ignoring aspect ratio.',
    contain:
      'Scales the replaced element to fit within the content box while preserving aspect ratio.',
    cover:
      'Scales the replaced element to cover the content box while preserving aspect ratio; parts may be clipped.',
    none: 'Preserves intrinsic size; no scaling applied.',
    'scale-down':
      'Behaves as either none or contain, whichever results in a smaller object size.',
  },
  'object-position': {},
  'object-view-box': {},
  offset: {},
  'offset-anchor': {},
  'offset-distance': {},
  'offset-path': {},
  'offset-position': {},
  'offset-rotate': {},
  opacity: {},
  order: {
    '0': 'Uses the default ordering based on document source order.',
  },
  orphans: {},
  outline: {
    auto: 'Allows the user agent to determine an appropriate outline representation.',
    none: 'Disables the outline.',
  },
  'outline-color': {
    currentColor: "Uses the element's current text color for the outline.",
  },
  'outline-offset': {},
  'outline-style': {
    auto: 'Allows the user agent to determine an appropriate outline style.',
    none: 'No outline is drawn.',
    solid: 'Draws a single continuous line as the outline.',
    dotted: 'Draws a dotted line as the outline.',
    dashed: 'Draws a dashed line as the outline.',
    double: 'Draws two parallel lines as the outline.',
    groove: 'Draws a carved (3D grooved) outline.',
    ridge: 'Draws a raised (3D ridged) outline.',
    inset: 'Draws the outline as if embedded into the surface.',
    outset: 'Draws the outline as if coming out of the surface.',
  },
  'outline-width': {
    thin: 'Uses a thin outline width.',
    medium: 'Uses the default medium outline width.',
    thick: 'Uses a thick outline width.',
  },
  overflow: {
    visible:
      "Content is not clipped and may render outside the element's box in the normal flow.",
    hidden:
      "Content that overflows the element's box is clipped and not scrollable.",
    clip: "Content is clipped to the element's box without providing scroll functionality.",
    scroll:
      "Content is clipped to the element's box and scrollbars are always shown, even if not needed.",
    auto: "Content is clipped to the element's box and scrollbars are shown only if necessary.",
  },
  'overflow-anchor': {
    auto: 'Scroll anchoring is enabled to reduce visible layout shifts.',
    none: 'Disables scroll anchoring for the element.',
  },
  'overflow-block': {
    visible: 'Allows overflow to extend beyond the block axis boundary.',
    hidden: 'Clips overflow content along the block axis.',
    scroll: 'Provides scrolling along the block axis even if unnecessary.',
    auto: 'Allows scrolling along the block axis when needed.',
  },
  'overflow-clip-box': {
    'padding-box': 'Overflow clipping uses the padding box as the boundary.',
    'content-box': 'Overflow clipping uses the content box as the boundary.',
  },
  'overflow-clip-margin': {
    'content-box': 'Overflow clipping margin is measured from the content box.',
    'padding-box': 'Overflow clipping margin is measured from the padding box.',
    'border-box': 'Overflow clipping margin is measured from the border box.',
  },
  'overflow-inline': {
    visible: 'Allows overflow to extend beyond the inline axis boundary.',
    hidden: 'Clips overflow content along the inline axis.',
    scroll: 'Provides scrolling along the inline axis even if unnecessary.',
    auto: 'Allows scrolling along the inline axis when needed.',
  },
  'overflow-wrap': {
    normal: 'Lines break only at allowed break points.',
    anywhere: 'Lines may break at any point if necessary.',
    'break-word': 'Allows unbreakable words to be broken to prevent overflow.',
  },
  'overflow-x': {
    visible:
      "Content is not clipped and may render outside the element's box in the normal flow.",
    hidden:
      "Content that overflows the element's box is clipped and not scrollable.",
    clip: "Content is clipped to the element's box without providing scroll functionality.",
    scroll:
      "Content is clipped to the element's box and scrollbars are always shown, even if not needed.",
    auto: "Content is clipped to the element's box and scrollbars are shown only if necessary.",
  },
  'overflow-y': {
    visible:
      "Content is not clipped and may render outside the element's box in the normal flow.",
    hidden:
      "Content that overflows the element's box is clipped and not scrollable.",
    clip: "Content is clipped to the element's box without providing scroll functionality.",
    scroll:
      "Content is clipped to the element's box and scrollbars are always shown, even if not needed.",
    auto: "Content is clipped to the element's box and scrollbars are shown only if necessary.",
  },
  overlay: {},
  'overscroll-behavior': {},
  'overscroll-behavior-block': {},
  'overscroll-behavior-inline': {},
  'overscroll-behavior-x': {},
  'overscroll-behavior-y': {},
  padding: {},
  'padding-block': {},
  'padding-block-end': {},
  'padding-block-start': {},
  'padding-bottom': {},
  'padding-inline': {},
  'padding-inline-end': {},
  'padding-inline-start': {},
  'padding-left': {},
  'padding-right': {},
  'padding-top': {},
  page: {},
  'page-break-after': {},
  'page-break-before': {},
  'page-break-inside': {},
  'paint-order': {
    normal:
      'Uses the default rendering order: fill, then stroke, then markers.',
    fill: 'Renders fill before stroke and markers.',
    stroke: 'Renders stroke before fill and markers.',
    markers: 'Renders markers before fill and stroke.',
  },
  perspective: {},
  'perspective-origin': {},
  'place-content': {
    '<align-content> <justify-content>':
      'Sets alignment of grid tracks along both the block axis and inline axis.',
  },
  'place-items': {
    '<align-items> <justify-items>':
      'Sets alignment of items along both the block axis and inline axis.',
  },
  'place-self': {
    '<align-self> <justify-self>':
      'Overrides both block-axis and inline-axis alignment for this item only.',
  },
  'pointer-events': {},
  position: {
    static: 'Element participates in normal flow without offset positioning.',
    relative:
      'Element remains in normal flow but may be shifted relative to its normal position using inset properties.',
    absolute:
      'Element is removed from normal flow and positioned relative to its nearest positioned ancestor or the initial containing block.',
    fixed:
      'Element is removed from normal flow and positioned relative to the viewport.',
    sticky:
      'Element behaves as relative until a scroll threshold is passed, then behaves as fixed.',
  },
  'position-anchor': {},
  'position-area': {},
  'position-try': {},
  'position-try-fallbacks': {},
  'position-try-order': {},
  'position-visibility': {},
  'print-color-adjust': {},
  quotes: {},
  r: {},
  resize: {},
  right: {
    auto: 'No offset is applied; layout determines final position.',
  },
  rotate: {},
  'row-gap': {
    normal: 'Uses layout-defined spacing between rows.',
  },
  'ruby-align': {},
  'ruby-merge': {},
  'ruby-overhang': {},
  'ruby-position': {},
  rx: {},
  ry: {},
  scale: {},
  'scroll-behavior': {},
  'scroll-initial-target': {},
  'scroll-margin': {},
  'scroll-margin-block': {},
  'scroll-margin-block-end': {},
  'scroll-margin-block-start': {},
  'scroll-margin-bottom': {},
  'scroll-margin-inline': {},
  'scroll-margin-inline-end': {},
  'scroll-margin-inline-start': {},
  'scroll-margin-left': {},
  'scroll-margin-right': {},
  'scroll-margin-top': {},
  'scroll-padding': {},
  'scroll-padding-block': {},
  'scroll-padding-block-end': {},
  'scroll-padding-block-start': {},
  'scroll-padding-bottom': {},
  'scroll-padding-inline': {},
  'scroll-padding-inline-end': {},
  'scroll-padding-inline-start': {},
  'scroll-padding-left': {},
  'scroll-padding-right': {},
  'scroll-padding-top': {},
  'scroll-snap-align': {},
  'scroll-snap-coordinate': {},
  'scroll-snap-destination': {},
  'scroll-snap-points-x': {},
  'scroll-snap-points-y': {},
  'scroll-snap-stop': {},
  'scroll-snap-type': {},
  'scroll-snap-type-x': {},
  'scroll-snap-type-y': {},
  'scroll-timeline': {},
  'scroll-timeline-axis': {},
  'scroll-timeline-name': {},
  'scrollbar-color': {},
  'scrollbar-gutter': {},
  'scrollbar-width': {},
  'shape-image-threshold': {},
  'shape-margin': {},
  'shape-outside': {},
  'shape-rendering': {},
  'speak-as': {},
  'stop-color': {},
  'stop-opacity': {},
  stroke: {},
  'stroke-color': {},
  'stroke-dasharray': {},
  'stroke-dashoffset': {},
  'stroke-linecap': {
    butt: 'Ends the stroke exactly at the endpoint with no extension.',
    round:
      'Adds a semicircular end to the stroke extending beyond the endpoint.',
    square: 'Adds a square end to the stroke extending beyond the endpoint.',
  },
  'stroke-linejoin': {
    miter:
      'Joins stroke segments with a sharp corner extended to a miter point.',
    round: 'Joins stroke segments with a rounded corner.',
    bevel: 'Joins stroke segments with a flattened corner.',
  },
  'stroke-miterlimit': {},
  'stroke-opacity': {},
  'stroke-width': {},
  'tab-size': {},
  'table-layout': {},
  'text-align': {
    start: 'Aligns text to the start of the inline axis.',
    end: 'Aligns text to the end of the inline axis.',
    left: 'Aligns text to the left side of the line box.',
    right: 'Aligns text to the right side of the line box.',
    center: 'Aligns text to the center of the line box.',
    justify:
      'Expands spacing between inline items so lines align along both start and end edges.',
  },
  'text-align-last': {},
  'text-anchor': {},
  'text-box': {},
  'text-box-edge': {},
  'text-box-trim': {},
  'text-combine-upright': {},
  'text-decoration': {
    none: 'No text decoration is applied.',
    underline: 'Draws a line beneath the text.',
    overline: 'Draws a line above the text.',
    'line-through': 'Draws a line through the text.',
  },
  'text-decoration-color': {
    currentColor: "Uses the element's current text color for the decoration.",
  },
  'text-decoration-line': {
    none: 'No text decoration line is drawn.',
    underline: 'Draws a line beneath the text.',
    overline: 'Draws a line above the text.',
    'line-through': 'Draws a line through the text.',
  },
  'text-decoration-skip': {},
  'text-decoration-skip-ink': {},
  'text-decoration-style': {
    solid: 'Draws a single continuous line.',
    double: 'Draws two parallel lines.',
    dotted: 'Draws a dotted line.',
    dashed: 'Draws a dashed line.',
    wavy: 'Draws a wavy line.',
  },
  'text-decoration-thickness': {
    auto: 'Determines thickness automatically based on font metrics.',
    'from-font':
      "Uses the thickness specified in the font's metrics when available.",
  },
  'text-emphasis': {},
  'text-emphasis-color': {},
  'text-emphasis-position': {},
  'text-emphasis-style': {},
  'text-indent': {},
  'text-justify': {
    auto: 'Allows the browser to choose the justification algorithm.',
    'inter-word': 'Adjusts spacing between words to justify text.',
    'inter-character': 'Adjusts spacing between characters to justify text.',
    none: 'Disables justification adjustments.',
  },
  'text-orientation': {
    mixed: 'Combines upright and rotated glyphs depending on character type.',
    upright: 'Displays all characters upright, without rotation.',
    sideways: 'Displays characters rotated as if rotated sideways.',
  },
  'text-overflow': {
    clip: 'Truncates text at the content edge without adding an indicator.',
    ellipsis: 'Displays an ellipsis (\u2026) to indicate clipped text.',
  },
  'text-rendering': {
    auto: 'Lets the browser choose an appropriate text rendering strategy.',
    optimizeSpeed: 'Prioritizes rendering speed over legibility.',
    optimizeLegibility:
      'Prioritizes legibility, enabling advanced glyph shaping when available.',
    geometricPrecision: 'Prioritizes precise glyph geometry over speed.',
  },
  'text-shadow': {},
  'text-size-adjust': {
    auto: 'Allows the browser to adjust text size for readability.',
    none: 'Prevents automatic text size adjustment.',
  },
  'text-spacing-trim': {},
  'text-transform': {
    none: 'No capitalization transformation is applied.',
    capitalize: 'Transforms the first character of each word to uppercase.',
    uppercase: 'Transforms all characters to uppercase.',
    lowercase: 'Transforms all characters to lowercase.',
    'full-width': 'Transforms characters to their full-width forms.',
    'full-size-kana':
      'Transforms small kana characters to their full-size forms.',
  },
  'text-underline-offset': {},
  'text-underline-position': {},
  'text-wrap': {
    wrap: 'Allows text to wrap normally.',
    nowrap: 'Prevents text from wrapping.',
    balance: 'Balances line length to improve visual appearance.',
  },
  'text-wrap-mode': {},
  'text-wrap-style': {},
  'timeline-scope': {},
  top: {
    auto: 'No offset is applied; layout determines final position.',
  },
  'touch-action': {},
  transform: {
    none: 'Applies no transform; element remains in its original position and size.',
    'translate()': 'Moves the element along the X/Y (and optionally Z) axes.',
    'scale()': 'Scales the element in the X/Y (and optionally Z) dimensions.',
    'rotate()': 'Rotates the element by a specified angle.',
    'skew()': 'Skews the element along one or both axes.',
    'matrix()': 'Defines a 2D transformation using a transformation matrix.',
    'matrix3d()': 'Defines a 3D transformation using a 4x4 matrix.',
  },
  'transform-box': {},
  'transform-origin': {
    center: 'Sets the origin for transforms to the center of the element.',
    top: 'Sets the origin for transforms to the top edge of the element.',
    bottom: 'Sets the origin for transforms to the bottom edge of the element.',
    left: 'Sets the origin for transforms to the left edge of the element.',
    right: 'Sets the origin for transforms to the right edge of the element.',
  },
  'transform-style': {},
  transition: {},
  'transition-behavior': {},
  'transition-delay': {},
  'transition-duration': {},
  'transition-property': {
    none: 'No properties are transitioned.',
    all: 'All animatable properties are transitioned.',
  },
  'transition-timing-function': {
    ease: 'Starts slow, speeds up, then slows down toward the end (cubic-bezier(0.25, 0.1, 0.25, 1)).',
    linear: 'A constant speed transition.',
    'ease-in': 'Starts slowly and accelerates (cubic-bezier(0.42, 0, 1, 1)).',
    'ease-out': 'Starts quickly and decelerates (cubic-bezier(0, 0, 0.58, 1)).',
    'ease-in-out': 'Combines ease-in and ease-out behavior.',
    'step-start':
      'Jumps to the end value at the beginning of the transition (a single step).',
    'step-end':
      'Remains at the start value until the end of the transition (a single step).',
    'steps()':
      'Defines a stepped timing function with a specified number of intervals.',
    'cubic-bezier()':
      'Defines a custom cubic-bezier timing function using control points.',
  },
  translate: {},
  'unicode-bidi': {},
  'user-select': {},
  'vector-effect': {
    none: 'The stroke scales and transforms normally with the element.',
    'non-scaling-stroke':
      'The stroke width remains constant even when the element is scaled.',
    'non-scaling-size':
      'The entire element maintains constant sizing during scaling transforms.',
    'non-rotation':
      'Prevents rotation effects from being applied during transforms.',
    'fixed-position':
      'Renders the element as if fixed to the screen coordinate system.',
  },
  'vertical-align': {
    baseline:
      'Aligns the baseline of the element with the baseline of its parent.',
    sub: 'Aligns the element as subscript text below the baseline.',
    super: 'Aligns the element as superscript text above the baseline.',
    'text-top':
      "Aligns the top of the element with the top of the parent's font metrics box.",
    'text-bottom':
      "Aligns the bottom of the element with the bottom of the parent's font metrics box.",
    middle:
      "Aligns the midpoint of the element with half the x-height above the parent's baseline.",
    top: 'Aligns the top of the element with the top of the tallest element on the line.',
    bottom:
      'Aligns the bottom of the element with the bottom of the lowest element on the line.',
  },
  'view-timeline': {},
  'view-timeline-axis': {},
  'view-timeline-inset': {},
  'view-timeline-name': {},
  'view-transition-class': {},
  'view-transition-name': {},
  visibility: {
    visible: 'The element is visible and participates in layout and rendering.',
    hidden: 'The element is invisible but still occupies layout space.',
    collapse:
      'For table elements, removes the row/column and frees the space; otherwise behaves like hidden.',
  },
  'white-space': {
    normal: 'Collapses whitespace and wraps lines as needed.',
    nowrap: 'Collapses whitespace but prevents line wrapping.',
    pre: 'Preserves whitespace and prevents line wrapping.',
    'pre-wrap': 'Preserves whitespace and wraps lines as needed.',
    'pre-line':
      'Collapses sequences of spaces but preserves line breaks, wrapping when necessary.',
    'break-spaces':
      'Preserves spaces, wraps at any space, and allows spaces at line ends.',
  },
  'white-space-collapse': {},
  widows: {},
  width: {
    auto: 'Determines the size based on content and layout context.',
    'max-content':
      'Sizes the element based on its largest unbreakable content.',
    'min-content':
      'Sizes the element based on its smallest possible content size without overflow.',
    'fit-content':
      'Clamps the size between the min-content and max-content sizes.',
    stretch:
      'Expands to fill available space in layout contexts that support stretching.',
  },
  'will-change': {},
  'word-break': {
    normal: 'Uses standard line break rules based on the writing system.',
    'break-all':
      'Allows line breaks between any characters to prevent overflow.',
    'keep-all':
      'Prevents breaking within words in CJK text, keeping characters grouped together.',
  },
  'word-spacing': {
    normal: 'Uses the default spacing between words based on the typeface.',
  },
  'word-wrap': {
    normal: 'Lines break only at allowed break points.',
    'break-word': 'Allows unbreakable words to be broken to prevent overflow.',
    anywhere: 'Lines may break anywhere if needed to prevent overflow.',
  },
  'writing-mode': {
    'horizontal-tb':
      'Text is laid out horizontally, progressing from top to bottom.',
    'vertical-rl':
      'Text is laid out vertically, progressing from right to left.',
    'vertical-lr':
      'Text is laid out vertically, progressing from left to right.',
  },
  x: {},
  y: {},
  'z-index': {
    auto: 'Element participates in the stacking context determined by its parent and painting order.',
  },
  zoom: {},
}
