#!/usr/bin/env node --loader tsx
import Crawler from "./crawler.ts"
import GPTDriver, { CommandTypeSubmit, CommandClick, CommandBingo } from "./gptdriver.ts"
// const readline = require("readline")

(async () => {
    const objective = "find darth vader image with horns";
    const crawler = await Crawler.create();
    const gpt = new GPTDriver();

//     const url = "https://google.com/"
    const url = "https://google.com/?hl=en"

    await crawler.goTo(url);

    let previousCommand = "";

    do {
        const parsed = await crawler.parse();
        console.log(parsed);

        const command = await gpt.askCommand(objective, url, parsed, previousCommand)
        previousCommand = command.raw;

        if (command instanceof CommandTypeSubmit) {
            await crawler.typeSubmit(command.role, command.name, command.text);
        } else if (command instanceof CommandClick) {
            await crawler.click(command.role, command.name);
        } else if (command instanceof CommandBingo) {
            break;
        }
    } while (true);

//     await crawler.close();
})();
