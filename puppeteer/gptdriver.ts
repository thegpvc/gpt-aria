// import async fs
import { promises as fs } from "fs";
// rewrite as typescript
// const OpenAI = require('openai-api');
import OpenAI, { Completion } from 'openai-api'
import { textSpanContainsPosition } from "typescript";
import { BrowserState, GptResponse } from "./prompt";
import { backOff, BackoffOptions } from "exponential-backoff";

export class GPTDriver {
    async prompt(state: BrowserState): Promise<[string, string]> {
      let promptTemplate = await fs.readFile("prompt.ts", "utf8")
      let prefix = '{"'
      let prompt = promptTemplate.trim()
          .replace("$objective", (state.objective))
          .replace("$url", (state.url))
          .replace('"$output"})', prefix)
          .replace('$ariaTreeJSON', state.ariaTreeJSON)
          .replace('"$browserError"', state.browserError ? JSON.stringify(state.browserError) : 'undefined')
          .replace('$actionsSummary', state.actionsSummary)
          ;
        return [prompt, prefix]
    }
    async askCommand(prompt:string, prefix: string): Promise<[Completion, string]> {
        if (!process.env.OPENAI_API_KEY) {
          throw new Error("cat not set");
        }
        const openai = new OpenAI(process.env.OPENAI_API_KEY);

        const suffix = '"}'
        const backOffOptions: BackoffOptions = {
            retry: (e: any, attemptNumber: number) => {
                console.log("retrying openai.complete error " + e)
                return true;
            }
        }
        const completion = await backOff(() => openai.complete({
            engine: "code-davinci-002",
            prompt: prompt,
            maxTokens: 256,
            temperature: 0.5,
            bestOf: 10,
            n: 3,
            suffix: suffix,
            stop: suffix,
            // Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
            // this helps a lot
            // frequency_penalty:2,
        }), backOffOptions);

        return [completion,suffix];
    }
}
