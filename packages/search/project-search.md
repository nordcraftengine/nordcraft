# Nordcraft Project Search Syntax (`@nordcraft/search`)

This document is the source of truth for the query syntax supported by `@nordcraft/search` (`findSearch`, `createSearchRules`, `parseSearchQuery`).

Queries are plain strings that can combine **freetext**, **reference lookups (`@...`)**, **DOM/Component node selectors (`<...>`)**, **scope filters (`in:...`)**, **entity type filters (`is:...`)**, and **negation (`-...`)**.

---

## 1. Segment Matching Modes (Prefix, Exact, Wildcard, Regex)

Every segment inside `@<kind>:...`, `in:...`, and `<component:...>` supports four matching modes (case-insensitive by default):

| Mode | Syntax | Behavior | Examples |
| :--- | :--- | :--- | :--- |
| **Prefix (Default)** | `value` *(unquoted)* | Matches any target **starting with** `value`. Ideal for typing interactively in the search bar. | `@component:ui-` *(matches `ui-button`, `ui-card`)*<br>`@var:is` *(matches `isOpen`, `isLoading`)* |
| **Exact** | `"value"` *(quoted)* | Matches **only** targets equal to `value`. Recommended for programmatic **"Show references"** context-menu actions to avoid prefix collisions (e.g. `"Broadcaster"` vs. `"Broadcaster old"`). | `@component:"ui-"` *(matches only `ui-`)*<br>`@workflow:"Broadcaster"/"Emit event"` |
| **Wildcard** | `*value*`, `*`, `a*b` | `*` matches zero or more characters anywhere in the segment. Use `*` alone to match **all** references of that kind. | `@component:*button*` *(matches `PrimaryButton`, `my-button-lg`)*<br>`@event:*` *(matches all event references)*<br>`@workflow:"Broadcaster"/*` |
| **Regex** | `/<pattern>/<flags>` | Matches the segment against a JavaScript regular expression. | `@component:/^ui-(btn\|card)$/` |

---

## 2. Reference Search (`@` / `ref:`) — Editor "Show References"

Use `@<kind>:<target>` (or `ref:<kind>:<target>`) to find all references to a specific entity across the project.
- Hierarchy segments are separated by `/`.
- Both **display names** (`value.name`) and **internal keys** are resolved automatically.
- For editor **"Show references"** context menus, quote each segment (`@<kind>:"<Owner>"/"<Target>"`) to guarantee exact matching.

