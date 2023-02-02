// import async fs
import { promises as fs } from "fs";
// rewrite as typescript
// const OpenAI = require('openai-api');
import OpenAI from 'openai-api'
import { NextState } from "./command";
export class GPTDriver {
    private openai = new OpenAI(process.env.OPENAI_API_KEY);

    async askCommand(objective: string, url: string, browserContent: string, previousCommand: string): Promise<[string, NextState]> {
        let limit = 2000
        if (browserContent.length > limit)
            browserContent = browserContent.slice(0, limit);

        url = url.replace(/[?].*/g, "");
        let promptTemplate = await fs.readFile("command.ts", "utf8") +
          await fs.readFile("prompt.ts", "utf8")
        let prompt = promptTemplate
          .replace('"$objective"', JSON.stringify(objective))
          .replace('"$url"', JSON.stringify(url))
          .replace('"$output"}', '')
          // .replace("$previousCommand", previousCommand)
          .replace('$accessibility_tree', ((browserContent))).trim();
        console.log(prompt)
        const gptResponse = await this.openai.complete({
            engine: "text-davinci-002",
            prompt: prompt,
            maxTokens: 50,
            temperature: 0.5,
            bestOf: 10,
            n: 3,
            stop: '\n'
        });

        const response = gptResponse.data.choices[0].text;
        try {
          return [prompt, JSON.parse(response)];
        } catch (e) {
          console.error("Invalid response: " + response)
          throw e
        }
    }
}
