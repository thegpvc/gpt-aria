import puppeteer, { Browser, ElementHandle, Page, SerializedAXNode } from "puppeteer";
import { MAIN_WORLD } from "puppeteer";

export class Crawler {
    private browser: Browser;
    private page: Page;
    private nodes: Map<number, string>;

    private constructor() {}

    private async init() {
//         this.browser = await puppeteer.launch({ headless: false, args: ["--proxy-server=socks5://localhost:5555"] });
        this.browser = await puppeteer.launch({ headless: false });
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

        this.nodes = new Map();
        this.fillIdsMap(tree, this.nodes);

        return this.prettyPrintTree(tree);
    }

    async close() {
        await this.browser.close();

        this.browser = undefined;
        this.page = undefined;
    }

    private async getAccessibilityTree(page: Page): Promise<Node> {
        const tree = await page.accessibility.snapshot({ interestingOnly: true });
        return this.convertNode(tree, [0]);
    }

    private fillIdsMap(node: Node, map: Map<number, string>) {
        map[node.id] = node;
        node.children.forEach(child => this.fillIdsMap(child, map));
    }

    // todo use backendNodeId
    private convertNode(axNode: SerializedAXNode, lastIdHolder: Array<number>): Node {
        const id = lastIdHolder[0] + 1;
        lastIdHolder[0] = id;

        const self = this;

        const children = (axNode.children || [])
            .map(child => this.convertNode(child, lastIdHolder));

        return new Node(id, axNode.role, axNode.name, children);
    }

    private prettyPrintTree(node, indent: string = ""): string {
        let str = indent + node.role + " " + node.id + " " + node.name;

        if (node.children.length > 0) {
            const self = this;
            const childrenIndent = indent + "  ";
            const children = node.children
                .map(child => self.prettyPrintTree(child, childrenIndent))
                .join("\n");

            str += "\n" + children;
        }

        return str;
    }

    private async queryAXTree(
      client: CDPSession,
      element: ElementHandle<Node>,
      accessibleName?: string,
      role?: string
    ): Promise<Protocol.Accessibility.AXNode[]> {
      const {nodes} = await client.send('Accessibility.queryAXTree', {
        objectId: element.remoteObject().objectId,
        accessibleName,
        role,
      });
      const filteredNodes: Protocol.Accessibility.AXNode[] = nodes.filter(
        (node: Protocol.Accessibility.AXNode) => {
          return !node.role || node.role.value !== 'StaticText';
        }
      );
      return filteredNodes;
    }

    private async findElement(id: number): Promise<ElementHandle<Element>> {
        const node = this.nodes[id];

        let client = (this.page as any)._client();
        const body = await this.page.$("body");
        const res = await this.queryAXTree(client, body, node.name, node.role);
        if (!res[0] || !res[0].backendDOMNodeId) {
            throw new Error(`Could not find element with role ${node.role} and name ${node.name}`);
        }
        const backendNodeId = res[0].backendDOMNodeId;

        return (await this.page.mainFrame().worlds[MAIN_WORLD].adoptBackendNode(backendNodeId)) as ElementHandle<Element>
    }

    async type(id: number, text: string) {
        const el = await this.findElement(id);
        await el.type(text);
    }

    async typeSubmit(id: number, text: string) {
        await this.type(id, text + "\n");
        await this.page.waitForNavigation({ waitUntil: "networkidle2" });
    }

    async click(id: number) {
        const el = await this.findElement(id);
        await el.click();
        await this.page.waitForNavigation({ waitUntil: "networkidle2" });
    }

    static async create(): Crawler {
        const crawler = new Crawler();
        await crawler.init();
        return crawler;
    }
}

class Node {
    constructor(
        public id: number,
        public role: name,
        public name: string,
        public children: Array<Node>
    ) {}
}