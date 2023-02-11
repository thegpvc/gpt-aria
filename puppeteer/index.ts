#!/usr/bin/env node --loader tsx
import { Crawler } from "./crawler";
import { GPTDriver } from "./gptdriver"
import { promises as fs } from "fs";
import { GptResponse } from "./prompt";

(async () => {
    let objective = process.argv[2];
    const objectiveARIA = objective
    const crawler = await Crawler.create();
    const gpt = new GPTDriver();
    const logFile = "log.txt"
    // open logFile for writing, replace existing contents if exist
    let fd = await fs.open(logFile, "w")
    // let objectiveProgress = [] as string[]
    console.log(`logging to ${logFile}`)
    async function log(info) {
        await fs.appendFile(fd, info)
        console.log(info)

    }

    const startUrl = process.argv[3] || "https://google.com/?hl=en"
    await crawler.goTo(startUrl);
    let objectiveProgress = [] as string[];
    do {
        const state = await crawler.state(objectiveARIA, objectiveProgress);
        const [prompt, prefix] = await gpt.prompt(state)
        let trimmed_prompt = prompt.split('// prompt //', 2)[1].trim()
        let interaction = trimmed_prompt + "\n////////////////////////////\n"
        await log(interaction)
//         await new Promise(f => setTimeout(f, 3000000));
        const [completions, suffix] = await gpt.askCommand(prompt, prefix)
        console.log(completions.data.choices[0])
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
            let response = prefix + choice.text //+ suffix
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
        objectiveProgress.push(responseObj.actionDescription);
        interaction = JSON.stringify(responseObj)
        await log(interaction)
        if (responseObj.actionCommand.result) {
            console.log("Objective:" + objective)
            console.log("Objective Progress:")
            console.log(objectiveProgress.join("\n"))
            console.log("Progress Assessment:")
            console.log(responseObj.progressAssessment)
            console.log("Result:")
            console.log(responseObj.actionCommand.result)
            process.exit(0)
        } else {
            await crawler.transitionState(responseObj.actionCommand)
        }
    } while (true);
})();
