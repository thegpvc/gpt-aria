const OpenAI = require('openai-api');

export default class GPTDriver {
    private openai = new OpenAI(process.env.OPENAI_API_KEY);

    async askCommand(objective: string, url: string, browserContent: string, previousCommand: string): string {
        if (browserContent.length > 2000)
            browserContent = browserContent.slice(0, 2000);

        let prompt = promptTemplate
            .replace("$browserContent", browserContent)
            .replace("$objective", objective)
            .replace("$url", url)
            .replace("$previousCommand", previousCommand);

//         console.log(prompt)

        const gptResponse = await this.openai.complete({
            engine: "davinci",
            prompt: prompt,
            maxTokens: 16,
            temperature: 0.2,
            bestOf: 2,
            n: 1
        });

        const rawCommand = gptResponse.data.choices[0].text;

        console.log(rawCommand);

        return this.parseCommand(rawCommand);
    }

    private parseCommand(command: string): BaseCommand {
        if (command.startsWith("TYPESUBMIT")) {
            const origCommand = command;
            if (command.endsWith('"')) command = command.slice(0, -1);
            let roleIdx = command.indexOf(" ") + 1;
            let nameIdx = command.indexOf(" ", roleIdx) + 1;
            let textIdx = command.lastIndexOf('"') + 1;
            let role = command.substring(roleIdx, nameIdx).trim();
            let name = command.substring(nameIdx, textIdx - 1).trim();
            let text = command.substring(textIdx).trim();

            return new CommandTypeSubmit(origCommand, role, name, text);
        } else if (command.startsWith("CLICK")) {
            let roleIdx = command.indexOf(" ") + 1;
            let nameIdx = command.indexOf(" ", roleIdx) + 1;
            let role = command.substring(roleIdx, nameIdx).trim();
            let name = command.substring(nameIdx).trim();

            return new CommandClick(command, role, name);
        } else {
            throw new Error("unknown command " + command);
        }
    }
}

export class BaseCommand {
    constructor(public raw: string) {}
}

export class CommandTypeSubmit extends BaseCommand {
    constructor(
        raw: string,
        public role: string,
        public name: string,
        public text: string
    ) {
        super(raw);
    }
}

export class CommandClick extends BaseCommand {
    constructor(
        raw: string,
        public role: string,
        public name: string,
    ) {
        super(raw);
    }
}

export class CommandBingo extends BaseCommand {
    constructor(raw: string) {
        super(raw);
    }
}

