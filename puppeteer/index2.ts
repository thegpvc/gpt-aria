#!/usr/bin/env node --loader tsx
import { Crawler } from "./crawler";
import { GPTDriver, CommandTypeSubmit, CommandClick, CommandBingo } from "./gptdriver"

(async () => {
    const objective = process.argv[2];
    const crawler = await Crawler.create();
    const gpt = new GPTDriver();
    const startUrl = "https://google.com/?hl=en"
    let previousCommand = "";

    await crawler.goTo(startUrl);

    do {
        const parsed = await crawler.parse();
        const url = crawler.url().toString();

        console.log(url);
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
