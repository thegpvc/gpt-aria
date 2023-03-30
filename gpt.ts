import { promises as fs } from "fs";
import OpenAI, { Completion } from 'openai-api'
import { ObjectiveState } from "./prompt";
import { backOff, BackoffOptions } from "exponential-backoff";

export class GPTDriver {
    private lastAttemptCount = 0
    private OPENAI_API_KEY: string

    constructor(OPENAI_API_KEY: string) {
        this.OPENAI_API_KEY = OPENAI_API_KEY
    }

    async prompt(state: ObjectiveState): Promise<[string, string]> {
      let promptTemplate = await fs.readFile("prompt.ts", "utf8")
      let prefix = '{"progressAssessment":'
      let prompt = promptTemplate.trim()
          .replace("$objective", (state.objective))
          .replace("$url", (state.url))
          .replace('"$output"}})', '')
          .replace('$ariaTreeJSON', state.ariaTree)
        //   .replace('"$browserError"', state.browserError ? JSON.stringify(state.browserError) : 'undefined')
          .replace('["$objectiveProgress"]', JSON.stringify(state.progress))
          ;
        return [prompt, prefix]
    }

    async askCommand(prompt:string): Promise<[Completion, string]> {
        const openai = new OpenAI(this.OPENAI_API_KEY);

        const suffix = '})'
        let self = this
        const backOffOptions: BackoffOptions = {
            // try to delay the first attempt if we had fails in previous runs
            delayFirstAttempt: !!this.lastAttemptCount,
            startingDelay: (Math.max(0, this.lastAttemptCount - 1) + 1) * 100,
            retry: (e: any, attemptNumber: number) => {
                self.lastAttemptCount = attemptNumber
                console.warn(`Retry #${attemptNumber} after openai.complete error ${e}`)
                return true;
            }
        }
        const completion = await backOff(() => {
            return openai.complete({
                engine: "text-davinci-003",
                prompt: prompt,
                maxTokens: 256,
                temperature: 0.5,
                bestOf: 10,
                n: 3,
                suffix: suffix,
                stop: suffix,
            })
        }, backOffOptions);

        return [completion,suffix];
    }
}