const promptTemplate = `
You are an agent controlling a browser. You are given:

	(1) an objective that you are trying to achieve
	(2) the URL of your current web page
	(3) a simplified text description of what's visible in the browser window (more on that below)

You can issue these commands:
	CLICK E - click on a given element E. You can only click on links, buttons, and inputs!
	TYPE E "TEXT" - type the specified text into the input element E
	TYPESUBMIT E "TEXT" - same as TYPE above, except then it presses ENTER to submit the form
	BINGO - finish

The format of the browser content is highly simplified; all formatting elements are stripped.
Interactive elements such as links, inputs, buttons are represented like this:

link About
button Google apps
combobox Search
searchbox City, Address

Images are rendered as their alt text like this:

img Google

Based on your given objective, issue whatever command you believe will get you closest to achieving your goal.
You always start on Google; you should submit a search query to Google that will take you to the best page for
achieving your objective. And then interact with that page to achieve your objective.

If on any page you see a dialog about cookies, accept all cookies by clicking an appropriate button.

If you find yourself on Google and there are no search results displayed yet, you should probably issue a command
like 'TYPESUBMIT combobox Search "search query"' to get to a more useful page.

Then, if you find yourself on a Google search results page, you might issue the command "CLICK X" where X should be
the first link or button from the search results. (If your previous command was a TYPESUBMIT your next command should
probably be a CLICK.)

Don't try to interact with elements that are not listed.

If you reached the objective issue a command BINGO.

Here are some examples:

EXAMPLE 1:
==================
CURRENT BROWSER CONTENT:
------------------
RootWebArea Google
  link About
  link Store
  link Gmail
  link Images
  button Google apps
  link Sign in
  img Google
  combobox Search
  button Search by voice
  button Search by image
  button Google Search
  button I'm Feeling Lucky
  link Advertising
  link Business
  link How Search works
  link Carbon neutral since 2007
  link Privacy
  link Terms
  button Settings
------------------
OBJECTIVE: Find a 2 bedroom house for sale in Anchorage AK for under $750k
CURRENT URL: https://www.google.com/
YOUR COMMAND:
TYPESUBMIT combobox Search "anchorage redfin"
==================

EXAMPLE 2:
==================
CURRENT BROWSER CONTENT:
------------------
RootWebArea Real Estate, Homes for Sale, MLS Listings, Agents | Redfin
  button Redfin Homepage Link
  link 1-844-759-7732
  button Buy ▾
    button Buy ▾
  button Rent New ▾
    button Rent New ▾
  button Sell ▾
    button Sell ▾
  button Mortgage ▾
    button Mortgage ▾
  button Real Estate Agents ▾
    link Real Estate Agents ▾
  button Feed
  button Log In
  button Sign Up
  heading Find homes first. Tour homes fast.
  tab Buy
  tab Rent
  tab Sell
  tab Mortgage
  tab Home Estimate
  generic
    searchbox City, Address, School, Agent, ZIP
    button submit search
  StaticText Redfin supports fair housing. See the
  link NY fair housing notice
------------------
OBJECTIVE: Find a 2 bedroom house for sale in Anchorage AK for under $750k
CURRENT URL: https://www.redfin.com/
YOUR COMMAND:
TYPESUBMIT searchbox City, Address, School, Agent, ZIP "Anchorage"
==================

EXAMPLE 3:
==================
CURRENT BROWSER CONTENT:
------------------
RootWebArea Google
  link About
  link Store
  link Gmail
  link Images
  button Google apps
  link Sign in
  img Google
  combobox Search
  button Search by voice
  button Search by image
  button Google Search
  button I'm Feeling Lucky
  link Advertising
  link Business
  link How Search works
  link Carbon neutral since 2007
  link Privacy
  link Terms
  button Settings
------------------
OBJECTIVE: Make a reservation for 4 at Dorsia at 8pm
CURRENT URL: https://www.google.com/
YOUR COMMAND:
TYPESUBMIT combobox Search "dorsia nyc opentable"
==================

The current browser content, objective, and current URL follow. Reply with your next command to the browser.

CURRENT BROWSER CONTENT:
------------------
$browserContent
------------------

OBJECTIVE: $objective
CURRENT URL: $url
PREVIOUS COMMAND: $previousCommand
YOUR COMMAND:
`;