| Target Entity | Syntax | Aliases | What It Matches | Examples |
| :--- | :--- | :--- | :--- | :--- |
| **Component** | `@component:<Component>`<br>`@component:<Package>/<Component>` | `ref:component:...` | All `<Component>` instance nodes (`component-node`) and context provider subscriptions (`component-context`). | `@component:"Button"`<br>`@component:ui-`<br>`@component:*button*`<br>`@component:"ui"/"Modal"`<br>`@component:*` |
| **Project Formula** | `@formula:/<Formula>`<br>`@formula:<Formula>` | `ref:formula:...` | All `function` formula calls to the global project formula. Leading `/` forces project-only scope when a component formula shares the same name. | `@formula:/"formatDate"`<br>`@formula:format`<br>`@formula:/*` |
| **Package Formula** | `@formula:<Package>/<Formula>` | `ref:formula:...` | All `function` formula calls to the exported package formula. | `@formula:"ui"/"clamp"`<br>`@formula:ui/*` |
| **Component Formula** | `@formula:<Component>/<Formula>`<br>`@formula:<Package>/<Component>/<Formula>` | `ref:formula:...` | Internal `apply` formula calls inside `<Component>`, external `component-context` subscriptions, and `Contexts.<Component>.<Formula>` path formulas. | `@formula:"Broadcaster"/"activeChannel"`<br>`@formula:Header/*`<br>`@formula:"ui"/"PkgBadge"/"badgeCount"` |
| **Component Workflow** | `@workflow:<Component>/<Workflow>`<br>`@workflow:<Package>/<Component>/<Workflow>`<br>`@workflow:<Workflow>` | `ref:workflow:...` | Internal `TriggerWorkflow` actions inside `<Component>`, external `component-context` subscriptions, and external context `TriggerWorkflow` actions. | `@workflow:"Broadcaster"/"Emit event"`<br>`@workflow:"ui"/"PkgBadge"/"Reset badge"`<br>`@workflow:*` |
| **Workflow Parameter** | `@workflow-param:<Component>/<Workflow>/<Param>`<br>`@workflow-param:<Workflow>/<Param>` | `ref:workflow-param:...` | `Parameters.<Param>` path formulas inside the workflow and `TriggerWorkflow` actions passing `<Param>`. | `@workflow-param:"Broadcaster"/"Emit event"/"payload"`<br>`@workflow-param:*/*/*` |
| **Context (External Only)** | `@context:<Component>`<br>`@context:<Component>/<Member>`<br>`@context:<Package>/<Component>/<Member>` | `ref:context:...` | External `component-context` subscriptions, `Contexts.<Component>.*` formula paths, and external `TriggerWorkflow` context calls (excludes internal self-calls). | `@context:"Broadcaster"`<br>`@context:"Broadcaster"/"Emit event"`<br>`@context:"Broadcaster"/"activeChannel"`<br>`@context:*` |
| **Project / Custom / Built-in Action** | `@action:<Action>`<br>`@action:/<Action>`<br>`@action:<Package>/<Action>` | `ref:action:...` | Workflow `action-model` nodes invoking the project action, package action, or built-in action (`Fetch`, `SetVariable`, `TriggerEvent`, etc.). | `@action:"TrackEvent"`<br>`@action:"ui"/"pkgLog"`<br>`@action:Fetch`<br>`@action:*` |
| **Component Variable** | `@var:<Component>/<Variable>`<br>`@var:<Variable>` | `@variable:...` | `Variables.<Variable>` path formulas and `SetVariable` actions. | `@var:"ConsumerPage"/"isOpen"`<br>`@var:is*`<br>`@var:*` |
| **Component Attribute** | `@attr:<Component>/<Attribute>`<br>`@attr:<Package>/<Component>/<Attribute>`<br>`@attr:<Attribute>` | `@attribute:...` | Internal `Attributes.<Attribute>` path formulas inside `<Component>` and `<Attribute>` bindings on component instances (`component-node-attribute`). | `@attr:"Broadcaster"/"channelId"`<br>`@attr:"ui"/"PkgBadge"/"tone"`<br>`@attr:*` |
| **Component / DOM Event** | `@event:<Component>/<Event>`<br>`@event:<Package>/<Component>/<Event>`<br>`@event:<Event>` | `ref:event:...` | Internal `TriggerEvent` actions inside `<Component>` and event listeners attached to component/element nodes. | `@event:"Broadcaster"/"broadcasted"`<br>`@event:click`<br>`@event:*` |
| **Component API** | `@api:<Component>/<Api>`<br>`@api:<Api>` | `ref:api:...` | `Apis.<Api>` path formulas and `Fetch` / `AbortFetch` actions targeting `<Api>`. | `@api:"ConsumerPage"/"usersApi"`<br>`@api:*` |
| **API Service** | `@service:<Service>` | `@api-service:...` | All `component-api` definitions configured to use `<Service>`. | `@service:"Supabase"`<br>`@service:*` |
| **URL Parameter** | `@url-param:<Component>/<Param>`<br>`@url-param:<Param>` | `@param:...` | `URL parameters.<Param>` and `Route parameters.*.<Param>` path formulas, plus `SetURLParameter` / `SetURLParameters` actions. | `@url-param:"ConsumerPage"/"tab"`<br>`@url-param:*` |
| **Slot** | `@slot:<Component>/<Slot>`<br>`@slot:<Package>/<Component>/<Slot>`<br>`@slot:<Slot>` | `ref:slot:...` | The `<slot>` node definition inside `<Component>` and all child nodes assigned to `slot="<Slot>"` inside `<Component>` instances. | `@slot:"Broadcaster"/"header"`<br>`@slot:"Broadcaster"/"default"`<br>`@slot:*` |
| **CSS Custom Property / Theme Variable** | `@css:<--name>` | `@theme:...`<br>`@style-var:...` | Style declarations referencing `var(--name)`, `custom-property` overrides, and theme property definitions referencing `var(--name)`. | `@css:"--primary-color"`<br>`@css:--primary`<br>`@css:*color*`<br>`@css:*` |
| **Package** | `@package:<Package>` | `ref:package:...` | All component instances, context subscriptions, formula calls, and custom actions from `<Package>`. | `@package:"ui"`<br>`@package:*` |

---

## 3. Node Selector Search (`<...>`)

Wrap CSS-like selectors in `<...>` to query `component-node` elements, component instances, slots, and text nodes.

