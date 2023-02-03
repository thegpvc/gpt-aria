#!/usr/bin/env node --loader tsx
import { Crawler } from "./crawler";
import { GPTDriver } from "./gptdriver"
import { promises as fs } from "fs";

(async () => {
    const objective = process.argv[2];
    const crawler = await Crawler.create();
    const gpt = new GPTDriver();
    const startUrl = process.argv[3] || "https://google.com/?hl=en"
    const logFile = "log.txt"
    // open logFile for writing, replace existing contents if exist
    let fd = await fs.open(logFile, "w")
    console.log(`logging to ${logFile}`)
    await crawler.goTo(startUrl);

    do {
        const state = await crawler.state(objective);
        const prompt = await gpt.prompt(state)
        let interaction = prompt + "\n////////////////////////////\n"
        await fs.appendFile(fd, interaction)
        console.log(interaction)
        const command = await gpt.askCommand(prompt)
        interaction = JSON.stringify(command)
        await fs.appendFile(fd, interaction)
        console.log(command)
        if (command.result) {
            console.log(command.result)
            process.exit(0)
        } else {
            await crawler.transitionState(command)
        }
    } while (true);

//     await crawler.close();
})();