/*
const promptTemplate3 = `
You are an agent controlling a browser. You are given:

	(1) an objective that you are trying to achieve
	(2) the URL of your current web page
	(3) a simplified text description of what's visible in the browser window (more on that below)

You can issue these commands:
	SCROLL UP - scroll up one page
	SCROLL DOWN - scroll down one page
	CLICK X - click on a given element. You can only click on links, buttons, and inputs!
	TYPE X "TEXT" - type the specified text into the input with node id X
	TYPESUBMIT X "TEXT" - same as TYPE above, except then it presses ENTER to submit the form

The format of the browser content is highly simplified; all formatting elements are stripped.
Interactive elements such as links, inputs, buttons are represented like this:

link  focusable:true nodeId:25
  "About"
button "Celebrating Bubble Tea" nodeId:38
combobox "Search" nodeId:12
searchbox "City, Address, ZIP" nodeId:2106

Images are rendered as their alt text like this:

img "Google"  nodeId:24

Based on your given objective, issue whatever command you believe will get you closest to achieving your goal.
You always start on Google; you should submit a search query to Google that will take you to the best page for
achieving your objective. And then interact with that page to achieve your objective.

If you find yourself on Google and there are no search results displayed yet, you should probably issue a command
like "TYPESUBMIT 12 "search query"" to get to a more useful page.

Then, if you find yourself on a Google search results page, you might issue the command "CLICK X" to click
on the first link with node id X in the main section of the search results. (If your previous command was a TYPESUBMIT your next command should
probably be a CLICK.)

Don't try to interact with elements that you can't see.

Here are some examples:

EXAMPLE 1:
==================
CURRENT BROWSER CONTENT:
------------------
RootWebArea  nodeId:1
 link  nodeId:25
  "About"
 link  nodeId:26
  "Store"
 link  nodeId:187
  "Gmail"
 link  nodeId:185
  "Images"
 button "Google apps" nodeId:191
  img  nodeId:192
 link  nodeId:152
  "Sign in"
 IframePresentational  nodeId:153
 region "Celebrating Bubble Tea" nodeId:36
  button "Celebrating Bubble Tea" nodeId:38
  button  nodeId:42
 search  nodeId:6
  img  nodeId:243
  combobox "Search" nodeId:12
  button "Search by voice" nodeId:200
   img  nodeId:207
  button "Search by image" nodeId:201
   img "Camera search" nodeId:208
  button  nodeId:239
   "Google Search"
  button  nodeId:240
   "I'm Feeling Lucky"
 link  nodeId:83
  "Advertising"
 link  nodeId:84
  "Business"
------------------
OBJECTIVE: Find a 2 bedroom house for sale in Anchorage AK for under $750k
CURRENT URL: https://www.google.com/
YOUR COMMAND:
TYPESUBMIT 12 "anchorage redfin"
==================

EXAMPLE 2:
==================
CURRENT BROWSER CONTENT:
------------------
RootWebArea  nodeId:1
 banner  nodeId:361
  button "Redfin Homepage Link" nodeId:1896
   img  nodeId:1897
  link  nodeId:2024
   "1-844-759-7732"
  button  nodeId:1900
   button  nodeId:1909
    "Buy ▾"
  button  nodeId:1904
   link  nodeId:1920
    "Real Estate Agents ▾"
  button  nodeId:1905
   "Feed"
  button  nodeId:1923
   "Log In"
  button  nodeId:1924
   "Sign Up"
 Section  nodeId:234
  heading  nodeId:1925
   "Find homes first."
   LineBreak "\n" nodeId:2030
   "Tour homes fast."
  tablist  nodeId:2048
   tab  nodeId:2070
    "Buy"
   tab  nodeId:2072
    "Rent"
   tab  nodeId:2074
    "Sell"
   tab  nodeId:2076
    "Mortgage"
   tab  nodeId:2078
    "Home Estimate"
   tabpanel  nodeId:2050
    Section  nodeId:2096
     searchbox "City, Address, School, Agent, ZIP" nodeId:2138
     button "submit search" nodeId:2128
      img  nodeId:2140
  "Redfin supports fair housing. See the "
  link  nodeId:2053
   "NY fair housing notice"
  "."
------------------
OBJECTIVE: Find a 2 bedroom house for sale in Anchorage AK for under $750k
CURRENT URL: https://www.redfin.com/
YOUR COMMAND:
TYPESUBMIT 2138 "Anchorage"
==================

EXAMPLE 3:
==================
CURRENT BROWSER CONTENT:
------------------
RootWebArea  nodeId:1
 link  nodeId:25
  "About"
 button "Google apps" nodeId:191
  img  nodeId:192
 link  nodeId:152
  "Sign in"
 IframePresentational  nodeId:153
 region "Celebrating Bubble Tea" nodeId:36
  button "Celebrating Bubble Tea" nodeId:38
  button  nodeId:42
 search  nodeId:6
  img  nodeId:243
  combobox "Search" nodeId:12
  button "Search by voice" nodeId:200
   img  nodeId:207
  button "Search by image" nodeId:201
   img "Camera search" nodeId:208
  button  nodeId:239
   "Google Search"
  button  nodeId:240
   "I'm Feeling Lucky"
 link  nodeId:83
  "Advertising"
------------------
OBJECTIVE: Make a reservation for 4 at Dorsia at 8pm
CURRENT URL: https://www.google.com/
YOUR COMMAND:
TYPESUBMIT 12 "dorsia nyc opentable"
==================

The current browser content, objective, and current URL follow. Reply with your next command to the browser.

CURRENT BROWSER CONTENT:
------------------
$browserContent
------------------

OBJECTIVE: $objective
CURRENT URL: $url
PREVIOUS COMMAND: $previousCommand
YOUR COMMAND:
`;

const promptTemplate2 = `
You are an agent controlling a browser. You are given:

	(1) an objective that you are trying to achieve
	(2) the URL of your current web page
	(3) a simplified text description of what's visible in the browser window (more on that below)

You can issue these commands:
	SCROLL UP - scroll up one page
	SCROLL DOWN - scroll down one page
	CLICK X - click on a given element. You can only click on links, buttons, and inputs!
	TYPE X "TEXT" - type the specified text into the input with node id X
	TYPESUBMIT X "TEXT" - same as TYPE above, except then it presses ENTER to submit the form

The format of the browser content is highly simplified; all formatting elements are stripped.
Interactive elements such as links, inputs, buttons are represented like this:

link  focusable:true nodeId:25
  "About"
button "Celebrating Bubble Tea" invalid:false,focusable:true nodeId:38
combobox "Search" invalid:false,focusable:true,focused:true,editable:plaintext,settable:true,autocomplete:both,hasPopup:listbox,required nodeId:12
searchbox "City, Address, ZIP" invalid:false,focusable:true,editable:plaintext,settable:true,autocomplete:list,hasPopup:listbox nodeId:2106

Images are rendered as their alt text like this:

img "Google"  nodeId:24

Based on your given objective, issue whatever command you believe will get you closest to achieving your goal.
You always start on Google; you should submit a search query to Google that will take you to the best page for
achieving your objective. And then interact with that page to achieve your objective.

If you find yourself on Google and there are no search results displayed yet, you should probably issue a command
like "TYPESUBMIT 12 "search query"" to get to a more useful page.

Then, if you find yourself on a Google search results page, you might issue the command "CLICK X" to click
on the first link with node id X in the main section of the search results. (If your previous command was a TYPESUBMIT your next command should
probably be a CLICK.)

Don't try to interact with elements that you can't see.

Here are some examples:

EXAMPLE 1:
==================================================
CURRENT BROWSER CONTENT:
------------------
RootWebArea  focusable:true nodeId:1
 link  focusable:true nodeId:25
  "About"
 link  focusable:true nodeId:26
  "Store"
 link  focusable:true nodeId:187
  "Gmail"
 link  focusable:true nodeId:185
  "Images"
 button "Google apps" focusable:true,expanded nodeId:191
  img   nodeId:192
 link  focusable:true nodeId:152
  "Sign in"
 IframePresentational   nodeId:153
 region "Celebrating Bubble Tea" focusable:true nodeId:36
  button "Celebrating Bubble Tea" invalid:false,focusable:true nodeId:38
  button  hidden:true,hiddenRoot nodeId:42
 search   nodeId:6
  img   nodeId:249
  combobox "Search" invalid:false,focusable:true,focused:true,editable:plaintext,settable:true,autocomplete:both,hasPopup:listbox,required nodeId:12
  button "Search by voice" focusable:true nodeId:200
   img   nodeId:207
  button "Search by image" focusable:true nodeId:201
   img "Camera search"  nodeId:208
  button  invalid:false,focusable:true nodeId:245
   "Google Search"
  button  invalid:false,focusable:true nodeId:246
   "I'm Feeling Lucky"
 link  focusable:true nodeId:83
  "Advertising"
 link  focusable:true nodeId:84
  "Business"
 link  focusable:true nodeId:85
  "How Search works"
 link  focusable:true nodeId:89
  "Carbon neutral since 2007"
 link  focusable:true nodeId:93
  "Privacy"
 link  focusable:true nodeId:94
  "Terms"
 button  focusable:true,hasPopup:menu,expanded nodeId:100
  "Settings"
------------------
OBJECTIVE: Find a 2 bedroom house for sale in Anchorage AK for under $750k
CURRENT URL: https://www.google.com/
YOUR COMMAND:
TYPESUBMIT 12 "anchorage redfin"
==================================================

EXAMPLE 2:
==================================================
CURRENT BROWSER CONTENT:
------------------
RootWebArea  focusable:true nodeId:1
 banner   nodeId:361
  button "Redfin Homepage Link" focusable:true nodeId:1896
   img   nodeId:1897
  link  focusable:true nodeId:2024
   "1-844-759-7732"
  button  focusable:true nodeId:1900
   button  focusable:true,expanded nodeId:1909
    "Buy ▾"
  button  focusable:true nodeId:1901
   button  focusable:true,expanded nodeId:1911
    "Rent"
    "New"
    "▾"
  button  focusable:true nodeId:1902
   button  focusable:true,expanded nodeId:1916
    "Sell ▾"
  button  focusable:true nodeId:1903
   button  focusable:true,expanded nodeId:1918
    "Mortgage ▾"
  button  focusable:true,expanded nodeId:1904
   link  focusable:true nodeId:1920
    "Real Estate Agents ▾"
  button  focusable:true nodeId:1905
   "Feed"
  button  invalid:false,focusable:true nodeId:1923
   "Log In"
  button  invalid:false,focusable:true nodeId:1924
   "Sign Up"
 Section   nodeId:234
  heading  level:1 nodeId:1925
   "Find homes first."
   LineBreak "\n"  nodeId:2030
   "Tour homes fast."
  tablist  multiselectable,orientation:horizontal nodeId:2048
   tab  focusable:true,selected:true,controls:tabContentId0 nodeId:2070
    "Buy"
   tab  focusable:true,selected nodeId:2072
    "Rent"
   tab  focusable:true,selected nodeId:2074
    "Sell"
   tab  focusable:true,selected nodeId:2076
    "Mortgage"
   tab  focusable:true,selected nodeId:2078
    "Home Estimate"
   tabpanel   nodeId:2050
    Section   nodeId:2096
     searchbox "City, Address, School, Agent, ZIP" invalid:false,focusable:true,editable:plaintext,settable:true,autocomplete:list,hasPopup:listbox nodeId:2138
     button "submit search" invalid:false,focusable:true nodeId:2128
      img   nodeId:2140
  "Redfin supports fair housing. See the "
  link  focusable:true nodeId:2053
   "NY fair housing notice"
  "."
 Section   nodeId:54
  img "A woman holding an iPad displaying the Redfin map"  nodeId:365
  heading  level:2 nodeId:370
   "Sell for more than the home next door"
   link "disclaimer" focusable:true nodeId:373
    img   nodeId:1063
  "Local Redfin Agents price your home right and make it shine online. Get started with a free consultation."
  Section   nodeId:377
   Section   nodeId:2034
    searchbox "Enter your street address" invalid:false,focusable:true,editable:plaintext,settable:true,autocomplete:list,hasPopup:listbox nodeId:2099
   button  invalid:false,focusable:true nodeId:2036
    "Next"
 Section   nodeId:55
  img "A street lined with multi-unit residence buildings."  nodeId:381
  heading  level:2 nodeId:386
   "Your perfect rental is now on Redfin"
  "Finding the apartment, condo, or house you’ll love to rent just got easier."
  Section   nodeId:393
   searchbox "City, Address, School, Building, ZIP" invalid:false,focusable:true,editable:plaintext,settable:true,autocomplete:list,hasPopup:listbox nodeId:2038
   button "submit search" invalid:false,focusable:true nodeId:1938
    img   nodeId:2040
 Section   nodeId:56
  img "A woman looking at her laptop"  nodeId:397
  heading  level:2 nodeId:402
   "Get real-time market updates"
  "We’re bringing you the latest on how COVID-19 is impacting the real estate market."
  button  focusable:true nodeId:408
   "See Housing News"
 Section   nodeId:57
  img "Mobile phone with QR code."  nodeId:411
  heading  level:2 nodeId:415
   "Get the Redfin app"
  "Take your home search to the next level with our top-rated real estate apps for iOS and Android."
  LineBreak "\n"  nodeId:421
  LineBreak "\n"  nodeId:422
  "Scan the QR code with your phone's camera to download the app."
 heading  level:2 nodeId:424
  "Talk to a Redfin Agent"
 paragraph   nodeId:425
  "Start your search with an expert local agent—there’s no pressure or obligation."
 form   nodeId:242
  "Where are you searching for homes?"
  Section   nodeId:2043
   searchbox "City, Address, ZIP" invalid:false,focusable:true,editable:plaintext,settable:true,autocomplete:list,hasPopup:listbox nodeId:2106
   button "submit search" invalid:false,focusable:true nodeId:2094
    img   nodeId:2108
 Section   nodeId:59
  "Search for homes by city"
  list   nodeId:436
   listitem  level:1 nodeId:438
    link  focusable:true nodeId:1079
     "Albuquerque Real Estate"
   listitem  level:1 nodeId:439
    link  focusable:true nodeId:1080
     "Alexandria Real Estate"
   listitem  level:1 nodeId:440
    link  focusable:true nodeId:1081
     "Anchorage Real Estate"
   listitem  level:1 nodeId:441
    link  focusable:true nodeId:1082
     "Arlington Real Estate"
------------------
OBJECTIVE: Find a 2 bedroom house for sale in Anchorage AK for under $750k
CURRENT URL: https://www.redfin.com/
YOUR COMMAND:
TYPESUBMIT 2138 "Anchorage"
==================================================

EXAMPLE 3:
==================================================
CURRENT BROWSER CONTENT:
------------------
RootWebArea  focusable:true nodeId:1
 link  focusable:true nodeId:25
  "About"
 link  focusable:true nodeId:26
  "Store"
 link  focusable:true nodeId:187
  "Gmail"
 link  focusable:true nodeId:185
  "Images"
 button "Google apps" focusable:true,expanded nodeId:191
  img   nodeId:192
 link  focusable:true nodeId:152
  "Sign in"
 IframePresentational   nodeId:153
 region "Celebrating Bubble Tea" focusable:true nodeId:36
  button "Celebrating Bubble Tea" invalid:false,focusable:true nodeId:38
  button  hidden:true,hiddenRoot nodeId:42
 search   nodeId:6
  img   nodeId:249
  combobox "Search" invalid:false,focusable:true,focused:true,editable:plaintext,settable:true,autocomplete:both,hasPopup:listbox,required nodeId:12
  button "Search by voice" focusable:true nodeId:200
   img   nodeId:207
  button "Search by image" focusable:true nodeId:201
   img "Camera search"  nodeId:208
  button  invalid:false,focusable:true nodeId:245
   "Google Search"
  button  invalid:false,focusable:true nodeId:246
   "I'm Feeling Lucky"
 link  focusable:true nodeId:83
  "Advertising"
 link  focusable:true nodeId:84
  "Business"
 link  focusable:true nodeId:85
  "How Search works"
 link  focusable:true nodeId:89
  "Carbon neutral since 2007"
 link  focusable:true nodeId:93
  "Privacy"
 link  focusable:true nodeId:94
  "Terms"
 button  focusable:true,hasPopup:menu,expanded nodeId:100
  "Settings"
------------------
OBJECTIVE: Make a reservation for 4 at Dorsia at 8pm
CURRENT URL: https://www.google.com/
YOUR COMMAND:
TYPESUBMIT 12 "dorsia nyc opentable"
==================================================

The current browser content, objective, and current URL follow. Reply with your next command to the browser.

CURRENT BROWSER CONTENT:
------------------
$browserContent
------------------

OBJECTIVE: $objective
CURRENT URL: $url
PREVIOUS COMMAND: $previousCommand
YOUR COMMAND:
`;
*/