| Feature | Syntax | Description | Examples |
| :--- | :--- | :--- | :--- |
| **Element Tag** | `<<tag>>`<br>`<element:<tag>>` | Matches HTML/SVG element nodes by exact tag name or `*` wildcard. | `<div>`<br>`<button>`<br>`<h*>`<br>`<element:svg>` |
| **Component Instance** | `<<PascalName>>`<br>`<<Package>/<Component>>`<br>`<component:<Component>>` | Matches component instance nodes by component name (supports prefix, exact `"..."`, and `*` wildcard via `<component:...>`). | `<Button>`<br>`<ui/Card>`<br>`<component:ui->`<br>`<component:"My Modal">`<br>`<component:*button*>` |
| **Slot / Text Node** | `<slot>`<br>`<text>` | Matches `slot` or `text` nodes. | `<slot>`<br>`<slot[name="header"]>`<br>`<text>` |
| **ID Selector** | `<#<id>>` | Matches nodes where `attrs.id` is static `<id>` or `node.id === <id>` (supports `*` wildcards). | `<#hero>`<br>`<div#main-*>` |
| **Class Selector** | `<.<class1>.<class2>>` | Matches element nodes having all specified classes in `node.classes` or static `attrs.class` (supports `*` wildcards). | `<.btn>`<br>`<.card.primary>`<br>`<button.btn-*>` |
| **Attribute Existence** | `<[<attr>]>` | Matches nodes where `attrs.<attr>` is defined. | `<img[alt]>`<br>`<input[disabled]>` |
| **Attribute Comparison** | `<[<attr>=<val>]>`<br>`<[<attr>*=<val>]>`<br>`<[<attr>^=<val>]>`<br>`<[<attr>$=<val>]>`<br>`<[<attr>=/<regex>/flags]>` | Matches static `attrs.<attr>` values by exact (`=`), substring (`*=`), prefix (`^=`), suffix (`$=`), or regex (`/.../`). | `<a[target="_blank"]>`<br>`<a[href*="/blog"]>`<br>`<img[src^="/assets"][src$=".png"]>`<br>`<Button[variant="danger"]>` |
| **Style Property** | `<[style:<prop>]>`<br>`<[style:<prop><op><val>]>` | Matches inline `node.style` or `node.variants[].style` declarations. | `<[style:display=flex]>`<br>`<[style:color*="--primary"]>` |
| **Event Listener** | `<[event:<trigger>]>` | Matches element or component nodes with an event handler for `<trigger>`. | `<[event:click]>`<br>`<Button[event:broadcasted]>` |
| **Assigned Slot** | `<[slot=<name>]>` | Matches nodes assigned to a specific parent slot. | `<[slot="header"]>`<br>`<span[slot=footer]>` |

---

## 4. Scope (`in:`), Entity Type (`is:` / `type:`), and Negation (`-`)

| Qualifier | Syntax | Description | Examples |
| :--- | :--- | :--- | :--- |
| **Component Scope** | `in:<Component>`<br>`in:components/<Component>` | Restricts matches to components matching `<Component>` (supports prefix, `"exact"`, and `*` wildcards). | `in:Header <button>`<br>`in:"Broadcaster" is:workflow`<br>`in:*Page <img>` |
| **Collection Scope** | `in:<collection>`<br>`in:<collection>/<item>` | Restricts matches to `components`, `formulas`, `actions`, `services`, `routes`, `themes`, `packages`, or `config`. | `in:formulas`<br>`in:packages/ui`<br>`in:themes/Default` |
| **Entity Type Filter** | `is:<type>`<br>`type:<type>` | Restricts matches to a specific node type or alias (`page`, `component`, `element`, `component-instance`, `slot`, `text`, `node`, `formula`, `component-formula`, `project-formula`, `workflow`, `action`, `project-action`, `variable`, `attribute`, `event`, `api`, `service`, `route`, `theme`, `package`, `style`, `variant`, `animation`, `custom-property`, `context`). | `is:page`<br>`is:formula "localStorage"`<br>`is:workflow "Emit"`<br>`type:style` |
| **Negation** | `-<token>` | Excludes nodes matching `<token>`. Works on `<selectors>`, `in:`, `is:`, `@references`, and `"freetext"`. | `<img> -<[alt]>`<br>`@component:Button -in:TestPage`<br>`is:formula "user" -"admin"` |

---

## 5. Freetext, Regex, and Hybrid Queries

Any input that does not match a structured token automatically falls back to freetext search.

| Mode | Syntax | Description | Examples |
| :--- | :--- | :--- | :--- |
| **Substring Freetext** | `some text` | Case-insensitive substring match across node fields and array paths. | `Submit order`<br>`Variables, isOpen`<br>`@nordcraft/metadata` |
| **Exact Freetext** | `"some text"` | Case-insensitive exact match on field values (also acts as an escape hatch for literal strings like `"<div>"`). | `"myFormula"`<br>`"Submit order"`<br>`"<div>"` |
| **Regular Expression** | `/<pattern>/<flags>` | Regular expression match (case-sensitive by default; add `i` flag for case-insensitive). | `/myFormula/`<br>`/some string/i`<br>`/value.*person/` |
| **Selector + Child Text** | `<<selector>> "<text>"` | Matches element or component nodes that satisfy `<selector>` and contain `<text>` in their fields or immediate child text nodes. | `<button.cta> "Submit order"`<br>`in:Header <a> Pricing` |
