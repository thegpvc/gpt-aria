#!/usr/bin/env node --loader tsx
import { Crawler } from "./crawler";
import { GPTDriver, CommandTypeSubmit, CommandClick, CommandBingo } from "./gptdriver"
import { promises as fs } from "fs";

(async () => {
    const objective = process.argv[2];
    const crawler = await Crawler.create();
    const gpt = new GPTDriver();
    const startUrl = "https://google.com/?hl=en"
    const logFile = "log.txt"
    let previousCommand = "";
    // open logFile for writing, replace existing contents if exist
    let fd = await fs.open(logFile, "w")
    console.log(`logging to ${logFile}`)
    await crawler.goTo(startUrl);

    do {
        const parsed = await crawler.parse();
        const url = crawler.url().toString();

        const [prompt, command] = await gpt.askCommand(objective, url, parsed, previousCommand)
        previousCommand = command.raw;

        let interaction = prompt + "\n----------------------------------------\n" + command.raw
        await fs.appendFile(fd, interaction)
        console.log(interaction)

        if (command instanceof CommandTypeSubmit) {
            await crawler.typeSubmit(command.id, command.text);
        } else if (command instanceof CommandClick) {
            await crawler.click(command.id);
        } else if (command instanceof CommandBingo) {
            break;
        }
    } while (true);

//     await crawler.close();
})();
