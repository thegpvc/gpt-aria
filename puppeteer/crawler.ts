import puppeteer from "puppeteer";

export default class Crawler {
    private browser: Browser;
    private page: Page;

    private constructor() {}

    private async init() {
//         this.browser = await puppeteer.launch({ headless: false, args: ["--proxy-server=socks5://localhost:5555"] });
        this.browser = await puppeteer.launch({ headless: false });
        this.page = await this.browser.newPage();
    }

    async goTo(url: string) {
        await this.page.goto(url, { waitUntil: "networkidle2" });
    }

    async parse(): string {
        const tree = await this.getAccessibilityTree(this.page);
        return this.prettyPrintTree(tree)
    }

    async close() {
        await this.browser.close();

        this.browser = undefined;
        this.page = undefined;
    }

    private async getAccessibilityTree(page: Page): SerializedAXNode | null {
        return await page.accessibility.snapshot({ interestingOnly: true });
    }

    private prettyPrintTree(node, indent: string = ""): string {
        const str = indent + node.role + " " + node.name;

        if (node.children) {
            const self = this;
            const childrenIndent = indent + "  ";
            const children = node.children
                .map(child => self.prettyPrintTree(child, childrenIndent))
                .join("\n");

            return str + "\n" + children;
        } else {
            return str;
        }
    }

    private async findElement(role: string, name: String): ElementHandle {
        return await this.page.$(`aria/${name}[role="${role}"]`);
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

    private async resolveNodeFromBackendNodeId(frame, backendNodeId): ElementHandle {
        const ctx = await Promise.resolve(frame.executionContext())
        console.log(ctx)
        return ctx._adoptBackendNodeId(backendNodeId)
    }

    static async create(): Crawler {
        const crawler = new Crawler();
        await crawler.init();
        return crawler;
    }
}