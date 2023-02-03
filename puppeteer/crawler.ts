import puppeteer, { Browser, ElementHandle, Page, SerializedAXNode } from "puppeteer";
import { ContinueCommand, NextState, AccessibilityTree } from "./command";
import { BrowserCommand, BrowserContentJSON, BrowserState } from "./prompt";

export class Crawler {
    private browser: Browser;
    private page: Page;
    private idMapping = new Map<number, any>()
    private constructor() {}
    private error?: string
    private lastCommand?: BrowserCommand

    private async init() {
//         this.browser = await puppeteer.launch({ headless: false, args: ["--proxy-server=socks5://localhost:5555"] });
        this.browser = await puppeteer.launch({ headless: false });
        this.page = await this.browser.newPage();
    }

    async state(objective: string, limit=2000): Promise<BrowserState> {
        let contentJSON = await this.parseContent()
        let content: BrowserContentJSON = {
            url: this.url(), // todo: should probably limit url too
            ariaTreeJSON: contentJSON.substring(0, limit),
            objective: objective,
            error: this.error,
            lastCommand: this.lastCommand
        }
        return content
    }

    async transitionState(command: BrowserCommand) {
        this.error = undefined
        command = command as ContinueCommand
        try {
            if (command.index !== undefined) {
                let e = await this.findElement(command.index)
                // cause text to get selected prior to replacing it(instead of appending)
                e.click({ clickCount: 3 })
                await new Promise(resolve => setTimeout(resolve, 100));
                e.type(command.params[0] as string + "\n")
            } else {
                throw new Error("Unknown command:"+ JSON.stringify(command));
            }
            await this.page.waitForNavigation({ waitUntil: "networkidle2" });
        } catch (e) {
            this.error = e.toString()
            this.lastCommand = command
        }
    }

    async goTo(url: string) {
        await this.page.goto(url, { waitUntil: "networkidle2" });
    }

    url(): string {
        return this.page.url();
    }

    async parseContent(): Promise<string> {
        const tree = await this.getAccessibilityTree(this.page);
        this.idMapping = new Map<number, any>()
        let tree_ret = this.simplifyTree(tree)
        let ret= JSON.stringify(tree_ret)
        return ret
    }

    async close() {
        await this.browser.close();

        this.browser = undefined;
        this.page = undefined;
    }

    private async getAccessibilityTree(page: Page): Promise<SerializedAXNode | null> {
        return await page.accessibility.snapshot({ interestingOnly: true });
    }

    private simplifyTree(node): AccessibilityTree {
        switch (node.role) {
            case "StaticText":
            case "generic":
                return node.name
            case "img":
                return ["img", node.name]
            default:
                break;
        }
        let index = this.idMapping.size
        let e: AccessibilityTree = [index, node.role, node.name]
        this.idMapping.set(index, e)
        let children = [] as AccessibilityTree[]
        if (node.children) {
            const self = this;
            children = node.children.map(child => self.simplifyTree(child))
            e.push(children)
        }
        return e
    }

    private async findElement(index:number): Promise<ElementHandle<Element>> {
        let e = this.idMapping.get(index)
        let role = e[1]
        let name = e[2]
        let ret = await this.page.$(`aria/${name}[role="${role}"]`);
        if (!ret) {
            throw new Error(`Could not find element with role ${role} and name ${name}`);
        }
        return ret
    }

    async type(role: string, name: String, text: string) {
        const el = await this.findElement(role, name);
        await el.type(text);
    }

    async typeSubmit(role: string, name: String, text: string) {
        await this.type(role, name, text + "\n");
        await this.page.waitForNavigation({ waitUntil: "networkidle2" });
    }

    async click(role: string, name: String) {
        const el = await this.findElement(role, name);
        await el.click();
        await this.page.waitForNavigation({ waitUntil: "networkidle2" });
    }

    private async resolveNodeFromBackendNodeId(frame, backendNodeId): Promise<ElementHandle<Element>> {
        const ctx = await Promise.resolve(frame.executionContext())
        console.log(ctx)
        return ctx._adoptBackendNodeId(backendNodeId)
    }

    static async create(): Promise<Crawler> {
        const crawler = new Crawler();
        await crawler.init();
        return crawler;
    }
}