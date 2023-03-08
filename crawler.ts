import puppeteer, { Browser, ElementHandle, Page, SerializedAXNode } from "puppeteer";
import { AccessibilityTree, BrowserAction, ObjectiveState } from "./prompt";
import { MAIN_WORLD } from "puppeteer";

export class Crawler {
    private browser: Browser;
    private page: Page;
    private idMapping = new Map<number, any>()
    private error?: string

    constructor() {
    }

    private async init(headless: boolean) {
        this.browser = await puppeteer.launch({
            headless: headless,
            userDataDir: "google-chrome",
        });
        this.page = await this.browser.newPage();
        let self = this
        // this helps us work when links are opened in new tab
        this.browser.on('targetcreated', async function(target){
            let page = await target.page()
            if (page) {
                self.page = page
            }
        })
    }

    async state(objective: string, objectiveProgress: string[], limit=4000): Promise<ObjectiveState> {
        let contentJSON = await this.parseContent()
        let content: ObjectiveState = {
            url: this.url().replace(/[?].*/g, ""),
            ariaTree: contentJSON.substring(0, limit),
            objectiveProgress: objectiveProgress,
//             error: this.error,
            objectivePrompt: objective
        }
        return content
    }

    async transitionState(command: BrowserAction) {
        this.error = undefined
        try {
            if (command.index !== undefined) {
                let e = await this.findElement(command.index)
                // cause text to get selected prior to replacing it(instead of appending)
                if (command.params) {
                    await e.click({ clickCount: 3 })
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await e.type(command.params[0] as string + "\n")
                } else {
                    await e.click()
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } else {
                throw new Error("Unknown command:"+ JSON.stringify(command));
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
            this.error = e.toString()
            console.error(this.error)
        }
    }

    async goTo(url: string) {
        await this.page.goto(url);
        await new Promise(resolve => setTimeout(resolve, 1000));
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

    private simplifyTree(node: SerializedAXNode): AccessibilityTree {
        switch (node.role) {
            case "StaticText":
            case "generic":
                return node.name!
            case "img":
                return ["img", node.name!]
            default:
                break;
        }
        let index = this.idMapping.size
        let e: AccessibilityTree = [index, node.role, node.name!]
        this.idMapping.set(index, e)
        let children = [] as AccessibilityTree[]
        if (node.children) {
            const self = this;
            children = node.children.map(child => self.simplifyTree(child))
        } else if (node.value) {
            children = [node.value]
        }
        if (children.length) {
            e.push(children)
        }
        return e
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

    private async findElementXX(id: number): Promise<ElementHandle<Element>> {
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

    private async findElement(index:number): Promise<ElementHandle<Element>> {
        let e = this.idMapping.get(index)
        let role = e[1]
        let name = e[2]

        // console.log(index + " " + role + " " + name)

        let client = (this.page as any)._client();
        const body = await this.page.$("body");
        const res = await this.queryAXTree(client, body, name, role);
        if (!res[0] || !res[0].backendDOMNodeId) {
            throw new Error(`Could not find element with role ${node.role} and name ${node.name}`);
        }
        const backendNodeId = res[0].backendDOMNodeId;

        const ret = (await this.page.mainFrame().worlds[MAIN_WORLD].adoptBackendNode(backendNodeId)) as ElementHandle<Element>

//         let ret = await this.page.$(`aria/${name}[role="${role}"]`);
        if (!ret) {
            throw new Error(`Could not find element by backendNodeId with role ${role} and name ${name}`);
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

    static async create(headless: boolean): Promise<Crawler> {
        const crawler = new Crawler();
        await crawler.init(headless);
        return crawler;
    }
}