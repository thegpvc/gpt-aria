// import async fs
import { promises as fs } from "fs";
// rewrite as typescript
// const OpenAI = require('openai-api');
import OpenAI, { Completion } from 'openai-api'
import { textSpanContainsPosition } from "typescript";
import { BrowserState, GptResponse } from "./prompt";
export class GPTDriver {
    private openai = new OpenAI(process.env.OPENAI_API_KEY);

    async prompt(state: BrowserState): Promise<[string, string]> {
      let promptTemplate = await fs.readFile("prompt.ts", "utf8")
      let prefix = '{"'
      let prompt = promptTemplate.trim()
          .replace("$objective", (state.objective))
          .replace("$url", (state.url))
          .replace("$steps", JSON.stringify(state.steps))
          .replace("$currentStepIndex", state.currentStepIndex)
          .replace('"$output"})', prefix)
          .replace('$ariaTreeJSON', state.ariaTreeJSON)
          .replace('"$browserError"', state.browserError ? JSON.stringify(state.browserError) : 'undefined')
          ;
        return [prompt, prefix]
    }
    async askCommand(prompt:string, prefix: string): Promise<[Completion, string]> {
        if (!process.env.OPENAI_API_KEY) {
          throw new Error("cat not set");
        }

        const suffix = '}'
        const completion = await this.openai.complete({
            engine: "code-davinci-002",
            prompt: prompt,
            maxTokens: 50,
            temperature: 0.5,
            bestOf: 10,
            n: 3,
            suffix: suffix,
            stop: suffix,
            // Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
            // this helps a lot
            // frequency_penalty:2,
        });

        return [completion,suffix];
    }

    async askPlan(objective: string): Promise<[string]> {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("cat not set");
        }

//         const prompt = objective + ". Steps should be doable by a blind person. The steps list should be valid json string array. The first string should be URL."
        const prompt = objective + ". Steps should be doable by a blind person. The steps list should be valid json string array. The first step should be google search query."

        const json = await this.openai.complete({
            engine: "text-davinci-003",
            prompt: prompt,
            maxTokens: 256,
            temperature: 0.7,
            bestOf: 1,
            n: 1,
        });

        return JSON.parse(json.data.choices[0].text);
    }
}
