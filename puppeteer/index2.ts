#!/usr/bin/env node --loader tsx
import { Crawler } from "./crawler";
import { GPTDriver } from "./gptdriver"
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
        let interaction = prompt + "\n////////////////////////////\n" + JSON.stringify(command)
        await fs.appendFile(fd, interaction)
        console.log(interaction)
        await crawler.handleCommand(command)
    } while (true);

//     await crawler.close();
})();
