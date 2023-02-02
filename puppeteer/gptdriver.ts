const OpenAI = require('openai-api');

export class GPTDriver {
    private openai = new OpenAI(process.env.OPENAI_API_KEY);

    async askCommand(objective: string, url: string, browserContent: string, previousCommand: string): Promise<[string, BaseCommand]> {
        if (browserContent.length > 2000)
            browserContent = browserContent.slice(0, 2000);

        url = url.replace(/[?].*/g, "");

        let prompt = promptTemplate
            .replace("$browserContent", browserContent)
            .replace("$objective", objective)
            .replace("$url", url)
            .replace("$previousCommand", previousCommand)
            .trim();

        const gptResponse = await this.openai.complete({
            engine: "text-davinci-002",
            prompt: prompt,
            maxTokens: 50,
            temperature: 0.5,
            bestOf: 1,
            n: 1
        });

        const rawCommand = gptResponse.data.choices[0].text;
        let cmd = this.parseCommand(rawCommand)
        return [prompt, cmd];
    }

    private parseCommand(command: string): BaseCommand {
        command = command.trim();

        if (command.startsWith("TYPESUBMIT")) {
            const id = parseInt(command.split(" ")[1]);
            const text = command.split('"')[1];

            return new CommandTypeSubmit(command, id, text);
        } else if (command.startsWith("CLICK")) {
            const id = parseInt(command.split(" ")[1]);

            return new CommandClick(command, id);
        } else if (command == "BINGO") {
            return new CommandBingo(command);
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
        public id: number,
        public text: string
    ) {
        super(raw);
    }
}

export class CommandClick extends BaseCommand {
    constructor(
        raw: string,
        public id: number,
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
	CLICK E - click on a given element with id E. You can only click on links, buttons, and inputs!
	TYPE E "TEXT" - type the specified text into the input element with id E
	TYPESUBMIT E "TEXT" - same as TYPE above, except then it presses ENTER to submit the form
	BINGO - objective reached

The format of the browser content is a highly simplified accessibility tree; all formatting elements are stripped.
Interactive elements such as links, inputs, buttons are represented like this:

link 12 About
button 1 Google apps
combobox 42 Search
searchbox 43 City, Address

Images are rendered as their alt text like this:

img 42 Google

Based on your given objective, issue whatever command you believe will get you closest to achieving your goal.
If there is a dialog asking about cookies, you should issue a command to click a button to accept all cookies.
Command may look like "CLICK 42". Accept all cookies before doing anything on the page.

You always start on Google; you should submit a search query to Google that will take you to the best page for
achieving your objective. And then interact with that page to achieve your objective.

If you find yourself on Google and there are no search results displayed yet, you should probably issue a command
like 'TYPESUBMIT 9 "search query"' to get to a more useful page.

Then, if you find yourself on a Google search results page, you might issue the command "CLICK X" where X should be a id of
the first link or button from the search results. (If your previous command was a TYPESUBMIT your next command should
probably be a CLICK.)

Don't try to interact with elements that are not listed.

If you reached the objective issue a command BINGO.

Here are some examples:

EXAMPLE 1:
==================
CURRENT BROWSER CONTENT:
------------------
RootWebArea 1 Google
  link 2 About
  link 3 Store
  link 4 Gmail
  link 5 Images
  button 6 Google apps
  link 7 Sign in
  img 8 Google
  combobox 9 Search
  button 10 Search by voice
  button 11 Search by image
  button 12 Google Search
  button 13 I'm Feeling Lucky
  link 14 Advertising
  link 15 Business
  link 16 How Search works
  link 17 Carbon neutral since 2007
  link 18 Privacy
  link 19 Terms
  button 20 Settings
------------------
OBJECTIVE: Find a 2 bedroom house for sale in Anchorage AK for under $750k
CURRENT URL: https://www.google.com/
YOUR COMMAND:
TYPESUBMIT 9 "anchorage redfin"
==================

EXAMPLE 2:
==================
CURRENT BROWSER CONTENT:
------------------
RootWebArea 1 Real Estate, Homes for Sale, MLS Listings, Agents | Redfin
  button 2 Redfin Homepage Link
  link 3 1-844-759-7732
  button 4 Buy ▾
    button 5 Buy ▾
  button 6 Rent New ▾
    button 7 Rent New ▾
  button 8 Sell ▾
    button 9 Sell ▾
  button 10 Mortgage ▾
    button 11 Mortgage ▾
  button 12 Real Estate Agents ▾
    link 13 Real Estate Agents ▾
  button 14 Feed
  button 15 Log In
  button 16 Sign Up
  heading 17 Find homes first. Tour homes fast.
  tab 18 Buy
  tab 19 Rent
  tab 20 Sell
  tab 21 Mortgage
  tab 22 Home Estimate
  generic 23
    searchbox 24 City, Address, School, Agent, ZIP
    button 25 submit search
  StaticText 26 Redfin supports fair housing. See the
  link 27 NY fair housing notice
------------------
OBJECTIVE: Find a 2 bedroom house for sale in Anchorage AK for under $750k
CURRENT URL: https://www.redfin.com/
YOUR COMMAND:
TYPESUBMIT 24 "Anchorage"
==================

EXAMPLE 3:
==================
CURRENT BROWSER CONTENT:
------------------
RootWebArea 1 Google
  link 2 About
  link 3 Store
  link 4 Gmail
  link 5 Images
  button 6 Google apps
  link 7 Sign in
  img 8 Google
  combobox 9 Search
  button 10 Search by voice
  button 11 Search by image
  button 12 Google Search
  button 13 I'm Feeling Lucky
  link 14 Advertising
  link 15 Business
  link 16 How Search works
  link 17 Carbon neutral since 2007
  link 18 Privacy
  link 19 Terms
  button 20 Settings
------------------
OBJECTIVE: Make a reservation for 4 at Dorsia at 8pm
CURRENT URL: https://www.google.com/
YOUR COMMAND:
TYPESUBMIT 9 "dorsia nyc opentable"
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