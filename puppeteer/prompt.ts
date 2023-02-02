// This is TypeScript
// include command.ts

type Input = {
    objective, // an @objective that you are trying to achieve
    url, // the @url of your current web page
    browserContent // accessibility @tree string in format [index, role, name, [children]]
}

/** Function that controls the browser

  @returns the next command to issue to the browser
*/
function browserNext(input:Input):Command {
    throw new Error("TODO")
}

//Following contains inputs and expected outputs for the browserNext function
let google_page = [
    0,
    "RootWebArea",
    "Google",
    [
        [ 1, "link", "About", [] ],
        [ 2, "link", "Store", [] ],
        [ 3, "link", "Gmail", [] ],
        [ 4, "link", "Images", [] ],
        [ 5, "button", "Google apps", [] ],
        [ 6, "link", "Sign in", [] ],
        [ 7, "img", "Google", [] ],
        [ 8, "combobox", "Search", [] ],
        [ 11, "button", "Google Search", [] ],
        [ 12, "button", "I'm Feeling Lucky", [] ]
    ]
]
let session1 = {
    input: {
        objective: "Find a 2 bedroom house for sale in Anchorage AK for under $750k",
        url: "https://www.google.com/",
        browserContent: google_page
    },
    // keep output without newlines
    outputJSON: {"index": 8, "params": ["anchorage redfin"]}
}

// live example
let sessionN = {
    input: {
        objective: "$objective",
        url: "$url",
        browserContent: "$accessibility_tree",
    },
    outputJSON:"$output"}
