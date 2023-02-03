// This is TypeScript

export type AccessibilityTreeNode = [number, string, string, AccessibilityTree[]?]
export type AccessibleImg = ["img", string] // [tag, alt]
export type AccessibilityTree = AccessibilityTreeNode | AccessibleImg | string

export type BrowserCommand = {
    index: number // index usually of combobox search field
    params: string[] // params indicate text to put into box
}

export type GptSummary = {
    result: string;
}

export type GptResponse = BrowserCommand | GptSummary

export type BrowserState = {
    objective: string, // an objective set by user that browserNextDecision is trying to achieve
    url: string,
    ariaTreeJSON: string, //JSON of AccessibilityTree in format [index, role, name, [children]]
    browserError?: {
        error: string // error that occurred during interaction with browser
        lastCommand?: BrowserCommand // last command that was issued to browser
    }
}

/** Function that controls the browser
  @returns the next command to issue to the browser
*/
function browserNextDecision(input:BrowserState):BrowserCommand {
    throw new Error("TODO")
}

/*
Following contains inputs and expected outputs for the browserNext function
Your code must obey the following constraints:
1. only write valid code
2. returnBrowserCommandJSON must be derived from input ariaTreeJSON in same session block
3. Do not reuse info from other session blocks
4. Do not solve objectives yourself, only let ariaTreeJSON guide you
*/
let google_page = `[0,"RootWebArea","Google",[[1,"link","Gmail"],[2,"link","Images"],[3,"button","Google apps"],[4,"link","Sign in"],["img","Google"],[5,"combobox","Search"]`
let session1 = {
    input: {
        objective: "how much is an gadget 11 pro",
        url: "https://www.google.com/",
        ariaTreeJSON: google_page
    },
    returnBrowserCommandJSON: {"index": 5, "params": ["gadget 11 pro price"]}
}

let session2 = {
    input: {
        objective: "how much is an gadget 11 pro",
        url: "https://www.google.com/search",
        ariaTreeJSON: `[0,"RootWebArea","gadget 99 MAX - Google Search",[[1,"heading","Accessibility Links"],[2,"link","Skip to main content"],[3,"link","Switch to page by page results"],[4,"link","Accessibility help"],[5,"link","Accessibility feedback"],[6,"link","Google"],[7,"combobox","Search"],[8,"button"," Clear"],[9,"button","Search by voice"],[10,"button","Search by image"],[11,"button","Search"],[12,"button","Settings"],[13,"button","Google apps"],[14,"link","Sign in"],[15,"heading","Search Modes"],"All",[16,"link","Shopping"],[17,"link","Images"],[18,"link","News"],[19,"link","Videos"],[20,"button","More"],[21,"button","Tools"],"About 242,000,000 results"," (0.70 seconds) ",[22,"heading","Ads"],[23,"heading","Ads·Shop gadget 99 MAX"],[24,"button","Why this ad?"],[25,"link","gadget 99 MAX Deep Purple - Unlocked eSIM - Vendor for $2,099.00 from Vendor"]`
    },
    outputJSON: {"result": "gadget 99 MAX from Vendor for $2,099.00"}
}

// live example
let sessionN = {
    input: {
        objective: "$objective",
        url: "$url",
        ariaTreeJSON: `$ariaTreeJSON`,
        browserError: "$browserError"
    },
    outputJSON:"$output"}