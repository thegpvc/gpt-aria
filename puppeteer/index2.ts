#!/usr/bin/env node --loader tsx
import { Crawler } from "./crawler";
import { GPTDriver } from "./gptdriver"
import { promises as fs } from "fs";
import { GptResponse } from "./prompt";

(async () => {
    let objective = process.argv[2];
    objective += ". Think on whether answer is relevant per ARIA tree."
    const crawler = await Crawler.create();
    const gpt = new GPTDriver();
    const startUrl = process.argv[3] || "https://google.com/?hl=en"
    const logFile = "log.txt"
    // open logFile for writing, replace existing contents if exist
    let fd = await fs.open(logFile, "w")
    console.log(`logging to ${logFile}`)
    await crawler.goTo(startUrl);
    async function log(info) {
        await fs.appendFile(fd, info)
        console.log(info)

    }
    do {
        const state = await crawler.state(objective);
        const [prompt, prefix] = await gpt.prompt(state)
        let interaction = prompt + "\n////////////////////////////\n"
        await log(interaction)
        const [completions, suffix] = await gpt.askCommand(prompt, prefix)
        // filter debug a bit
        let debugChoices = [] as string[]
        for (let choice of completions.data.choices) {
            delete choice['index']
            delete choice['logprobs']
            let json = JSON.stringify(choice)
            let json_debug = "DEBUG:" + json + "\n"
            if (debugChoices.length && debugChoices[debugChoices.length - 1] == json_debug) {
                continue
            }
            debugChoices.push(json_debug)
        }
        log(debugChoices.join(""))
        let responseObj: GptResponse | undefined = undefined
        for (const choice of completions.data.choices) {
            let response = prefix + choice.text + suffix
            try {
                responseObj = JSON.parse(response)
                break
            } catch (e) {
                console.error("invalid JSON:" + response)
                continue
            }
        }
        if (!responseObj) {
            console.error("Did not receive a valid response")
            process.exit(1)
        }
        interaction = JSON.stringify(responseObj)
        await log(interaction)
        if (responseObj.result) {
            console.log(interaction.result)
            process.exit(0)
        } else {
            await crawler.transitionState(responseObj)
        }
    } while (true);

//     await crawler.close();
})();
