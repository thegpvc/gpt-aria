type Generic = [number, string, string, AccessibilityTree[]?]
type Content = string | number
type Image = ["img", string]
export type AccessibilityTree = Generic | Content | Image
export type ObjectiveState = {
    objective: string, // objective set by user
    progress: string[], // summary of previous actions taken towards objective
    url: string, // current page url
    ariaTree: string //JSON of ariaTree of AccessibilityTree type
 }
 export type BrowserAction = {
    kind: "BrowserAction",
    index: number, // index for ariaTree element
    params?: string[] // input for combobox, textbox, or searchbox elements
 }
 export type ObjectiveComplete = {
    kind: "ObjectiveComplete",
    result: string // response to objectivePrompt in conversational tone
 }
 export type GptResponse = BrowserAction | ObjectiveComplete  // either the next browser action or a final response to the objectivePrompt
 export type ActionStep = {
    progressAssessment: string, //decide if enough info to return an ObjectiveComplete or if a next BrowserAction is needed
    command: GptResponse, // action
    description: string // brief description of actionCommand
 }
 /** Function that controls the browser
  @returns the next ActionStep
 */
 declare function assertNextActionStep(input_output:{objectivestate:ObjectiveState, actionstep:ActionStep})
 /*
 For each assertActionNextStep function below, use information from the ObjectiveState within that function only to complete the ActionStep within that function.Only write valid code.
 */
 assertNextActionStep({
    objectivestate: {
        objective: "how much is an gadget 11 pro",
        progress: [],
        url: "https://www.google.com/",
        ariaTree: `[0,"RootWebArea","Google",[[1,"link","Gmail"],[2,"link","Images"],[3,"button","Google apps"],[4,"link","Sign in"],["img","Google"],[5,"combobox","Search"]`
    },
    actionstep: {
        "progressAssessment": "Do not have enough information in ariaTree to return an Objective Result.",
        "command": {"kind": "BrowserAction", "index": 5, "params": ["gadget 11 pro price"]},
        "description": "Searched `gadget 11 pro price`"
    }})

 assertNextActionStep({
    objectivestate: {
        objective: "Who was president when Early Voting won Preakness Stakes",
        progress: ["Searched `early voting Preakness Stakes win`"],
        url: "https://www.google.com/search",
        ariaTree: `[0,"RootWebArea","early voting Preakness Stakes win - Google Search",[[1,"heading","Accessibility Links"],[2,"link","Skip to main content"],[3,"link","Switch to page by page results"],[4,"link","Accessibility help"],[5,"link","Accessibility feedback"],[6,"link","Google"],[7,"combobox","Search",["early voting Preakness Stakes win"]],[8,"button"," Clear"],[9,"button","Search by voice"],[10,"button","Search by image"],[11,"button","Search"],[12,"button","Settings"],[13,"button","Google apps"],[14,"link","Sign in"],[15,"heading","Search Modes"],"All",[16,"link","News"],[17,"link","Images"],[18,"link","Shopping"],[19,"link","Videos"],[20,"button","More"],[21,"button","Tools"],"About 166,000 results"," (0.39 seconds) ",[22,"heading","Search Results"],[23,"heading","Featured snippet from the web"],[24,"button","Image result for early voting Preakness Stakes win"],[25,"heading","Early Voting, a colt owned by the billionaire hedge fund investor Seth Klarman, repelled the challenge of the heavily favored Epicenter to capture the 147th running of the Preakness Stakes.May 21, 2022"],[26,"link"," Early Voting Wins Preakness Stakes - The New York Times https://www.nytimes.com › Sports › Horse Racing"],[27,"button","About this result"]`
    },
    actionstep: {
        "progressAssessment": "Per search results in ariaTree: Early Voting won Preakness Stakes in 2022. Do not have enough information to return objective result. Now need to find out who was president in 2022",
        "command": {"kind": "BrowserAction", "index": 7, "params": ["2022 president"]},
        "description": "Early Voting won Preakness Stakes on `May 21, 2022`. This is a partial answer to `early voting Preakness Stakes win` so searched `2022 president`"
    }})

 assertNextActionStep({
    objectivestate: {
        objective: "When was Ted Kennedy Born",
        progress: ["Searched `Ted Kennedy born`"],
        url: "https://www.google.com/",
        ariaTree: `[0,"RootWebArea","Ted Kennedy born - Google Search",[[1,"heading","Accessibility Links"],[2,"link","Skip to main content"],[3,"link","Switch to page by page results"],[4,"link","Accessibility help"],[5,"link","Accessibility feedback"],[6,"link","Google"],[7,"combobox","Search",["Ted Kennedy born"]],[8,"button"," Clear"],[9,"button","Search by voice"],[10,"button","Search by image"],[11,"button","Search"],[12,"button","Settings"],[13,"button","Google apps"],[14,"link","Sign in"],[15,"heading","Search Modes"],"All",[16,"link","Images"],[17,"link","News"],[18,"link","Videos"],[19,"link","Shopping"],[20,"button","More"],[21,"button","Tools"],"About 13,200,000 results"," (0.50 seconds) ",[22,"heading","Search Results"],[23,"heading","Ted Kennedy/Born"],[24,"link","February 22, 1932, Dorchester, Boston, MA"],[25,"button","Image result for Ted Kennedy born"],[26,"button","Feedback"],[27,"link"," Ted Kennedy - Wikipedia https://en.wikipedia.org › wiki › Ted_Kennedy"],[28,"button","About this result"],"Edward Moore Kennedy (","February 22, 1932 – August 25, 2009",") was an American lawyer`
    },
    actionstep: {
        "progressAssessment": "Per search results in ariaTree: Ted Kennedy was born on February 22, 1932, returning Objective result.",
        "command": {"kind": "ObjectiveComplete", "result": "Ted Kennedy was born on February 22, 1932."},
        "description": "Ted Kennedy was born on `February 22, 1932` according to search results. This is a reasonable answer to `When was Ted Kennedy Born` in objectivePrompt."
    }})

assertNextActionStep({
    objectivestate: {
        objective: "",
        progress: [],
        url: "https://www.google.com/",
        ariaTree: `[0,"RootWebArea","Google",[[1,"dialog","Before you continue to Google Search",[["img","Google"],[2,"button","Choose language, en"],[3,"link","Sign in"],[4,"heading","Before you continue to Google"],"We use ",[5,"link","cookies"]," and data to","Deliver and maintain Google services","Track outages can also include more relevant results, recommendations and tailored ads based on past activity from this browser, like previous Google searches. We also use cookies and data to tailor the experience to be age-appropriate, if relevant.","Select 'More options' to see additional information, including details about managing your privacy settings. You can also visit ","g.co/privacytools"," at any time.",[6,"button","Reject all"],[7,"button","Accept all"],[8,"link","More options",["More options"]],[9,"link","Privacy"],[10,"link","Terms"]]]]]`,
    },
    actionstep: {
        "progressAssessment": "Content in ariaTree wants me to accept terms. I will click accept when nothing more relevant to click.",
        "command": {"kind": "BrowserAction", "index" : 7},
        "description": "Clicked Accept"
    }})

// prompt //
assertNextActionStep({
    objectivestate: {
        objective: "$objective",
        progress: ["$objectiveProgress"],
        url: "$url",
        ariaTree: `$ariaTreeJSON`,
    },
    actionstep: {
        "progressAssessment":"$output"}})