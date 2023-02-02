import puppeteer, { Browser, ElementHandle, Page, SerializedAXNode } from "puppeteer";
import { ContinueCommand, NextState } from "./command";

export class Crawler {
    private browser: Browser;
    private page: Page;
    private ids = new Map<number, any>()
    private constructor() {}

    private async init() {
//         this.browser = await puppeteer.launch({ headless: false, args: ["--proxy-server=socks5://localhost:5555"] });
        this.browser = await puppeteer.launch({ headless: true });
        this.page = await this.browser.newPage();
    }

    async goTo(url: string) {
        await this.page.goto(url, { waitUntil: "networkidle2" });
    }

    url(): string {
        return this.page.url();
    }

    async parse(): Promise<string> {
        const tree = await this.getAccessibilityTree(this.page);
        this.ids = new Map<number, any>()
        let tree_ret = this.simplifyTree(tree, {length_budget:2000})
        // pretty-print to console
        let ret= JSON.stringify(tree_ret)
        console.log(ret.length)
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

    private simplifyTree(node, budget:{length_budget:number}): any {
        let index = this.ids.size
        let e = [index, node.role, node.name]
        budget.length_budget -= node.role.length + node.name.length
        this.ids.set(index, e)
        let children = []
        console.log("length_budget:"+budget.length_budget)
        if (node.children && budget.length_budget > 0) {
            const self = this;
            children = node.children.map(child => self.simplifyTree(child, budget))
        }
        return [...e, children]
    }

    private async findElement(index:number): Promise<ElementHandle<Element>> {
        let e = this.ids.get(index)
        let role = e[1]
        let name = e[2]
        let ret = await this.page.$(`aria/${name}[role="${role}"]`);
        if (!ret) {
            throw new Error(`Could not find element with role ${role} and name ${name}`);
        }
        return ret
    }

    async handleCommand(command: NextState) {
        command = command as ContinueCommand
        if (command.index !== undefined) {
            let e = await this.findElement(command.index)
            console.log(e)
            e.type(command.params[0] as string + "\n")
        } else {
            throw new Error("Unknown command:"+ JSON.stringify(command));
        }
        await this.page.waitForNavigation({ waitUntil: "networkidle2" });
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