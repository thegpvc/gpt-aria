// This is TypeScript

export type AccessibilityTreeNode = [number, string, string, AccessibilityTree[]?]
export type AccessibleImg = ["img", string] // [tag, alt]
export type AccessibilityTree = AccessibilityTreeNode | AccessibleImg | string

export type BrowserCommand = {
    index: number // index usually of combobox search field
    params?: string[] // params indicate text to put into box
}

export type GptSummary = {
    result: string; // Uses objective to form a full sentence response
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
declare function browserNextDecision(input:BrowserState):BrowserCommand

/*
Following contains inputs and expected outputs for the browserNext function
Your outputJSON must obey the following constraints:
1. only write valid code
2. outputJSON must be derived from input ariaTreeJSON in same session block
3. Do not reuse info from other session blocks
4. Do not solve objectives yourself, only let ariaTreeJSON be source for outputJSON
5. When our outputJSON.params includes text, do not pass text that's already in the textbox as that will cause a loop.
*/
let google_page = `[0,"RootWebArea","Google",[[1,"link","Gmail"],[2,"link","Images"],[3,"button","Google apps"],[4,"link","Sign in"],["img","Google"],[5,"combobox","Search"]`
let session1 = {
    input: {
        objective: "how much is an gadget 11 pro",
        url: "https://www.google.com/",
        ariaTreeJSON: google_page
    },
    outputJSON: {"index": 5, "params": ["gadget 11 pro price"]}
}

let session2 = {
    input: {
        objective: "how much is an gadget 11 pro",
        url: "https://www.google.com/search",
        ariaTreeJSON: `[0,"RootWebArea","gadget 99 MAX - Google Search",[[1,"heading","Accessibility Links"],[2,"link","Skip to main content"],[3,"link","Switch to page by page results"],[4,"link","Accessibility help"],[5,"link","Accessibility feedback"],[6,"link","Google"],[7,"combobox","Search"],[8,"button"," Clear"],[9,"button","Search by voice"],[10,"button","Search by image"],[11,"button","Search"],[12,"button","Settings"],[13,"button","Google apps"],[14,"link","Sign in"],[15,"heading","Search Modes"],"All",[16,"link","Shopping"],[17,"link","Images"],[18,"link","News"],[19,"link","Videos"],[20,"button","More"],[21,"button","Tools"],"About 242,000,000 results"," (0.70 seconds) ",[22,"heading","Ads"],[23,"heading","Ads·Shop gadget 99 MAX"],[24,"button","Why this ad?"],[25,"link","gadget 99 MAX Deep Purple - Unlocked eSIM - Vendor for $2,099.00 from Vendor"]`
    },
    outputJSON: {"result": "gadget 99 MAX from Vendor sells for $2,099.00."}
}

let session3 = {
    input: {
        objective: "latest news on floods in bay area",
        url: "https://www.google.com/search",
        ariaTreeJSON: `[0,"RootWebArea","latest news on floods in bay area - Google Search",[[1,"heading","Accessibility links"],[2,"link","Skip to main content"],[3,"link","Accessibility help"],[4,"link","Accessibility feedback"],[5,"link","Google"],[6,"combobox","Search",["latest news on floods in bay area"]],[7,"button","Clear"],[8,"button","Search by voice"],[9,"button","Search by image"],[10,"button","Search"],[11,"button","Settings"],[12,"button","Google apps"],[13,"link","Sign in"],[14,"heading","Search modes"],"All",[15,"link","News"],[16,"link","Images"],[17,"link","Videos"],[18,"link","Books"],[19,"button","More"],[20,"button","Tools"],"About 21,000,000 results"," (0.52 seconds) ",[21,"heading","Ads"],[22,"link"," Breaking news, updated 24/7 - Local News Ad· https://www.rwcpulse.com/"],[23,"button","Why this ad?"],"Updated 24/7, including government, ","breaking news",", business updates, obituaries and more. Redwood City Pulse is your source for ","breaking"," local ","news",". Sign Up For E-Mail. See Events.","",[24,"link","Redwood City Local News"]," · ",[25,"link","Events Calendar"]," · ",[26,"link","News Releases"]," · ",[27,"link","Lasting Memories"]," · ",[28,"link","Blogs"],[29,"link"," San Francisco Unbiased News - Daily Non-Clickbait Briefing. Ad· https://www.join1440.com/san-francisco/news"],[30,"button","Why this ad?"],"We Scour 100+ Sources. Culture, Science, Sports, Politics, Business, And More. Join Today. We Scour 100+ Sources So You Don't Have To. All In A 5-Minute Read. 2.1 Million Readers. Subscribe Online. View Our Story.",[31,"link"," US flood hazard maps - Storm surge flood maps Ad· https://www.fathom.global/us"],[32,"button","Why this ad?"],"Fathom's US data is peer-reviewed, academic-led and the only real alternative to FEMA. Fathom partners deliver our world leading ","flood"," data to a wide variety of end users.","",[33,"link","Fathom US flood maps"]," · ",[34,"link","Research"]," · ",[35,"link","Fathom US CAT model"]`
    },
    outputJSON: {"index": 15}
}

let session4 = {
    input: {
        objective: "buy me iphone 14 pro. Think on whether answer is relevant per ARIA tree.",
        url: "https://www.google.com/search?q=iphone+14+pro",
        ariaTreeJSON: `[0,"RootWebArea","iphone 14 pro - Google Shopping",[[1,"heading","Accessibility links"],[2,"link","Skip to main content"],[3,"link","Google"],[4,"combobox","Search",["iphone 14 pro"]],[5,"button","Clear",[[6,"button","Clear"]]],[7,"button","Search by voice"],[8,"button","Google Search"],[9,"button","Settings"],[10,"button","Google apps"],[11,"link","Sign in"],[12,"heading","Search modes"],[13,"link","All"],[14,"link","Images"],[15,"link","Maps"],"Shopping",[16,"button","More"],"Volyn Oblast",[17,"link","Learn more"],"Show only","","Price","","Broadband Generation","","Colour","","Storage Capacity","","Weight","","SIM Slots","","Cellular Network","","Security Features","","Rear Camera Resolution","","Screen Resolution","","Lens Quality","","RAM","","Lens Type","","Shipping & returns","","Product rating","",[18,"button","More Product rating"],"Condition","","Seller","",[19,"button","More Seller"],[20,"button","Sort by: Relevance"],"Ads","·",[21,"heading","See iphone 14 pro"],[22,"heading","More info"],[23,"link","Смартфон Apple iPhone 14 Pro 128Gb Deep Purple UAH 52,499.00 From Comfy"`,
        browserError: undefined
    },
    // keep JSON on single line, no newlines within string, ensure valid JSON
    outputJSON:{"index": 23}
}

// prompt //
let sessionN = {
    input: {
        objective: "$objective",
        url: "$url",
        ariaTreeJSON: `$ariaTreeJSON`,
        browserError: "$browserError"
    },
    // keep JSON on single line, no newlines within string, ensure valid JSON
    outputJSON:"$output"}
