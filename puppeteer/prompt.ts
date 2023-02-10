// This is TypeScript

export type AccessibilityTreeNode = [number, string, string, AccessibilityTree[]?]
export type AccessibleImg = ["img", string] // [tag, alt]
export type AccessibilityTree = AccessibilityTreeNode | AccessibleImg | string

export type Action = {
    actionThought: string, // general assessment of current state and reasoning behind the action
    actionPlan: string, // what should I do on the current page to move towards the objective
    actionCommand: BrowserCommand, // action in the browser
    actionDescription: string // description of the action taken
}

export type BrowserCommand = {
    index: number // index usually of combobox search field
    params?: string[] // params indicate text to put into box
}

export type GptSummary = {
    result: string; // Uses objective to form a full sentence response
}

export type GptResponse = Action | GptSummary

export type BrowserState = {
    objective: string, // an objective set by user that browserNextDecision is trying to achieve
    url: string, // current page url
    ariaTreeJSON: string, //JSON of AccessibilityTree in format [index, role, name, [children]]
    browserError?: {
        error: string // error that occurred during interaction with browser
        lastCommand?: BrowserCommand // last command that was issued to browser
    },
    actionsSummary: string // concatenation of all actionDescription from previous actions
}

/** Function that controls the browser
  @returns the next command to issue to the browser
*/
declare function browserNextDecision(input:BrowserState):GptResponse

declare function assertBrowserNextDecision(input_output:{input:BrowserState, outputJSON:GptResponse}):void // throws is browserNextDecision is not behaving correctly
/*
Following contains inputs and expected outputs for the browserNextDecision function
Your outputJSON must obey the following constraints:
1. only write valid code
2. outputJSON must be derived from input BrowserState in same session block
3. Do not reuse info from other session blocks
4. Do not solve objectives yourself, only let BrowserState be source for outputJSON
5. When our outputJSON.actionCommand.params includes text, do not pass text that's already in the textbox as that will cause a loop.
*/
let google_page = `[0,"RootWebArea","Google",[[1,"link","Gmail"],[2,"link","Images"],[3,"button","Google apps"],[4,"link","Sign in"],["img","Google"],[5,"combobox","Search"]`
assertBrowserNextDecision({
    input: {
        objective: "how much is an gadget 11 pro",
        url: "https://www.google.com/",
        ariaTreeJSON: google_page,
        actionSummary: ""
    },
    outputJSON: {actionThought:"I do not yet have enough information to complete the objective, so I should take another action step.", actionPlan:"Enter a search query to find sites with prices of gadget 11 pro", actionCommand:{"index": 5, "params": ["gadget 11 pro price"]}, actionDescription:"Entered a search query to find sites about prices of gadget 11 pro."}
})

assertBrowserNextDecision({
    input: {
        objective: "how much is an gadget 11 pro",
        url: "https://www.google.com/search",
        ariaTreeJSON: `[0,"RootWebArea","gadget 11 pro - Google Search",[[1,"heading","Accessibility Links"],[2,"link","Skip to main content"],[3,"link","Switch to page by page results"],[4,"link","Accessibility help"],[5,"link","Accessibility feedback"],[6,"link","Google"],[7,"combobox","Search"],[8,"button"," Clear"],[9,"button","Search by voice"],[10,"button","Search by image"],[11,"button","Search"],[12,"button","Settings"],[13,"button","Google apps"],[14,"link","Sign in"],[15,"heading","Search Modes"],"All",[16,"link","Shopping"],[17,"link","Images"],[18,"link","News"],[19,"link","Videos"],[20,"button","More"],[21,"button","Tools"],"About 242,000,000 results"," (0.70 seconds) ",[22,"heading","Ads"],[23,"heading","Ads·Shop gadget 99 MAX"],[24,"button","Why this ad?"],[25,"link","gadget 11 pro Deep Purple - Unlocked eSIM - Vendor for $2,099.00 from Vendor"]`,
        actionSummary: "Entered a search query to find sites about prices of gadget 11 pro."
    },
    outputJSON: {actionThought:"There are sites of stores selling gadget 11 pro. I should look there.", actionPlan:"Select a link that will take me to a page with pricing information about gadget 11 pro", actionCommand:{"index": 25}, actionDescription:"Clicked on a link to a gadget 11 pro page on Vendor site"}
})

assertBrowserNextDecision({
    input: {
        objective: "how much is an gadget 11 pro",
        url: "https://gadgetvendor.com/apple-iphone-11-pro/prices",
        ariaTreeJSON: `[0,"RootWebArea","Apple IPhone 11 Pro Max 256GB Gold #1328 | Handy Smartphones",[[1,"link","Skip to content"],[2,"link","Handy Smartphones"],[3,"button","Main Menu"],"Sale!",[4,"link","🔍"],[5,"link","1 30"],[6,"link","1 31"],[7,"link","2 27"],[8,"link","3 28"],[9,"link","4 28"],[10,"link","5 28"],[11,"link","6 28"],[12,"link","9 12"],[13,"link","7 25"],[14,"link","8 21"],[15,"link","Clearance Sale"],[16,"heading","Apple iPhone 11 Pro Max 256GB Gold #1328"],"479 ","€","Phone Excellent condition.","Display Like New.","Frame Like New.","Back Condition Like new.","84% Batter Health",`,
        actionSummary: "Entered a search query to find sites about prices of gadget 11 pro. Clicked on a link to a gadget 11 pro page on Vendor site."
    },
    outputJSON: {actionThought:"There is enough information on this page to achieve objective and summarise the result", actionPlan:"Get the price of gadget 11 pro", actionCommand:{"result": "gadget 11 Pro from Vendor sells for €479"}, actionDescription:"Summarised the result"}
})

// prompt //
assertBrowserNextDecision({
    input: {
        objective: "$objective",
        url: "$url",
        ariaTreeJSON: `$ariaTreeJSON`,
        browserError: "$browserError",
        actionsSummary: `$actionsSummary`,
    },
    // use the input context above to take a next action or complete the objective.
    // keep JSON on single line, no newlines within string, ensure valid JSON
    outputJSON:"$output"})
