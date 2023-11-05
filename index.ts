import fs from "fs";
import { argv } from "process";
import css from "css";
import { IBundable } from "./interfaces";
import { SystemError } from "bun";
import JSDOM from "jsdom";

class Bundler {
    private args: string[] = argv;
    private throwErr(short: string, errorMessage: string) {
        console.error(`Error: ${short}`)
        console.log(errorMessage)
        process.exit(0)
    }

    private extractDOM(string: string) {
        string.match(/<dom>([\s\S]*)<\/dom>/);
        return RegExp.$1
    }

    private extractConfig(string: string) {
        let config = {} as any;
        string.match(/<config>([\s\S]*)<\/config>/);
        RegExp.$1.split("\n").forEach((element, index: number) => {
            if (element) {
                let [key, value] = element.split(":");
                let evalStr = eval("(" + value + ")");
                config[key] = evalStr;
            }
        });
    
        return config;
    }
    
    private extractCSS(string: string) {
        string.match(/<style>([\s\S]*)<\/style>/);
        return css.parse(RegExp.$1).stylesheet?.rules;
    }
    
    private extractComponents(string: string) {
        let components = [] as string[];
        string.match(/<require>([\s\S]*)<\/require>/);
        RegExp.$1.split("\n").forEach((element, index: number) => {
            if (element) {
                components.push(element);
            }
        });
    
        return components;
    }

    constructor(isCLI: boolean) {
        if (!isCLI) return;
        if (this.args.length < 3) {
            this.throwErr("NOARG", "No arguments specified! Try 'help'")
        }

        this.args = this.args.slice(2)
    }

    public build(src: string): Promise<IBundable> {
        return new Promise((resolve, reject) => {
			resolve({
				css: this.extractCSS(src.toString()),
				config: this.extractConfig(src.toString()),
				html: this.extractDOM(src.toString())
			})
        })
    }

	public CLI(): Promise<IBundable> {
		return new Promise((resolve) => {
			fs.readFile(this.args[1], (err: SystemError | null, data: Buffer) => {
				if (err) throw err
				this.build(data.toString()).then(result => {
					resolve(result)
				})
			})
		})
	}
}

// let LPcontent = fs.readFileSync(process.cwd() + "/test.html").toString()

let x = new Bundler(true);
x.CLI().then((data: IBundable) => {
	console.log(data)
	console.log(data.css[1].declarations)
})