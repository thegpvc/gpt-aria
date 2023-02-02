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
            .replace("$previousCommand", previousCommand).trim();

        const gptResponse = await this.openai.complete({
            engine: "text-davinci-002",
            prompt: prompt,
            maxTokens: 50,
            temperature: 0.5,
            bestOf: 10,
            n: 3
        });

        const rawCommand = gptResponse.data.choices[0].text;
        let cmd = this.parseCommand(rawCommand)
        return [prompt, cmd];
    }

    private parseCommand(command: string): BaseCommand {
        command = command.trim();

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

The format of the browser content is a highly simplified accessibility tree; all formatting elements are stripped.
Interactive elements such as links, inputs, buttons are represented like this:

link About
button Google apps
combobox Search
searchbox City, Address

Images are rendered as their alt text like this:

img Google

Based on your given objective, issue whatever command you believe will get you closest to achieving your goal.
If there is a dialog asking about cookies, you should issue a command to click a button to accept all cookies.
Like may look like "CLICK button Accept all". Accept all cookies before doing anything on the page.

You always start on Google; you should submit a search query to Google that will take you to the best page for
achieving your objective. And then interact with that page to achieve your objective.

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