// This is TypeScript
// include command.ts

type Input = {
    objective: string, // an @objective that you are trying to achieve
    url: string, // the @url of your current web page
    browserContentJSON: string // JSON of AccessibilityTree in format [index, role, name, [children]]
}

/** Function that controls the browser

  @returns the next command to issue to the browser
*/
function browserNext(input:Input):Command {
    throw new Error("TODO")
}

//Following contains inputs and expected outputs for the browserNext function
let google_page = `[0,"RootWebArea","Google",[[1,"link","About",[]],[2,"link","Store",[]],[3,"link","Gmail",[]],[4,"link","Images",[]],[5,"button","Google apps",[]],[6,"link","Sign in",[]],[7,"img","Google",[]],[8,"combobox","Search",[]],[11,"button","Google Search",[]],[12,"button","I'm Feeling Lucky",[]]]]`
let session1 = {
    input: {
        objective: "Find a 2 bedroom house for sale in Anchorage AK for under $750k",
        url: "https://www.google.com/",
        browserContentJSON: google_page
    },
    // keep output without newlines
    outputJSON: {"index": 8, "params": ["anchorage redfin"]}
}

let session2 = {
    input: {
        objective: "how much is an iphone 14 pro 256",
        url: "https://www.google.com/search",
        browserContentJSON: `[0,"RootWebArea","iphone 14 pro 256 - Google Search",[[1,"heading","Accessibility Links",[]],[2,"link","Skip to main content",[]],[3,"link","Switch to page by page results",[]],[4,"link","Accessibility help",[]],[5,"link","Accessibility feedback",[]],[6,"link","Google",[]],[7,"combobox","Search",[]],[8,"button"," Clear",[]],[9,"button","Search by voice",[]],[10,"button","Search by image",[]],[11,"button","Search",[]],[12,"button","Settings",[]],[13,"button","Google apps",[]],[14,"link","Sign in",[]],[15,"heading","Search Modes",[]],[16,"StaticText","All",[]],[17,"link","Shopping",[]],[18,"link","Images",[]],[19,"link","News",[]],[20,"link","Videos",[]],[21,"button","More",[]],[22,"button","Tools",[]],[23,"StaticText","About 162,000,000 results",[]],[24,"StaticText"," (0.74 seconds) ",[]],[25,"heading","Ads",[]],[26,"heading","Ads·Shop iphone 14 pro 256",[]],[27,"button","Why this ad?",[]],[28,"link","iPhone 14 Pro 256GB Deep Purple - Unlocked eSIM - Apple for $1,099.00 from Apple",[]],[29,"link","Image of iPhone 14 Pro 256GB Deep Purple - Unlocked eSIM - Apple",[]],[30,"link","Title of iPhone 14 Pro 256GB Deep Purple - Unlocked eSIM - Apple",[]],[31,"StaticText","$1,099.00",[]],[32,"StaticText","Apple",[]],[33,"StaticText","Free shipping",[]],[34,"link","iPhone 14 Pro 256GB Space Black - Unlocked eSIM - Apple for $1,099.00 from Apple",[]],[35,"link","Image of iPhone 14 Pro 256GB Space Black - Unlocked eSIM - Apple",[]],[36,"link","Title of iPhone 14 Pro 256GB Space Black - Unlocked eSIM - Apple",[]],[37,"StaticText","$1,099.00",[]],[38,"StaticText","Apple",[]],[39,"StaticText","Free shipping",[]],[40,"link","Apple iPhone 14 Pro 256 GB in Deep Purple with installment for $0.00 now from Verizon",[]],[41,"link","Image of Apple iPhone 14 Pro 256 GB in Deep Purple with installment",[]],[42,"link","Title of Apple iPhone 14 Pro 256 GB in Deep Purple with installment",[]],[43,"StaticText","$0.00 now",[]],[44,"StaticText","$30.55/mo x 36",[]],[45,"StaticText","Verizon",[]],[`
    },
    // keep output without newlines
    outputJSON: {"result": "iphone 14 pro 256 from apple for $1,099.00"}
}

// live example
let sessionN = {
    input: {
        objective: "$objective",
        url: "$url",
        browserContentJSON: `$accessibility_tree`,
    },
    outputJSON:"$output"}
