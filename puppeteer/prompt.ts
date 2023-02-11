// This is TypeScript

export type ObjectiveState = {
    objectivePrompt: string, // objective set by user
    objectiveProgress: string[], // summary of previous actions taken towards objective
    url: string, // current page url
    ariaTree: string //JSON of ariaTree for url in format [index, role, name, [children]]
 }
 export type BrowserAction = {
    index: number, // index for ariaTree element
    params?: string[] // input for combobox, textbox, or searchbox elements
 }
 export type ObjectiveResponse = {
    result: string // response to objectivePrompt in conversational tone
 }
 export type GptResponse = BrowserAction | ObjectiveResponse  // either the next browser action or a final response to the objectivePrompt
 export type ActionStep = {
    progressAssessment: string, //decide if enough info to return an ObjectiveResponse or if a next BrowserAction is needed
    actionCommand: GptResponse, // action
    actionDescription: string // brief description of actionCommand
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
        objectivePrompt: "how much is an gadget 11 pro",
        objectiveProgress: [],
        url: "https://www.google.com/",
        ariaTree: `[0,"RootWebArea","Google",[[1,"link","Gmail"],[2,"link","Images"],[3,"button","Google apps"],[4,"link","Sign in"],["img","Google"],[5,"combobox","Search"]`
    },
    actionstep: {
        "progressAssessment": "Do not have enough information in ariaTree to return an Objective Result.",
        "actionCommand": {"index": 5, "params": ["gadget 11 pro price"]},
        "actionDescription": "Searched `gadget 11 pro price`"
    }})

 assertNextActionStep({
    objectivestate: {
        objectivePrompt: "Who was president when Early Voting won Preakness Stakes",
        objectiveProgress: ["Searched `early voting Preakness Stakes win`"],
        url: "https://www.google.com/search",
        ariaTree: `[0,"RootWebArea","early voting Preakness Stakes win - Google Search",[[1,"heading","Accessibility Links"],[2,"link","Skip to main content"],[3,"link","Switch to page by page results"],[4,"link","Accessibility help"],[5,"link","Accessibility feedback"],[6,"link","Google"],[7,"combobox","Search",["early voting Preakness Stakes win"]],[8,"button"," Clear"],[9,"button","Search by voice"],[10,"button","Search by image"],[11,"button","Search"],[12,"button","Settings"],[13,"button","Google apps"],[14,"link","Sign in"],[15,"heading","Search Modes"],"All",[16,"link","News"],[17,"link","Images"],[18,"link","Shopping"],[19,"link","Videos"],[20,"button","More"],[21,"button","Tools"],"About 166,000 results"," (0.39 seconds) ",[22,"heading","Search Results"],[23,"heading","Featured snippet from the web"],[24,"button","Image result for early voting Preakness Stakes win"],[25,"heading","Early Voting, a colt owned by the billionaire hedge fund investor Seth Klarman, repelled the challenge of the heavily favored Epicenter to capture the 147th running of the Preakness Stakes.May 21, 2022"],[26,"link"," Early Voting Wins Preakness Stakes - The New York Times https://www.nytimes.com › Sports › Horse Racing"],[27,"button","About this result"]`
    },
    actionstep: {
        "progressAssessment": "Per search results in ariaTree: Early Voting won Preakness Stakes in 2022. Do not have enough information to return objective result. Now need to find out who was president in 2022",
        "actionCommand": {"index": 7, "params": ["2022 president"]},
        "actionDescription": "Early Voting won Preakness Stakes on `May 21, 2022`. This is a partial answer to `early voting Preakness Stakes win` so searched `2022 president`"
    }})

 assertNextActionStep({
    objectivestate: {
        objectivePrompt: "When was Ted Kennedy Born",
        objectiveProgress: ["Searched `Ted Kennedy born`"],
        url: "https://www.google.com/",
        ariaTree: `[0,"RootWebArea","Ted Kennedy born - Google Search",[[1,"heading","Accessibility Links"],[2,"link","Skip to main content"],[3,"link","Switch to page by page results"],[4,"link","Accessibility help"],[5,"link","Accessibility feedback"],[6,"link","Google"],[7,"combobox","Search",["Ted Kennedy born"]],[8,"button"," Clear"],[9,"button","Search by voice"],[10,"button","Search by image"],[11,"button","Search"],[12,"button","Settings"],[13,"button","Google apps"],[14,"link","Sign in"],[15,"heading","Search Modes"],"All",[16,"link","Images"],[17,"link","News"],[18,"link","Videos"],[19,"link","Shopping"],[20,"button","More"],[21,"button","Tools"],"About 13,200,000 results"," (0.50 seconds) ",[22,"heading","Search Results"],[23,"heading","Ted Kennedy/Born"],[24,"link","February 22, 1932, Dorchester, Boston, MA"],[25,"button","Image result for Ted Kennedy born"],[26,"button","Feedback"],[27,"link"," Ted Kennedy - Wikipedia https://en.wikipedia.org › wiki › Ted_Kennedy"],[28,"button","About this result"],"Edward Moore Kennedy (","February 22, 1932 – August 25, 2009",") was an American lawyer`
    },
    actionstep: {
        "progressAssessment": "Per search results in ariaTree: Ted Kennedy was born on February 22, 1932, returning Objective result.",
        "actionCommand": {"result": "Ted Kennedy was born on February 22, 1932."},
        "actionDescription": "Ted Kennedy was born on `February 22, 1932` according to search results. This is a reasonable answer to `When was Ted Kennedy Born` in objectivePrompt."
    }})

// prompt //
assertNextActionStep({
    objectivestate: {
        objectivePrompt: "$objective",
        objectiveProgress: ["$objectiveProgress"],
        url: "$url",
        ariaTree: `$ariaTreeJSON`,
    },
    actionstep: {
        "progressAssessment":"$output"}})