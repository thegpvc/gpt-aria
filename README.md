# aria-gpt

## Using chrome accessibility tree to turn the web into a textual interface and access it like a blind user

**Marketing Goal**: to produce a content-marketing blog post like: https://dagster.io/blog/chatgpt-langchain

**Technical goal**: 
1. Create an extension where you can enter a task and have it perform a demo like: https://www.adept.ai/act
2. Ideally we'd enable a new mode of browser interaction where a blind user can perform some task easier (eg summarization of article, or functionality to read out balance on credit card, etc)

**Scope**: Tight, initial milestone is a "weekend" project: 3-4 days.

**Prior art**:
* https://github.com/nat/natbot
* https://yihui.dev/actgpt

Technical stack:
* typescript in extension
* https://plasmo.com/ framework

### Why ARIA is superior to raw html

html:
![html](doc/html.png?raw=true "HTML is only good for renders")

html with ARIA accessibility tree:
![accessibility_tree](doc/accessibility_tree.png?raw=true "HTML is only good for renders")

## Follow-up ideas

### Have an index of gpt prompts that explain in natural language how to navigate a particular website.
* Eg for twitter it was say "In order to 'tweet', one goes to twitter.com and posts a tweet. in order to scan the latest news on twitter, one can pick use default timeline or pick a twitter list for a particular category".
* For buying a house "redfin provides search functionality and ability to narrow down location and prices"
* for shopping "amazon.com is a shopping site"
* likewise for google, wikipedia, etc
* eventually we'd want langchain-style website modules so you could specify "Summarize my inbox and news" which would be a composition of gmail and news modules

### Chrome extension that accesses page aria

https://github.com/ziolko/aria-devtools

tangent: hook up chrome extension to google sheets via oaut

https://stackoverflow.com/questions/55477723/how-to-integrate-google-sheet-to-chrome-extension

https://stackoverflow.com/questions/48335559/google-sheets-api-with-chrome-extension-how-to-use
