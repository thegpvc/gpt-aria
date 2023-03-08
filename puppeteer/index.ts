#!/usr/bin/env node --loader tsx
import { Crawler } from "./crawler";
import { GPTDriver } from "./gptdriver"
import { promises as fs } from "fs";
import { ActionStep } from "./prompt";
import yargs from 'yargs/yargs';

(async () => {
    const argv = yargs(process.argv.slice(2)).options({
        objective: { type: 'string', demandOption: true, description: 'Natural language objective for gpt-aria to complete' },
        "start-url": { default: 'https://google.com/?hl=en' },
        "log-output": { default: 'log.txt' },
        }).
        usage('Usage: $0 --objective <objective> [--start-url <url-to-visit-first>]').
        parseSync();

    const crawler = await Crawler.create();
    const gpt = new GPTDriver();
    const logFile = "log.txt"
    let fd = await fs.open(logFile, "w")
    console.log(`logging to ${logFile}`)
    async function log(info) {
        await fs.appendFile(fd, info)
    }

    const startUrl = argv["start-url"]
    await crawler.goTo(startUrl);
    let objectiveProgress = [] as string[];
    do {
        const state = await crawler.state(argv.objective, objectiveProgress);
        const [prompt, prefix] = await gpt.prompt(state)
        let trimmed_prompt = prompt.split('// prompt //', 2)[1].trim()
        let interaction = trimmed_prompt + "\n////////////////////////////\n"
        await log(interaction)
        const [completions, suffix] = await gpt.askCommand(prompt, prefix)
        log(JSON.stringify(completions.data.choices[0]))
        // filter debug a bit
        let debugChoices = [] as string[]
        for (let choice of completions.data.choices) {
            delete (choice as any)['index']
            delete choice['logprobs']
            let json = JSON.stringify(choice)
            let json_debug = "DEBUG:" + json + "\n"
            if (debugChoices.length && debugChoices[debugChoices.length - 1] == json_debug) {
                continue
            }
            debugChoices.push(json_debug)
        }
        log(debugChoices.join(""))
        let responseObj: ActionStep | undefined = undefined
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
        if (responseObj.actionCommand.kind === "ObjectiveComplete") {
            console.log("Objective:" + argv.objective)
            console.log("Objective Progress:")
            console.log(objectiveProgress.join("\n"))
            console.log("Progress Assessment:")
            console.log(responseObj.progressAssessment)
            console.log("Result:")
            console.log(responseObj.actionCommand.result)
            process.exit(0)
        } else {
            console.log(responseObj)
            await crawler.transitionState(responseObj.actionCommand)
        }
    } while (true);
})();
